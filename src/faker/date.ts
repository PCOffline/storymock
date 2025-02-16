enum Month {
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

interface DateFaker {
  year(year?: string | number): DateFaker;
  month(month?: Lowercase<keyof typeof Month> | Month): DateFaker;
  day(day?: number): DateFaker;
  min();
}
