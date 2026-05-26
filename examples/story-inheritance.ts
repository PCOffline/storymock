/**
 * Story Inheritance
 *
 * Demonstrates how stories extend and branch:
 * - Base stories with `.setup()` wiring
 * - Extending a story with new entries and additional `.setup()`
 * - Setup accumulation — all registered callbacks run at `.create()` time
 * - Cascading `.with()` across entries
 * - Targeting specific `addMany` items via index syntax
 * - Forking independent variants from a shared base
 * - Reusable wiring functions
 */

import { choice, person, ref, schema, story, temporal, text } from 'storymock';

// --- Minimal domain interfaces ---

interface Org {
  id: string;
  name: string;
  plan: 'free' | 'pro';
  deletedAt: Date | null;
}

interface Team {
  id: string;
  orgId: string;
  name: string;
  deletedAt: Date | null;
}

interface Member {
  id: string;
  teamId: string;
  name: string;
  role: 'admin' | 'member';
}

// --- Schemas with traits ---

const OrgSchema = schema<Org>({
  id: text().uuid(),
  name: text().alpha().length(8),
  plan: 'free',
  deletedAt: null,
}).trait('deleted', {
  deletedAt: temporal().past(),
});

const TeamSchema = schema<Team>({
  id: text().uuid(),
  orgId: '',
  name: text().alpha().length(6),
  deletedAt: null,
}).trait('deleted', {
  deletedAt: temporal().past(),
});

const MemberSchema = schema<Member>({
  id: text().uuid(),
  teamId: '',
  name: person().fullName(),
  role: choice('admin', 'member'),
});

// --- Reusable wiring function ---

const wireTeamMembers = (m: { teams: Team[]; members: Member[] }) => {
  m.members.forEach((member, i) => {
    member.teamId = m.teams[i % m.teams.length].id;
  });
};

// --- Base story ---

const orgBase = story()
  .add('org', OrgSchema)
  .addMany('teams', TeamSchema, 2, { orgId: ref('org') })
  .setup((m) => {
    // First setup: wire org → teams (runs for all derived stories)
  });

// --- Extended story ---
// Adds members and a second .setup(). Both setups accumulate —
// at .create() time the base setup runs first, then this one.

const orgWithMembers = orgBase
  .addMany('members', MemberSchema, 4)
  .setup(wireTeamMembers);

// --- Cascading .with() ---

const deletedOrg = orgWithMembers
  .with('org', 'deleted')
  .with('teams', 'deleted');
// Both org and all teams receive the 'deleted' trait

// --- Targeting a specific addMany item ---

const namedTeams = orgWithMembers
  .with('teams[0]', { name: 'Alpha' })
  .with('teams[1]', { name: 'Bravo' });
// Only teams[0] and teams[1] are overridden by name

// --- Forking independent variants from the same base ---

const proOrg = orgWithMembers.with('org', { plan: 'pro' as const });
const softDeleted = orgWithMembers.with('org', 'deleted');

// proOrg and softDeleted are independent — modifying one doesn't affect the other.
const proResult = proOrg.create();
const deletedResult = softDeleted.create();

// proResult.org.plan       === 'pro'  ✓
// proResult.org.deletedAt  === null   ✓
// deletedResult.org.deletedAt !== null ✓

// --- Same wiring function, different story ---

const bigOrg = story()
  .add('org', OrgSchema, { plan: 'pro' as const })
  .addMany('teams', TeamSchema, 5, { orgId: ref('org') })
  .addMany('members', MemberSchema, 10)
  .setup(wireTeamMembers);

// wireTeamMembers distributes 10 members round-robin across 5 teams,
// exactly the same logic as orgWithMembers — zero duplicated wiring.
