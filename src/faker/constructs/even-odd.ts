import { Construct } from '../type.js';

export interface IEvenOddConstruct<Context> {
  even(): Context;
  odd(): Context;
}

export default class EvenOddConstruct
  extends Construct<{ even: boolean }>
  implements IEvenOddConstruct<EvenOddConstruct>
{
  even() {
    this.setter((constraints) => {
      constraints.even = true;
    });
    return this;
  }

  odd() {
    this.setter((constraints) => {
      constraints.even = false;
    });
    return this;
  }
}
