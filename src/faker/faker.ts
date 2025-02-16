interface Faker<Context> {
  min(v: Context): Faker<Context>;
  max(v: Context): Faker<Context>;
  not(): Faker<Context>;
}
