# Core Concepts

storymock has three layers. Each builds on the one below:

```
  ┌─────────────────────────────────────────┐
  │  Story                                  │
  │  Composes schemas, wires relationships  │
  ├─────────────────────────────────────────┤
  │  Schema                                 │
  │  Maps fields to fakers, produces objects│
  ├─────────────────────────────────────────┤
  │  Faker                                  │
  │  Generates a single value               │
  └─────────────────────────────────────────┘
```

You can use any layer on its own — a faker works without a schema, a schema works without a story. Each layer adds structure and relationships on top of the one below.

## Faker

A faker is an immutable, lazy builder that describes *how* to generate a value. Every method call returns a new instance, leaving the original unchanged. No value is produced until `.create()` is called.

```typescript
const age = numeric().min(18).max(65);
age.create();   // 34
age.create();   // 51 — different each time
```

See [Working with Fakers](/guide/fakers) for the full guide.

## Domain

Domains are entry points for creating fakers. They come in two flavors:

- **Core domains** — structural building blocks: `numeric()`, `text()`, `temporal()`, `bool()`, `choice()`, `collection()`. These expose constraint methods (`.min()`, `.maxLength()`, etc.).
- **Semantic domains** — real-world data: `person()`, `internet()`, `location()`, `commerce()`, `finance()`, `company()`, `lorem()`, `food()`, `system()`, and more. Each method returns a core faker, so you can keep chaining constraints.

```typescript
person().age()                               // NumericFaker — .min()/.max() work
internet().email()                           // TextFaker — .not() works
finance().amount().precision(2)              // NumericFaker
```

## Mixin

Mixins are composable interfaces that grant capabilities to fakers. Not every mixin applies to every domain — only the combinations that make sense.

| Mixin | Methods | Applies to |
|-------|---------|------------|
| **Bounded** | `.min()`, `.max()`, `.between()` | numeric, temporal |
| **Measurable** | `.length()`, `.minLength()`, `.maxLength()` | text, collection |
| **Excludable** | `.not()` | numeric, text, temporal, choice |
| **Nullable** | `.nullable()`, `.optional()` | all fakers |
| **Seedable** | `.seed(n)` | all fakers |

See the [Faker API](/reference/faker#_2-mixins) for the full mixin-to-domain matrix.

## Schema

A schema is a typed factory for mock objects. Each field maps to a faker, literal value, `when()`, or `derive()`. The generic parameter enforces compile-time type checking.

```typescript
const UserSchema = schema<User>({
  id: text().uuid(),
  name: person().fullName(),
  age: person().age().min(18).max(80),
  status: choice('active', 'inactive'),
});

const user: User = UserSchema.create();
// { id: 'e72f1a9b-...', name: 'Amara Osei', age: 41, status: 'active' }
```

See [Working with Schemas](/guide/schemas) for `when()`, `derive()`, and advanced patterns.

## Trait

A trait is a named, reusable set of field overrides on a schema. It represents a specific state — "admin", "deleted", "expired" — and is applied with `.with()`.

```typescript
const UserSchema = schema<User>({ /* ... */ })
  .trait('admin', { role: 'admin' as const })
  .trait('inactive', { status: 'inactive' as const });

UserSchema.with('admin').create();
// { id: '3d4c8b2e-...', name: 'Yuki Tanaka', age: 52, role: 'admin', status: 'active' }

UserSchema.with('admin', 'inactive').create();
// { id: 'f7a2d190-...', name: 'Diego Fuentes', age: 29, role: 'admin', status: 'inactive' }
```

Traits are partial and type-checked — you only override the fields you need, and TypeScript ensures they match the interface.

## `.with()`

The single customization method across schemas and stories.

- **On a schema**: accepts trait names and/or an override object.
  ```typescript
  UserSchema.with('admin', { name: 'Eldar' }).create();
  // { id: 'b1c5a8f3-...', name: 'Eldar', age: 37, role: 'admin', status: 'active' }
  ```
- **On a story**: the first argument is the entry name, followed by traits and/or overrides.
  ```typescript
  myStory.with('user', 'admin', { name: 'Eldar' }).create();
  ```

Both return a new instance (immutable).

## Story

A story composes multiple schema instances into a coherent, referentially-linked dataset. The result is a typed record.

```typescript
const checkout = story()
  .add('user', UserSchema)
  .add('order', OrderSchema, { userId: ref('user') })
  .create();

// checkout.order.userId === checkout.user.id
```

Key helpers:
- **`ref()`** — resolves a foreign key to another entry's identity at create time.
- **`.setup()`** — a callback for complex relationship wiring (array membership, computed fields).

Stories support inheritance — define a base story once and extend it with `.add()`, `.with()`, or `.setup()`. See [Working with Stories](/guide/stories).

## Data Provider

The provider is an adapter interface for the underlying generation engine. storymock ships with `FakerJsProvider` (wrapping `@faker-js/faker`) as the default. You can swap providers globally via `configure()` or build your own by implementing `CoreProvider`.

```typescript
import { configure, FakerJsProvider } from 'storymock';
configure({ provider: new FakerJsProvider() });
```

See [Configuration](/guide/configuration) for setup and custom providers.

## Immutability

Every method on every layer returns a **new instance**. The original is never modified. This makes fakers, schemas, and stories safe to fork, store, and compose without side effects.

```typescript
const base = numeric().min(0).max(100);
const small = base.max(10);    // new instance
const big = base.min(90);      // another new instance — base is unchanged
```

This applies to `.trait()`, `.with()`, `.add()`, `.setup()` — everything.
