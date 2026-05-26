# Contributing to storymock

> Internal reference for contributors. Read the [docs/](docs/) for the public-facing API documentation.

---

## Project setup

```bash
pnpm install
pnpm test   # jest in watch mode
pnpm lint   # eslint
```

---

## Architecture

### Three layers

```
storymock/faker       (standalone — no internal dependencies)
       ↑
storymock/schema      (depends on faker)
       ↑
storymock/story       (depends on schema + faker)
```

Each layer builds on the one below. A faker works without a schema, a schema works without a story. Dependencies only point downward — never import from `schema` inside `faker`, or from `story` inside `schema`.

### Import paths

The package exposes three subpath entry points plus a root that re-exports everything:

```typescript
import { numeric, text, temporal, person, configure } from 'storymock/faker';
import { schema, when, derive } from 'storymock/schema';
import { story, ref } from 'storymock/story';

// Prefer importing from the root in all docs and examples
import { numeric, text, schema, story, ref, when, derive } from 'storymock';
```

---

## Layer 1: Faker

A faker is an immutable builder that describes how to generate a value. Nothing is produced until `.create()` is called. Every method returns a new instance.

### Core domains

These are the structural building blocks. Each is a factory function that returns a faker:

| Factory | Produces | Default |
|---------|----------|---------|
| `numeric()` | `number` | int in `[0, 1000]` |
| `text()` | `string` | alphanumeric, length `[1, 20]` |
| `temporal()` | `Date` | ±10 years from now |
| `bool()` | `boolean` | 50/50 |
| `choice(...values)` | union of the values | uniform distribution |
| `collection(faker)` | `T[]` | length `[1, 5]` |

### Mixins

Capabilities are composed via mixins. Not every mixin applies to every domain:

| Mixin | Methods | Applies to |
|-------|---------|------------|
| Bounded | `.min()`, `.max()`, `.between()` | numeric, temporal |
| Measurable | `.length()`, `.minLength()`, `.maxLength()` | text, collection |
| Excludable | `.not(...values)` | numeric, text, temporal, choice |
| Nullable | `.nullable()`, `.optional()` | all |
| Seedable | `.seed(n)` | all |

When implementing a new domain, pick only the mixins that make sense for it.

### Semantic domains

Functions like `person()`, `internet()`, `location()` etc. that return factory methods. Each method returns a **core domain faker**, so constraints keep working:

```typescript
person().age()             // → NumericFaker — .min(18).max(65) works
internet().email()         // → TextFaker — .not('test@test.com') works
finance().amount()         // → NumericFaker — .precision(2) works
```

Semantic domains delegate actual value generation to the data provider (see below).

### Data provider

All generation goes through a `DataProvider` interface. The default implementation wraps `@faker-js/faker`.

- `CoreProvider` is the required minimum: `integer()`, `float()`, `string()`, `boolean()`, `date()`, `pick()`, `pickMultiple()`, `shuffle()`, `seed()`.
- Semantic modules (`person`, `internet`, `location`, …) are optional. If a semantic faker is called and the provider lacks the module, throw `UnsupportedProviderError`.

### Format methods

Some domains have format methods (e.g. `.hex()`, `.iso()`) that **change the return type**. These must come last in the chain — once called, the faker loses its domain-specific constraints:

```typescript
numeric().min(0).max(255).hex()   // ✅ returns Faker<string>
numeric().hex().min(0)            // ❌ type error — Faker<string> has no .min()
```

---

## Layer 2: Schema

A schema maps each field of a TypeScript interface to a faker, literal, `when()`, or `derive()`, and produces typed objects via `.create()`.

### Field types

A schema field can be: a `Faker<T>`, a nested `Schema<T>`, a literal value, a `when()` conditional, or a `derive()` computation.

### Traits

Named partial overrides on a schema. Type-checked against the original interface. Defined with `.trait()`, applied with `.with()`.

### `when()` and `derive()`

- `when(field, caseMap)` — picks a faker/literal based on a sibling field's resolved value. Creates a dependency edge.
- `derive(fn)` — computes a field from resolved siblings. Resolves after all non-derived fields.

### Dependency resolution

Fields form a DAG. At definition time, `when()` edges are analyzed and topologically sorted. Cycles throw `CircularDependencyError` immediately. At `.create()` time, fields resolve in topological order, then `derive()` fields resolve last.

### `.with()` on schemas

Single method for applying traits and/or inline field overrides. Traits left-to-right, then overrides last. Always returns a new schema.

### `.id()`

Schema metadata declaring how to extract the identity of an instance. Used by `ref()` in stories.

### `.setup()`

Records a post-generation callback. Runs sequentially at `.create()` time on the fully resolved object. Returns a new schema (immutable). Callbacks accumulate.

---

## Layer 3: Story

A story composes multiple schema instances into a typed record with relationship wiring.

### Core API

- `.add(name, schema, overrides?)` — single entry.
- `.addMany(name, schema, count, overrides?)` — array entry.
- `.setup(fn)` — relationship wiring callback. Accumulates across inheritance.
- `ref(name)` / `ref(name, field)` — resolves a foreign key at `.create()` time.
- `.with(entryName, ...traitsAndOverrides)` — customize a specific entry.
- `.derive(name, fn)` — compute an additional entry from the fully-wired mocks.

### `ref()` resolution

1. Schema `.id()` metadata → 2. `id` property → 3. string value → 4. `UnknownRefError`.

When `ref()` points at an `addMany` entry, it resolves to an array of IDs.

