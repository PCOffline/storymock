import {
  RangeConstruct,
  EvenOddConstruct,
  IRangeConstruct,
  IEvenOddConstruct,
} from '../constructs/index.js';
import { Module, Construct } from '../type.js';

interface Constraints {
  min: number;
  max: number;
  even: boolean;
  positive: boolean;
}

class NumberModule
  extends Module<number, Constraints>
  implements IRangeConstruct<NumberModule>, IEvenOddConstruct<NumberModule>
{
  private rangeConstruct: RangeConstruct;
  private evenOddConstruct: EvenOddConstruct;

  constructor(constraints?: Partial<Constraints>) {
    super(constraints ?? {});

    this.rangeConstruct = new RangeConstruct();
    this.evenOddConstruct = new EvenOddConstruct();
  }
  even(): NumberModule {
    throw new Error('Method not implemented.');
  }
  odd(): NumberModule {
    throw new Error('Method not implemented.');
  }

  min(min: number): NumberModule & Max<NumberModule> {
    throw new Error('Method not implemented.');
  }
  max(max: number): NumberModule & Min<NumberModule> {
    throw new Error('Method not implemented.');
  }
  between(min: number, max: number): NumberModule {
    throw new Error('Method not implemented.');
  }

  min(min: number): NumberModule & Max<NumberModule> {
    throw new Error('Method not implemented.');
  }
  max(max: number): NumberModule & Min<NumberModule> {
    throw new Error('Method not implemented.');
  }
  between(min: number, max: number): NumberModule {
    throw new Error('Method not implemented.');
  }
}
