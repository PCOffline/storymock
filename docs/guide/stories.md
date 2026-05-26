# Working with Stories

A progressive tutorial on composing coherent, related mock datasets with storymock stories.

---

## What is a Story?

A story composes multiple schema instances into a **coherent, typed record** — a snapshot of related data where foreign keys match, arrays are wired, and everything fits together. Think of it as "these objects exist together in the same world."

Stories are **pure data snapshots**, not state machines. Traits handle states (`'deleted'`, `'expired'`, `'admin'`). Your application code handles transitions. A story just gives you the data at a point in time.

```typescript
import { story, ref } from 'storymock';

const checkout = story()
  .add('user', UserSchema)
  .add('order', OrderSchema, { userId: ref('user') })
  .create();

// checkout.user is a User
// checkout.order is an Order
// checkout.order.userId === checkout.user.id  ✓
```

---

## Building a Story

Start with `story()`, then add entries with `.add()` and `.addMany()`:

```typescript
const s = story()
  .add('user', UserSchema)                   // single entry
  .addMany('items', ItemSchema, 3)           // array of 3 entries
  .create();

// s: { user: User; items: Item[] }
```

TypeScript **accumulates** the record type as you chain calls — each `.add()` widens the type:

```typescript
story()                                       // Story<{}>
  .add('user', UserSchema)                    // Story<{ user: User }>
  .addMany('items', ItemSchema, 3)            // Story<{ user: User; items: Item[] }>
  .create()                                   // { user: User; items: Item[] }
```

Every field is fully typed — `s.user` is `User`, `s.items` is `Item[]`. No casts needed.

---

## Cross-References: ref()

The most common relationship pattern is a foreign key: `order.userId` should equal `user.id`. That's what `ref()` does.

Pass it as an inline override in `.add()`:

```typescript
const s = story()
  .add('user', UserSchema)
  .add('order', OrderSchema, { userId: ref('user') })
  .create();

// s.order.userId === s.user.id  ✓
```

### How ref() resolves

`ref('user')` goes through this chain to find the identity:

1. **`.id()` accessor** — if the schema has `.id(fn)`, calls `fn(instance)` and uses the return value
2. **`id` property** — if the generated object has a property named `id`, uses its value
3. **String value** — if the entire generated value is a string, uses it directly
4. **Error** — throws `UnknownRefError`

Most schemas have an `id` field, so `ref()` usually just works.

### Referencing a specific field

By default `ref()` resolves to the entry's identity. To reference a different field:

```typescript
.add('notification', NotificationSchema, {
  recipientEmail: ref('user', 'email'),    // resolves to user.email
})
```

### ref() with arrays

When `ref()` points at an `addMany` entry, it resolves to an **array of IDs**:

```typescript
const s = story()
  .addMany('songs', SongSchema, 5)
  .add('playlist', PlaylistSchema, { songIds: ref('songs') })
  .create();

// s.playlist.songIds === [songs[0].id, songs[1].id, ..., songs[4].id]
```

When `ref()` appears in an `addMany` inline override, the **same value** is used for every entry:

```typescript
story()
  .add('user', UserSchema)
  .addMany('orders', OrderSchema, 3, { userId: ref('user') })
  .create();

// All 3 orders get the same userId (equal to user.id)
```

If you need per-entry variation (e.g., distributing orders across different users), use `.setup()` instead.

::: warning Type pitfall
`ref()` on an `addMany` entry resolves to an **array**, not a single value. If your field type is a scalar (e.g., `postId: string`), use `.setup()` to pick one item instead:

```typescript
// ❌ Type mismatch — ref('posts') resolves to string[]
.add('comment', CommentSchema, { postId: ref('posts') })

// ✅ Use setup to pick one
.setup((m) => { m.comment.postId = m.posts[0].id; })
```
:::

---

## Wiring with .setup()

`ref()` handles scalar foreign keys beautifully, but some relationships need more: array membership, computed values, or distributing items across collections. That's where `.setup()` comes in.

`.setup()` **records a callback** — no mutation happens when you call it. At `.create()` time, all setup callbacks execute sequentially on the generated objects.

```typescript
const checkout = story()
  .add('user', UserSchema)
  .addMany('items', ItemSchema, 2)
  .add('coupon', CouponSchema)
  .setup((m) => {
    m.user.items = m.items;              // wire the array
    m.user.coupons = [m.coupon];         // wire another array
    m.coupon.userId = m.user.id;         // wire a foreign key
  })
  .create();
```

### Setup accumulation

Multiple `.setup()` calls **accumulate** — they all run, in order. This is essential for story inheritance:

```typescript
const base = story()
  .add('user', UserSchema)
  .addMany('items', ItemSchema, 2)
  .setup((m) => { m.user.items = m.items; });

const withCoupon = base
  .add('coupon', CouponSchema)
  .setup((m) => {
    m.user.coupons = [m.coupon];
    m.coupon.userId = m.user.id;
  });

// At .create() time, BOTH setups run:
// 1. m.user.items = m.items
// 2. m.user.coupons = [m.coupon]; m.coupon.userId = m.user.id
```

