import { Module } from '../type.js';

type Constructor<Result, Constraints extends object> = abstract new (
  ...args: any[]
) => Module<Result, Constraints>;

interface RangeTrait<T> {
  min(value: number): this & T;
  max(value: number): this & T;
  between(min: number, max: number): this & T;
}

interface RangeConstraints {
  min?: number;
  max?: number;
}

function RangeMixin<
  TBase extends Constructor<Result, Constraints>,
  Result,
  Constraints extends RangeConstraints,
>(Base: TBase) {
  abstract class Mixin extends Base implements RangeTrait<InstanceType<TBase>> {
    public constraints: Partial<Constraints> = {};

    min(value: number) {
      this.constraints.min = value;
      return this as this & InstanceType<TBase>;
    }

    max(value: number): InstanceType<TBase> {
      this.constraints.max = value;
      return this as InstanceType<TBase>;
    }

    between(min: number, max: number): InstanceType<TBase> {
      this.constraints.min = min;
      this.constraints.max = max;
      return this as InstanceType<TBase>;
    }
  }

  return Mixin;
}

interface ParityTrait<T> {
  even(): T;
  odd(): T;
}

enum Parity {
  Even = 'even',
  Odd = 'odd',
}

interface ParityConstraints {
  parity: Parity;
}

function ParityMixin<
  TBase extends Constructor<Result, Constraints>,
  Result,
  Constraints extends ParityConstraints,
>(Base: TBase) {
  abstract class Mixin
    extends Base
    implements ParityTrait<InstanceType<TBase>>
  {
    even(): InstanceType<TBase> {
      this.constraints.parity = Parity.Even;
      return this as InstanceType<TBase>;
    }

    odd(): InstanceType<TBase> {
      this.constraints.parity = Parity.Odd;
      return this as InstanceType<TBase>;
    }
  }

  return Mixin;
}

interface SignTrait<T> {
  positive(): T;
  negative(): T;
}

enum Sign {
  Positive = 'positive',
  Negative = 'negative',
}

interface SignConstraints {
  sign: Sign;
}

function SignMixin<
  TBase extends Constructor<Result, Constraints>,
  Result,
  Constraints extends SignConstraints,
>(Base: TBase) {
  abstract class Mixin extends Base implements SignTrait<InstanceType<TBase>> {
    positive(): InstanceType<TBase> {
      this.constraints.sign = Sign.Positive;
      return this as InstanceType<TBase>;
    }

    negative(): InstanceType<TBase> {
      this.constraints.sign = Sign.Negative;
      return this as InstanceType<TBase>;
    }
  }

  return Mixin;
}

// Concrete implementation
class NumberFaker extends RangeMixin(Module<number>) {
  exec(): number {
    return 5;
    //   let min =
    //     this.constraints.min ??
    //     (this.signConstraint === 'positive' ? 0 : -Infinity);
    //   let max =
    //     this.constraints.max ??
    //     (this.signConstraint === 'negative' ? -1 : Infinity);

    //   if (this.parityConstraint === 'even') {
    //     min = Math.ceil(min / 2) * 2;
    //     max = Math.floor(max / 2) * 2;
    //   } else if (this.parityConstraint === 'odd') {
    //     min = Math.ceil((min + 1) / 2) * 2 - 1;
    //     max = Math.floor((max + 1) / 2) * 2 - 1;
    //   }

    //   return Math.floor(Math.random() * (max - min + 1)) + min;
    // }
  }
}

declare function test<
  Constraints extends object,
  T,
  U extends Constructor<T, Constraints>,
>(
  base: abstract new () => Module<T>,
  ...args: ((c: Constructor<T, Constraints>) => U)[]
): typeof base & U extends abstract new (...args: infer O) => infer P
  ? abstract new (...args: O) => Omit<P, 'constraints'> & { exec(): T }
  : never;

const a = test(
  Module<number>,
  RangeMixin<
    abstract new () => Module<number, RangeConstraints>,
    number,
    RangeConstraints
  >,
);
class A extends test(Module<number>, RangeMixin) {
  public exec(): number {
    return 5;
  }
}

const bla = new A();
const dsad = bla.exec();

function inject<
  Constraints extends object,
  T,
  U extends Constructor<T, Constraints>,
>(
  base: abstract new () => Module<T>,
  ...args: ((c: Constructor<T, Constraints>) => U)[]
): typeof base & U {
  return args.reduce((curr, acc) => acc(curr), base) as typeof base & U;
}

class Some extends inject(Module<number>, RangeMixin) {}

export const number = (): Omit<NumberFaker, 'constraints'> => new NumberFaker();
number().min(5).exec();
