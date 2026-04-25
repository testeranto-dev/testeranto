export class EventQueue<T> {
  private items: T[] = [];

  push(event: T): void {
    this.items.push(event);
  }

  drain(processor: (event: T) => void): void {
    while (this.items.length > 0) {
      const event = this.items.shift()!;
      processor(event);
    }
  }

  get length(): number {
    return this.items.length;
  }
}