# storymock

Build mocks from stories. A TypeScript-first library with three layers: **fakers** for values, **schemas** for objects, and **stories** for related data.

```
pnpm add storymock
```

## Overview

storymock generates realistic, type-safe mock data by composing immutable builders. Fakers produce single values, schemas assemble fakers into typed objects with named states, and stories wire multiple schemas into coherent datasets.

- **Need a single value?** → [Faker](https://storymock.dev/reference/faker)
- **Need a typed object?** → [Schema](https://storymock.dev/reference/schema)
- **Need related objects?** → [Story](https://storymock.dev/reference/story)

## Quick Start

### Faker — generate any value

```typescript
import { numeric, text, temporal, person, choice } from 'storymock';

numeric().min(1).max(100).create();              // 42
temporal().year(2024).weekday('monday').create(); // Date
person().firstName().create();                    // 'Günther'
text().uuid().create(5);                          // ['550e8400-...', ...]
choice('active', 'inactive').create();            // 'active'

// Composable — pass a faker where a value is expected:
temporal().year(numeric().min(2020).max(2025)).create();
```

[→ Full API](https://storymock.dev/reference/faker)

### Schema — define shapes and states

```typescript
import { schema, text, numeric, temporal, person, choice, collection, lorem } from 'storymock';

const UserSchema = schema<User>({
  id: text().uuid(),
  name: person().fullName(),
  age: person().age().min(18).max(80),
  birthdate: temporal().past(50),
  status: choice('active', 'inactive'),
  tags: collection(lorem().word()).maxLength(3),
})
.trait('admin', {
  status: 'active' as const,
  tags: ['admin', 'staff'],
});

UserSchema.create();                // User
UserSchema.create(10);              // User[] — 10 independent users
UserSchema.with('admin').create();  // User with admin trait
```

> **Note:** `.with()` on a schema takes trait names and/or an override object directly.
> On a story, `.with()` takes the entry name first, then traits/overrides.

[→ Full API](https://storymock.dev/reference/schema)

### Story — compose related mocks

```typescript
import { schema, story, ref, text, person } from 'storymock';

const userWithCart = story()
  .add('user', UserSchema)
  .addMany('items', ItemSchema, 2)
  .setup((m) => { m.user.items = m.items; });

const checkout = userWithCart
  .with('user', 'birthday')
  .add('coupon', CouponSchema, { userId: ref('user') })
  .setup((m) => { m.user.coupons = [m.coupon]; });

const { user, coupon } = checkout.create();
// coupon.userId === user.id ✓
```

Stories inherit wiring. Customize with traits and overrides — never re-wire.

[→ Full API](https://storymock.dev/reference/story) · [→ Complete examples](https://storymock.dev/examples)

## Documentation

Full docs site: run `cd docs && pnpm install && pnpm dev`

**Guide:**
- [Getting Started](https://storymock.dev/guide/) — Installation and quick tour
- [Core Concepts](https://storymock.dev/guide/concepts) — Mental model and terminology
- [Working with Fakers](https://storymock.dev/guide/fakers) — Generating values
- [Working with Schemas](https://storymock.dev/guide/schemas) — Typed objects, traits, conditional fields
- [Working with Stories](https://storymock.dev/guide/stories) — Composing related data
- [Configuration](https://storymock.dev/guide/configuration) — Config, seeding, custom providers
- [Errors](https://storymock.dev/guide/errors) — Error types and fixes

**API Reference:**
- [Quick Reference](https://storymock.dev/reference/) — Cheat sheet
- [Faker API](https://storymock.dev/reference/faker) — Full faker reference
- [Schema API](https://storymock.dev/reference/schema) — Full schema reference
- [Story API](https://storymock.dev/reference/story) — Full story reference

**More:**
- [Examples](https://storymock.dev/examples) — Complete working examples
- [Changelog](https://storymock.dev/changelog)
- [Contributing](CONTRIBUTION_GUIDE.md) — Architecture and design decisions
