# Circle Tests

This directory contains tests for the Circle class using Testeranto's multi-pattern testing framework.

## Circle Class Features

- `setRadius(radius: number): Circle` - Sets the radius and returns the instance
- `getRadius(): number` - Returns the current radius
- `getCircumference(): number` - Returns the circumference (2πr)
- `getArea(): number` - Returns the area (πr²)

## Test Patterns Demonstrated

### 1. TDT (Table-Driven Testing)
- Tests circumference calculation with various radii
- Tests area calculation with various radii

### 2. AAA (Arrange-Act-Assert) via Describe-It Pattern
- Tests circle properties with a specific radius

### 3. BDD (Behavior-Driven Development)
- Tests radius operations (double and halve)
- Tests setRadius method

## Running Tests

```bash
# From the tiposkripto directory
npm test -- circle
```

## Test Coverage

- Basic radius operations
- Mathematical correctness of circumference and area calculations
- Method chaining (setRadius returns Circle instance)
- Edge cases (radius = 0)
```
