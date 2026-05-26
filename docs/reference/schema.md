# Schema — API Reference

> Part of [storymock](/). Import from `'storymock'` or `'storymock/schema'`.

A schema is a typed factory for generating mock objects. It maps each field of a TypeScript interface to a faker, literal value, or conditional helper, and produces instances via `.create()`. For seeding, see [Configuration — Seeding](/guide/configuration#seeding).

---

## Table of Contents

1. [Schema Definition](#_1-schema-definition)
2. [Field Types](#_2-field-types)
3. [Traits](#_3-traits)
4. [Customization with `.with()`](#_4-customization-with-with)
5. [Conditional Logic: `when()`](#_5-conditional-logic-when)
6. [Computed Fields: `derive()`](#_6-computed-fields-derive)
7. [Dependency Resolution](#_7-dependency-resolution)
8. [Schema Metadata](#_8-schema-metadata)
9. [Setup Callbacks: `.setup()`](#_9-setup-callbacks-setup)
10. [Batch Generation](#_10-batch-generation)

---

## 1. Schema Definition

```typescript
import { schema, numeric, text, temporal, person, choice, collection } from 'storymock';

interface User {
  id: string;
  name: string;
  age: number;
  birthdate: Date;
  status: 'active' | 'inactive';
  tags: string[];
}

const UserSchema = schema<User>({
  id: text().uuid(),
  name: person().fullName(),
  age: person().age().min(18).max(80),
  birthdate: temporal().past(50),
  status: choice('active', 'inactive'),
  tags: collection(lorem().word()).maxLength(3),
});

const user: User = UserSchema.create();
// { id: 'a1c4e8b2-...', name: 'Sofia Reyes', age: 37, status: 'active', ... }
```

The generic parameter `<User>` enables compile-time validation: every key of `User` must be present, and each field's faker must produce the correct type.

### Throws

- `ContradictoryConstraintError` — thrown at `.create()` time when field constraints conflict (e.g. `numeric().min(10).max(5)`). See [errors](/guide/errors) for details.

---

## 2. Field Types

A schema field can be any of the following:

| Type | Description | Example |
|------|-------------|---------|
| `Faker<T>` | A faker that produces the field's type | `text().uuid()` |
| `Schema<T>` | A nested schema (creates a sub-object) | `AddressSchema` |
| Literal `T` | A constant value, used as-is every time | `'active'` |
| `When<T>` | Conditional based on a sibling field | `when('type', { ... })` |
| `Derive<T>` | Computed from resolved sibling fields | `derive(({ a, b }) => ...)` |

```typescript
type SchemaDefinition<T> = {
  [K in keyof T]:
    | Faker<T[K]>
    | Schema<T[K]>
    | T[K]
    | When<T, T[K]>
    | Derive<T, T[K]>;
};
```

Nested schemas are fully supported:

```typescript
interface Address {
  street: string;
  city: string;
  zip: string;
}

interface User {
  name: string;
  address: Address;
}

const AddressSchema = schema<Address>({
  street: location().streetAddress(),
  city: location().city(),
  zip: location().zipCode(),
});

const UserSchema = schema<User>({
  name: person().fullName(),
  address: AddressSchema,       // nested schema — creates a full Address
});
```

---

## 3. Traits

Traits are named, reusable sets of field overrides. They represent a specific **state** of the mock data.

### 3.1 Defining Traits

```typescript
const UserSchema = schema<User>({ /* base definition */ })
  .trait('birthday', {
    birthdate: temporal().today().yearsAgo(numeric().min(18).max(80)),
  })
  .trait('inactive', {
    status: 'inactive' as const,
  })
  .trait('admin', {
    tags: ['admin', 'staff'],
  })
  .trait('young', {
    age: numeric().min(18).max(25),
    birthdate: temporal().yearsAgo(numeric().min(18).max(25)),
  });
```

### 3.2 Trait Rules

- A trait is a **partial** schema definition — it only needs to include the fields it overrides
- Trait fields are type-checked against the original interface
- Trait values follow the same rules as schema fields (fakers, literals, when, derive)
- Defining a trait returns a **new schema** (immutable)

```typescript
// ❌ Type error — 'email' is not a field of User
UserSchema.trait('invalid', { email: text() });

// ❌ Type error — age must be number, not string
UserSchema.trait('invalid', { age: text() });
```

### Throws

- `InvalidTraitError` — thrown when applying a trait name that was never defined on the schema. See [errors](/guide/errors) for details.

---

## 4. Customization with `.with()`

`.with()` is the **single method** for applying traits and field overrides. There is no separate `.override()` method.

### 4.1 Applying Traits

```typescript
const birthdayUser = UserSchema.with('birthday').create();
// { id: '4f8a1c3d-...', name: 'Kenji Watanabe', age: 62, status: 'active', ... }

const inactiveAdmin = UserSchema.with('inactive', 'admin').create();
// { id: 'd2b7e5f0-...', name: 'Amara Osei', age: 29, status: 'inactive', tags: ['admin', 'staff'], ... }
```

Multiple traits are applied left-to-right. Later traits override earlier ones for overlapping fields.

### 4.2 Applying Field Overrides

Pass an object as the **last argument** to override specific fields inline:

```typescript
const customUser = UserSchema.with({ name: 'Eldar', age: 30 }).create();
// { id: '9c3f2a71-...', name: 'Eldar', age: 30, status: 'active', ... }
```

### 4.3 Combining Traits and Overrides

```typescript
const birthdayEldar = UserSchema.with('birthday', { name: 'Eldar' }).create();
// { id: 'e6d0b8a2-...', name: 'Eldar', age: 44, status: 'inactive', ... }

const youngAdmin = UserSchema.with('young', 'admin', { name: 'Alice' }).create();
// { id: '1a5c9f3e-...', name: 'Alice', age: 22, tags: ['admin', 'staff'], ... }
```

Traits are applied first (left-to-right), then the field override object is applied last.

### 4.4 Immutability

`.with()` always returns a **new schema**. The original is unchanged:

```typescript
const base = UserSchema;
const birthday = base.with('birthday');     // new schema
const admin = base.with('admin');           // another new schema, independent of birthday
```

For `.with()` on stories, see [Story API — .with()](/reference/story#_2-customization-with-with).

---

## 5. Conditional Logic: `when()`

`when()` selects a faker based on the resolved value of a sibling field. It creates an implicit dependency edge in the resolution graph (see §7). The case map supports string, number, and boolean keys.

### String Matching

```typescript
import { schema, when, numeric, temporal, choice } from 'storymock';

interface Coupon {
  type: 'percentage' | 'fixed';
  status: 'expired' | 'redeemed' | 'available';
  price: number;
  expiration: Date;
}

const CouponSchema = schema<Coupon>({
  type: choice('percentage', 'fixed'),
  status: choice('expired', 'redeemed', 'available'),

  price: when('type', {
    percentage: numeric().min(5).max(100),
    fixed: numeric().min(10).max(200).precision(2),
  }),

  expiration: when('status', {
    expired: temporal().past(),
    _: temporal().future(),       // '_' is the default/else case
  }),
});
```

Each key is a possible value of the matched field. `_` is the default/else case.

::: info Full example
[`examples/conditional-fields.ts`](https://storymock.dev/examples#conditional-fields)
:::

### Numeric Matching

```typescript
interface Order {
  quantity: number;
  discount: number;
}

const OrderSchema = schema<Order>({
  quantity: choice(1, 5, 10),

  discount: when('quantity', {
    1: 0,
    5: numeric().min(5).max(10).precision(2),
    _: numeric().min(10).max(25).precision(2),
  }),
});
```

Numeric keys in the case map are matched against the resolved value of the field.

### Boolean Matching

```typescript
interface Feature {
  isActive: boolean;
  label: string;
}

const FeatureSchema = schema<Feature>({
  isActive: choice(true, false),

  label: when('isActive', {
    true: 'Enabled',
    false: 'Disabled',
  }),
});
```

### Rules

- The matched field must resolve **before** the dependent field
- Cases can be fakers or literal values
- `_` is the default case — used when no other case matches
- If no case matches and no `_` is provided, `MissingCaseError` is thrown at `.create()` time
- For complex conditional logic on any field type, use `derive()` instead

### Throws

- `MissingCaseError` — thrown at `.create()` time when the resolved value of the matched field does not match any case key and no `_` default is provided. See [errors](/guide/errors) for details.

---

## 6. Computed Fields: `derive()`

`derive()` computes a field's value from resolved sibling fields. It's the escape hatch for logic that doesn't fit `when()`.

```typescript
import { schema, derive, choice, numeric, food } from 'storymock';

const CouponSchema = schema<Coupon>({
  type: choice('percentage', 'fixed'),
  price: numeric().min(5).max(100),

  title: derive(({ type, price }) => {
    const suffix = type === 'percentage' ? '%' : ' USD';
    return `${price}${suffix} OFF ${food().dish().create()}`;
  }),
});
```

### Type Signature

```typescript
function derive<T, R>(
  fn: (resolved: Partial<T>) => R | Faker<R>,
): Derive<T, R>;
```

### Rules

- The callback receives a `Partial<T>` of all fields resolved so far
- The callback can return a literal value **or** a faker (which will be `.create()`'d automatically)
- `derive()` fields resolve **after** all non-derived fields (MVP behavior)
- Future: Proxy-based dependency tracking will enable `derive()` → `derive()` chains

---

## 7. Dependency Resolution

Fields form a **directed acyclic graph** (DAG) based on their dependencies:

- Plain fakers and literals have no dependencies — resolved first
- `when('fieldA', ...)` creates an edge: `fieldA → this field`
- `derive()` fields resolve after all non-derived fields (MVP)

### Resolution Order

1. **Definition time:** Analyze `when()` calls to build the dependency graph
2. **Definition time:** Topological sort — throw `CircularDependencyError` if a cycle exists
3. **Create time:** Resolve fields in topological order, passing results to dependents
4. **Create time:** Resolve all `derive()` fields last

```
// Example for CouponSchema:
// 1. type       (no deps)
// 2. status     (no deps)
// 3. price      (depends on type via when())
// 4. expiration (depends on status via when())
// 5. title      (derive — resolves last, receives type + price)
```

### Throws

- `CircularDependencyError` — thrown at definition time when `when()` edges form a cycle in the dependency graph. See [errors](/guide/errors) for details.

---

## 8. Schema Metadata

### `.id(fn)`

Declares how to extract the identity of a generated instance. Used by `ref()` in stories to resolve foreign keys.

```typescript
const UserSchema = schema<User>({ /* ... */ })
  .id((user) => user.id);
```

#### Resolution chain

When a story evaluates `ref('user')`, it resolves the identity through this chain (first match wins):

1. **`.id()` accessor** — if the schema has `.id(fn)`, calls `fn(instance)` and uses the return value
2. **`id` property** — if the generated object has a property named `id`, uses its value
3. **String value** — if the entire generated value is a string (e.g., from a bare `text()` schema), uses it directly
4. **Error** — throws `UnknownRefError`

#### When to define `.id()` explicitly

Most schemas have an `id` field, so `ref()` resolves automatically. Define `.id()` when:
- The primary key has a non-standard name (`_id`, `uuid`, `pk`)
- The identity is composite
- The identity requires transformation

```typescript
// Non-standard key name
const DocSchema = schema<Doc>({ _id: text().objectId(), ... })
  .id((doc) => doc._id);

// Composite identity
const EdgeSchema = schema<Edge>({ from: text().uuid(), to: text().uuid(), ... })
  .id((edge) => `${edge.from}:${edge.to}`);
```

See [Stories — ref()](/reference/story#_4-cross-references-ref) for how resolution works at the story level.

---

## 9. Setup Callbacks: `.setup()`

`.setup()` records a callback — no mutation happens until `.create()` is called. At create time, all setup callbacks execute sequentially on the generated objects.

```typescript
const UserSchema = schema<User>({
  id: text().uuid(),
  name: person().fullName(),
  age: person().age().min(18).max(80),
})
.setup((user) => {
  user.name = user.name.toUpperCase();
})
.setup((user) => {
  console.log('Generated user:', user.id);
});

const user = UserSchema.create();
// 1. Object is generated from the schema definition
// 2. First .setup() callback runs — uppercases the name
// 3. Second .setup() callback runs — logs the id
```

`.setup()` returns a new schema (immutable). Each callback receives the fully resolved object and can mutate it in place. Callbacks execute in registration order.

---

## 10. Batch Generation

Generate multiple instances:

```typescript
const users: User[] = UserSchema.create(10);
// [{ id: 'a1c4...', name: 'Sofia Reyes', age: 37, ... }, ...] — 10 users

const admins: User[] = UserSchema.with('admin').create(5);
// [{ id: 'f7a2...', name: 'Kenji Watanabe', tags: ['admin', 'staff'], ... }, ...] — 5 admins
```

Each instance in the batch is independently generated (different random values, unless seeded).
