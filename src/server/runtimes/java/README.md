### Java Integration

**Detection Implementation:**

- Add annotation scanning to `java_runtime.java`
- Use reflection to detect `@Test`, `@Before`, `@After` annotations
- Check for JUnit 4 vs JUnit 5 imports

**Wrapper Generation:**

- Create wrapper that uses `JUnitCore` to run tests
- Implement `RunListener` to capture results
- Handle TestNG test execution if detected
# Java Runtime

Tests run via JVM with native test framework detection.

## Native Toolchain Integration

### Supported Frameworks
- **JUnit 4 & 5** (`.java` with `@Test` annotations)
- **TestNG** (`.java` with `@Test` annotations)
- **Spock** (`.groovy` with Specification style)

### Detection Approach
- Bytecode analysis via ASM or reflection
- Annotation scanning (`@Test`, `@org.junit.Test`)
- Class naming patterns (`*Test.java`, `*Spec.java`)

### Translation Strategy
- Generate wrapper classes that extend testeranto base
- Use JUnit's `TestRunner` API to execute tests
- Capture results via `RunListener`

### Implementation Details
- Uses Gradle for building Java projects
- Compiles test files into JARs with wrapper main classes
- Leverages JSON library for configuration parsing

### BuildKit Configuration
```typescript
useBuildKit: true,
buildKitOptions: {
  cacheMounts: ["/root/.m2", "/root/.gradle"],
  // Optional: target stage for multi-stage builds
  // targetStage: "runtime",
  buildArgs: {
    JAVA_VERSION: "17"
  }
}
```

### Dockerfile Requirements
- Must include JDK and Gradle
- Should include necessary dependencies for compilation
- Can be single-stage or multi-stage

### Entry Point Processing
1. Find test file in workspace
2. Extract package name and dependencies
3. Create wrapper class with main method
4. Build JAR file with Gradle
5. Compute hash of all input files
6. Write to `inputFiles.json`

### Native Test Detection and Translation

#### Detection Implementation
- **File patterns**: `*Test.java`, `*Spec.java`, `*IT.java`
- **AST analysis**: Look for `@Test`, `@Before`, `@After`, `@BeforeEach`, `@AfterEach` annotations
- **Import detection**: Check for `org.junit`, `org.testng`, `org.spockframework` imports
- **Configuration**: Check for `pom.xml` dependencies, `build.gradle` configurations

#### Framework Identification
- **JUnit 4**: `@Test` from `org.junit`
- **JUnit 5**: `@Test` from `org.junit.jupiter`
- **TestNG**: `@Test` from `org.testng`
- **Spock**: `Specification` base class, `given:`/`when:`/`then:` blocks

#### Three-Parameter Translation

**Specification Generation**:
- Test class → Suite
- `@Before`/`@BeforeEach` methods → Given
- `@Test` methods → When + Then
- Assert statements → Then assertions

**Implementation Generation**:
- Extract test methods and their annotations
- Map JUnit assertions to testeranto assertions
- Convert TestNG test methods with dependencies

**Adapter Generation**:
- JUnit: Use `JUnitCore` with `RunListener`
- TestNG: Use `TestNG` with `ITestListener`
- Spock: Use Spock runner with custom listener

#### Integration Example
```java
// Native JUnit test detection and translation
public class JavaNativeTestTranslator {
    public TranslationResult translateJUnitToTesteranto(File javaFile) {
        JavaTestDetector detector = new JavaTestDetector(javaFile);
        if (detector.isNativeTest() && detector.getFramework().equals("junit5")) {
            JUnitTranslator translator = new JUnitTranslator(javaFile);
            Specification spec = translator.generateSpecification();
            Implementation impl = translator.generateImplementation();
            Adapter adapter = translator.generateAdapter();
            return new TranslationResult(spec, impl, adapter);
        }
        return null;
    }
}

#### Native Detection Module
The Java runtime now includes `native_detection.java` which provides:
1. **Detection**: Identifies native test files and their frameworks
2. **Structure Extraction**: Parses test methods, setup/teardown methods
3. **Translation**: Generates three-parameter components for testeranto

#### Usage in Builder
When processing Java test files, the builder:
1. Uses `JavaNativeTestDetection.translateNativeTest()` to detect native tests
2. Marks tests as native in `inputFiles.json`
3. Generates appropriate wrapper classes for native vs testeranto tests
4. Includes framework-specific information in the build artifacts
