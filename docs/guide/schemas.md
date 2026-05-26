# Working with Schemas

A progressive tutorial on building typed mock object factories with storymock schemas.

---

## What is a Schema?

A schema is a **typed factory** for generating mock objects. You map each field of a TypeScript interface to a faker, literal value, nested schema, or helper — and the schema produces fully-typed instances via `.create()`.

Like fakers, schemas are **immutable**. Methods like `.trait()` and `.with()` always return a new schema, leaving the original unchanged. And like fakers, nothing is generated until you call `.create()`.

```typescript
import { schema, text, person, choice } from 'storymock';

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
// { id: 'e72f1a9b-...', name: 'Amara Osei', age: 41, role: 'editor' }

const users: User[] = UserSchema.create(10);
// [{ id: '3d4c...', name: 'Lena Björk', age: 55, role: 'viewer' }, ...] — 10 users
```

The generic `<User>` is the key — it enables compile-time validation. Miss a field, use the wrong type, or misspell a key, and TypeScript catches it before your tests ever run.

---

## Defining a Schema

A schema definition is an object where each key matches a field on your interface. Values can be:

| Type | What it does | Example |
|------|--------------|---------|
| `Faker<T>` | Generates a random value of type T | `text().uuid()` |
| `Schema<T>` | Creates a nested sub-object | `AddressSchema` |
| Literal `T` | Used as-is, every time | `'active'` |
| `When<T>` | Conditionally picks based on a sibling | `when('type', { ... })` |
| `Derive<T>` | Computed from resolved siblings | `derive(({ a, b }) => ...)` |

Here's a schema mixing several field types:

```typescript
const ProductSchema = schema<Product>({
  id: text().uuid(),                               // faker
  name: commerce().productName(),                   // semantic faker
  price: numeric().min(1).max(1000).precision(2),          // constrained faker
  currency: 'USD',                                  // literal
  inStock: bool().probability(0.8),                 // faker
  tags: collection(lorem().word()).maxLength(3),     // collection faker
});
```

---

## Nested Schemas

Schemas compose naturally. When a field's type is an object, define a separate schema for it and use it directly:

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
  address: AddressSchema,          // nested — creates a full Address object
});

UserSchema.create();
// { name: 'Maria Chen', address: { street: '742 Evergreen Terrace', city: 'Springfield', zip: '62704' } }
```

Each `.create()` call generates a fresh nested object. There's no limit to nesting depth.

---

## Traits — Named States

Real test data isn't one-size-fits-all. You need an admin user, a deleted user, a user whose birthday is today. Traits let you define these states once and apply them by name.

### Defining traits

A trait is a **partial** schema definition — it only overrides the fields it cares about:

```typescript
const UserSchema = schema<User>({
  id: text().uuid(),
  name: person().fullName(),
  age: person().age().min(18).max(80),
  role: choice('viewer', 'editor'),
  status: choice('active', 'inactive'),
})
.trait('admin', {
  role: 'editor' as const,
  status: 'active' as const,
})
.trait('young', {
  age: numeric().min(18).max(25),
})
.trait('inactive', {
  status: 'inactive' as const,
});
```

### Applying traits

Use `.with()` followed by `.create()`:

```typescript
UserSchema.with('admin').create();
// { id: 'c8d2f4a7-...', name: 'Sofia Reyes', age: 38, role: 'editor', status: 'active' }

UserSchema.with('young').create();
// { id: 'a9f1e0c6-...', name: 'Kenji Watanabe', age: 21, role: 'viewer', status: 'inactive' }
```

Traits are type-checked. If you try to define a trait with a field that doesn't exist on the interface, or with the wrong type, TypeScript will catch it:

```typescript
// ❌ Type error — 'email' is not a field of User
UserSchema.trait('bad', { email: text() });

// ❌ Type error — age must be number, not string
UserSchema.trait('bad', { age: text() });
```

---

## Customizing with .with()

`.with()` is the single method for all schema customization. It supports three patterns:

### Apply a trait by name

```typescript
UserSchema.with('admin').create();
// { id: '7b3e1d09-...', name: 'Priya Kapoor', age: 44, role: 'editor', status: 'active' }
```

### Apply inline field overrides

```typescript
UserSchema.with({ name: 'Eldar', age: 30 }).create();
// { id: 'a9f1e0c6-...', name: 'Eldar', age: 30, role: 'viewer', status: 'inactive' }
```

### Combine traits and overrides

```typescript
UserSchema.with('admin', { name: 'Eldar' }).create();
// { id: 'c8d2f4a7-...', name: 'Eldar', age: 55, role: 'editor', status: 'active' }

