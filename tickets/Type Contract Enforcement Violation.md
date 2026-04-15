# Test Documentation: Type-Driven Implementation Polymorphism

## Overview
This document shows how existing tests demonstrate Type-Driven Implementation Polymorphism through different `M` type shapes. Each test file shows a different polymorphic adapter pattern.

## Test Patterns

### 1. Calculator Test - Complex M Type
**File:** `src/lib/tiposkripto/tests/calculator/Calculator.test.types.ts`
- Shows full polymorphic pattern with complete `M` type
- `M` type maps all givens, whens, and thens to their implementations
- Demonstrates comprehensive type-driven implementation

### 2. Circle Test - Factory Function M Type  
**File:** `src/lib/tiposkripto/tests/circle/Circle.test.types.ts`
- Shows different `M` type shape using factory functions
- Each implementation returns a factory that creates the actual function
- Demonstrates alternative polymorphic pattern

### 3. Rectangle Test - Constant Usage M Type
**File:** `src/lib/tiposkripto/tests/Rectangle/Rectangle.test.implementation.ts`
- Shows `M` type that uses constant values in implementation
- One implementation method returns a constant instead of a function
- Demonstrates polymorphic pattern with constant values

### 4. AbstractBase Test - Minimal M Type
**File:** `src/lib/tiposkripto/tests/abstractBase.test/implementation.ts`
- Shows minimal `M` type with basic structure
- Only essential type mappings are defined
- Demonstrates simplest polymorphic pattern

## Principles Demonstrated
- Each test shows a different `M` type shape
- No mixing of patterns within a test
- One test demonstrates constant usage
- All use existing TypeScript type system features
- No runtime type checking or fallbacks
