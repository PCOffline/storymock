import { date } from './index.js';

const isLeapYear = (year: number): boolean =>
  year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

describe('fake day', () => {
  it('should generate a random day', () => {
    const day = date().exec().getDate();
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(31);
  });

  it('should generate a random sunday', () => {
    const sunday = date().day('sunday').exec().getDay();
    expect(sunday).toBe(0);
  });

  it('should generate a random even day', () => {
    const evenDay = date().day().even().exec().getDate();
    expect(evenDay % 2).toBe(0);
  });

  it('should generate a random odd day', () => {
    const oddDay = date().day().odd().exec().getDate();
    expect(oddDay % 2).toBe(1);
  });

  it('should generate a random day in the range 1-15', () => {
    const day = date().day().between(1, 15).exec().getDate();
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(15);
  });
});

describe('fake month', () => {
  it('should generate a random month', () => {
    const month = date().exec().getMonth() + 1;
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  it('should generate a random short month', () => {
    const month = date().month('jan').exec().getMonth() + 1;
    expect(month).toBe(1);
  });

  it('should generate a random long month', () => {
    const longMonth = date().month('january').exec().getMonth() + 1;
    expect(longMonth).toBe(1);
  });

  it('should generate a random month in the range 1-5', () => {
    const month = date().month().between(1, 5).exec().getMonth() + 1;
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(5);
  });
});

describe('fake year', () => {
  it('should generate a random year', () => {
    const year = date().exec().getFullYear();
    expect(year).toBeGreaterThanOrEqual(1970);
    expect(year).toBeLessThanOrEqual(3000);
  });

  it('should generate a random year in the range 1950-2000', () => {
    const year = date().year().between(2000, 2010).exec().getFullYear();
    expect(year).toBeGreaterThanOrEqual(2000);
    expect(year).toBeLessThanOrEqual(2010);
  });

  it('should generate a random leap year', () => {
    const leapYear = date().year().leap().exec().getFullYear();
    expect(isLeapYear(leapYear)).toBeTruthy();
  });

  it('should generate a random even year', () => {
    const evenYear = date().year().even().exec().getFullYear();
    expect(evenYear % 2 === 0).toBeTruthy();
  });
});

describe('fake complex date', () => {
  it('should generate a date at a leap year where February 29th is valid', () => {
    const date1: Date = date().year().leap().month(1).day(29).exec();
    const date2: Date = date().year().month(1).day(29).exec();

    expect(isLeapYear(date1.getFullYear())).toBeTruthy();
    expect(isLeapYear(date2.getFullYear())).toBeTruthy();

    expect(date1.getMonth() + 1).toBe(2);
    expect(date2.getMonth() + 1).toBe(2);

    expect(date1.getDate()).toBe(29);
    expect(date2.getDate()).toBe(29);
  });

  it('should generate a sunday on a December 31st', () => {
    const res: Date = date().year().month(11).day(31).day('sunday').exec();

    expect(res.getDay()).toBe(0);
    expect(res.getDate()).toBe(31);
    expect(res.getMonth() + 1).toBe(12);
  });

  it('should generate a date after 2002-09-27', () => {
    const dateAfter = new Date('2002-09-27');
    const res: Date = date().after(dateAfter).exec();

    expect(res.getTime() - dateAfter.getTime()).toBeGreaterThan(0)
  })

  it('should generate a date before 2005-12-19', () => {
    const dateBefore = new Date('2005-12-19');
    const res: Date = date().before(dateBefore).exec();

    expect(res.getTime() - dateBefore.getTime()).toBeLessThan(0)
  })
});
