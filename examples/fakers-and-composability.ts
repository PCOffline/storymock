/**
 * Fakers & Composability
 *
 * Fakers are lazy, immutable builders that produce values on `.create()`.
 * This example covers:
 *  - Core domains: numeric(), text(), temporal(), bool(), choice()
 *  - Constraint chaining: .min(), .max(), .float(), .precision(), .length()
 *  - Format methods that change return type: .hex(), .iso()
 *  - Semantic domains returning core fakers: person().age(), internet().email()
 *  - Composability: passing a faker where a literal is expected
 *  - Batch generation: .create(n)
 *  - Unique values: .unique().create(n)
 *  - Nullable / optional modifiers
 *  - Collection faker with .unique() and .length()
 */
import {
  bool,
  choice,
  collection,
  internet,
  lorem,
  numeric,
  person,
  temporal,
  text,
} from 'storymock';

// ── Core domains ────────────────────────────────────────────────────
const id = text().uuid().create(); // '550e8400-e29b-...'
const score = numeric().min(0).max(100).create(); // 73
const price = numeric().min(1).max(999).float().precision(2).create(); // 42.99
const hexByte = numeric().min(0).max(255).hex().create(); // 'B3'
const active = bool().create(); // true | false
const role = choice('viewer', 'editor', 'admin').create(); // 'editor'

// ── Temporal ────────────────────────────────────────────────────────
const createdAt = temporal().past().create(); // Date (within last year)
const isoDate = temporal().thisYear().iso().create(); // '2026-03-14T...'

// ── Constraint chaining on text ─────────────────────────────────────
const pin = text().digits().length(6).create(); // '048271'
const token = text().alpha().uppercase().length(12).create(); // 'XQJFMKLBRNTS'

// ── Semantic domains (return core fakers — keep chaining) ───────────
const age = person().age().min(18).max(65).create(); // 34
const email = internet().email().create(); // 'john.doe@example.com'
const word = lorem().word().create(); // 'lorem'

// ── Composability: faker-in-faker ───────────────────────────────────
// temporal().year() accepts a faker — picks a random year first, then a date in it
const randomYearDate = temporal().year(numeric().min(2020).max(2025)).create(); // Date somewhere in 2020–2025

// numeric().between() also accepts fakers for its bounds
const flexScore = numeric()
  .between(numeric().min(1).max(10), numeric().min(90).max(100))
  .create(); // number between a random low and a random high

// ── Batch generation ────────────────────────────────────────────────
const fiveIds = text().uuid().create(5); // string[] (length 5)
const tenScores = numeric().min(0).max(100).create(10); // number[] (length 10)

// ── Unique values ───────────────────────────────────────────────────
const uniqueRoles = choice('viewer', 'editor', 'admin').unique().create(3);
// ['admin', 'viewer', 'editor'] — all three, no duplicates

const uniqueAges = numeric().min(18).max(99).unique().create(5);
// [43, 72, 18, 55, 31] — five distinct ages

// ── Nullable / optional ─────────────────────────────────────────────
const maybeNull = text().uuid().nullable().create(); // string | null
const maybeUndefined = numeric().optional().create(); // number | undefined

// ── Collection faker ────────────────────────────────────────────────
const tags = collection(lorem().word()).unique().length(3).create();
// ['dolor', 'amet', 'sit'] — exactly 3 unique words

const names = collection(person().firstName())
  .minLength(2)
  .maxLength(5)
  .create();
// ['Maria', 'Chen', 'Aiko'] — 2–5 first names
