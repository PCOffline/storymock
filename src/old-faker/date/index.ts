import {
  Faker,
  generateRangeFuncs,
  Range,
  validateRange,
} from '../util/index.js';
import {
  type DateFakerFunc,
  Day,
  Month,
  ShortDay,
  ShortMonth,
  type DateObject,
  MonthFunc,
  DayFunc,
} from './type.js';

export class DateFaker {
  private constraints: Partial<DateObject>;
  public millisecond: DateFakerFunc;
  public ms: DateFakerFunc;
  public second: DateFakerFunc;
  public minute: DateFakerFunc;
  public hour: DateFakerFunc;
  public year: DateFakerFunc;

  constructor(constraints?: Partial<DateObject>) {
    this.constraints = constraints ?? {};
    this.millisecond = this.genFunc('millisecond', 0, 1000);
    this.ms = this.millisecond;
    this.second = this.genFunc('second', 0, 60);
    this.minute = this.genFunc('minute', 0, 60);
    this.hour = this.genFunc('hour', 0, 24);
    this.year = this.genFunc('year', 0, 3000);
  }

  private genFunc(
    key: Exclude<keyof DateObject, 'day' | 'month'>,
    min: number,
    max: number,
  ): DateFakerFunc {
    return ((...params) => {
      const [num] = params;

      if (num) {
        validateRange(min, max, num);
        this.constraints[key] = num;
        return this;
      }

      return {
        ...generateRangeFuncs<typeof this, Date>(min, max, (num) => {
          this.constraints[key] = num;
          return this;
        }),
        ...this,
      };
    }) as DateFakerFunc;
  }

  //! EDGE CASE / DEFINITION: date().day('sunday').day(31).exec() // A Sunday that is 31st or should 31 override?
  public day: DayFunc = ((...params) => {
    const [day] = params;

    if (day && typeof day === 'number') {
      validateRange(0, 32, day);
      this.constraints.day = day;
      return this;
    } else if (typeof day === 'string') {
      const shortDay = Object.keys(ShortDay)
        .map((key) => key.toLowerCase())
        .indexOf(day);
      const longDay = Object.keys(Day)
        .map((key) => key.toLowerCase())
        .indexOf(day);
      if (shortDay === -1 && longDay === -1) {
        throw new Error(`Invalid day '${day}'`);
      }

      this.constraints.weekday = shortDay === -1 ? longDay : shortDay;
      return this;
    }

    return {
      ...generateRangeFuncs<typeof this, Date>(0, 31, (num) => {
        this.constraints.day = num;
        return this;
      }),
      ...this,
    };
  }) as DayFunc;

  public month: MonthFunc = ((...params) => {
    const [month] = params;

    if (month && typeof month === 'number') {
      validateRange(0, 13, month);
      this.constraints.month = month;
      return this;
    } else if (typeof month === 'string') {
      const shortMonth = Object.keys(ShortMonth)
        .map((key) => key.toLowerCase())
        .indexOf(month);
      const longMonth = Object.keys(Month)
        .map((key) => key.toLowerCase())
        .indexOf(month);
      if (shortMonth === -1 && longMonth === -1) {
        throw new Error(`Invalid month '${month}'`);
      }

      this.constraints.month = shortMonth === -1 ? longMonth : shortMonth;
      return this;
    }

    return {
      ...this,
      ...generateRangeFuncs<typeof this, Date>(0, 13, (num) => {
        this.constraints.month = num;
        return this;
      }),
    };
  }) as MonthFunc;

  private validateDate(): void {
    const { month, day, year } = this.constraints as Pick<
      DateObject,
      'day' | 'month' | 'year'
    >;

    if (!day && !month) return;

    if (day && (day < 1 || day > 31)) {
      throw new Error(`Invalid day ${day}`);
    }

    if (month < Month.January || month > Month.December) {
      throw new Error(`Invalid month ${month}`);
    }

    if (day && month) {
      const daysInMonth = [
        31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
      ] as const;

      const leapYear =
        year && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
      const maxDays =
        month === Month.February && leapYear ? 29 : daysInMonth[month];

      if (day > maxDays) {
        throw new Error(`Month ${month} does not have ${day} days`);
      }
    }
  }

  private genYear() {
    // Well fuck I have to think of an algorithm that takes into account weekday, day, month and year values
    this.constraints.year = Math.floor(Math.random() * 3000) + 1970;
  }

  exec = (): Date => {
    if (this.constraints.month && this.constraints.day) {
      this.validateDate();
    }

    if (this.constraints.weekday) {
      // TODO
    }

    if (!this.constraints.year) this.year();
    if (!this.constraints.month) this.month();
    if (!this.constraints.day) this.day();
    if (!this.constraints.hour) this.hour();
    if (!this.constraints.minute) this.minute();
    if (!this.constraints.second) this.second();
    if (!this.constraints.millisecond) this.millisecond();

    const { year, month, day, hour, minute, second, millisecond } = this
      .constraints as DateObject;

    console.log(year, month, day, hour, minute, second, millisecond);

    return new Date(year, month, day, hour, minute, second, millisecond);
  };
}

