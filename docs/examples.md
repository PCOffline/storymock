# Examples

Self-contained TypeScript examples, each highlighting a **storymock feature**. Run any example with `npx tsx examples/<file>.ts`.

---

## Fakers & Composability

Core domains, semantic domains, constraint chaining, composability, batch generation.

**Highlights:**
- `numeric()`, `text()`, `temporal()`, `bool()`, `choice()`, `collection()`
- Constraint chaining: `.min()`, `.max()`, `.float()`, `.precision()`, `.length()`
- Format methods that change return type: `.hex()`, `.iso()`
- Faker-in-faker composability: `temporal().year(numeric().min(2020).max(2025))`
- Batch (`.create(5)`) and unique (`.unique().create(3)`)
- `.nullable()` and `.optional()`

::: info Try it
[View source on GitHub](https://github.com/storymock/storymock/blob/main/examples/fakers-and-composability.ts) · [Open in StackBlitz ⚡](https://stackblitz.com/github/storymock/storymock/tree/main?file=examples/fakers-and-composability.ts)
:::

---

## Traits & Customization

Named states, combining traits, inline overrides, immutable forking.

**Highlights:**
- Defining traits with `.trait('name', { ... })`
- Applying one trait: `.with('completed')`
- Combining traits left-to-right: `.with('urgent', 'completed')`
- Inline overrides: `.with({ title: 'Fix bug #123' })`
- Traits + overrides: `.with('urgent', { assignee: 'Alice' })`
- Immutable forking: base schema unchanged after `.with()`

::: info Try it
[View source on GitHub](https://github.com/storymock/storymock/blob/main/examples/traits-and-customization.ts) · [Open in StackBlitz ⚡](https://stackblitz.com/github/storymock/storymock/tree/main?file=examples/traits-and-customization.ts)
:::

---

## Conditional Fields

`when()` for conditional logic, `derive()` for computed fields, dependency resolution.

**Highlights:**
- `when()` with string keys: `when('type', { percentage: ..., fixed: ... })`
- `when()` with numeric keys and `_` default
- `when()` with boolean keys
- `derive()` computing from resolved siblings
- `derive()` returning a faker instead of a literal
- Field resolution order (DAG)

::: info Try it
[View source on GitHub](https://github.com/storymock/storymock/blob/main/examples/conditional-fields.ts) · [Open in StackBlitz ⚡](https://stackblitz.com/github/storymock/storymock/tree/main?file=examples/conditional-fields.ts)
:::

---

## Story Composition

`ref()` for foreign keys, `.setup()` for wiring, `addMany`, type accumulation.

**Highlights:**
- `story().add()` and `.addMany()` with type accumulation
- `ref('entry')` resolving foreign keys via `.id()`
- `ref('entry', 'field')` referencing a specific field
- `ref()` on `addMany` entries resolving to an array of IDs
- `.setup()` for complex relationship wiring
- Inline overrides with `ref()`

::: info Try it
[View source on GitHub](https://github.com/storymock/storymock/blob/main/examples/story-composition.ts) · [Open in StackBlitz ⚡](https://stackblitz.com/github/storymock/storymock/tree/main?file=examples/story-composition.ts)
:::

---

## Story Inheritance

Base stories, extending, setup accumulation, cascading `.with()`, targeting.

**Highlights:**
- Base story → extended story with additional entries
- `.setup()` accumulation across inheritance
- Cascading `.with()` across multiple entries
- Targeting specific `addMany` items: `.with('teams[0]', { ... })`
- Forking independent variants from the same base
- Reusable wiring functions

::: info Try it
[View source on GitHub](https://github.com/storymock/storymock/blob/main/examples/story-inheritance.ts) · [Open in StackBlitz ⚡](https://stackblitz.com/github/storymock/storymock/tree/main?file=examples/story-inheritance.ts)
:::

---

## Seeding & Determinism

`.seed()` at every level, `configure({ seed })`, reproducible snapshots.

**Highlights:**
- Faker seed: `numeric().seed(42).create()`
- Schema seed: `UserSchema.seed(42).create()`
- Story seed: `myStory.seed(42).create()`
- Seed precedence (faker > schema > story > global)
- Global seed via `configure({ seed: 42 })`
- Deterministic test assertions

::: info Try it
[View source on GitHub](https://github.com/storymock/storymock/blob/main/examples/seeding-and-determinism.ts) · [Open in StackBlitz ⚡](https://stackblitz.com/github/storymock/storymock/tree/main?file=examples/seeding-and-determinism.ts)
:::

---

## Running Examples

```bash
git clone https://github.com/storymock/storymock.git
cd storymock
pnpm install

npx tsx examples/fakers-and-composability.ts
npx tsx examples/traits-and-customization.ts
npx tsx examples/conditional-fields.ts
npx tsx examples/story-composition.ts
npx tsx examples/story-inheritance.ts
npx tsx examples/seeding-and-determinism.ts
```

---

## Contributing an Example

Examples highlight **features**, not business scenarios. See the [Contributing guide](https://github.com/storymock/storymock/blob/main/CONTRIBUTION_GUIDE.md#contributing-examples) for the full checklist.
