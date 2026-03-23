package kafe;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.*;
import java.util.function.Function;
import java.util.Arrays;
import java.util.Arrays;

public class Kafe<I, S, R, Sel> {
    public int totalTests = 0;
    public List<Object> artifacts = new ArrayList<>();
    public Function<Object, Boolean> assertThis = (t) -> true;
    public Map<String, Object> givenOverrides;
    public Object specs;
    public Map<String, Object> suitesOverrides;
    public List<ITestJob> testJobs = new ArrayList<>();
    public ITTestResourceRequest testResourceRequirement;
    public ITestSpecification testSpecification;
    public Map<String, Object> thenOverrides;
    public Map<String, Object> whenOverrides;
    // TDT pattern overrides
    public Map<String, Object> valuesOverrides;
    public Map<String, Object> shouldsOverrides;
    public Map<String, Object> expectedsOverrides;
    // Describe-It pattern overrides
    public Map<String, Object> describesOverrides;
    public Map<String, Object> itsOverrides;
    public ITTestResourceConfiguration testResourceConfiguration;
    
    // Abstract method to be implemented by concrete runtimes
    public void writeFileSync(String filename, String payload) {
        // Default implementation that writes to standard output
        System.out.println("[Kafe writeFileSync] " + filename + ": " + payload);
    }
    
    // Create an artifactory that tracks context - matches TypeScript implementation
    // Note: Java is a server-side language and CANNOT capture screenshots or screencasts
    // Only the Web runtime (browser environment) can do visual captures
    // This is a necessary difference between web and other runtimes
    public Object createArtifactory(Map<String, Object> context) {
        return new Object() {
            public void writeFileSync(String filename, String payload) {
                // Construct the path based on context
                StringBuilder path = new StringBuilder();
                
                // Start with the test resource configuration fs path
                String basePath = testResourceConfiguration != null ? testResourceConfiguration.fs : "testeranto";
                
                System.out.println("[Artifactory] Base path: " + basePath);
                System.out.println("[Artifactory] Context: " + context);
                
                // Add suite context if available
                if (context.containsKey("suiteIndex")) {
                    path.append("suite-").append(context.get("suiteIndex")).append("/");
                }
                
                // Add given context if available
                if (context.containsKey("givenKey")) {
                    path.append("given-").append(context.get("givenKey")).append("/");
                }
                
                // Add when or then context
                if (context.containsKey("whenIndex")) {
                    path.append("when-").append(context.get("whenIndex")).append(" ");
                } else if (context.containsKey("thenIndex")) {
                    path.append("then-").append(context.get("thenIndex")).append(" ");
                }
                
                // Add the filename
                path.append(filename);
                
                // Ensure it has a .txt extension if not present
                String pathStr = path.toString();
                if (!pathStr.matches(".*\\.[a-zA-Z0-9]+$")) {
                    pathStr += ".txt";
                }
                
                // Prepend the base path, avoiding double slashes
                String basePathClean = basePath.replaceAll("/$", "");
                String pathClean = pathStr.replaceAll("^/", "");
                String fullPath = basePathClean + "/" + pathClean;
                
                System.out.println("[Artifactory] Full path: " + fullPath);
                
                // Call the implementation
                Kafe.this.writeFileSync(fullPath, payload);
            }
            
            // Note: We do NOT include screenshot, openScreencast, or closeScreencast methods
            // because Java is a server-side language and cannot capture visual content
            // This is a necessary difference between web and other runtimes
            
        };
    }
    
