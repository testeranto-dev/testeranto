export class Circle {
  private radius: number = 0;

  constructor(radius: number = 0) {
    this.radius = radius;
  }

  setRadius(radius: number): Circle {
    this.radius = radius;
    return this;
  }

  getRadius(): number {
    return this.radius;
  }

  getCircumference(): number {
    return 2 * Math.PI * this.radius;
  }

  getArea(): number {
    return Math.PI * this.radius * this.radius;
  }

  // For testing purposes
  toString(): string {
    return `Circle(radius=${this.radius})`;
  }
}
