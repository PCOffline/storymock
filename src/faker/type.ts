export abstract class Module<Result, Constraints extends object = {}> {
  protected constraints: Partial<Constraints>;

  constructor(constraints?: Partial<Constraints>) {
    this.constraints = constraints ?? {};
  }

  public abstract exec(): Result;
}

export abstract class Construct<Constraints extends object, Rules extends object = {}> {
  protected rules: Partial<Rules>;

  constructor(
    protected setter: (callback: (constraints: Partial<Constraints>) => void) => void,
    rules?: Partial<Rules>,
  ) {
    this.setter = setter;
    this.rules = rules ?? {};
  }
}