    public Kafe(
        String webOrNode,
        I input,
        ITestSpecification testSpecification,
        ITestImplementation testImplementation,
        ITTestResourceRequest testResourceRequirement,
        ITestAdapter<I, S, R> testAdapter,
        ITTestResourceConfiguration testResourceConfiguration,
        String wsPort,
        String wsHost
    ) {
        this.testResourceConfiguration = testResourceConfiguration;
        this.testResourceRequirement = testResourceRequirement;
        this.testSpecification = testSpecification;
        
        // Initialize overrides
        this.suitesOverrides = new HashMap<>();
        this.givenOverrides = new HashMap<>();
        this.whenOverrides = new HashMap<>();
        this.thenOverrides = new HashMap<>();
        this.valuesOverrides = new HashMap<>();
        this.shouldsOverrides = new HashMap<>();
        this.expectedsOverrides = new HashMap<>();
        this.describesOverrides = new HashMap<>();
        this.itsOverrides = new HashMap<>();
        
        // Create pattern overrides using factory
        PatternOverrideFactory<I, S, R, Sel> factory = new PatternOverrideFactory<>(this, testAdapter, testImplementation);
        this.suitesOverrides = factory.createSuiteOverrides();
        this.givenOverrides = factory.createGivenOverrides();
        this.whenOverrides = factory.createWhenOverrides();
        this.thenOverrides = factory.createThenOverrides();
        
        // Note: For brevity, TDT and Describe-It patterns are not fully implemented here
        // but the structure is in place
        
        // Generate specs
        if (testSpecification != null) {
            this.specs = testSpecification.apply(
                this.Suites(),
                this.Given(),
                this.When(),
                this.Then()
            );
        }
        
        // Calculate total tests and create test jobs
        TestJobManager<I, S, R, Sel> jobManager = new TestJobManager<>(this);
        this.totalTests = jobManager.calculateTotalTests();
        this.testJobs = jobManager.initializeTestJobs();
        
        // Run tests if we have test jobs
        if (!this.testJobs.isEmpty() && testResourceConfiguration != null) {
            this.testJobs.get(0).receiveTestResourceConfig(testResourceConfiguration);
        }
    }
    
    private int calculateTotalTests() {
        int total = 0;
        if (this.specs instanceof List) {
            List<?> specsList = (List<?>) this.specs;
            for (Object suite : specsList) {
                if (suite instanceof BaseSuite) {
                    BaseSuite baseSuite = (BaseSuite) suite;
                    total += baseSuite.givens.size();
                }
            }
        }
        return total;
    }
    
    private void initializeTestJobs() {
        if (this.specs instanceof List) {
            List<?> specsList = (List<?>) this.specs;
            for (Object suiteObj : specsList) {
                if (suiteObj instanceof BaseSuite) {
                    BaseSuite suite = (BaseSuite) suiteObj;
                    // Set parent reference for artifactory creation
                    suite.setParent(this);
                    
                    // Create runner function similar to TypeScript
                    Function<ITTestResourceConfiguration, Object> runner = (testResourceConfig) -> {
                        try {
                            return suite.run(null, testResourceConfig);
                        } catch (Exception e) {
                            System.err.println(e.getMessage());
                            e.printStackTrace();
                            throw e;
                        }
                    };
                    
                    ITestJob testJob = new ITestJob() {
                        @Override
                        public Object toObj() {
                            return suite.toObj();
                        }
                        
                        @Override
                        public Object getTest() {
                            return suite;
                        }
                        
                        @Override
                        public Function<ITTestResourceConfiguration, Object> getRunner() {
                            return runner;
                        }
                        
                        @Override
                        public IFinalResults receiveTestResourceConfig(ITTestResourceConfiguration testResourceConfig) {
                            try {
                                BaseSuite suiteDone = (BaseSuite) runner.apply(testResourceConfig);
                                int fails = suiteDone.fails;
                                // Write results to tests.json similar to TypeScript
                                String reportJson = testResourceConfig.fs + "/tests.json";
                                IFinalResults results = new IFinalResults(
                                    fails > 0,
                                    fails,
                                    new ArrayList<>(),
                                    suiteDone.features(),
                                    0,
                                    totalTests,
                                    toObj()
                                );
                                // Write results to file
                                writeFileSync(reportJson, results.toString());
                                return results;
                            } catch (Exception e) {
                                System.err.println(e.getMessage());
                                e.printStackTrace();
                                return new IFinalResults(
                                    true,
                                    -1,
                                    new ArrayList<>(),
                                    new ArrayList<>(),
                                    0,
                                    -1,
                                    toObj()
                                );
                            }
                        }
                    };
                    this.testJobs.add(testJob);
                }
            }
        }
    }
    
