# Faker — API Reference

> Part of [storymock](/). Import from `'storymock'` or `'storymock/faker'`.

The faker module provides lazy, immutable builders for generating mock data. Every method returns a **new instance** (immutable). No value is produced until `.create()` is called.
For global configuration and seeding, see [Configuration](/guide/configuration).

---

## Table of Contents

1. [Base Faker](#_1-base-faker)
2. [Mixins](#_2-mixins)
3. [Core Domains](#_3-core-domains)
4. [Semantic Domains](#_4-semantic-domains)
5. [Data Provider](#_5-data-provider)
6. [Errors](#_6-errors)
7. [Extensibility](#_7-extensibility)

---

## 1. Base Faker

The abstract base class for all fakers. Contains only capabilities that apply to **every** domain.

```typescript
abstract class Faker<T> {
  /** Generate a single value. */
  abstract create(): T;

  /** Generate `count` values. */
  create(count: number): T[];

  /** Ensure .create(n) returns only unique values. Throws ContradictoryConstraintError if not enough unique values can be produced. */
  unique(): Faker<T>;
}
```

The base class implements two mixins globally (see §2):

- **`Nullable`** — every faker can produce `null` or `undefined`
- **`Seedable`** — every faker can be pinned to a deterministic seed

> **What is NOT on the base class:** `min`, `max`, `not`, `length`. These come from mixins and are only available on domains that implement them.

---

## 2. Mixins

Inspired by Rust traits: small, composable interfaces that grant specific capabilities. A domain **chooses** which mixins it implements.

### `Nullable<T>`

Implemented by: **all fakers** (via base class).

```typescript
interface Nullable<T> {
  /** Randomly produce null instead of T. Default probability: 0.5. */
  nullable(probability?: number): Faker<T | null>;

  /** Randomly produce undefined instead of T. Default probability: 0.5. */
  optional(probability?: number): Faker<T | undefined>;
}
```

### `Seedable<T>`

Implemented by: **all fakers** (via base class).

```typescript
interface Seedable<T> {
  /** Return a new faker pinned to a deterministic seed. */
  seed(value: number): Faker<T>;
}
```

> For global seeding, precedence rules, and deterministic generation, see [Configuration — Seeding](/guide/configuration#seeding).

### `Bounded<T>`

Implemented by: `NumericFaker`, `TemporalFaker`.

```typescript
interface Bounded<T> {
  /** Set minimum value. Replaces any previous min. Accepts a literal or another faker (resolved at create time). */
  min(value: T | Faker<T>): Faker<T>;

  /** Set maximum value. Replaces any previous max. Accepts a literal or another faker. */
  max(value: T | Faker<T>): Faker<T>;

  /** Shorthand for min + max. */
  between(min: T | Faker<T>, max: T | Faker<T>): Faker<T>;
}
```

> **Last-write-wins**: `.min(18)` on a faker that already has a min replaces it. See [Fakers guide](/guide/fakers#what-is-a-faker).

### `Excludable<T>`

Implemented by: `NumericFaker`, `TextFaker`, `TemporalFaker`, `ChoiceFaker`.

```typescript
interface Excludable<T> {
  /** Exclude specific values from the output. Re-rolls until a non-excluded value is generated. */
  not(...values: T[]): Faker<T>;
}
```

### `Measurable<T>`

Implemented by: `TextFaker`, `CollectionFaker`.

```typescript
interface Measurable<T> {
  /** Exact length. */
  length(n: number | Faker<number>): Faker<T>;

  /** Minimum length. */
  minLength(n: number | Faker<number>): Faker<T>;

  /** Maximum length. */
  maxLength(n: number | Faker<number>): Faker<T>;
}
```

### Summary: which domains implement which mixins

- `NumericFaker` — Bounded, Excludable, Nullable, Seedable
- `TextFaker` — Excludable, Measurable, Nullable, Seedable
- `TemporalFaker` — Bounded, Excludable, Nullable, Seedable
- `BoolFaker` — Nullable, Seedable
- `ChoiceFaker` — Excludable, Nullable, Seedable
- `CollectionFaker` — Measurable, Nullable, Seedable

---

## 3. Core Domains

### 3.1 `numeric()`

Creates a `NumericFaker`. Default: integer in `[0, 1000]`.

Implements mixins: `Bounded<number>`, `Excludable<number>`, `Nullable`, `Seedable`.

#### Constraints

- `.min(n)` — Minimum value. Accepts a literal or faker.
- `.max(n)` — Maximum value. Accepts a literal or faker.
- `.between(a, b)` — Shorthand for `.min(a).max(b)`.
- `.positive()` — Alias for `.min(1)`.
- `.negative()` — Alias for `.max(-1)`.
- `.not(v)` — Exclude value(s). Example: `numeric().not(0, 1)`.

#### Type

- `.int()` — Integer (default).
- `.float()` — Floating-point. Rarely needed explicitly since `.precision()` implies it.
- `.precision(p)` — Decimal places (implies `.float()`). Example: `numeric().precision(2)`.

::: tip
`.precision(n)` implies `.float()` — no need to chain both. Use `numeric().precision(2)` instead of `numeric().float().precision(2)`.
:::

#### Format (changes return type)

- `.hex()` — Hexadecimal string. Returns `Faker<string>`. Example: `numeric().min(0).max(255).hex().create()` → `"B3"`.
- `.binary()` — Binary string. Returns `Faker<string>`. Example: `numeric().binary().create()` → `"101"`.
- `.octal()` — Octal string. Returns `Faker<string>`. Example: `numeric().octal().create()` → `"17"`.

::: warning
Format methods return `Faker<string>`, not `NumericFaker`. Constraints must come before format methods.

```typescript
// ✅ Correct
numeric().min(0).max(255).hex().create()

// ❌ Type error — hex() returns Faker<string>, .min() is not available
numeric().hex().min(0)
```
:::

### 3.2 `text()`

Creates a `TextFaker`. Default: random alphanumeric string, length `[1, 20]`.

Implements mixins: `Excludable<string>`, `Measurable`, `Nullable`, `Seedable`.

`text()` handles **structural** string generation only. Semantic strings (names, emails, cities) live in semantic domains (§4).

#### Length

- `.length(n)` — Exact length.
- `.minLength(n)` — Minimum length.
- `.maxLength(n)` — Maximum length.

#### Charset

- `.alpha()` — Letters only.
- `.alphanumeric()` — Letters + digits (default).
- `.digits()` — Digits only.
- `.lowercase()` — Force lowercase.
- `.uppercase()` — Force uppercase.
- `.fromCharacters(chars)` — Custom charset. Example: `text().fromCharacters('abc123')`.

#### Identifiers

- `.uuid()` — UUID v4.
- `.ulid()` — ULID.
- `.nanoid(size?)` — NanoID (default 21).
- `.cuid()` — CUID.
- `.objectId()` — MongoDB ObjectId.
- `.slug()` — URL-safe slug.

#### Pattern

- `.regex(pattern)` — String matching a regex. Example: `text().regex(/[A-Z]{3}-\d{4}/)`.
- `.template(str)` — Template with placeholders. Example: `text().template('user-{{uuid}}')`.

#### Exclusion

- `.not(v)` — Exclude value(s). Example: `text().not(['admin', 'root'])`.

### 3.3 `temporal()`

Creates a `TemporalFaker`. Default: random date in range `[10 years ago, 10 years from now]`.

Implements mixins: `Bounded<Date>`, `Excludable<Date>`, `Nullable`, `Seedable`.

#### Relative Methods

- `.today()` — Today (time zeroed).
- `.yesterday()` — Yesterday.
- `.tomorrow()` — Tomorrow.
- `.past(years?)` — Random past date (default: 1yr).
- `.future(years?)` — Random future date (default: 1yr).
- `.recent(days?)` — Recent past (default: 1 day).
- `.soon(days?)` — Near future (default: 1 day).
- `.daysAgo(n)` — Exactly N days ago.
- `.daysFromNow(n)` — Exactly N days ahead.
- `.weeksAgo(n)` — N weeks ago.
- `.weeksFromNow(n)` — N weeks ahead.
- `.monthsAgo(n)` — N months ago.
- `.monthsFromNow(n)` — N months ahead.
- `.yearsAgo(n)` — N years ago.
- `.yearsFromNow(n)` — N years ahead.

#### Absolute Methods

- `.year(y)` — Constrain year. Accepts `Faker<number>`. Example: `temporal().year(2024)`.
- `.month(m)` — Constrain month (name or 1–12). Example: `temporal().month('january')`.
- `.day(d)` — Constrain day of month.
- `.weekday(d)` — Constrain to weekday. Example: `temporal().weekday('monday')`.
- `.hour(h)` — Constrain hour (0–23).
- `.minute(m)` — Constrain minute (0–59).
- `.second(s)` — Constrain second (0–59).

> Absolute constraints compose: `temporal().year(2024).weekday('monday')` generates a random Monday in 2024.
>
> Accepts fakers: `temporal().year(numeric().min(2020).max(2025))` picks a random year first, then a random date in it.

#### Range Methods

- `.between(start, end)` — Date in range. Example: `temporal().between('2020-01-01', '2024-12-31')`.
- `.before(d)` — Before a date.
- `.after(d)` — After a date.
- `.thisWeek()` — Within current week.
- `.thisMonth()` — Within current month.
- `.thisYear()` — Within current year.
- `.lastWeek()` — Previous week.
- `.lastMonth()` — Previous month.
- `.lastYear()` — Previous year.
- `.nextWeek()` — Next week.
- `.nextMonth()` — Next month.
- `.nextYear()` — Next year.

#### Format Methods (change return type)

- `.iso()` — ISO 8601 string. Returns `Faker<string>`. Example: `temporal().today().iso().create()`.
- `.timestamp()` — Unix timestamp (ms). Returns `Faker<number>`. Example: `temporal().today().timestamp().create()`.
- `.format(fmt)` — Custom format string. Returns `Faker<string>`. Example: `temporal().format('YYYY-MM-DD').create()`.

### 3.4 `bool()`

Creates a `BoolFaker`. Default: 50% true / 50% false.

Implements mixins: `Nullable`, `Seedable`.

- `.probability(p)` — Probability of `true` (0–1). Example: `bool().probability(0.8)`.
- `.true()` — Always `true`.
- `.false()` — Always `false`.

### 3.5 `choice(...values)`

Creates a `ChoiceFaker<T>`. Selects from a fixed set of literal values.

Implements mixins: `Excludable<T>`, `Nullable`, `Seedable`.

```typescript
choice('a', 'b', 'c').create()  // 'b'
```

**Type inference:** `choice('active', 'inactive')` produces `ChoiceFaker<'active' | 'inactive'>`.

- `.weighted(map)` — Weighted probabilities. Example: `choice('a', 'b', 'c').weighted({ a: 0.6 })`.
- `.not(...values)` — Exclude options. Example: `choice('a', 'b', 'c').not('b')`.

> **`weighted(map)`** — keys not in the map share remaining probability equally:
> ```typescript
> choice('a', 'b', 'c').weighted({ a: 0.6 })
> // a: 60%, b: 20%, c: 20%
> ```

> **Picking multiple values:** use `.create(n)`, optionally with `.unique()`:
> ```typescript
> choice('a', 'b', 'c').unique().create(2)  // ['a', 'c']
> ```

### 3.6 `collection(faker)`

Creates a `CollectionFaker<T>`. Generates an array of values from a faker or a schema.

Implements mixins: `Measurable`, `Nullable`, `Seedable`.

**Default:** length `[1, 5]`.

- `.length(n)` — Exact length.
- `.minLength(n)` — Minimum length.
- `.maxLength(n)` — Maximum length.
- `.unique()` — Deduplicate results.
- `.empty()` — Always `[]`.

```typescript
collection(person().firstName()).length(3).create()
// ['John', 'Maria', 'Chen']

// Schemas can be passed to collection():
collection(ItemSchema).length(3).create()
// [{ id: '...', name: '...', qty: 42 }, ...]
```

---

## 4. Semantic Domains

Semantic domains are **functions** that return an object of factory methods. Each method returns a **core domain faker** of the appropriate type. They are not fakers themselves — you cannot `.create()` a domain directly.

```typescript
person().firstName().create()               // 'Günther'
person().age().create()                     // 34
person().birthdate().create()               // 1994-06-21T03:22:19Z
internet().email().create()                 // 'niko.alvarado@example.com'
location().latitude().create()              // 44.827
```

Because each method returns a core faker, you can continue chaining core-domain methods:

```typescript
person().age().min(18).max(65).create()                    // 34
person().birthdate().year(2000).create()                    // 2000-08-14T03:22:19Z
finance().amount().min(10).max(500).precision(2).create()   // 129.99
```

### 4.1 `person()`

- `firstName()` → `TextFaker` — First name.
- `lastName()` → `TextFaker` — Last name.
- `fullName()` → `TextFaker` — Full name.
- `middleName()` → `TextFaker` — Middle name.
- `prefix()` → `TextFaker` — Name prefix (Mr., Dr.).
- `suffix()` → `TextFaker` — Name suffix (Jr., III).
- `gender()` → `TextFaker` — Gender.
- `sex()` → `TextFaker` — Biological sex.
- `age()` → `NumericFaker` — Age (default: 0–120).
- `birthdate()` → `TemporalFaker` — Date of birth (default: 0–120 years ago).
- `jobTitle()` → `TextFaker` — Job title.
- `jobArea()` → `TextFaker` — Job area/department.
- `bio()` → `TextFaker` — Short biography.

### 4.2 `internet()`

- `email()` → `TextFaker` — Email address.
- `username()` → `TextFaker` — Username.
- `password(len?)` → `TextFaker` — Password.
- `url()` → `TextFaker` — Full URL.
- `domainName()` → `TextFaker` — Domain name.
- `port()` → `NumericFaker` — Port number.
- `ip()` → `TextFaker` — IP address (v4 or v6).
- `ipv4()` → `TextFaker` — IPv4 address.
- `ipv6()` → `TextFaker` — IPv6 address.
- `mac()` → `TextFaker` — MAC address.
- `userAgent()` → `TextFaker` — User agent string.
- `emoji()` → `TextFaker` — Random emoji.

### 4.3 `location()`

- `city()` → `TextFaker` — City name.
- `country()` → `TextFaker` — Country name.
- `countryCode()` → `TextFaker` — ISO country code.
- `state()` → `TextFaker` — State/province.
- `street()` → `TextFaker` — Street name.
- `streetAddress()` → `TextFaker` — Full street address.
- `zipCode()` → `TextFaker` — Postal code.
- `latitude()` → `NumericFaker` — Latitude (default: -90 to 90).
- `longitude()` → `NumericFaker` — Longitude (default: -180 to 180).
- `timezone()` → `TextFaker` — IANA timezone.

### 4.4 `commerce()`

- `product()` → `TextFaker` — Product adjective.
- `productName()` → `TextFaker` — Full product name.
- `productDescription()` → `TextFaker` — Product description.
- `department()` → `TextFaker` — Department name.
- `isbn()` → `TextFaker` — ISBN.

### 4.5 `finance()`

- `creditCard()` → `TextFaker` — Credit card number.
- `creditCardCVV()` → `TextFaker` — CVV code.
- `iban()` → `TextFaker` — IBAN.
- `bic()` → `TextFaker` — BIC/SWIFT code.
- `bitcoinAddress()` → `TextFaker` — Bitcoin address.
- `ethereumAddress()` → `TextFaker` — Ethereum address.
- `currencyCode()` → `TextFaker` — Currency code (USD, EUR).
- `currencyName()` → `TextFaker` — Currency name.
- `accountNumber()` → `TextFaker` — Bank account number.
- `amount()` → `NumericFaker` — Monetary amount.

### 4.6 `company()`

- `name()` → `TextFaker` — Company name.
- `catchPhrase()` → `TextFaker` — Catch phrase.
- `buzzPhrase()` → `TextFaker` — Buzz phrase.

### 4.7 `lorem()`

- `word()` → `TextFaker` — Single word.
- `words(n?)` → `TextFaker` — Multiple words (default: 3).
- `sentence()` → `TextFaker` — Single sentence.
- `sentences(n?)` → `TextFaker` — Multiple sentences.
- `paragraph()` → `TextFaker` — Single paragraph.
- `paragraphs(n?)` → `TextFaker` — Multiple paragraphs.

### 4.8 `food()`

- `dish()` → `TextFaker` — Dish name.
- `ingredient()` → `TextFaker` — Ingredient.
- `fruit()` → `TextFaker` — Fruit name.
- `vegetable()` → `TextFaker` — Vegetable.
- `meat()` → `TextFaker` — Meat type.
- `spice()` → `TextFaker` — Spice name.

### 4.9 `system()`

- `fileName()` → `TextFaker` — File name.
- `fileExt()` → `TextFaker` — File extension.
- `filePath()` → `TextFaker` — Full file path.
- `mimeType()` → `TextFaker` — MIME type.
- `semver()` → `TextFaker` — Semver string.
- `cron()` → `TextFaker` — Cron expression.

### 4.10 `image()`

- `avatar()` → `TextFaker` — Avatar image URL.
- `url()` → `TextFaker` — Random image URL.
- `dataUri()` → `TextFaker` — Base64 data URI.
- `placeholder(width?, height?)` → `TextFaker` — Placeholder image URL.

### 4.11 Other Semantic Domains

The following domains follow the same pattern. Full method lists will be finalized during implementation.

- **`git()`** — `commitSha()`, `commitMessage()`, `branch()`
- **`phone()`** — `number()`, `imei()`
- **`vehicle()`** — `name()`, `manufacturer()`, `model()`, `vin()`, `licensePlate()`
- **`color()`** — `human()`, `rgb()`, `hex()`, `hsl()`
- **`music()`** — `genre()`, `songName()`, `artist()`, `album()`
- **`animal()`** — `type()`, `cat()`, `dog()`, `bird()`, `fish()`, `horse()`
- **`airline()`** — `name()`, `airport()`, `flightNumber()`, `seat()`

---

## 5. Data Provider

### 5.1 Interface

The provider interface has two tiers: **core** (required) and **semantic modules** (optional).

Note that provider methods use primitive names (`integer`, `float`, `string`) — not the public API names (`numeric`, `text`, `person`). The provider is the low-level generation engine; storymock's builder API (`numeric().min(1).max(100)`) resolves constraints and then delegates to the provider's primitives (e.g. `provider.integer({ min: 1, max: 100 })`).

```typescript
interface CoreProvider {
  integer(options: { min: number; max: number }): number;
  float(options: { min: number; max: number; precision?: number }): number;
  string(options: { length: number; charset?: string }): string;
  boolean(options?: { probability?: number }): boolean;
  date(options: { min: Date; max: Date }): Date;
  pick<T>(array: T[]): T;
  pickMultiple<T>(array: T[], count: number): T[];
  shuffle<T>(array: T[]): T[];
  seed(value: number): void;
}

interface DataProvider extends CoreProvider {
  person?: PersonProvider;
  internet?: InternetProvider;
  location?: LocationProvider;
  commerce?: CommerceProvider;
  finance?: FinanceProvider;
  company?: CompanyProvider;
  lorem?: LoremProvider;
  food?: FoodProvider;
  system?: SystemProvider;
}
```

### 5.2 Default: FakerJsProvider

Wraps `@faker-js/faker`. All core and semantic methods delegate to faker.js.

### 5.3 Missing Module Handling

When a semantic method is called but the provider lacks that module, a clear `UnsupportedProviderError` is thrown with guidance on which provider or module is needed.

---

## 6. Errors

See [Errors Reference](/guide/errors) for all errors. Key errors relevant to fakers:

- **`ContradictoryConstraintError`** — Thrown when constraints make it impossible to generate a value (e.g. `.min(10).max(5)`, or `.unique().create(n)` when fewer than `n` unique values can be produced).
- **`UnsupportedProviderError`** — Thrown when a semantic method is called but the configured provider lacks the required module.
- **`IndexOutOfBoundsError`** — Thrown when `.with('items[n]', ...)` on a story targets an index that exceeds the `addMany` count.

---

## 7. Extensibility

### 7.1 Custom Semantic Domains

Register custom domains that receive a `CoreProvider` for access to `pick()`, `integer()`, `shuffle()`, etc. — respecting the global seed.

```typescript
import { registerDomain } from 'storymock';
import { TextFaker, NumericFaker } from 'storymock/internals';
```

::: tip Internals
`TextFaker` and `NumericFaker` are internal builder classes. They're exposed via `storymock/internals` specifically for custom domain registration. In normal usage you never need to import them — the public factory functions (`text()`, `numeric()`, etc.) handle instantiation for you.
:::

```typescript

const pokemon = registerDomain('pokemon', (core) => ({
  name: () => new TextFaker(() => core.pick(['Pikachu', 'Charizard', 'Bulbasaur'])),
  type: () => new TextFaker(() => core.pick(['fire', 'water', 'grass', 'electric'])),
  level: () => new NumericFaker({ min: 1, max: 100 }),
}));

pokemon().name().create();            // 'Charizard'
pokemon().level().min(50).create();   // 73
```

::: info Full example
[`examples/fakers-and-composability.ts`](https://storymock.dev/examples#fakers-composability)
:::

### 7.2 Custom Providers

Implement `CoreProvider` for a minimal custom backend, or extend `FakerJsProvider`:

```typescript
class ExtendedProvider extends FakerJsProvider {
  override integer({ min, max }: { min: number; max: number }) {
    return super.integer({ min, max });
  }
}

configure({ provider: new ExtendedProvider() });
```
