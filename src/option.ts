export class Option<T> {
  static None = new Option<never>(null);

  static Some<T>(value: T) {
    return new Option(value);
  }

  protected constructor(private value: T|null) {
    if (this.value === undefined) {
      this.value = null;
    }
  }

  isDefined() {
    return this.value !== null;
  }

  get() {
    return this.value;
  }

  getOrElse(orElse: () => T|T) {
    if (this.isDefined()) {
      return this.value;
    } else if (typeof orElse === 'function') {
      orElse();
    } else {
      return orElse;
    }
  }

  map(fn: (t: T|null) => T): Option<T|null> {
    if (this.isDefined()) {
      return Option.Some(fn(this.value));
    }
    return Option.None;
  }

  flatMap(fn: (t: T|null) => T): T|null {
    if (this.isDefined()) {
      return fn(this.value);
    }
    return null;
  }

  match<K>(matchFn: (t: T) => K,
           emptyFn: () => K) {
    if (this.isDefined()) {
      return matchFn(this.value as T);
    }
    return emptyFn();
  }

  toString() {
    if (this.value === null) {
      return 'None';
    }
    return 'Some(' + this.value + ')';
  }
}
