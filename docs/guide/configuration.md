# Configuration

## Overview

storymock uses a four-tier configuration model. Each tier overrides the one below it, giving you precise control from project-wide defaults down to individual faker instances.

## Global Configuration

Use `configure()` to set defaults for all subsequent generation:

```typescript
import { configure, FakerJsProvider } from 'storymock';

configure({
  seed: 42,
  provider: new FakerJsProvider(),
  defaults: {
    numeric: { min: 0, max: 1000, type: 'int' },
    text: { minLength: 1, maxLength: 20, charset: 'alphanumeric' },
    temporal: { min: '-10 years', max: '+10 years' },
    bool: { probability: 0.5 },
    collection: { minLength: 1, maxLength: 5 },
  },
});
```

Every field is optional — pass only what you want to change. Call `configure()` as early as possible (e.g. in a test setup file) so all tests share the same defaults.

## Faker-Level Configuration

Builder methods on individual fakers override global defaults. Each method returns a new faker — the global state is never affected.

```typescript
import { numeric } from 'storymock';

// Global default: numeric min is 0, max is 1000
const price = numeric().min(1).max(99).precision(2);

price.create();   // 42.17 — uses faker-level min/max
numeric().create(); // 738 — still uses global defaults
```

## Precedence

Configuration is resolved in four tiers, highest priority first:

1. **Faker** — `.min(5)`, `.seed(42)`, `.maxLength(10)` on an individual faker
2. **Schema** — `UserSchema.seed(42)` — applies to all fakers within the schema
3. **Story** — `myStory.seed(42)` — applies to all schemas within the story
4. **Global** — `configure({ seed: 42 })` — applies to everything

```typescript
import { configure, numeric } from 'storymock';

// Global: numeric max is 500
configure({ defaults: { numeric: { max: 500 } } });

numeric().create();             // 347 — global max is 500
numeric().max(10).create();     // 6 — faker max is 10 (wins over global)
```

## Seeding

A seed makes generation **deterministic** — the same seed with the same constraints always produces the same output. This is essential for snapshot tests, debugging, and reproducible CI runs.

### Setting a seed

**Global** — affects all fakers, schemas, and stories:

```typescript
import { configure } from 'storymock';
configure({ seed: 42 });
```

**Faker-level** — affects only this specific faker:

```typescript
numeric().min(1).max(100).seed(42).create();   // 67 — always the same
UserSchema.seed(42).create();                   // { id: 'a1c4...', ... } — always the same
myStory.seed(42).create();                      // { user: {...}, order: {...} } — always the same
```

### Resetting

To return to non-deterministic generation, reset the global seed:

```typescript
configure({ seed: undefined });
```

### Seed precedence

Seeds follow the same four-tier rule:

1. **Faker** — `.seed(42)` on an individual faker
2. **Schema** — `UserSchema.seed(42)` 
3. **Story** — `myStory.seed(42)`
4. **Global** — `configure({ seed: 42 })`

A faker inside a schema uses its own seed if set, otherwise inherits the schema's seed, and so on up the chain.

### Example: all levels

```typescript
import { configure, numeric, schema, story, text, ref } from 'storymock';

// Level 4: global seed
configure({ seed: 100 });

// Level 2: schema seed overrides global
const UserSchema = schema<User>({ /* ... */ }).seed(200);

// Level 1: faker seed overrides everything
const pinned = numeric().min(1).max(100).seed(300);
pinned.create();  // 73 — always the same

// Level 3: story seed overrides global, but schema seed still wins for UserSchema
const myStory = story()
  .add('user', UserSchema)
  .add('order', OrderSchema)
  .seed(400)
  .create();
```

## Defaults Reference

These are the built-in library defaults when no global or instance configuration is set:

| Domain | Property | Default |
|--------|----------|---------|
| `numeric` | min | `0` |
| `numeric` | max | `1000` |
| `numeric` | type | `'int'` |
| `text` | minLength | `1` |
| `text` | maxLength | `20` |
| `text` | charset | `'alphanumeric'` |
| `temporal` | min | 10 years ago |
| `temporal` | max | 10 years from now |
| `bool` | probability | `0.5` |
| `collection` | minLength | `1` |
| `collection` | maxLength | `5` |

## Custom Providers

storymock delegates actual value generation to a **data provider**. The default is `FakerJsProvider` (wrapping `@faker-js/faker`). To customize generation, implement `CoreProvider` or extend the default:

```typescript
import { configure, FakerJsProvider } from 'storymock';

class CustomProvider extends FakerJsProvider {
  override integer({ min, max }: { min: number; max: number }) {
    // custom integer logic
    return super.integer({ min, max });
  }
}

configure({ provider: new CustomProvider() });
```

`CoreProvider` is the minimal interface — it uses primitive names (`integer`, `float`, `string`) because it sits below storymock's builder layer. When you call `numeric().min(1).max(100).create()`, storymock resolves the constraints and delegates to `provider.integer({ min: 1, max: 100 })`. The provider just generates; storymock handles the rest. Required methods: `integer()`, `float()`, `string()`, `boolean()`, `date()`, `pick()`, `pickMultiple()`, `shuffle()`, and `seed()`. Semantic modules (`person`, `internet`, etc.) are optional.

See the [Faker API — Data Provider](/reference/faker#_5-data-provider) for the full interface.

## Custom Domains

Register your own semantic domains with `registerDomain()`. The callback receives a `CoreProvider` so your custom domain respects the global seed and provider configuration.

```typescript
import { registerDomain } from 'storymock';
import { TextFaker, NumericFaker } from 'storymock/internals';

const pokemon = registerDomain('pokemon', (core) => ({
  name: () => new TextFaker(() => core.pick(['Pikachu', 'Charizard', 'Bulbasaur'])),
  type: () => new TextFaker(() => core.pick(['fire', 'water', 'grass', 'electric'])),
  level: () => new NumericFaker({ min: 1, max: 100 }),
}));

pokemon().name().create();            // 'Charizard'
pokemon().level().min(50).create();   // 73
```

::: tip Internals
`TextFaker` and `NumericFaker` are internal builder classes exposed via `storymock/internals` for advanced use cases like custom domain registration. See the [Faker API Reference — Extensibility](https://storymock.dev/reference/faker#_7-extensibility) for the full interface.
:::

See the [Faker API — Extensibility](/reference/faker#_7-extensibility) for more details.
