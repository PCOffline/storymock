import type { DateFaker } from './index.js';
import type { Faker, FakerWithRange } from '../util/index.js';

export enum ShortDay {
  Sun,
  Mon,
  Tue,
  Wed,
  Thu,
  Fri,
  Sat,
}

export enum Day {
  Sunday,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
}

export enum ShortMonth {
  Jan,
  Feb,
  Mar,
  Apr,
  May,
  Jun,
  Jul,
  Aug,
  Sep,
  Oct,
  Nov,
  Dec,
}

export enum Month {
  January,
  February,
  March,
  April,
  May,
  June,
  July,
  August,
  September,
  October,
  November,
  December,
}

export type Result = FakerWithRange<DateFaker, Date>;

type IsNever<T, U, V = any, W = any, Z = any> = any
type NotHelper<T, U, V = any, W = any, Z = any> = any
type A<T, Not> = <U>(...args: IsNever<T, NotHelper<true, IsNever<U, true, false>, Not, [], [never]>, NotHelper<T, U, Not, [], [never]>>) => void;

export type DateFakerFunc<U = number> = <T extends U[] = [] | [U]>(
  ...num: T
) => T extends [] ? Result : Faker<DateFaker, Date>;
export type MonthFunc = DateFakerFunc<
  Lowercase<keyof typeof Month> | Lowercase<keyof typeof ShortMonth> | number
>;
export type DayFunc = DateFakerFunc<
  number | Lowercase<keyof typeof Day> | Lowercase<keyof typeof ShortDay>
>;

export interface DateObject {
  millisecond: number;
  second: number;
  minute: number;
  hour: number;
  day: number;
  weekday: Day;
  month: Month;
  year: number;
}
