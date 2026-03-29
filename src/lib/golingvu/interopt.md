# Interoperability Guide for Golingvu

Golingvu provides full interoperability between standard Go testing and the Testeranto ecosystem. This document explains how to:

1. Run standard Go tests using Golingvu
2. Run Golingvu tests using the official Go test runner
3. Integrate with the Testeranto test runner

## 1. Running Standard Go Tests on Golingvu

You can run existing Go tests through Golingvu to leverage its BDD/TDT/Describe-It patterns and artifact generation.

### Example: Converting a Native Go Test

**Original Go test:**
```go
func TestCalculatorAddition(t *testing.T) {
    calc := &Calculator{}
    calc.Add(2)
    calc.Add(3)
    if calc.Result() != 5 {
        t.Errorf("Expected 5, got %d", calc.Result())
    }
}
```

**Converted to Golingvu BDD:**
```go
func TestCalculatorAdditionGolingvu(t *testing.T) {
    impl := ITestImplementation{
        Suites: map[string]interface{}{"CalculatorSuite": "Calculator Tests"},
        Givens: map[string]interface{}{
            "emptyCalculator": func() interface{} { return NewCalculator() },
        },
        Whens: map[string]interface{}{
            "add": func(x int) interface{} {
                return func(calc interface{}) interface{} {
                    calc.(*Calculator).Add(x)
                    return calc
                }
            },
        },
        Thens: map[string]interface{}{
            "result": func(expected int) interface{} {
                return func(calc interface{}) interface{} {
                    if calc.(*Calculator).Result() != expected {
                        return fmt.Errorf("expected %d, got %d", expected, calc.(*Calculator).Result())
                    }
                    return nil
                }
            },
        },
    }
    
    spec := func(suites, givens, whens, thens interface{}) interface{} {
        return []interface{}{
            map[string]interface{}{
                "key": "CalculatorSuite",
                "givens": map[string]interface{}{
                    "testAddition": map[string]interface{}{
                        "features": []string{"addition"},
                        "whens": []interface{}{"add:2", "add:3"},
                        "thens": []interface{}{"result:5"},
                    },
                },
            },
        }
    }
    
    gv := NewGolingvu(
        nil,
        spec,
        impl,
        DefaultTestResourceRequest,
        &SimpleTestAdapter{},
        nil,
    )
    
    gv.WithTestingT(t).RunAsGoTest()
}
```

### Benefits:
- Structured BDD/TDT patterns
- Automatic artifact generation
- Consistent test reporting
- Integration with Testeranto ecosystem

## 2. Running Golingvu Tests on Official Go Test Runner

Golingvu tests can be executed using standard `go test` commands, making them compatible with existing Go tooling.

### Method 1: Using `RunAsGoTest()`

```go
func TestCalculatorSuite(t *testing.T) {
    gv := NewGolingvu(
        nil,
        specificationFunc,
        implementation,
        DefaultTestResourceRequest,
        &SimpleTestAdapter{},
        nil,
    )
    
    gv.WithTestingT(t).RunAsGoTest()
}
```

Run with:
```bash
go test -v -run TestCalculatorSuite
```

### Method 2: Using `CreateGoTest()` Helper

```go
var gv *Golingvu

func init() {
    gv = NewGolingvu(
        nil,
        specificationFunc,
        implementation,
        DefaultTestResourceRequest,
        &SimpleTestAdapter{},
        nil,
    )
}

var TestAddition = gv.CreateGoTest("TestAddition")
var TestSubtraction = gv.CreateGoTest("TestSubtraction")
```

Run with:
```bash
go test -v -run "TestAddition|TestSubtraction"
```

### Method 3: Using `TestMainIntegration()` for Package-Level Setup

```go
func TestMain(m *testing.M) {
    gv := NewGolingvu(
        nil,
        specificationFunc,
        implementation,
        DefaultTestResourceRequest,
        &SimpleTestAdapter{},
        nil,
    )
    
    code := gv.TestMainIntegration(m)
    os.Exit(code)
}
```

### Method 4: Using `RunSimpleTest()` for Quick Integration

```go
func TestSimple(t *testing.T) {
    gv := NewGolingvu(
        nil,
        nil,
        ITestImplementation{},
        DefaultTestResourceRequest,
        &SimpleTestAdapter{},
        nil,
    )
    
    gv.RunSimpleTest(t, func() error {
        // Your test logic here
        return nil
    })
}
```

