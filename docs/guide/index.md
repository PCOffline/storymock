# Getting Started

## What is storymock?

storymock is a TypeScript-first mocking library built in three layers: **fakers** generate individual values, **schemas** compose fakers into typed objects, and **stories** wire schemas into coherent, related datasets. Every layer is immutable, lazy, and fully type-checked.

## Installation

```bash
npm install storymock
```

## Your first faker

A faker is a lazy builder that describes *how* to generate a value. Nothing happens until you call `.create()`.

```typescript
import { numeric, text, person } from 'storymock';

numeric().min(1).max(100).create();   // 42
text().uuid().create();               // '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
person().firstName().create();        // 'Maria'
```

Every method returns a **new instance** — fakers are immutable, so you can safely fork and reuse them:

```typescript
const age = numeric().min(0).max(120);
const adultAge = age.min(18);          // new instance — age is unchanged

adultAge.create();   // 34
age.create();        // 7
```

## Your first schema

A schema maps each field of a TypeScript interface to a faker (or literal value) and produces typed objects via `.create()`.

```typescript
import { schema, text, numeric, person, choice } from 'storymock';

interface User {
  id: string;
  name: string;
  age: number;
  role: 'viewer' | 'editor';
}

const UserSchema = schema<User>({
  id: text().uuid(),
  name: person().fullName(),
  age: person().age().min(18).max(80),
  role: choice('viewer', 'editor'),
});

const user: User = UserSchema.create();
// { id: '9b2f7e4a-...', name: 'Tomoko Nishimura', age: 34, role: 'viewer' }

const users: User[] = UserSchema.create(10);
// [{ id: 'c4f8...', name: 'Diego Fuentes', age: 28, role: 'editor' }, ...] — 10 users
```

The generic `<User>` ensures every field is present and type-correct at compile time. Miss a field or pass the wrong faker type and TypeScript will tell you.

## Your first trait

A trait is a named set of field overrides that represents a specific state. Define it once, apply it anywhere with `.with()`.

```typescript
const UserSchema = schema<User>({
  id: text().uuid(),
  name: person().fullName(),
  age: person().age().min(18).max(80),
  role: choice('viewer', 'editor'),
}).trait('admin', {
  role: 'editor' as const,
  age: numeric().min(25).max(60),
});

const admin = UserSchema.with('admin').create();
// { id: '5a8c3f12-...', name: 'Lena Björk', age: 47, role: 'editor' }

// Traits compose with inline overrides:
const namedAdmin = UserSchema.with('admin', { name: 'Eldar' }).create();
// { id: 'f0d7b3a1-...', name: 'Eldar', age: 33, role: 'editor' }
```

## Your first story

A story composes multiple schemas and wires their relationships. Use `ref()` to link foreign keys automatically.

```typescript
import { schema, story, ref, text, numeric, person, choice } from 'storymock';

interface Order {
  id: string;
  userId: string;
  total: number;
}

const OrderSchema = schema<Order>({
  id: text().uuid(),
  userId: text().uuid(),
  total: numeric().min(10).max(500),
});

const checkout = story()
  .add('user', UserSchema)
  .add('order', OrderSchema, { userId: ref('user') })
  .create();

// checkout.order.userId === checkout.user.id  ✓
```

`ref('user')` resolves to the user's `id` at create time. The result is a fully typed record — `checkout.user` is `User`, `checkout.order` is `Order`.

## What's next?

- [Core Concepts](/guide/concepts) — the mental model behind the three layers
- [Working with Fakers](/guide/fakers) — domains, mixins, and all the ways to shape values
- [Working with Schemas](/guide/schemas) — schemas, traits, `when()`, `derive()`
- [Working with Stories](/guide/stories) — stories, `ref()`, `.setup()`, inheritance
- [Configuration](/guide/configuration) — global defaults, seeding, custom providers
- [API Reference](/reference/) — exhaustive method reference
