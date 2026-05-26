/**
 * Seeding and Determinism
 *
 * Demonstrates how seeding makes mock generation reproducible:
 * - Faker-level `.seed()` on a faker
 * - Schema-level `.seed()` for full objects
 * - Story-level `.seed()` for entire snapshots
 * - Seed precedence: faker > schema > story > global
 * - Global seeding via `configure()`
 * - Batch generation with a seed
 * - Deterministic test assertions
 */

import { configure, numeric, person, schema, story, text } from 'storymock';

// --- Minimal domain interface ---

interface User {
  id: string;
  name: string;
  age: number;
}

const UserSchema = schema<User>({
  id: text().uuid(),
  name: person().fullName(),
  age: person().age().min(18).max(80),
});

// --- Faker seeding ---

const a = numeric().min(1).max(100).seed(42).create();
const b = numeric().min(1).max(100).seed(42).create();
// a === b  ✓  — same seed always produces the same value

// --- Schema seeding ---

const user1 = UserSchema.seed(42).create();
const user2 = UserSchema.seed(42).create();
// user1.id === user2.id  ✓
// user1.name === user2.name  ✓

// --- Story seeding ---

const myStory = story().add('author', UserSchema).add('reviewer', UserSchema);

const snap1 = myStory.seed(42).create();
const snap2 = myStory.seed(42).create();
// snap1.author.id === snap2.author.id  ✓
// snap1.reviewer.name === snap2.reviewer.name  ✓

// --- Seed precedence ---
// Faker seed > schema seed > story seed > global seed.
// A seed set closer to the value always wins.

const SchemaWithSeed = schema<User>({
  id: text().uuid(),
  name: person().fullName(),
  age: person().age().min(18).max(80).seed(99), // faker seed on age
}).seed(42);

// age uses seed 99 (faker wins); id and name use seed 42 (schema level)

// --- Global seeding ---

configure({ seed: 42 });
// All fakers, schemas, and stories without their own seed now use 42.

const globalUser = UserSchema.create();
configure({ seed: 42 });
const sameUser = UserSchema.create();
// globalUser.id === sameUser.id  ✓

configure({ seed: undefined });
// Resets to non-deterministic generation.

// --- Batch generation with seed ---

const batch1 = UserSchema.seed(42).create(3);
const batch2 = UserSchema.seed(42).create(3);
// batch1[0].id === batch2[0].id  ✓
// batch1[2].age === batch2[2].age  ✓

// --- Deterministic test assertions ---

function testDeterministicUser() {
  const user = UserSchema.seed(1).create();

  // Because the seed is fixed, these values are stable across runs.
  // Replace with actual expected values after a first run.
  console.assert(typeof user.id === 'string');
  console.assert(typeof user.name === 'string');
  console.assert(user.age >= 18 && user.age <= 80);

  // Exact equality works because generation is deterministic:
  const again = UserSchema.seed(1).create();
  console.assert(user.id === again.id);
  console.assert(user.name === again.name);
  console.assert(user.age === again.age);
}

testDeterministicUser();