## 3. Running Golingvu Tests on Testeranto Test Runner

Golingvu integrates with the Testeranto test runner through the `ReceiveTestResourceConfig()` method.

### Configuration Format

Create a JSON configuration file:
```json
{
    "Name": "calculator-tests",
    "Fs": "./test-results",
    "BrowserWSEndpoint": "",
    "Timeout": 30,
    "Retries": 3,
    "Environment": {
        "TEST_ENV": "production"
    }
}
```

### Execution

```go
func main() {
    gv := NewGolingvu(
        nil,
        specificationFunc,
        implementation,
        DefaultTestResourceRequest,
        &SimpleTestAdapter{},
        nil,
    )
    
    config := `{
        "Name": "calculator-tests",
        "Fs": "./test-results",
        "Timeout": 30
    }`
    
    results, err := gv.ReceiveTestResourceConfig(config)
    if err != nil {
        fmt.Printf("Test execution failed: %v\n", err)
        os.Exit(1)
    }
    
    if results.Failed {
        fmt.Printf("Tests failed: %d out of %d\n", results.Fails, results.Tests)
        os.Exit(1)
    } else {
        fmt.Printf("All tests passed: %d tests executed\n", results.Tests)
        os.Exit(0)
    }
}
```

### Output Files

The test runner generates:
- `tests.json`: Complete test results in Testeranto format
- Artifacts in the specified `Fs` directory structure

## 4. Mixed Mode: Running Both Native and Golingvu Tests

You can mix both testing approaches in the same codebase:

```go
// Native Go test
func TestNativeAddition(t *testing.T) {
    calc := NewCalculator()
    calc.Add(2)
    calc.Add(3)
    if calc.Result() != 5 {
        t.Errorf("Expected 5, got %d", calc.Result())
    }
}

// Golingvu BDD test
func TestGolingvuAddition(t *testing.T) {
    gv := createCalculatorGolingvu()
    gv.WithTestingT(t).RunAsGoTest()
}

// Golingvu TDT test
func TestGolingvuTableDriven(t *testing.T) {
    gv := createTableDrivenGolingvu()
    gv.WithTestingT(t).RunAsGoTest()
}
```

Run all tests:
```bash
go test -v ./...
```

## 5. Best Practices for Interoperability

### File Organization
```
src/
├── calculator.go           # Implementation
├── calculator_test.go      # Native Go tests
├── calculator_bdd_test.go  # Golingvu BDD tests
├── calculator_tdt_test.go  # Golingvu TDT tests
└── test_resources/         # Test artifacts
```

### Naming Conventions
- Native tests: `TestFunctionName`
- Golingvu BDD tests: `TestFeatureGolingvu`
- Golingvu TDT tests: `TestFeatureTableDriven`

### CI/CD Integration

**GitHub Actions Example:**
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.22'
      - run: go test ./... -v -cover
```

**Artifact Collection:**
```yaml
      - name: Upload test artifacts
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            test-results/
            **/tests.json
```

## 6. Troubleshooting

### Common Issues

1. **Package conflicts**: Ensure all files in the same directory have the same package name
2. **Import paths**: Use full import paths for examples: `github.com/testeranto-dev/testeranto/src/lib/golingvu/examples/calculator`
3. **Test discovery**: Run `go test ./...` from the project root
4. **Artifact permissions**: Ensure write permissions for the `Fs` directory

### Debugging Tips

- Use `go test -v` for verbose output
- Check `tests.json` for detailed test results
- Verify artifact directory structure
- Use `-run` flag to run specific tests

## 7. Examples

Complete working examples are available in:
- `examples/calculator/native_test.go`: Native Go tests
- `examples/calculator/golingvu_test.go`: Golingvu BDD tests
- `examples/calculator/calculator.go`: Shared implementation

Run examples:
```bash
# Native tests
cd examples/calculator
go test -v -run "TestCalculator.*"

# Golingvu tests
go test -v -run "TestCalculatorWithGolingvu"

# All tests
go test -v
```

## Conclusion

Golingvu provides seamless interoperability between:
- Standard Go testing (`go test`)
- Testeranto test runner
- Multiple testing methodologies (BDD, TDT, Describe-It)

This allows teams to gradually adopt Golingvu's advanced features while maintaining compatibility with existing Go tooling and CI/CD pipelines.