### Story inheritance

Stories are immutable builders. `.add()`, `.addMany()`, `.with()`, `.setup()` all return new stories. `.setup()` callbacks accumulate — derived stories inherit all parent setups. This is what makes the "define once, reuse everywhere" pattern work.

### Targeting specific entries

`.with('items[0]', 'premium')` targets index 0 of an `addMany` entry instead of applying to all items.

---

## Configuration

### Global (`configure()`)

Mutates global state. Affects all subsequent generation. Supports `seed`, `provider`, and per-domain `defaults`.

### Faker-level

Builder methods on individual fakers. Returns new fakers, never touches global state.

### Precedence (highest wins)

1. Faker (`.seed(42)`, `.min(5)`)
2. Schema (`.seed(42)`)
3. Story (`.seed(42)`)
4. Global (`configure()`)

---

## Errors

All extend `StorymockError`. Throw eagerly at definition time when possible, lazily at `.create()` time for runtime issues.

| Error | When |
|-------|------|
| `ContradictoryConstraintError` | Constraints conflict (min > max, all choices excluded, not enough unique values) |
| `CircularDependencyError` | `when()` edges form a cycle — thrown at schema definition time |
| `MissingCaseError` | `when()` case map has no match and no `_` default |
| `UnsupportedProviderError` | Provider missing a required semantic module |
| `InvalidTraitError` | Trait name not defined, field not on interface, or type mismatch |
| `DuplicateNameError` | Two story entries share a name |
| `UnknownRefError` | `ref()` to non-existent entry or unresolvable identity |
| `IndexOutOfBoundsError` | `.with('items[n]', ...)` targets an index beyond the `addMany` count |

---

## Conventions

- Every builder method returns a new instance — never mutate `this`.
- Nothing is generated until `.create()` is called.
- `.with()` is the single customization verb — no `.override()`.
- See the conventions listed below for naming and lint rules.

---

## Extensibility

### Custom semantic domains

`registerDomain(name, factory)` — the factory callback receives a `CoreProvider` so custom domains respect the global seed and provider.

### Custom providers

Implement `CoreProvider` for a minimal backend, or extend `FakerJsProvider`.

---

## Documentation site

The docs live in `docs/` and are built with [VitePress](https://vitepress.dev/).

### Running locally

```bash
cd docs
pnpm install
pnpm dev      # starts dev server at http://localhost:5173
```

The dev server hot-reloads on every save — edit a markdown file and see the result instantly.

### Building for production

```bash
cd docs
pnpm build    # outputs to docs/.vitepress/dist/
pnpm preview  # preview the production build locally
```

### Site structure

```
docs/
├── .vitepress/config.ts     ← Nav, sidebar, site metadata
├── index.md                 ← Landing page (VitePress home layout)
├── guide/                   ← Tutorial-style narrative guides
│   ├── index.md             ← Getting Started
│   ├── concepts.md          ← Core Concepts
│   ├── fakers.md            ← Working with Fakers
│   ├── schemas.md           ← Working with Schemas
│   ├── stories.md           ← Working with Stories
│   ├── configuration.md     ← Configuration & seeding
│   └── errors.md            ← Error reference
├── reference/               ← Exhaustive API reference
│   ├── index.md             ← Quick Reference cheat sheet
│   ├── faker.md             ← Faker API
│   ├── schema.md            ← Schema API
│   └── story.md             ← Story API
├── examples.md              ← Examples overview
└── changelog.md             ← Changelog
```

### Writing guide pages vs reference pages

**Guide pages** (`docs/guide/`) are tutorial-style: progressive, narrative, approachable. They introduce concepts one at a time with focused examples. Think "here's how to use this" — teach by doing.

**Reference pages** (`docs/reference/`) are exhaustive: every method, every signature, every edge case. Think "here's what this does" — look up by name.

Avoid duplicating content between the two. Guide pages should link to the reference for full details; reference pages should link to the guide for context.

### Adding a new page

1. Create the markdown file in the appropriate directory (`guide/` or `reference/`).
2. Add an entry to the sidebar in `docs/.vitepress/config.ts`.
3. Use VitePress absolute paths for internal links: `/guide/fakers`, `/reference/schema#traits`, etc.
4. Run `pnpm build` from `docs/` to verify there are no dead links.

### Contributing examples

Examples live in `examples/` at the project root (not inside `docs/`). Each example is a self-contained `.ts` file that highlights a **storymock feature**, not a business scenario.

To add an example:

1. Create a new `.ts` file in `examples/` named after the feature: `my-feature.ts`.
2. Add a JSDoc header explaining what feature is demonstrated.
3. Use minimal interfaces (3–5 fields) — just enough to showcase the feature.
4. Import only from `'storymock'`.
5. Add an entry to `docs/examples.md` with a description and bullet list of what's demonstrated.

### Style guidelines for docs

- Use `.create()` everywhere — never `.exec()`.
- Call composable interfaces "Mixins", not "Trait Interfaces".
- "Trait" means only schema field overrides (`.trait('admin', {...})`).
- Use `.precision()` (implies float) — never pair with `.float()` explicitly.
- Use tables for structured comparisons (mixin matrices, field-type summaries, error catalogs). Use bullet lists for sequential method documentation in API references.
- Keep code examples short and focused. One concept per example.
- End guide pages with a link to the full API reference.
- Prefer imports from `'storymock'` in all user-facing docs and examples.
- Define canonical examples in `examples/` and link to them from guide and reference pages rather than duplicating full code blocks.
