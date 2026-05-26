/**
 * Conditional Fields — when() & derive()
 *
 * `when()` selects a faker (or literal) based on the resolved value of a
 * sibling field. `derive()` computes a field from already-resolved siblings.
 * Together they let schemas express realistic conditional logic.
 *
 * This example covers:
 *  - when() with string keys
 *  - when() with the `_` default/else case
 *  - when() with numeric keys
 *  - when() with boolean keys
 *  - derive() returning a literal
 *  - derive() returning a faker
 *  - Resolution order
 */
import {
  bool,
  choice,
  derive,
  numeric,
  schema,
  temporal,
  text,
  when,
} from 'storymock';

// ═══════════════════════════════════════════════════════════════════
// 1. Coupon — string keys, default case, and derive()
// ═══════════════════════════════════════════════════════════════════

interface Coupon {
  type: 'percentage' | 'fixed';
  value: number;
  label: string;
  status: 'active' | 'expired';
  expiration: Date;
}

const CouponSchema = schema<Coupon>({
  type: choice('percentage', 'fixed'),

  // when() with string keys — value depends on type
  value: when('type', {
    percentage: numeric().min(5).max(100),
    fixed: numeric().min(10).max(500).float().precision(2),
  }),

  status: choice('active', 'expired'),

  // when() with `_` default — expired → past, anything else → future
  expiration: when('status', {
    expired: temporal().past(),
    _: temporal().future(),
  }),

  // derive() returning a literal — computed from resolved siblings
  label: derive(({ type, value }) =>
    type === 'percentage' ? value + '% OFF' : '$' + value + ' OFF',
  ),
});

// Resolution order:
//   1. type       (no deps)
//   2. status     (no deps)
//   3. value      (depends on type via when)
//   4. expiration (depends on status via when)
//   5. label      (derive — resolves last, receives type + value)

const coupon = CouponSchema.create();

// ═══════════════════════════════════════════════════════════════════
// 2. Shipping — when() with numeric keys
// ═══════════════════════════════════════════════════════════════════

interface Shipping {
  weight: number;
  cost: number;
}

const ShippingSchema = schema<Shipping>({
  weight: choice(1, 5, 20),

  cost: when('weight', {
    1: numeric().min(3).max(5).float().precision(2),
    5: numeric().min(8).max(15).float().precision(2),
    _: numeric().min(20).max(50).float().precision(2), // 20 kg or any other value
  }),
});

const shipping = ShippingSchema.create();

// ═══════════════════════════════════════════════════════════════════
// 3. Feature flag — when() with boolean keys
// ═══════════════════════════════════════════════════════════════════

interface Feature {
  enabled: boolean;
  badge: string;
}

const FeatureSchema = schema<Feature>({
  enabled: bool(),

  badge: when('enabled', {
    true: '✅ ON',
    false: '⛔ OFF',
  }),
});

const feature = FeatureSchema.create();

// ═══════════════════════════════════════════════════════════════════
// 4. derive() returning a faker
// ═══════════════════════════════════════════════════════════════════

interface Voucher {
  type: 'percentage' | 'fixed';
  code: string;
}

const VoucherSchema = schema<Voucher>({
  type: choice('percentage', 'fixed'),

  // derive() can return a faker — it will be .create()'d automatically
  code: derive(
    ({ type }) =>
      type === 'percentage'
        ? text().alpha().uppercase().length(5) // e.g. 'ABCDE'
        : text().digits().length(8), // e.g. '04827193'
  ),
});

const voucher = VoucherSchema.create();
