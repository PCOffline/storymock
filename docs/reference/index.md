# Quick Reference

Compact cheat sheet for storymock's API surface. See the full guide for detailed explanations.

---

## Fakers

```typescript
// Values
numeric().min(1).max(100).create()          // 42
text().uuid().create()                       // '550e8400-...'
temporal().past(5).create()                  // 2023-11-14T08:33:12Z
bool().probability(0.8).create()             // 80% true
choice('a', 'b', 'c').create()              // 'b'
collection(numeric()).length(3).create()     // [7, 42, 13]

// Batch & unique
numeric().create(5)                          // [384, 91, 7, 553, 219]
choice('a','b','c').unique().create(2)       // ['c', 'a']
```

---

## Mixins

| Mixin | Applies to | Methods |
|---|---|---|
| Bounded | numeric, temporal | `.min()` `.max()` `.between()` |
| Measurable | text, collection | `.length()` `.minLength()` `.maxLength()` |
| Excludable | numeric, text, temporal, choice | `.not()` |
| Nullable | all | `.nullable()` `.optional()` |
| Seedable | all | `.seed(n)` |

---

## Core Domains

**`numeric()`**
- Constraints: `.min()` `.max()` `.between()` `.positive()` `.negative()` `.not()`
- Type: `.int()` `.float()` `.precision()`
- Format → string: `.hex()` `.binary()` `.octal()`

**`text()`**
- Length: `.length()` `.minLength()` `.maxLength()`
- Charset: `.alpha()` `.digits()` `.lowercase()` `.uppercase()`
- IDs: `.uuid()` `.ulid()` `.nanoid()` `.cuid()` `.objectId()` `.slug()`
- Pattern: `.regex()` `.template()`

**`temporal()`**
- Relative: `.past()` `.future()` `.recent()` `.soon()` `.today()` `.daysAgo()` `.yearsAgo()` etc.
- Absolute: `.year()` `.month()` `.day()` `.weekday()`
- Range: `.between()` `.before()` `.after()` `.thisMonth()` `.lastYear()` etc.
- Format: `.iso()` `.timestamp()` `.format()`

**`bool()`** — `.probability()` `.true()` `.false()`

**`choice()`** — `.weighted()` `.not()` `.unique()`

**`collection()`** — `.length()` `.minLength()` `.maxLength()` `.unique()` `.empty()`

---

## Semantic Domains

- `person()` — `.firstName()` `.lastName()` `.fullName()` `.gender()` `.age()` `.birthdate()` `.jobTitle()` `.bio()`
- `internet()` — `.email()` `.username()` `.url()` `.ip()` `.ipv6()` `.port()` `.userAgent()` `.domainName()` `.password()`
- `location()` — `.city()` `.country()` `.state()` `.zipCode()` `.latitude()` `.longitude()` `.streetAddress()`
- `finance()` — `.currency()` `.currencyCode()` `.accountNumber()` `.iban()` `.bic()` `.creditCard()`
- `lorem()` — `.word()` `.words()` `.sentence()` `.sentences()` `.paragraph()` `.paragraphs()`
- `image()` — `.avatar()` `.url()` `.dataUri()` `.placeholder()`
- `phone()` — `.number()` `.imei()`
- `company()` — `.name()` `.catchPhrase()` `.buzzPhrase()`
- `color()` — `.hex()` `.rgb()` `.hsl()` `.human()`

---

## Schemas

```typescript
// Define
const User = schema<User>({
  id: text().uuid(),
  name: person().fullName(),
  age: numeric().between(18, 65),
  role: choice('admin', 'user'),
})
  .trait('admin', { role: 'admin' })
  .trait('young', { age: numeric().max(25) })
  .id((u) => u.id);

// Generate
User.create()                              // { id: '7b3e...', name: 'Obi Nduka', age: 34, role: 'user' }
User.create(10)                            // User[] — each independently generated
User.with('admin').create()                // { id: 'f1a4...', name: 'Yuki Tanaka', age: 52, role: 'admin' }
User.with('admin', { name: 'Jo' }).create() // { id: 'c9e2...', name: 'Jo', age: 41, role: 'admin' }

// Conditional & derived fields
when('role', { admin: ..., _: ... })
derive(({ age }) => age >= 18)
```

---

## Stories

```typescript
story()
  .add('user', UserSchema)
  .add('order', OrderSchema, { userId: ref('user') })
  .addMany('items', ItemSchema, 3)
  .setup((m) => {
    m.items.forEach((i) => (i.orderId = m.order.id));
  })
  .with('user', 'admin', { name: 'Test Admin' })
  .with('items[0]', 'featured')
  .derive('total', (m) => m.items.reduce((s, i) => s + i.price, 0))
  .seed(42)
  .create()
```

---

## Configuration

```typescript
import { configure } from 'storymock';

// Global seed
configure({ seed: 42 });

// Custom provider
configure({ provider: new FakerJsProvider() });

// Default constraints
configure({
  defaults: {
    numeric: { min: 0, max: 500 },
    text: { minLength: 1, maxLength: 100 },
  },
});
```

---

## Errors

| Error | Cause |
|---|---|
| [ContradictoryConstraintError](/guide/errors#contradictoryconstrainterror) | Incompatible constraints (e.g. min > max) |
| [CircularDependencyError](/guide/errors#circulardependencyerror) | Mutual `when()` references |
| [MissingCaseError](/guide/errors#missingcaseerror) | No matching `when()` case and no `_` default |
| [UnsupportedProviderError](/guide/errors#unsupportedprovidererror) | Provider missing a semantic module |
| [InvalidTraitError](/guide/errors#invalidtraiterror) | Bad trait name, field, or type |
| [DuplicateNameError](/guide/errors#duplicatenameerror) | Two story entries share a name |
| [UnknownRefError](/guide/errors#unknownreferror) | `ref()` to missing entry or unresolvable identity |
| [IndexOutOfBoundsError](/guide/errors#indexoutofboundserror) | `.with('items[n]', ...)` index exceeds `addMany` count |
