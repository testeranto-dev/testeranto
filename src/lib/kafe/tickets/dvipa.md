---
status: implemented
---

# Java (kafe) - Flavored Version "dvipa"

The Dvipa flavored API provides an idiomatic Java way to write BDD-style tests that integrate seamlessly with JUnit 5 and Java build tools.

## Features

1. **JUnit 5 Integration**: Tests run with standard JUnit 5 runners
2. **Annotation-based API**: Use `@DvipaTest`, `@Given`, `@When`, `@Then` annotations
3. **Maven/Gradle Compatible**: Works with standard Java build tools
4. **Spring Boot Support**: Can be integrated with Spring Boot tests

## Example

```java
package kafe.dvipa;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@DvipaTest("Calculator Tests")
@ExtendWith(DvipaRunner.class)
public class ExampleCalculatorTest {
    
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
        assert calculator.getResult() == expected : 
            "Expected " + expected + " but got " + calculator.getResult();
    }
    
    @Test
    public void testAddition() {
        givenNewCalculator();
        whenAddingNumbers(2, 3);
        thenResultShouldBe(5);
    }
    
    @Test
    public void testAdditionWithNegativeNumbers() {
        givenNewCalculator();
        whenAddingNumbers(-5, 10);
        thenResultShouldBe(5);
    }
    
    static class Calculator {
        private int result;
        
        public void add(int x, int y) {
            result = x + y;
        }
        
        public int getResult() {
            return result;
        }
    }
}
```

## Usage

### 1. Add Dependencies

Ensure you have JUnit 5 in your `pom.xml`:

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.0</version>
    <scope>test</scope>
</dependency>
```

### 2. Write Tests

Create test classes annotated with `@DvipaTest` and `@ExtendWith(DvipaRunner.class)`.

### 3. Run Tests

Tests can be run with standard Maven or Gradle commands:

```bash
mvn test
```

Or directly with JUnit:

```bash
mvn test -Dtest=ExampleCalculatorTest
```

## Integration with Build Tools

### Maven

The standard Maven Surefire plugin works automatically:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.0.0-M7</version>
</plugin>
```

### Gradle

Configure JUnit 5 in your `build.gradle`:

```groovy
test {
    useJUnitPlatform()
}

dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'
}
```

## Spring Boot Integration

For Spring Boot applications, you can combine Dvipa with Spring's test support:

```java
@SpringBootTest
@DvipaTest("User Service Tests")
@ExtendWith({SpringExtension.class, DvipaRunner.class})
public class UserServiceTest {
    
    @Autowired
    private UserService userService;
    
    @Given("a new user with name {name}")
    public void givenNewUser(String name) {
        // Setup test data
    }
    
    // ... more test methods
}
```

## Status

✅ **Implemented**:
- JUnit 5 extension for BDD tests
- Annotation-based API (`@DvipaTest`, `@Given`, `@When`, `@Then`)
- Basic BDD test execution flow
- Example tests demonstrating the pattern
- Integration with Maven Surefire plugin

✅ **Recently Fixed**:
- DvipaRunner now properly executes @Given methods before test methods
- Test methods can call @When and @Then methods in sequence
- Basic parameter placeholder detection in annotations

🔄 **In Progress**:
- Enhanced parameter injection from annotation placeholders
- Test context sharing between Given/When/Then steps
- Better error reporting for BDD step failures

📋 **Planned**:
- Spring Boot test integration support
- Test reporting integration with JUnit 5
- Parallel test execution support
- Maven plugin for test generation

## Next Steps

1. **Maven Plugin**: Create a Maven plugin for generating test skeletons
2. **Enhanced Reporting**: Integrate with test reporting tools
3. **Parameterized Tests**: Support for JUnit 5 parameterized tests
4. **Spring Boot Starter**: Create a Spring Boot starter for easier integration

The Dvipa flavored API makes Testeranto tests feel native to Java developers while maintaining compatibility with the broader Testeranto ecosystem.
