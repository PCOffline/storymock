/**
 * Traits & Customization
 *
 * Traits are named, reusable sets of field overrides that represent a specific
 * state of the mock object. `.with()` applies traits and/or inline overrides,
 * always returning a new, immutable schema.
 *
 * This example covers:
 *  - Base schema definition
 *  - Defining traits with .trait()
 *  - Applying one or multiple traits with .with()
 *  - Inline field overrides via .with({ ... })
 *  - Combining traits and overrides in a single .with() call
 *  - Immutability — forking schemas without side-effects
 *  - Batch generation with traits
 */
import {
  choice,
  collection,
  lorem,
  person,
  schema,
  temporal,
  text,
} from 'storymock';

// ── Domain interface ────────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  completedAt: Date | null;
  tags: string[];
}

// ── Base schema ─────────────────────────────────────────────────────
const TaskSchema = schema<Task>({
  id: text().uuid(),
  title: lorem().sentence(),
  priority: choice('low', 'medium', 'high'),
  assignee: person().fullName(),
  completedAt: null,
  tags: collection(lorem().word()).maxLength(3),
})

  // ── Defining traits ─────────────────────────────────────────────────
  .trait('completed', {
    completedAt: temporal().past(),
  })
  .trait('urgent', {
    priority: 'high' as const,
    tags: ['urgent'],
  })
  .trait('unassigned', {
    assignee: '',
  });

// ── Applying one trait ──────────────────────────────────────────────
const doneTask = TaskSchema.with('completed').create();
// doneTask.completedAt → Date (some past date)

// ── Combining traits (left-to-right precedence) ─────────────────────
const urgentDone = TaskSchema.with('urgent', 'completed').create();
// urgentDone.priority  → 'high'
// urgentDone.tags      → ['urgent']
// urgentDone.completedAt → Date

// ── Inline overrides ────────────────────────────────────────────────
const specific = TaskSchema.with({ title: 'Fix bug #123' }).create();
// specific.title → 'Fix bug #123' (everything else is random)

// ── Traits + overrides (override object is always last) ─────────────
const urgentAlice = TaskSchema.with('urgent', { assignee: 'Alice' }).create();
// urgentAlice.priority → 'high'   (from trait)
// urgentAlice.assignee → 'Alice'  (from override)

// ── Immutability — forking produces independent schemas ─────────────
const base = TaskSchema;
const urgent = base.with('urgent');
const unassigned = base.with('unassigned');

// `base` is unchanged — traits are not applied until .create()
const baseTask = base.create(); // random priority, has assignee
const urgentTask = urgent.create(); // priority: 'high'
const noOwner = unassigned.create(); // assignee: ''

// ── Batch with traits ───────────────────────────────────────────────
const completedBatch: Task[] = TaskSchema.with('completed').create(5);
// 5 independent tasks, each with a random past completedAt
