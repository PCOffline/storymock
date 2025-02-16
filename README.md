# Overview
A library that allows you to build mocks from stories.
Combines three powerful concepts: faker, schemas and state.

Mock a Date in 2024 that is a Monday:
```typescript
import { date } from 'storymock';

const mock: Date = date().day('monday').year(2024).exec();
```

Define a schema to mock:
```typescript
import { schema, string, number, date } from 'storymock';

// Opt-in type safety
interface User {
  name: string;
  siblings: number;
  birthdate: Date;
}

const UserMock = schema<User>({
  name: string().name(),
  siblings: number().max(3),
  birthdate: date().year(number().min(1990).max(2020))
});

// Create mock user instances
const user1 = new UserMock(); // { name: 'John', siblings: 3, birthdate: Date('1991-08-19T02:55:03Z') }
const user2 = UserMock.exec(); // { name: 'Sam', siblings: 0, birthdate: Date('2015-03-04T20:12:43Z') }

// Customize fields to mock
const userNamedDavid = new UserMock.field('birthdate').year(2002)();  // { name: 'David', siblings: 2, birthdate: Date('1999-12-31T00:00:00Z') }
const userBornIn2002 = UserMock.field('birthdate').year(2002).exec(); // { name: 'Eldar', siblings: 1, birthdate: Date('2002-09-27T16:29:00Z') }
```

Define complex relationships between states:
```typescript
import { schema, date, string, set, number, pattern } from 'storymock';

interface Coupon {
  title: string;
  status: 'expired' | 'redeemed' | 'available';
  expiration: Date;
  price: number;
  type: 'percentage' | 'fixed';
}

const CouponMock = schema<Coupon>({
  // Create a pattern for the generated string that is based on the 'type' and 'price' fields
  // e.g. 30 USD OFF Chicken
  // or 50% OFF Carrot
  title: string().pattern(
    pattern().field('price')
      .concat().field('type').map((type) => type === 'percentage' ? '%' : ' USD')
      .concat().literal(' OFF ')
      .concat().string().food()
  ),
  // Generate a random status from the given options, with 'available' being the most likely
  status: set().oneOf('expired', 'redeemed', 'available').chance().favor('available'),
  // Make expiry in the future if the status is not 'expired', otherwise in the past
  expiration: date().if().field('status').is('expired')
    .then().past()
    .else().future(),
  // Give different ranges to the price based on whether it's a percentage or a fixed price
  price: number().if().field('type').is('percentage')
    .then((type) => number().max(100))
    .else((type) => number().min(10).max(200).decimal()),
  // Randomly select whether the type is a percentage or a fixed price
  type: set().oneOf(['percentage', 'fixed'])
});
```

Define specific states of a schema using keywords:
```typescript
import { schema } from 'storymock';

const CouponMock = schema({ /*...*/ });
const UserMock = schema({ /*...*/ });

// Define special states as keywords
CouponMock.keyword('expired').field('expiration').is().past().and().field('status').is('expired');
UserMock.keyword('birthday').field('birthdate').is().today();

// Create pre-determined mocks based on keywords
const birthdayUser = UserMock.keyword('birthday').exec();
const expiredCoupon = new CouponMock.keyword('expired')();
```

Create relationship between multiple schemas:
```typescript
import { schema, action } from 'storymock';

interface Item {
  // ...
}

interface Coupon {
  // ...
}

const CouponMock = schema({ /*...*/ });
const UserMock = schema({ /*...*/, items: Item[], coupons: Coupon[] });
const ItemMock = schema({ /*...*/ });

UserMock.on('add', 'item').then((user, item) => user.items.push(item));
UserMock.on('remove', 'item').then((user, item) => {
  const index = user.items.findIndex((i) => i.id === item.id);

  if (index > -1) user.items.splice(index, 1);
});

// We actually have collection modifications built-in
UserMock.on('add', 'coupon').field('coupons').array().push();
// For removal, we need to specify how to identify the item
UserMock.on('remove', 'coupon').field('coupons').array().delete().id((coupon) => coupon.id);

// You can also specify the ID in the CouponMock schema instead
CouponMock.id((coupon) => coupon.id);

// Which shortens the UserMock remove action to
UserMock.on('remove', 'coupon').field('coupons').array().delete();

// Or, since the ID is now specified automatically, you can replace all the actions on 'coupon' with the following,
// to automatically handle remove, add and update:
UserMock.on('change', 'coupon').field('coupons').array().auto();

// Just like keywords, you can define custom actions:
UserMock.on('signout').field('items').array().empty().and().field('coupons').array().empty();
```

Create real-world scenarios by combining multiple schemas and states to create a story:
```typescript
import { schema, story } from 'storymock';

interface Item {
  // ...
}

interface Coupon {
  // ...
}

const CouponMock = schema({ /*...*/ });
const UserMock = schema({ /*...*/, items: Item[], coupons: Coupon[] });
const ItemMock = schema({ /*...*/ });

const birthdayUserWithItem = story().add('user', UserMock.keyword('birthday')).add('item', ItemMock).exec();
// Tip: just like the 'id' field, you can specify the 'name' field in the Schema level, and then you can use '.add' without specifying the name:
ItemMock.name('item');
birthdayUserWithItem.add(ItemMock); // This works now!

// We can now use this story to test whether our birthday coupon detection works:
describe('User discounts', () => {
  it('should detect that a birthday user is eligible for a discount', () => {
    const eligible = isUserEligibleForBirthdayDiscount(story.user);
    expect(eligible).toBe(true)
  });
});
```