interface DateConstraints {
  year?: number;
  month?: number;
  day?: number;
  weekday?: number;
  hour?: number;
  minute?: number;
  second?: number;
  before?: Date;
  after?: Date;
}

class DateGenerator {
  private static readonly MIN_YEAR = 1970;
  private static readonly MAX_YEAR = 2100;

  private constraints: DateConstraints = {};

  year(value: number): this {
    this.constraints.year = value;
    return this;
  }

  month(
    value:
      | number
      | Lowercase<keyof typeof Month>
      | Lowercase<keyof typeof ShortMonth>,
  ): this {
    if (typeof value === 'string') {
      const shortMonth = Object.keys(ShortMonth)
        .map((key) => key.toLowerCase())
        .indexOf(value);
      const longMonth = Object.keys(Month)
        .map((key) => key.toLowerCase())
        .indexOf(value);

      if (shortMonth === -1 && longMonth === -1) {
        throw new Error(`Invalid month '${value}'`);
      }

      this.constraints.month = shortMonth === -1 ? longMonth : shortMonth;
    } else {
      if (value < Month.January || value > Month.December) {
        throw new Error(`Invalid month ${value}`);
      }

      this.constraints.month = value;
    }

    return this;
  }

  day(
    value:
      | number
      | Lowercase<keyof typeof Day>
      | Lowercase<keyof typeof ShortDay>,
  ): this {
    if (typeof value === 'string') {
      const shortDay = Object.keys(ShortDay)
        .map((key) => key.toLowerCase())
        .indexOf(value);
      const longDay = Object.keys(Day)
        .map((key) => key.toLowerCase())
        .indexOf(value);

      if (shortDay === -1 && longDay === -1) {
        throw new Error(`Invalid day '${value}'`);
      }

      this.constraints.weekday = shortDay === -1 ? longDay : shortDay;
    } else {
      if (value < 1 || value > 31) {
        throw new Error(`Invalid day ${value}`);
      }

      this.constraints.day = value;
    }

    return this;
  }

  before(date: Date): this {
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    this.constraints.before = date;
    return this;
  }

  after(date: Date): this {
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    this.constraints.after = date;
    return this;
  }

  private static getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private static getDaysInMonth(month: number, year: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  private static isValidDate(
    day: number,
    month: number,
    year: number,
  ): boolean {
    const date = new Date(year, month, day);
    return (
      date.getDate() === day &&
      date.getMonth() === month &&
      date.getFullYear() === year
    );
  }

  private static adjustDateToConstraints(
    date: Date,
    constraints: DateConstraints,
  ): Date | null {
    // If we have a weekday constraint but the current date doesn't match,
    // find the next or previous date that does
    if (constraints.weekday !== undefined) {
      const currentWeekday = date.getDay();
      const diff = constraints.weekday - currentWeekday;

      // Try both forward and backward to stay close to the original date
      const forwardDate = new Date(date);
      forwardDate.setDate(date.getDate() + (diff >= 0 ? diff : diff + 7));

      const backwardDate = new Date(date);
      backwardDate.setDate(date.getDate() + (diff <= 0 ? diff : diff - 7));

      // Check which adjusted date better fits other constraints
      const forwardValid = this.validateDate(forwardDate, constraints);
      const backwardValid = this.validateDate(backwardDate, constraints);

      if (forwardValid && backwardValid) {
        // If both are valid, choose randomly
        return Math.random() < 0.5 ? forwardDate : backwardDate;
      }
      if (forwardValid) return forwardDate;
      if (backwardValid) return backwardDate;
      return null;
    }

    return this.validateDate(date, constraints) ? date : null;
  }

  private static validateDate(
    date: Date,
    constraints: DateConstraints,
  ): boolean {
    if (constraints.before && date >= constraints.before) return false;
    if (constraints.after && date <= constraints.after) return false;
    if (
      constraints.weekday !== undefined &&
      date.getDay() !== constraints.weekday
    )
      return false;
    return true;
  }

  private static generate(constraints: DateConstraints): Date {
    const maxAttempts = 1000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;

      // Generate base random values
      const year =
        constraints.year ??
        this.getRandomInt(
          constraints.after?.getFullYear() ?? this.MIN_YEAR,
          constraints.before?.getFullYear() ?? this.MAX_YEAR,
        );

      const month = constraints.month ?? this.getRandomInt(0, 11);
      const maxDays = this.getDaysInMonth(month, year);
      const day = constraints.day ?? this.getRandomInt(1, maxDays);
      const hour = constraints.hour ?? this.getRandomInt(0, 23);
      const minute = constraints.minute ?? this.getRandomInt(0, 59);
      const second = constraints.second ?? this.getRandomInt(0, 59);

      // Check if the date is valid
      if (!this.isValidDate(day, month, year)) {
        continue;
      }

      const date = new Date(year, month, day, hour, minute, second);

      // Try to adjust the date to match weekday constraints
      const adjustedDate = this.adjustDateToConstraints(date, constraints);
      if (adjustedDate) {
        return adjustedDate;
      }
    }

    throw new Error('Unable to generate a date matching all constraints');
  }

  exec(): Date {
    return DateGenerator.generate(this.constraints);
  }
}

export const date = () => new DateGenerator();
