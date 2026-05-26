---
layout: home

hero:
  name: storymock
  text: Build mocks from stories
  tagline: A TypeScript-first library that composes fakers, schemas, and stories into coherent, type-safe test data.
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/
    - theme: alt
      text: API Reference
      link: /reference/
    - theme: alt
      text: ⚡ Try in StackBlitz
      link: https://stackblitz.com/github/storymock/storymock/tree/main

features:
  - icon: 🎯
    title: Start simple, scale up
    details: "One value, one object, or a whole dataset — adopt only what your test needs."
  - icon: 🛡️
    title: Catch mistakes before tests run
    details: "Every field and override is type-checked at compile time. Your editor catches it, not a failing test."
  - icon: 🏷️
    title: Name your test states
    details: "Define states once, apply them anywhere in one word. No more scattered ad-hoc overrides."
  - icon: 🔗
    title: Related data, wired automatically
    details: "Generate multiple objects that reference each other correctly. Foreign keys, arrays, and cross-links just work."
  - icon: ♻️
    title: Reuse without risk
    details: "Immutable builders. Derive as many variants as you need — no shared state between tests."
  - icon: ⚡
    title: Works with what you already use
    details: "Powered by faker.js out of the box. Swap the engine or add your own data types when needed."
---

## Quick taste

### Fakers — generate any value

```typescript
import { numeric, text, temporal, person } from 'storymock';

numeric().min(1).max(100).create();                         // 42
person().firstName().create();                              // 'Günther'
temporal().year(numeric().min(2020).max(2025)).create();    // 2023-04-17T09:11:52Z
```

### Schemas — typed objects with named states

```typescript
import { schema, text, person, choice } from 'storymock';

const UserSchema = schema<User>({
  id: text().uuid(),
  name: person().fullName(),
  status: choice('active', 'inactive'),
})
.trait('admin', { status: 'active' as const });

UserSchema.create();                // { id: '7b3e...', name: 'Obi Nduka', status: 'inactive' }
UserSchema.with('admin').create();  // { id: 'f1a4...', name: 'Yuki Tanaka', status: 'active' }
```

### Stories — coherent related data

```typescript
import { story, ref } from 'storymock';

const checkout = story()
  .add('user', UserSchema)
  .add('order', OrderSchema, { userId: ref('user') })
  .setup((m) => { m.user.orders = [m.order]; });

const { user, order } = checkout.create();
// order.userId === user.id ✓
```

[Get started →](/guide/)
