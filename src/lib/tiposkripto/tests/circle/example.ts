// Example of how to use the Circle class

import { Circle } from "./Circle.js";

// Create a circle with radius 5
const circle = new Circle(5);

console.log(`Radius: ${circle.getRadius()}`);
console.log(`Circumference: ${circle.getCircumference()}`);
console.log(`Area: ${circle.getArea()}`);

// Chain methods
circle.setRadius(10).setRadius(7);

console.log(`\nAfter setting radius to 7:`);
console.log(`Radius: ${circle.getRadius()}`);
console.log(`Circumference: ${circle.getCircumference()}`);
console.log(`Area: ${circle.getArea()}`);
