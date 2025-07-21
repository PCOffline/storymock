export type Faker<Context, Result> = {
  // not(): Faker<Context, Result, Not extends true ? false : true>;
  exec(): Result;
} & Context;

export interface MaxRange<Context, Result> {
  max(
    max: number,
  ): MinRange<Context, Result> &
    EvenOdd<Context, Result, true, false> &
    Faker<Context, Result>;
}

export interface MinRange<Context, Result> {
  min(
    max: number,
  ): MaxRange<Context, Result> &
    EvenOdd<Context, Result, false, true> &
    Faker<Context, Result>;
}

export interface Between<Context, Result> {
  between(
    min: number,
    max: number,
  ): EvenOdd<Context, Result, false, false> & Faker<Context, Result>;
}

type MinMax<Context, Result> = MinRange<Context, Result> &
  MaxRange<Context, Result>;

export interface EvenOdd<Context, Result, Min = true, Max = true> {
  even(): Faker<Context, Result> &
    (Min extends true
      ? Max extends true
        ? MinMax<Context, Result>
        : MinRange<Context, Result>
      : Max extends true
      ? MaxRange<Context, Result>
      : Context);
  odd(): Faker<Context, Result> &
    (Min extends true
      ? Max extends true
        ? MinMax<Context, Result>
        : MinRange<Context, Result>
      : Max extends true
      ? MaxRange<Context, Result>
      : Context);
}

export type Range<Context, Result> = MinMax<Context, Result> &
  EvenOdd<Context, Result> &
  Between<Context, Result>;

export type FakerWithRange<Context, Result> = Faker<Context, Result> &
  Range<Context, Result>;
