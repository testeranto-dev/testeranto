# Dvipa - Java Flavored Testeranto

Dvipa is a flavored implementation of Testeranto for Java that provides an idiomatic, annotation-based API for writing BDD-style tests.

## Overview

Dvipa integrates with JUnit 5 to provide a seamless testing experience for Java developers. It allows you to write tests using familiar Java patterns while following the BDD (Given-When-Then) methodology.

## Quick Start

### 1. Add Dependencies

Make sure your `pom.xml` includes JUnit 5:

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.0</version>
    <scope>test</scope>
</dependency>
```

### 2. Write a Test

```java
package com.example.tests;

import kafe.dvipa.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@DvipaTest("Calculator Tests")
@ExtendWith(DvipaRunner.class)
public class CalculatorTest {
    
    private Calculator calculator;
    
    @Given("a new calculator")
    public void givenNewCalculator() {
        calculator = new Calculator();
    }
    
    @When("adding {x} and {y}")
    public void whenAddingNumbers(int x, int y) {
        calculator.add(x, y);
    }
    
    @Then("result should be {expected}")
    public void thenResultShouldBe(int expected) {
        assert calculator.getResult() == expected;
    }
    
    @Test
    public void testAddition() {
        givenNewCalculator();
        whenAddingNumbers(2, 3);
        thenResultShouldBe(5);
    }
}
```

### 3. Run Tests

```bash
mvn test
```

## Features

### Annotations

- `@DvipaTest`: Marks a class as a Dvipa test suite
- `@Given`: Marks a method as a Given step (setup)
- `@When`: Marks a method as a When step (action)
- `@Then`: Marks a method as a Then step (assertion)

### JUnit 5 Integration

Dvipa tests are regular JUnit 5 tests, so they work with:
- IDE test runners (IntelliJ, Eclipse, VS Code)
- Build tools (Maven, Gradle)
- CI/CD pipelines
- Test reporting tools

### Parameter Injection

Dvipa supports parameter injection in test methods:

```java
@When("adding {x} and {y}")
public void whenAddingNumbers(int x, int y) {
    // x and y will be provided by the test framework
}
```

## Best Practices

1. **Keep Given methods simple**: They should only set up initial state
2. **When methods should perform actions**: Focus on changing the system state
3. **Then methods should make assertions**: Verify the expected outcomes
4. **Use descriptive names**: Make test intentions clear
5. **Follow the Arrange-Act-Assert pattern**: Even with BDD annotations

## Integration with Existing Tests

Dvipa can coexist with traditional JUnit tests in the same project. You can gradually migrate tests to the BDD style or use both approaches as needed.

## Limitations

- Currently requires JUnit 5
- Test discovery is based on JUnit's extension model
- Some advanced BDD features may not be fully implemented yet

## Future Enhancements

1. **Spring Boot integration**: Better support for Spring Boot applications
2. **Parameterized tests**: Support for JUnit 5 parameterized tests
3. **Test context sharing**: Share state between test steps
4. **Custom assertions**: Domain-specific assertion libraries
5. **Test reporting**: Enhanced BDD-style test reports

## See Also

- [Testeranto Documentation](../../../README.md)
- [Kafe Baseline API](../README.md)
- [JUnit 5 Documentation](https://junit.org/junit5/docs/current/user-guide/)
