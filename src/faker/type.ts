export abstract class Module<Result, Constraints extends object = {}> {
  protected constraints: Partial<Constraints>;

  public constructor(constraints?: Partial<Constraints>) {
    this.constraints = constraints ?? {};
  }

  public abstract exec(): Result;
}

export abstract class Construct<Constraints extends object = {}, Rules extends object = {}> {
  protected rules: Partial<Rules>;

  public constructor(
    rules?: Partial<Rules>,
  ) {
    this.rules = rules ?? {};
  }

  public abstract get constraints(): Constraints;
}

