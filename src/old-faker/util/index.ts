import { Between, EvenOdd, Faker, MaxRange, MinRange, Range } from './type.js';

export const random = ({
  min = 0,
  max = 1,
  floor = true,
}: {
  min?: number;
  max?: number;
  floor?: boolean;
}): number => {
  const res = Math.random() * (max - min) + min;
  return floor ? Math.floor(res) : res;
};

export const validateRange = (min: number, max: number, input: number) => {
  if (input < min) {
    throw new Error(`${input} is below the valid minimum: ${min}`);
  }

  if (input >= max) {
    throw new Error(`${input} is above the valid maximum: ${max - 1}`);
  }
};

export const generateRangeFuncs = <Context, Result>(
  validMin: number,
  validMax: number,
  callback: (num: number) => Faker<Context, Result>,
  floor: boolean = true,
): Range<Context, Result> => {
  const wrapResult = (c: Context) =>
    ({ min, max, between, even, odd, ...c } as Context & {
      exec: () => Result;
    } & Range<Context, Result>);

  const validate = (num: number) => validateRange(validMin, validMax, num);

  const rand = (min: number, max: number, floorOverride = floor): number => {
    validate(min);
    validate(max);
    return random({ min, max, floor: floorOverride });
  };

  const min: MinRange<Context, Result>['min'] = (num: number) =>
    wrapResult(callback(rand(num, validMax)));

  const max: MaxRange<Context, Result>['max'] = (num: number) =>
    wrapResult(callback(rand(validMin, num)));

  const between = (min: number, max: number) =>
    wrapResult(callback(rand(min, max)));

  const even: EvenOdd<Context, Result>['even'] = () => {
    let max = validMax;
    let min = validMin;
    if (max % 2 !== 0) {
      if (max - 1 > min) max--;
      else
        throw new Error(
          `No even numbers between the range ${validMin} and ${validMax}`,
        );
    }

    if (min % 2 !== 0) {
      if (min + 1 < max) min--;
      else
        throw new Error(
          `No even numbers between the range ${validMin} and ${validMax}`,
        );
    }

    let result;
    do {
      result = rand(min, max);
    } while (result % 2 !== 0);

    return wrapResult(callback(result));
  };

  const odd: EvenOdd<Context, Result>['odd'] = () => {
    let max = validMax;
    let min = validMin;
    if (max % 2 === 0) {
      if (max - 1 > min) max--;
      else
        throw new Error(
          `No odd numbers between the range ${validMin} and ${validMax}`,
        );
    }

    if (min % 2 === 0) {
      if (min + 1 < max) min--;
      else
        throw new Error(
          `No odd numbers between the range ${validMin} and ${validMax}`,
        );
    }

    let result;
    do {
      result = rand(min, max);
    } while (result % 2 === 0);

    return wrapResult(callback(result));
  };

  return { min, max, between, even, odd };
};

export * from './type.js';