The base story's wiring is never lost — derived stories just add more on top.

---

## When to Use ref() vs .setup()

| Pattern | Use | Example |
|---------|-----|---------|
| Scalar foreign key | `ref()` | `{ userId: ref('user') }` |
| Array membership | `.setup()` | `m.user.items = m.items` |
| Complex/computed wiring | `.setup()` | Alternating senders, distributing members |

`ref()` handles roughly 70% of relationship wiring. For the rest, `.setup()` gives you full JavaScript to express whatever you need.

```typescript
// ref() — clean and declarative
.add('order', OrderSchema, { userId: ref('user') })

// .setup() — full control for complex cases
.setup((m) => {
  m.messages.forEach((msg, i) => {
    msg.senderId = i % 2 === 0 ? m.alice.id : m.bob.id;
  });
})
```

---

## Customizing Entries: .with()

On stories, `.with()` takes the **entry name** as the first argument, followed by traits and/or overrides:

### Apply a trait to an entry

```typescript
const birthdayStory = baseStory.with('user', 'birthday');
```

### Apply field overrides

```typescript
const namedStory = baseStory.with('user', { name: 'Eldar' });
```

### Combine traits and overrides

```typescript
const specific = baseStory.with('user', 'birthday', { name: 'Eldar' });
```

### Effect on addMany entries

When `.with()` targets an `addMany` entry, the trait or override applies to **all** items by default:

```typescript
const allDeleted = orgStory.with('teams', 'deleted');
// Every team has the 'deleted' trait
```

To target a specific item by index:

```typescript
baseStory.with('items[0]', 'premium');         // only the first item
baseStory.with('items[2]', { price: 9999 });   // only the third item
```

---

## Story Inheritance

This is where stories become a superpower. Because every method returns a new story, you can build a tree of increasingly specific scenarios from a shared base:

```typescript
// --- Base story: an org with teams ---
const orgBase = story()
  .add('org', OrgSchema)
  .addMany('teams', TeamSchema, 2)
  .setup((m) => {
    m.teams.forEach(t => { t.orgId = m.org.id; });
  });

// --- Extended: add members to the org ---
const orgWithMembers = orgBase
  .addMany('members', MemberSchema, 6)
  .setup((m) => {
    m.members.forEach((u, i) => {
      const team = m.teams[i % m.teams.length];
      u.teamId = team.id;
    });
  });

// --- Test variants: zero re-wiring ---
const deletedOrg = orgWithMembers.with('org', 'deleted');
const enterpriseOrg = orgWithMembers.with('org', 'enterprise');
```

::: info Full example
See [`examples/story-inheritance.ts`](https://storymock.dev/examples#story-inheritance) for the complete example including reusable wiring functions, cascading `.with()`, and index targeting.
:::

### Why this works

- `.with()`, `.add()`, `.addMany()`, and `.setup()` all return **new stories**
- `.setup()` callbacks **accumulate** — derived stories inherit all parent setups
- The base wiring is defined once and carries through every variant
- Test-specific stories only express what's different

This pattern — define once, reuse everywhere — eliminates the duplicated wiring logic that makes test fixtures painful to maintain.

---

## Story-Level derive()

Sometimes you need to compute additional data from the generated mocks. Story-level `derive()` runs after all `.setup()` callbacks, so it sees the fully-wired state:

```typescript
const s = story()
  .add('user', UserSchema)
  .add('item', ItemSchema)
  .derive('receipt', (mocks) => ({
    buyer: mocks.user.name,
    product: mocks.item.name,
    total: mocks.item.price,
    date: new Date(),
  }))
  .create();

// s.receipt: { buyer: string; product: string; total: number; date: Date }
```

The derived entry becomes part of the typed record, just like any `.add()` entry.

---

## Reusable Wiring Functions

When the same wiring logic appears across multiple stories, extract it into a plain function and pass it to `.setup()`:

```typescript
const wireOrgTeams = (m: { org: Org; teams: Team[] }) => {
  m.teams.forEach(t => { t.orgId = m.org.id; });
};

// Reuse in any story that has 'org' and 'teams':
const small = story().add('org', OrgSchema).addMany('teams', TeamSchema, 2).setup(wireOrgTeams);
const large = story().add('org', OrgSchema).addMany('teams', TeamSchema, 5).setup(wireOrgTeams);
```

::: info Full example
See [`examples/story-inheritance.ts`](https://storymock.dev/examples#story-inheritance) for the complete pattern with multiple reusable wiring functions.
:::

---

## Full API →

This guide covered the main patterns for composing stories. For the complete method reference — including seeding, batch generation, and detailed resolution rules — see the [Story API Reference](/reference/story).
