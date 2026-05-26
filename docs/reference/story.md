# Story — API Reference

> Part of [storymock](/). Import from `'storymock'` or `'storymock/story'`.

A story composes multiple schema instances into a coherent, referentially-linked set of mock data. The result is a **typed record** where each entry is a named mock.

**Stories are pure data snapshots** — no actions, events, or state machines. Traits handle states (banned, deleted, expired). Application code handles transitions. For seeding, see [Configuration — Seeding](/guide/configuration#seeding).

---

## Table of Contents

1. [Story Composition](#_1-story-composition)
2. [Customization with `.with()`](#_2-customization-with-with)
3. [Relationship Wiring: `.setup()`](#_3-relationship-wiring-setup)
4. [Cross-References: `ref()`](#_4-cross-references-ref)
5. [Story-Level `derive()`](#_5-story-level-derive)
6. [Story Inheritance](#_6-story-inheritance)
7. [Targeting Specific Entries](#_7-targeting-specific-entries)
8. [Batch Generation](#_8-batch-generation)
9. [Complete Examples](#_9-complete-examples)

---

## 1. Story Composition

### `story()`

Creates a new, empty story builder.

### `.add(name, schema)`

Adds a single mock entry to the story.

```typescript
const s = story()
  .add('user', UserSchema)
  .add('item', ItemSchema)
  .create();

// s: { user: User; item: Item }
```

**Throws:** `DuplicateNameError` if an entry with the same name already exists. See [`errors.md`](/guide/errors).

### `.addMany(name, schema, count)`

Adds multiple instances of a schema. The entry is typed as an array.

```typescript
const s = story()
  .add('user', UserSchema)
  .addMany('items', ItemSchema, 3)
  .create();

// s: { user: User; items: Item[] }
// s.items.length === 3
```

### Type Accumulation

Each `.add()` / `.addMany()` call widens the return type. TypeScript infers the full record:

```typescript
story()                                    // Story<{}>
  .add('user', UserSchema)                 // Story<{ user: User }>
  .addMany('items', ItemSchema, 3)         // Story<{ user: User; items: Item[] }>
  .create()                                // { user: User; items: Item[] }
```

### Inline Overrides

Pass a third argument to `.add()` for field overrides (including `ref()`):

```typescript
story()
  .add('user', UserSchema)
  .add('order', OrderSchema, { userId: ref('user') })
  .create();
```

Inline overrides also work with `.addMany()` as a fourth argument. When `ref()` is used in an `addMany` entry's inline overrides, it resolves the **same value** for all entries:

```typescript
story()
  .add('user', UserSchema)
  .addMany('orders', OrderSchema, 3, { userId: ref('user') })
  .create();

// All 3 orders get the same user.id
```

---

## 2. Customization with `.with()`

`.with()` on a story customizes an existing entry by applying traits and/or field overrides. It returns a **new story** (immutable).

### Applying Traits to an Entry

```typescript
const birthday = baseStory.with('user', 'birthday');
const deletedOrg = orgStory.with('org', 'deleted').with('teams', 'deleted');
```

### Applying Field Overrides

```typescript
const expensive = baseStory.with('item', { price: 9999 });
```

`ref()` works in `.with()` overrides too:

```typescript
const reassigned = baseStory.with('order', { sellerId: ref('newSeller') });
```

### Combining Traits and Overrides

```typescript
const specific = baseStory.with('user', 'birthday', { name: 'Eldar' });
```

When called on a story, `.with()` takes:
1. **Entry name** (string) — which entry to customize
2. **Traits** (zero or more strings) — trait names to apply
3. **Override object** (optional, always last) — field overrides

### Effect on `addMany` Entries

When `.with()` targets an `addMany` entry, the trait/override applies to **all** instances in the array by default:

```typescript
const allDeleted = orgStory.with('teams', 'deleted');
// All teams have the 'deleted' trait
```

To target a specific item, see [§7 Targeting Specific Entries](#_7-targeting-specific-entries).

---

## 3. Relationship Wiring: `.setup()`

`.setup()` records a callback — **no mutation happens until `.create()` is called.** At create time, all setup callbacks execute sequentially on the generated objects. Use this to wire relationships — foreign keys, array membership, cross-references.

```typescript
const checkout = story()
  .add('user', UserSchema)
  .addMany('items', ItemSchema, 2)
  .add('coupon', CouponSchema)
  .setup((mocks) => {
    mocks.user.items = mocks.items;
    mocks.user.coupons = [mocks.coupon];
    mocks.coupon.userId = mocks.user.id;
  })
  .create();
```

### Setup Accumulation

Multiple `.setup()` calls are **accumulated** — they all run, in order. This is critical for story inheritance:

```typescript
const base = story()
  .add('user', UserSchema)
  .addMany('items', ItemSchema, 2)
  .setup((m) => { m.user.items = m.items; });

// Extend — adds a new setup WITHOUT losing the first one
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

### Lazy Execution

`.setup()` callbacks are only registered — nothing executes until `.create()` is called. If a callback references an entry that doesn't exist (e.g., `m.coupon` when no coupon was added), it will simply be `undefined` at create time. This is intentional — it allows defining forward-looking setups on base stories that only take effect when the entry is added in a derived story.

### Reusable Wiring Functions

For relationships repeated across many stories, extract the wiring into plain functions:

```typescript
const wireOrgTeams = (m: { org: Org; teams: Team[] }) => {
  m.teams.forEach(t => { t.orgId = m.org.id; });
};

const storyA = story().add('org', OrgSchema).addMany('teams', TeamSchema, 2).setup(wireOrgTeams);
const storyB = story().add('org', OrgSchema).addMany('teams', TeamSchema, 5).setup(wireOrgTeams);
```

---

## 4. Cross-References: `ref()`

`ref()` is a helper for the most common relationship pattern: setting a foreign key to another entry's identity.

```typescript
import { story, ref } from 'storymock';

const s = story()
  .add('user', UserSchema)
  .add('order', OrderSchema, {
    userId: ref('user'),         // resolved to user.id at create time
    sellerId: ref('seller'),     // resolved to seller.id
  })
  .add('seller', SellerSchema)
  .create();

// s.order.userId === s.user.id  ✓
// s.order.sellerId === s.seller.id  ✓
```

### How `ref()` Resolves

`ref('user')` resolves the identity through this chain (first match wins):

1. **`.id()` accessor** — if the entry's schema has `.id(fn)`, calls `fn(instance)`
2. **`id` property** — if the generated object has a property named `id`, uses its value
3. **String value** — if the entire generated value is a string, uses it directly
4. **Error** — throws `UnknownRefError`

**Throws:** `UnknownRefError` if the referenced entry does not exist or cannot be resolved. See [`errors.md`](/guide/errors).

### `ref()` with `addMany` Entries

When `ref()` points at an `addMany` entry (an array), it resolves to an **array of IDs**:

```typescript
story()
  .add('playlist', PlaylistSchema)
  .addMany('songs', SongSchema, 5)
  .add('receipt', ReceiptSchema, { songIds: ref('songs') })
  .create();

// receipt.songIds === [songs[0].id, songs[1].id, ...songs[4].id]
```

Each item in the array is resolved through the same `.id()` → `id` property → string fallback chain.

### `ref()` in `addMany` Inline Overrides

When `ref()` is used in an `addMany` entry's inline overrides, it resolves the **same value** for all generated entries:

```typescript
story()
  .add('user', UserSchema)
  .addMany('orders', OrderSchema, 3, { userId: ref('user') })
  .create();

// All 3 orders share the same userId (equal to user.id)
```

If you need different references per entry (e.g., distributing orders across multiple users), use `.setup()` instead.

::: warning Type pitfall
`ref()` on an `addMany` entry always resolves to an **array of IDs** (`string[]`). If your target field is a scalar (`string`), this will be a type mismatch. Use `.setup()` to pick a specific item instead:

```typescript
// ❌ Type mismatch — ref('posts') resolves to string[], not string
.add('comment', CommentSchema, { postId: ref('posts') })

// ✅ Pick one via .setup()
.setup((m) => { m.comment.postId = m.posts[0].id; })
```
:::

### `ref()` with Explicit Field

To reference a field other than the identity:

```typescript
ref('user', 'email')   // resolves to user.email instead of user.id
```

### When to Use `ref()` vs `.setup()`

| Pattern | Use | Example |
|---------|-----|---------|
| Foreign key (scalar) | `ref()` | `{ userId: ref('user') }` |
| Array membership | `.setup()` | `m.user.items = m.items` |
| Complex/computed | `.setup()` | Alternating senders, distributing members |

`ref()` handles ~70% of relationship wiring. `.setup()` handles the rest.

---

## 5. Story-Level `derive()`

Compute additional data from the generated mocks. The derived entry is added to the record.

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

`derive()` runs after all `.setup()` callbacks, so it sees the fully-wired mocks.

---

## 6. Story Inheritance

Stories are immutable builders. **Define once, reuse everywhere.**

```typescript
// Base story (defined once, in a shared file)
const orgBase = story()
  .add('org', OrgSchema)
  .addMany('teams', TeamSchema, 2)
  .setup((m) => {
    m.teams.forEach(t => { t.orgId = m.org.id; });
  });

// Extend with more entries and wiring
const orgWithMembers = orgBase
  .addMany('members', MemberSchema, 6)
  .setup((m) => {
    m.members.forEach((u, i) => {
      u.teamId = m.teams[i % m.teams.length].id;
    });
  });

// Test-specific variants (zero repeated wiring)
const deletedOrg = orgWithMembers
  .with('org', 'deleted')
  .with('teams', 'deleted');
```

::: info Full example
[`examples/story-inheritance.ts`](https://storymock.dev/examples#story-inheritance)
:::

### Why This Works

- `.with()`, `.add()`, `.addMany()`, `.setup()` all return **new stories**
- `.setup()` callbacks **accumulate** — derived stories inherit all parent setups
- The base story's wiring is defined once and carries through all variants
- Each test customizes with traits and overrides, not with re-wiring

---

## 7. Targeting Specific Entries

By default, `.with()` on an `addMany` entry applies to **all items** in the array. To target specific items by index:

```typescript
// Override all items
baseStory.with('items', { price: 100 })

// Override a specific item by index
baseStory.with('items[0]', { price: 100 })
baseStory.with('items[2]', 'premium')
```

The index syntax `items[n]` targets the nth item in an `addMany` array.

**Throws:** `IndexOutOfBoundsError` when the index exceeds the `addMany` count. See [Errors](/guide/errors#indexoutofboundserror).

---

## 8. Batch Generation

Generate multiple independent snapshots of the same story:

```typescript
const snapshots = myStory.create(5);
// snapshots: Array<{ user: User; item: Item }> (length 5)
// Each snapshot has independently generated mocks
```

---

## 9. Complete Examples

Full working examples are available in the [`examples/`](https://github.com/storymock/storymock/tree/main/examples) directory. Each highlights a **storymock feature**:

- [Fakers & Composability](https://storymock.dev/examples#fakers-composability) — Core/semantic domains, constraint chaining, faker-in-faker, batch, unique
- [Traits & Customization](https://storymock.dev/examples#traits-customization) — Named states, combining traits, inline overrides, immutable forking
- [Conditional Fields](https://storymock.dev/examples#conditional-fields) — `when()` with string/number/boolean keys, `derive()`, resolution order
- [Story Composition](https://storymock.dev/examples#story-composition) — `ref()`, `.setup()`, `addMany`, type accumulation
- [Story Inheritance](https://storymock.dev/examples#story-inheritance) — Base stories, setup accumulation, cascading `.with()`, targeting
- [Seeding & Determinism](https://storymock.dev/examples#seeding-determinism) — `.seed()` at every level, reproducible snapshots
