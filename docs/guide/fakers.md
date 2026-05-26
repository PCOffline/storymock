# Working with Fakers

A progressive tutorial on generating mock values with storymock fakers.

---

## What is a Faker?

A faker is an **immutable, lazy builder** that describes how to generate a value. You chain constraints to shape the output, then call `.create()` to produce a result. Nothing happens until `.create()` — the chain just builds up a recipe.

```typescript
import { numeric, text, person } from 'storymock';

numeric().min(1).max(100).create();    // 42
text().uuid().create();                // '550e8400-e29b-41d4-a716-446655440000'
person().firstName().create();         // 'Maria'
```

Every method returns a **new instance**, so you can safely fork and reuse:

```typescript
const age = numeric().min(0).max(120);
const adultAge = age.min(18);            // new faker — replaces min, age is untouched

adultAge.create();  // 34
age.create();       // 7
```

Constraints are **last-write-wins** — calling `.min(18)` on a faker that already has a min replaces it. This is how you refine defaults from [semantic domains](#semantic-domains) like `person().age().min(18).max(80)`.

---

## Numbers

`numeric()` generates numbers. By default it produces an integer in `[0, 1000]`.

### Constraints

```typescript
numeric().min(1).max(100).create();        // 42
numeric().between(1, 100).create();        // 73 — same as .min(1).max(100)
numeric().positive().create();             // 847 — alias for .min(1)
numeric().negative().create();             // -312 — alias for .max(-1)
```

### Type modifiers

By default, `numeric()` produces integers. Switch to floating-point with `.float()` and control decimal places with `.precision()`:

```typescript
numeric().float().create();                // 73.148592...
numeric().precision(2).create();           // 73.14
```

::: tip
`.precision(n)` implies `.float()` — no need to chain both.
:::

### Format methods

`.hex()`, `.binary()`, and `.octal()` change the return type to `string`:

```typescript
numeric().min(0).max(255).hex().create();  // 'B3'
numeric().binary().create();               // '101'
numeric().octal().create();                // '17'
```

::: warning Order matters
Format methods return a `Faker<string>`, so numeric constraints like `.min()` and `.max()` are no longer available after them. Always apply constraints first:

```typescript
// ✅ Correct
numeric().min(0).max(255).hex()

// ❌ Type error — .min() doesn't exist on Faker<string>
numeric().hex().min(0)
```
:::

---

## Text

`text()` generates structural strings — random characters, identifiers, and patterns. For real-world data like names or emails, use [semantic domains](#semantic-domains) instead.

### Length

```typescript
text().length(10).create();                // 'a8Kf3mZq1X'
text().minLength(5).maxLength(15).create();  // 'kR3qmX9bL'
```

### Charset

```typescript
text().alpha().create();                   // 'jKqMwPzR'
text().digits().create();                  // '83920174'
text().lowercase().create();               // 'abcxyz'
text().uppercase().create();               // 'MNOPQR'
text().fromCharacters('abc123').length(6).create();  // 'a3b1c2'
```

Charset methods combine naturally: `text().alpha().uppercase().length(4)` produces something like `'KQZR'`.

### Identifiers

For common ID formats, `text()` has dedicated methods:

```typescript
text().uuid().create();                    // '550e8400-e29b-41d4-...'
text().ulid().create();                    // '01ARZ3NDEKTSV4RRFFQ69G5FAV'
text().nanoid().create();                  // 'V1StGXR8_Z5jdHi6B-myT'
text().cuid().create();                    // 'clh3am0e90000...'
text().objectId().create();               // '507f1f77bcf86cd799439011'
text().slug().create();                    // 'cool-random-slug'
```

### Patterns

When you need strings matching a specific shape:

```typescript
text().regex(/[A-Z]{3}-\d{4}/).create();           // 'XKQ-3847'
text().template('user-{{uuid}}').create();          // 'user-550e8400-...'
```

---

## Dates & Times

`temporal()` generates `Date` objects. By default it picks a random date within ±10 years of now.

### Relative methods

Position dates relative to the current moment:

```typescript
temporal().past().create();                // 2025-09-14T08:23:41Z — within the last year
temporal().past(5).create();               // 2022-03-07T19:45:02Z — within the last 5 years
temporal().future(2).create();             // 2027-11-22T14:05:47Z — within the next 2 years
temporal().recent().create();              // 2026-05-25T21:17:33Z — within the last day
temporal().soon().create();               // 2026-05-27T03:42:18Z — within the next day
temporal().today().create();               // 2026-05-26T00:00:00Z — time zeroed
temporal().yesterday().create();           // 2026-05-25T00:00:00Z
temporal().tomorrow().create();            // 2026-05-27T00:00:00Z
```

For exact offsets:

```typescript
temporal().daysAgo(7).create();            // 2026-05-19T10:33:14Z
temporal().weeksAgo(2).create();           // 2026-05-12T16:08:51Z
temporal().monthsAgo(3).create();          // 2026-02-26T04:55:29Z
temporal().yearsAgo(1).create();           // 2025-05-26T22:41:07Z
temporal().daysFromNow(30).create();       // 2026-06-25T13:19:44Z
```

### Absolute methods

Constrain to specific calendar components. These compose — each one narrows the range:

```typescript
temporal().year(2024).create();                        // 2024-09-14T07:33:21Z
temporal().year(2024).month('march').create();          // 2024-03-17T15:42:19Z
temporal().year(2024).weekday('monday').create();       // 2024-03-04T11:28:04Z — a Monday
temporal().month('december').day(25).create();          // 2031-12-25T03:17:44Z
```

Absolute methods also accept fakers, which are resolved at create time:

```typescript
temporal().year(numeric().min(2020).max(2025)).create();
// 2023-04-17T09:11:52Z — year is random in [2020, 2025]
```

### Range methods

```typescript
temporal().between('2020-01-01', '2024-12-31').create(); // 2022-07-03T18:29:55Z
temporal().before('2023-06-15').create();                 // 2019-11-28T04:12:37Z
temporal().after('2022-01-01').create();                  // 2029-08-14T21:53:08Z
temporal().thisMonth().create();            // 2026-05-13T09:44:21Z
temporal().lastYear().create();             // 2025-02-19T16:08:33Z
```

### Format methods

Like `numeric()`, format methods change the return type:

```typescript
temporal().today().iso().create();          // '2026-05-26T00:00:00.000Z'
temporal().past().timestamp().create();     // 1716700800000
temporal().format('YYYY-MM-DD').create();   // '2025-03-14'
```

---

## Booleans & Choices

### Booleans

`bool()` generates `true` or `false` with controllable probability:

```typescript
bool().create();                           // 50% true
bool().probability(0.8).create();          // 80% true
bool().true().create();                    // always true
bool().false().create();                   // always false
```

### Choices

`choice()` picks from a fixed set of literal values. TypeScript infers the union type automatically:

```typescript
import { choice } from 'storymock';

choice('active', 'inactive').create();                // 'inactive'
choice(1, 2, 3, 5, 8, 13).create();                  // 8
```

Use `.weighted()` to bias the distribution. Keys not in the map share the remaining probability equally:

```typescript
choice('common', 'rare', 'epic').weighted({ common: 0.7 }).create();
// 'common' — 70% common, 15% rare, 15% epic
```

Exclude values with `.not()`:

```typescript
choice('a', 'b', 'c', 'd').not('b', 'd').create();   // 'a' or 'c'
```

> **Picking multiple values:** there is no `.multiple()` method. Use `.create(n)` with `.unique()`:
> ```typescript
> choice('a', 'b', 'c', 'd').unique().create(2);       // ['c', 'a']
> ```

---

## Collections

`collection()` wraps a faker (or schema) and produces an array. Default length is `[1, 5]`.

```typescript
import { collection, numeric, person, lorem } from 'storymock';

collection(numeric().min(1).max(100)).length(3).create();    // [42, 7, 91]
collection(person().firstName()).maxLength(5).create();       // ['Maria', 'Chen', 'Aiko']
collection(lorem().word()).unique().length(4).create();       // ['lorem', 'ipsum', 'dolor', 'sit']
```

You can pass a schema to get an array of objects:

```typescript
collection(ItemSchema).length(3).create();
// [{ id: '...', name: '...', qty: 42 }, { ... }, { ... }]
```

Use `.empty()` when you explicitly want an empty array:

```typescript
collection(numeric()).empty().create();                      // []
```

---

## Semantic Domains

So far we've generated structural values — random numbers, character strings, dates. But test data often needs to look *realistic*: names, emails, addresses, product descriptions.

Semantic domains are **functions that return factory methods**. Each factory method produces a core-domain faker, so you can keep chaining constraints:

```typescript
import { person, internet, finance, location } from 'storymock';

person().firstName().create();                              // 'Günther'
person().age().min(18).max(65).create();                    // 34
internet().email().create();                                // 'gunther42@example.com'
finance().amount().min(10).max(500).precision(2).create();  // 129.99
location().latitude().min(40).max(50).create();             // 44.827
```

Notice the pattern: `person().age()` returns a `NumericFaker`, so `.min()` and `.max()` work. `internet().email()` returns a `TextFaker`, so `.not()` would work. Each domain method picks sensible defaults; you override them with [last-write-wins](#what-is-a-faker).

### Available domains

| Domain | Key methods |
|--------|-------------|
| `person()` | `firstName()`, `lastName()`, `fullName()`, `age()`, `birthdate()`, `jobTitle()`, `bio()` |
| `internet()` | `email()`, `username()`, `password()`, `url()`, `domainName()`, `ip()`, `ipv4()`, `ipv6()`, `port()` |
| `location()` | `city()`, `country()`, `state()`, `streetAddress()`, `zipCode()`, `latitude()`, `longitude()` |
| `commerce()` | `product()`, `productName()`, `productDescription()`, `department()`, `isbn()` |
| `finance()` | `amount()`, `creditCard()`, `iban()`, `bic()`, `currencyCode()`, `accountNumber()` |
| `company()` | `name()`, `catchPhrase()`, `buzzPhrase()` |
| `lorem()` | `word()`, `words()`, `sentence()`, `paragraph()` |
| `food()` | `dish()`, `ingredient()`, `fruit()`, `vegetable()`, `meat()`, `spice()` |
| `system()` | `fileName()`, `fileExt()`, `filePath()`, `mimeType()`, `semver()`, `cron()` |
| `git()` | `commitSha()`, `commitMessage()`, `branch()` |
| `phone()` | `number()`, `imei()` |
| `color()` | `human()`, `rgb()`, `hex()`, `hsl()` |
| `vehicle()` | `name()`, `manufacturer()`, `vin()`, `licensePlate()` |
| `music()` | `genre()`, `songName()`, `artist()`, `album()` |
| `animal()` | `type()`, `cat()`, `dog()`, `bird()` |
| `image()` | `avatar()`, `url()`, `dataUri()`, `placeholder()` |
| `airline()` | `name()`, `airport()`, `flightNumber()`, `seat()` |

---

## Composability

Fakers can accept other fakers as arguments. The inner faker is resolved at `.create()` time:

```typescript
// Random date in a randomly chosen year
temporal().year(numeric().min(2020).max(2025)).create();  // 2021-08-03T22:14:37Z

// Person born 18–80 years ago
temporal().yearsAgo(numeric().min(18).max(80)).create();  // 1971-02-08T16:45:23Z
```

This keeps everything lazy — the inner `numeric()` isn't evaluated when you build the chain. It's resolved fresh each time `.create()` runs, so every call can produce a different year.

---

## Batch & Unique

### Generating arrays

Pass a count to `.create()` to get an array:

```typescript
numeric().min(1).max(100).create(5);          // [42, 7, 91, 3, 68]
person().firstName().create(3);               // ['Maria', 'Chen', 'Aiko']
```

### Ensuring uniqueness

Add `.unique()` before `.create(n)` to guarantee no duplicates:

```typescript
numeric().min(1).max(10).unique().create(5);  // [3, 7, 1, 9, 4]
choice('a', 'b', 'c').unique().create(3);     // ['b', 'c', 'a']
```

If the faker can't produce enough unique values (e.g., `.unique().create(20)` on a range of 10), it throws a `ContradictoryConstraintError`.

---

## Nullable & Optional

Any faker can produce `null` or `undefined` via the Nullable mixin:

```typescript
text().uuid().nullable().create();            // 'e72f1a9b-...' or null
numeric().optional().create();                // 738 or undefined
```

Both accept an optional probability (0–1) controlling how often the null/undefined appears:

```typescript
text().nullable(0.3).create();                // 30% null
person().fullName().optional(0.1).create();   // 10% undefined
```

---

## Full API →

This guide covered the most common patterns. For exhaustive method signatures, default values, and edge cases, see the [Faker API Reference](/reference/faker).
