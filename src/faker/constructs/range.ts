import { Construct } from '../type.js';

interface Min<Context> {
  min(min: number): Context & Max<Context>;
}

interface Max<Context> {
  max(max: number): Context & Min<Context>;
}

interface Between<Context> {
  between(min: number, max: number): Context;
}

export type IRangeConstruct<Context> = Min<Context> &
  Max<Context> &
  Between<Context>;

export default class RangeConstruct
  extends Construct<{ min: number; max: number }, { min: number; max: number }>
  implements IRangeConstruct<RangeConstruct>
{
  public min(min: number) {
    if (this.rules.min != null && min < this.rules.min) {
      throw new Error(
        `Minimum value must be greater than or equal to ${this.rules.min}`,
      );
    }

    this.setter((constraints) => {
      constraints.min = min;
    });
    return this;
  }
  public max(max: number) {
    if (this.rules.max != null && max > this.rules.max) {
      throw new Error(
        `Maximum value must be less than or equal to ${this.rules.max}`,
      );
    }

    this.setter((constraints) => {
      constraints.max = max;
    });
    return this;
  }
  public between(min: number, max: number) {
    this.min(min);
    this.max(max);
    return this;
  }
}
