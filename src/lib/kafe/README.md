# Kafe - Java Implementation of Testeranto

Kafe is a Java implementation of the Testeranto BDD testing framework, following the same patterns as other language implementations (TypeScript, Python, Go, Ruby, Rust).

## Overview

This implementation provides Java classes for writing BDD-style tests with Given-When-Then structure, integrated with the Testeranto ecosystem.

## Structure

- `types.java`: Core type definitions and interfaces
- `BaseSuite.java`: Base class for test suites
- `BaseGiven.java`: Base class for Given conditions
- `BaseWhen.java`: Base class for When actions
- `BaseThen.java`: Base class for Then assertions
- `SimpleTestAdapter.java`: Default adapter implementation
- `Kafe.java`: Main orchestrator class

## Usage

### Basic Example

```java
import kafe.*;
import java.util.*;

public class CalculatorTest {
    public static void main(String[] args) {
        // Define test implementation
        Map<String, Object> suites = new HashMap<>();
        Map<String, Function<Object, Object>> givens = new HashMap<>();
        Map<String, Function<Object, Function<Object, Object>>> whens = new HashMap<>();
        Map<String, Function<Object, Function<Object, Object>>> thens = new HashMap<>();
        
        // Add your test definitions here...
        
        ITestImplementation implementation = new ITestImplementation(
            suites, givens, whens, thens
        );
        
        // Create test specification
        ITestSpecification specification = (suitesObj, givensObj, whensObj, thensObj) -> {
            // Build test specs
            return new ArrayList<>();
        };
        
        // Create Kafe instance
        Kafe kafe = new Kafe(
            null,
            specification,
            implementation,
            new ITestResourceRequest(1),
            new SimpleTestAdapter(),
            (runnable) -> { runnable.run(); return null; }
        );
        
        // Run tests
        IFinalResults results = kafe.receiveTestResourceConfig(
            "{\"name\":\"test\",\"fs\":\".\",\"ports\":[]}",
            "ipcfile"
        );
        
        System.exit(results.fails);
    }
}
```

### Running Tests

#### Running Dvipa Flavored Tests (JUnit 5)

Dvipa tests are regular JUnit 5 tests and can be run with standard Maven commands:

```bash
cd src/lib/kafe
mvn test
```

To run a specific test class:

```bash
mvn test -Dtest=ExampleCalculatorTest
```

#### Running the Example Test Programmatically

You can also run tests using the DvipaTestRunner:

```bash
cd src/lib/kafe
mvn compile
java -cp "target/classes:$(find ~/.m2/repository -name '*.jar' | tr '\n' ':')" kafe.dvipa.DvipaTestRunner kafe.dvipa.ExampleCalculatorTest
```

#### Running Baseline Kafe Tests

To run tests with the baseline Kafe implementation:

```bash
java -cp "target/classes:$(find ~/.m2/repository -name '*.jar' | tr '\n' ':')" kafe.Kafe '{"name":"test","fs":".","ports":[]}'
```

## Integration with Testeranto

Kafe follows the same patterns as other Testeranto implementations:

1. **Test Resource Configuration**: Passed as a JSON string argument
2. **Results Output**: Writes to `testeranto/reports/allTests/example/java.Calculator.test.ts.json`
3. **Artifact Generation**: Supports test artifacts and reporting

## Building

Kafe uses Maven for building. To compile and package:

```bash
cd src/lib/kafe
mvn clean compile
```

To create a runnable JAR:

```bash
mvn package
```

The JAR file will be created in the `target/` directory.

## Testing the Dvipa Implementation

The Dvipa flavored API provides an idiomatic Java way to write BDD-style tests:

1. **Annotations**: Use `@DvipaTest`, `@Given`, `@When`, `@Then` to define tests
2. **JUnit 5 Integration**: Tests run with standard JUnit 5 runners
3. **BDD Pattern**: Follows Given-When-Then structure

Example test structure:
```java
@DvipaTest("Calculator Tests")
@ExtendWith(DvipaRunner.class)
public class ExampleCalculatorTest {
    
    @Given("a new calculator")
    public void givenNewCalculator() {
        // setup code
    }
    
    @When("adding {x} and {y}")
    public void whenAddingNumbers(int x, int y) {
        // action code
    }
    
    @Then("result should be {expected}")
    public void thenResultShouldBe(int expected) {
        // assertion code
    }
    
    @Test
    public void testAddition() {
        givenNewCalculator();
        whenAddingNumbers(2, 3);
        thenResultShouldBe(5);
    }
}
```

## Future Enhancements

1. **Enhanced Parameter Injection**: Support for parameter placeholders in annotation values
2. **Test Context Management**: Better state management between Given, When, Then steps
3. **Spring Boot Integration**: Seamless integration with Spring Boot testing
4. **Test Reporting**: Enhanced BDD-style test reports

The Dvipa flavored API makes Testeranto tests feel native to Java developers while maintaining compatibility with the broader Testeranto ecosystem.
3. **WebSocket Support**: Real-time test reporting
4. **Annotation Support**: Java annotations for test definitions
5. **JUnit Integration**: Compatibility with JUnit

## See Also

- [Tiposkripto](../tiposkripto/) - TypeScript/JavaScript implementation
- [Pitono](../pitono/) - Python implementation
- [Golingvu](../golingvu/) - Go implementation
- [Rubeno](../rubeno/) - Ruby implementation
- [Rusto](../rusto/) - Rust implementation
