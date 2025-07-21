interface Constraints {
  even: boolean;
  positive: boolean;
  min: number;
  max: number;
}

export default class Range {
  private constraints: Partial<Constraints>;
  private rules: { min?: number; max?: number; positive?: boolean };

  constructor({
    min,
    max,
  }: {
    min?: number;
    max?: number;
    positive?: boolean;
  }) {
    this.constraints = {};
    this.rules = { min, max };
  }

  public even(): this {
    this.constraints.even = true;
    return this;
  }

  public odd(): this {
    this.constraints.even = false;
    return this;
  }

  public min(min: number): this {
    if (this.rules.min && this.rules.min < min) {
      throw new Error(
        `Minimum value must be greater than or equal to ${this.rules.min}`,
      );
    }

    if (this.rules.positive && min <= 0) {
      throw new Error('Minimum value must be positive');
    }

    if (this.rules.positive === false && min >= 0) {
      throw new Error('Minimum value must be negative');
    }

    this.constraints.min = min;
    return this;
  }

  public max(max: number): this {
    if (this.rules.max && this.rules.max < max) {
      throw new Error(
        `Minimum value must be less than or equal to ${this.rules.max}`,
      );
    }

    if (this.rules.positive && max <= 0) {
      throw new Error('Maximum value must be positive');
    }

    if (this.rules.positive === false && max >= 0) {
      throw new Error('Maximum value must be negative');
    }

    this.constraints.max = max;
    return this;
  }

  public between(min: number, max: number): this {
    if (this.rules.min && this.rules.min < min) {
      throw new Error(
        `Minimum value must be greater than or equal to ${this.rules.min}`,
      );
    }

    if (this.rules.max && this.rules.max < max) {
      throw new Error(
        `Minimum value must be less than or equal to ${this.rules.max}`,
      );
    }

    this.constraints.min = min;
    this.constraints.max = max;
    return this;
  }

  public positive() {
    if (this.rules.positive === false) {
      throw new Error('This range must be negative');
    }

    this.constraints.positive = true;
    return this;
  }

  public negative() {
    if (this.rules.positive) {
      throw new Error('This range must be positive');
    }

    this.constraints.positive = false;
    return this;
  }

  private generate(): number {
    const positive = this.constraints.positive ?? this.rules.positive;

    let min =
      this.constraints.min ?? this.rules.min ?? (positive ? 1 : -Infinity);
    let max =
      this.constraints.max ??
      this.rules.max ??
      (positive === false ? -1 : Infinity);

    if (min > max) {
      throw new Error(
        'Minimum value must be less than or equal to maximum value',
      );
    }

    if (this.constraints.even && min % 2 === 1) min++;
    if (this.constraints.even === false && min % 2 === 0) min++;

    if (this.constraints.even && max % 2 === 1) max--;
    if (this.constraints.even === false && max % 2 === 0) max--;

    if (
      min > max ||
      (positive && max < 1) ||
      (positive === false && min > -1)
    ) {
      throw new Error('No valid values in the range');
    }

    if (this.constraints.even) {
      while (true) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        if (num % 2 === 0) return num;
      }
    }

    if (this.constraints.even === false) {
      while (true) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        if (num % 2 === 1) return num;
      }
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  public exec(): number {
    return this.generate();
  }
}