UserSchema.with('young', 'admin', { name: 'Alice' }).create();
// { id: '2e9b0c5f-...', name: 'Alice', age: 21, role: 'editor', status: 'active' }
```

When combining, traits are applied left-to-right, then the inline override object is applied last. This means inline overrides always win:

```typescript
UserSchema.with('young', { age: 99 }).create();
// { id: '8f1c4a9d-...', name: 'Obi Nduka', age: 99, role: 'viewer', status: 'active' } — override beats trait
```

### Immutability

`.with()` always returns a **new schema**. The original is unchanged:

```typescript
const base = UserSchema;
const admin = base.with('admin');     // new schema
const young = base.with('young');     // another new schema — independent of admin
```

This makes it safe to derive multiple variants from the same base.

---

## Conditional Fields: when()

Sometimes a field's value should depend on a sibling. `when()` selects a faker (or literal) based on another field's resolved value.

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
    _: temporal().future(),          // '_' is the default/else case
  }),
});
```

When `type` resolves to `'percentage'`, the price is an integer 5–100. When `'fixed'`, it's a float 10–200. The `_` key acts as a catch-all default — here, any non-expired coupon gets a future expiration date.

`when()` supports string, number, and boolean keys. If no case matches and no `_` default is provided, `.create()` throws a `MissingCaseError`. For complex conditional logic that doesn't fit a case map, use `derive()`.

::: info Full example
See [`examples/conditional-fields.ts`](https://storymock.dev/examples#conditional-fields) for the complete example covering string, numeric, and boolean matching plus `derive()`.
:::

---

## Computed Fields: derive()

`derive()` lets you compute a field from the values of already-resolved siblings. The callback receives the resolved fields and can return a literal or a faker:

```typescript
import { schema, derive, choice, numeric, food } from 'storymock';

interface Coupon {
  type: 'percentage' | 'fixed';
  price: number;
  title: string;
}

const CouponSchema = schema<Coupon>({
  type: choice('percentage', 'fixed'),
  price: numeric().min(5).max(100),

  title: derive(({ type, price }) => {
    const suffix = type === 'percentage' ? '%' : ' USD';
    return `${price}${suffix} OFF ${food().dish().create()}`;
  }),
});

CouponSchema.create();
// { type: 'fixed', price: 42, title: '42 USD OFF Pad Thai' }
```

The callback can also return a faker instead of a literal — storymock will `.create()` it automatically. Derived fields resolve **after** all non-derived fields, so they always see the full object.

::: info Full example
See [`examples/conditional-fields.ts`](https://storymock.dev/examples#conditional-fields) for more `derive()` patterns.
:::

---

## How Fields Resolve

Fields form a **directed acyclic graph** (DAG) based on their dependencies. storymock resolves them in the right order automatically:

1. **Plain fakers and literals** — no dependencies, resolved first
2. **`when()` fields** — resolved after the field they depend on
3. **`derive()` fields** — resolved last, after everything else

```
// CouponSchema resolution order:
// 1. type       (no deps)
// 2. status     (no deps)
// 3. price      (depends on type via when())
// 4. expiration (depends on status via when())
// 5. title      (derive — last, sees type + price)
```

If `when()` edges create a cycle (field A depends on B, B depends on A), storymock throws a `CircularDependencyError` at schema definition time — before any data is generated.

---

## Schema Identity: .id()

When schemas are used in [stories](/guide/stories), `ref()` needs to resolve one entry's identity (typically a primary key). The `.id()` method declares how to extract that identity from a generated instance:

```typescript
const UserSchema = schema<User>({
  id: text().uuid(),
  name: person().fullName(),
}).id((user) => user.id);
```

### Resolution chain

When `ref('user')` is evaluated, storymock resolves the identity through this chain (first match wins):

1. **`.id()` accessor** — if the schema has `.id(fn)`, calls `fn(instance)` and uses the return value
2. **`id` property** — if the generated object has a property named `id`, uses its value
3. **String value** — if the entire generated value is a string (e.g., from a bare `text()` schema), uses it directly
4. **Error** — throws `UnknownRefError`

Most schemas have an `id` field, so `ref()` usually resolves automatically without needing `.id()`. Define `.id()` explicitly when:
- Your primary key has a different name (e.g., `_id`, `uuid`, `pk`)
- You want a composite identity
- The identity requires transformation

```typescript
// MongoDB-style _id
const DocSchema = schema<Doc>({ _id: text().objectId(), /* ... */ })
  .id((doc) => doc._id);

// Composite identity
const EdgeSchema = schema<Edge>({ from: text().uuid(), to: text().uuid(), /* ... */ })
  .id((edge) => `${edge.from}:${edge.to}`);
```

---

## Full API →

This guide covered the core patterns for defining and customizing schemas. For the complete method reference — including `.setup()`, seeding, and batch generation — see the [Schema API Reference](/reference/schema).
