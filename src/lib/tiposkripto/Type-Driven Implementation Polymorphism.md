# Simple Plan

## What to Do

### 1. Remove Runtime Checks
- Delete all `typeof` checks on functions
- Delete all `.length` checks on function arity
- Delete all function shape inspection

### 2. Fix These Files
1. **Adapters.ts** - Remove arity checks in `prepareEach`
2. **BaseConfirm.ts** - Remove function shape inspection
3. **ClassyImplementations.ts** - Remove function wrapping logic

### 3. Update Tests
1. **Circle test** - Fix Confirm pattern
2. **Calculator test** - Fix Value returns

## How
Framework trusts type contracts. If code compiles, it works.

## Result
- No runtime type checks
- Framework simpler
- Users can use any function shape that matches type contract

## Example
```typescript
// Before: Framework checks
if (typeof x === 'function') {
  if (x.length === 0) { ... }
}

// After: Framework trusts
const result = x();
```

---
# Type-Driven Implementation Polymorphism

## Concept Definition

**Type-Driven Implementation Polymorphism** is the architectural pattern in Testeranto where:

1. **Type contracts** (`M`, `I`, `O`) define the exact shape of implementations at compile time
2. **Multiple implementation shapes** can satisfy the same contract (polymorphism)
3. **No runtime inspection** - the framework trusts the type system
4. **User responsibility** - Users must ensure their implementations match their type contracts

## Core Principle

**The framework should not inspect function shapes at runtime; it should only enforce type contracts at compile time.**

## The Problem It Solves

Traditional testing frameworks often make assumptions about function shapes (arity, currying patterns, etc.) and perform runtime checks. This creates:

1. **Framework intrusion** into implementation details
2. **Limited flexibility** for users
3. **Runtime complexity** with type inspection logic
4. **Violation of type safety principles**

Type-Driven Implementation Polymorphism solves this by shifting responsibility to compile-time type checking.

## How It Works

### 1. Define Your Type Contract (`M`)

```typescript
// Calculator.test.types.ts
export type M = {
  givens: {
    [K in keyof O["givens"]]: (...args: O["givens"][K]) => Calculator;
  };
  whens: {
    [K in keyof O["whens"]]: (
      ...args: O["whens"][K]
    ) => (calculator: Calculator) => Calculator;
  };
  thens: {
    [K in keyof O["thens"]]: (
      ...args: O["thens"][K]
    ) => (calculator: Calculator) => void;
  };
};
```

### 2. Implement According to Your Contract

You can choose any shape that satisfies the type contract:

```typescript
// Option 1: Double-curried (default pattern)
confirms: {
  addition: () => {
    return (a: number, b: number) => a + b;
  };
}

// Option 2: Single function
confirms: {
  addition: (a: number, b: number) => a + b;
}

// Option 3: Constant value
confirms: {
  addition: 42; // If your type contract allows this
}
```

### 3. Framework Trusts the Type System

The framework doesn't inspect function shapes at runtime:

```typescript
// GOOD: Framework simply executes without inspection
const result = this.confirmCB(...args);

// BAD (what we avoid): Framework checking function arity
if (initializer.length === 0) {
  calculator = initializer();
} else if (initializer.length === 1) {
  calculator = initializer(subject);
} else {
  calculator = initializer();
}
```

## Key Benefits

### 1. **True Type Safety**
   - Errors caught at compile time, not runtime
   - No "function shape mismatch" runtime errors
   - TypeScript ensures compatibility

### 2. **Maximum Flexibility**
   - Users can define any function shape they need
   - Support for multiple patterns (curried, uncurried, constants)
   - No framework-imposed constraints

### 3. **Cleaner Framework Code**
   - No runtime type inspection logic
   - Simplified adapter implementations
   - Clear separation of concerns

### 4. **Clear Responsibility Boundaries**
   - **User responsibility**: Define correct type contracts
   - **Framework responsibility**: Execute according to types
   - No ambiguity about who ensures compatibility

## Implementation Patterns

### Pattern 1: Double-Curried (Traditional BDD)
```typescript
givens: {
  Default: () => new Calculator(),
},
whens: {
  press: (button: string) => (calculator: Calculator) => {
    calculator.press(button);
    return calculator;
  },
}
```

### Pattern 2: Single Function
```typescript
givens: {
  Default: () => new Calculator(),
},
whens: {
  press: (calculator: Calculator, button: string) => {
    calculator.press(button);
    return calculator;
  },
}
```

### Pattern 3: Factory Pattern
```typescript
confirms: {
  addition: () => {
    // Complex setup logic here
    const calculator = new Calculator();
    return (a: number, b: number) => {
      // Use pre-configured calculator
      return calculator.add(a, b);
    };
  },
}
```

## Migration from Runtime Inspection

If you're migrating code that previously relied on runtime inspection:

### Before (Runtime Inspection):
```typescript
// Framework inspects function shape
if (typeof this.confirmCB === 'function') {
  const potentialTestFn = this.confirmCB();
  if (typeof potentialTestFn === 'function') {
    testFn = potentialTestFn;
  } else {
    testFn = this.confirmCB;
  }
}
```

### After (Type-Driven):
```typescript
// Framework trusts the type system
// User ensures confirmCB matches type M
const testFn = this.confirmCB;
const result = testFn(...args);
```

## Common Pitfalls and Solutions

### Pitfall 1: Type M Doesn't Match Implementation
**Solution**: Ensure your `M` type accurately reflects your implementation shapes.

### Pitfall 2: Framework Still Doing Runtime Checks
**Solution**: Remove all `typeof`, `.length`, and other runtime inspections from framework code.

### Pitfall 3: Adapter Expects Specific Shape
**Solution**: Update adapters to work with the type contract, not specific shapes.

## Related Concepts

### 1. **Type Contract Enforcement Violation**
   - The anti-pattern where frameworks inspect function shapes at runtime
   - Violates the principle of Type-Driven Implementation Polymorphism

### 2. **Contract-First Development**
   - Define interfaces/types first, implementations second
   - Ensures compatibility through types, not runtime checks

### 3. **Compile-Time Polymorphism**
   - Different implementations selected at compile time
   - Type system ensures all implementations satisfy the contract

## Best Practices

1. **Define M First**: Always define your `M` type before implementing
2. **Use TypeScript Strict Mode**: Catch type errors early
3. **Test Type Compatibility**: Use TypeScript's type checking in your build process
4. **Document Your Patterns**: Comment on why you chose a particular implementation shape
5. **Keep Adapters Simple**: Adapters should not inspect shapes, just execute functions

## Examples in the Codebase

### Calculator Tests (`Calculator.test.types.ts`)
Shows a comprehensive `M` type definition with double-curried patterns.

### Circle Tests (`Circle.test.types.ts`)
Demonstrates how the same pattern works with different domain objects.

### Rectangle Tests (`Rectangle.test.implementation.ts`)
Shows practical implementation of the type contract.

## Conclusion

Type-Driven Implementation Polymorphism represents a fundamental shift in how testing frameworks handle implementation diversity. By trusting the type system and eliminating
runtime inspection, we achieve:

- **True type safety** through compile-time checking
- **Maximum flexibility** for implementation patterns
- **Cleaner, simpler framework code**
- **Clear separation of responsibilities**

This pattern ensures that Testeranto remains both flexible and type-safe, allowing users to choose the implementation patterns that work best for their specific needs while
maintaining rigorous type safety.