    public Object Suites() {
        return this.suitesOverrides;
    }
    
    public Object Given() {
        return this.givenOverrides;
    }
    
    public Object When() {
        return this.whenOverrides;
    }
    
    public Object Then() {
        return this.thenOverrides;
    }
    
    // TDT pattern accessors
    public Object Values() {
        return this.valuesOverrides;
    }
    
    public Object Shoulds() {
        return this.shouldsOverrides;
    }
    
    public Object Expecteds() {
        return this.expectedsOverrides;
    }
    
    // Describe-It pattern accessors
    public Object Describes() {
        return this.describesOverrides;
    }
    
    public Object Its() {
        return this.itsOverrides;
    }
    
    public Object Specs() {
        return this.specs;
    }
    
    public List<ITestJob> getTestJobs() {
        return this.testJobs;
    }
    
    public IFinalResults receiveTestResourceConfig(ITTestResourceConfiguration testResourceConfig) {
        if (this.testJobs != null && !this.testJobs.isEmpty()) {
            return this.testJobs.get(0).receiveTestResourceConfig(testResourceConfig);
        } else {
            throw new RuntimeException("No test jobs available");
        }
    }
    
    // Interface for BiFunction since we need it
    interface BiFunction<A, B, C> {
        C apply(A a, B b);
    }
    
    // Main method for running from command line
    public static void main(String[] args) {
        System.out.println("Kafe Java Implementation");
        
        if (args.length < 1) {
            System.out.println("Usage: Kafe <testResourceConfig>");
            System.exit(0);
        }
        
        String testResourceConfigJson = args[0];
        
        try {
            // Parse configuration
            ITTestResourceConfiguration config = parseTestResourceConfig(testResourceConfigJson);
            
            // Create a simple Kafe instance
            Kafe<Object, Object, Object, Object> kafe = new Kafe<>(
                "node",
                null,
                null,
                new ITestImplementation(
                    new HashMap<>(),
                    new HashMap<>(),
                    new HashMap<>(),
                    new HashMap<>()
                ),
                new ITTestResourceRequest(0),
                new SimpleTestAdapter<>(),
                config,
                "3456",
                "localhost"
            );
            
            IFinalResults results = kafe.receiveTestResourceConfig(config);
            
            // Write results
            writeTestsJson(config, results.fails, results.features, results.artifacts);
            
            System.exit(results.fails > 0 ? 1 : 0);
        } catch (Exception e) {
            System.err.println("Error running tests: " + e.getMessage());
            e.printStackTrace();
            System.exit(-1);
        }
    }
    
    private static ITTestResourceConfiguration parseTestResourceConfig(String json) {
        // Simple parsing - in reality would use a JSON library
        String fs = ".";
        if (json.contains("\"fs\":")) {
            int start = json.indexOf("\"fs\":\"") + 6;
            int end = json.indexOf("\"", start);
            if (start >= 6 && end > start) {
                fs = json.substring(start, end);
            }
        }
        return new ITTestResourceConfiguration(
            "default",
            fs,
            new ArrayList<>(),
            null,
            30000,
            0,
            new HashMap<>()
        );
    }
    
    private static void writeTestsJson(ITTestResourceConfiguration config, int fails, List<String> features, List<Object> artifacts) {
        String fsPath = config.fs != null ? config.fs : ".";
        if (!fsPath.endsWith("/")) {
            fsPath = fsPath + "/";
        }
        String filePath = fsPath + "tests.json";
        
        File dir = new File(fsPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        
        try (FileWriter writer = new FileWriter(filePath)) {
            writer.write("{\n");
            writer.write("  \"name\": \"Java Test\",\n");
            writer.write("  \"givens\": [],\n");
            writer.write("  \"fails\": " + fails + ",\n");
            writer.write("  \"failed\": " + (fails > 0) + ",\n");
            writer.write("  \"features\": [],\n");
            writer.write("  \"artifacts\": []\n");
            writer.write("}\n");
            System.out.println("tests.json written to: " + filePath);
        } catch (IOException e) {
            System.err.println("Error writing tests.json: " + e.getMessage());
        }
    }
}
