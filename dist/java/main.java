import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.FileTime;
import java.security.*;
import java.util.*;
import org.json.*;
import org.json.JSONException;

public class java_runtime {
    public static void main(String[] args) throws Exception {
        System.out.println("🚀 Java builder starting...");
        
        // Get arguments from command line
        if (args.length < 3) {
            System.err.println("❌ Usage: java java_runtime <projectConfigPath> <javaConfigPath> <testName>");
            System.exit(1);
        }
        
        String projectConfigPath = args[0];
        String javaConfigPath = args[1];
        String testName = args[2];
        
        System.out.println("projectConfigPath: " + projectConfigPath);
        System.out.println("javaConfigPath: " + javaConfigPath);
        System.out.println("testName: " + testName);
        
        // Load project configuration
        Path projectConfigFile = Paths.get(projectConfigPath);
        if (!Files.exists(projectConfigFile)) {
            System.err.println("❌ Project config file not found: " + projectConfigPath);
            System.exit(1);
        }
        
        String projectConfigContent = new String(Files.readAllBytes(projectConfigFile));
        JSONObject projectConfig;
        try {
            // Try to parse as JSON directly
            projectConfig = new JSONObject(projectConfigContent);
        } catch (JSONException e) {
            // If it's not valid JSON, it might be a TypeScript/JavaScript file
            // Try to extract JSON from the file
            System.out.println("⚠️  Project config is not pure JSON, trying to extract JSON from file...");
            String jsonStr = extractJsonFromFile(projectConfigContent, projectConfigPath);
            if (jsonStr == null) {
                System.err.println("❌ Failed to extract JSON from project config file: " + projectConfigPath);
                System.err.println("   File type: " + (projectConfigPath.endsWith(".ts") ? "TypeScript" : 
                                  projectConfigPath.endsWith(".js") ? "JavaScript" : "Unknown"));
                System.err.println("   First 100 chars: " + projectConfigContent.substring(0, Math.min(100, projectConfigContent.length())));
                System.exit(1);
                return;
            }
            try {
                projectConfig = new JSONObject(jsonStr);
                System.out.println("✅ Successfully extracted JSON from config file");
            } catch (JSONException e2) {
                System.err.println("❌ Failed to parse extracted JSON from project config: " + e2.getMessage());
                System.err.println("   Extracted content: " + jsonStr);
                System.exit(1);
                return;
            }
        }
        
        // Load Java configuration - this might not be needed, but we'll try to parse it
        Path javaConfigFile = Paths.get(javaConfigPath);
        if (!Files.exists(javaConfigFile)) {
            System.err.println("❌ Java config file not found: " + javaConfigPath);
            System.exit(1);
        }
        
        String javaConfigContent = new String(Files.readAllBytes(javaConfigFile));
        JSONObject javaConfig;
        try {
            javaConfig = new JSONObject(javaConfigContent);
        } catch (JSONException e) {
            // Java config might not be JSON either
            // Try to extract JSON
            System.out.println("⚠️  Java config is not pure JSON, trying to extract...");
            String jsonStr = extractJsonFromFile(javaConfigContent, javaConfigPath);
            if (jsonStr != null) {
                try {
                    javaConfig = new JSONObject(jsonStr);
                    System.out.println("✅ Successfully extracted JSON from Java config");
                } catch (JSONException e2) {
                    System.out.println("⚠️  Failed to parse extracted JSON, using empty config");
                    javaConfig = new JSONObject();
                }
            } else {
                System.out.println("⚠️  Could not extract JSON from Java config, using empty config");
                javaConfig = new JSONObject();
            }
        }
        
        // Get Java tests from project config
        JSONObject runtimes = projectConfig.optJSONObject("runtimes");
        if (runtimes == null) {
            System.out.println("No runtimes found in project config");
            return;
        }
        
        JSONObject testRuntime = runtimes.optJSONObject(testName);
        if (testRuntime == null) {
            System.err.println("❌ Test runtime not found: " + testName);
            System.exit(1);
        }
        
        JSONArray tests = testRuntime.optJSONArray("tests");
        if (tests == null || tests.length() == 0) {
            System.out.println("No tests in Java config for " + testName);
            return;
        }
        
        System.out.println("✅ Loaded config with " + tests.length() + " Java test(s)");
        
        // Create a JSON object to store all tests' information
        JSONObject allTestsInfo = new JSONObject();
        
        // Process each test
        for (int i = 0; i < tests.length(); i++) {
            String testPath = tests.getString(i);
            System.out.println("\n📦 Processing test: " + testPath);
            
            // Get test file name and base name
            Path testFilePath = Paths.get(testPath);
            String testFileName = testFilePath.getFileName().toString();
            String testBaseName = testFileName.replaceFirst("[.][^.]+$", "");
            
            // Collect input files
            List<String> inputFiles = collectInputFiles(testPath);
            
            // Compute hash
            String testHash = computeFilesHash(inputFiles);
            
            // Create artifacts directory
            Path artifactsDir = Paths.get("/workspace", "testeranto/bundles", testName, "java", "example");
            Files.createDirectories(artifactsDir);
            
            // Create test info JSON
            JSONObject testInfo = new JSONObject();
            testInfo.put("hash", testHash);
            JSONArray filesArray = new JSONArray();
            for (String file : inputFiles) {
                filesArray.put(file);
            }
            testInfo.put("files", filesArray);
            
            // Add to all tests info
            allTestsInfo.put(testPath, testInfo);
            
            // Compile the test
            Path outputJarPath = artifactsDir.resolve(testBaseName + ".jar");
            System.out.println("  🔨 Compiling test to " + outputJarPath + "...");
            
            // For now, just create a placeholder
            // In a real implementation, we would compile with javac and package with jar
            createPlaceholderJar(outputJarPath, testPath);
            
            System.out.println("  ✅ Successfully created placeholder JAR");
        }
        
        // Write single inputFiles.json for all tests
        Path inputFilesPath = Paths.get("/workspace", "testeranto/bundles", testName, "inputFiles.json");
        Files.createDirectories(inputFilesPath.getParent());
        Files.write(inputFilesPath, allTestsInfo.toString(2).getBytes());
        System.out.println("\n✅ Created inputFiles.json at " + inputFilesPath + " with " + allTestsInfo.length() + " tests");
        
        System.out.println("\n🎉 Java builder completed successfully");
    }
    
    private static String findConfig() {
        return "/workspace/testeranto/runtimes/java/java.json";
    }
    
    private static List<String> collectInputFiles(String testPath) {
        List<String> files = new ArrayList<>();
        
        // Add the test file itself
        files.add(testPath);
        
        // Look for Java files in the same directory
        Path testDir = Paths.get(testPath).getParent();
        if (testDir != null && Files.exists(testDir)) {
            try {
                Files.walk(testDir)
                    .filter(path -> path.toString().endsWith(".java"))
                    .forEach(path -> {
                        String relativePath = "/workspace".equals(path.toString().substring(0, Math.min(path.toString().length(), 9))) 
                            ? path.toString().substring(10) // Remove /workspace/
                            : path.toString();
                        if (!files.contains(relativePath)) {
                            files.add(relativePath);
                        }
                    });
            } catch (IOException e) {
                System.err.println("Warning: Could not walk directory: " + e.getMessage());
            }
        }
        
        // Add pom.xml or build.gradle if present
        Path workspace = Paths.get("/workspace");
        if (Files.exists(workspace.resolve("pom.xml"))) {
            files.add("pom.xml");
        }
        if (Files.exists(workspace.resolve("build.gradle"))) {
            files.add("build.gradle");
        }
        if (Files.exists(workspace.resolve("build.gradle.kts"))) {
            files.add("build.gradle.kts");
        }
        
        return files;
    }
    
    private static String computeFilesHash(List<String> files) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            for (String file : files) {
                Path filePath = Paths.get("/workspace", file);
                md.update(file.getBytes());
                if (Files.exists(filePath)) {
                    FileTime lastModified = Files.getLastModifiedTime(filePath);
                    long size = Files.size(filePath);
                    md.update(Long.toString(lastModified.toMillis()).getBytes());
                    md.update(Long.toString(size).getBytes());
                } else {
                    md.update("missing".getBytes());
                }
            }
            byte[] digest = md.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "error";
        }
    }
    
    private static String extractJsonFromFile(String content, String filePath) {
        // If the file is TypeScript/JavaScript, look for export default
        if (filePath.endsWith(".ts") || filePath.endsWith(".js")) {
            // Look for export default followed by an object
            int exportIndex = content.indexOf("export default");
            if (exportIndex != -1) {
                // Find the start of the object
                int start = content.indexOf("{", exportIndex);
                if (start != -1) {
                    // Find matching braces
                    int braceCount = 0;
                    int end = start;
                    for (int i = start; i < content.length(); i++) {
                        char c = content.charAt(i);
                        if (c == '{') {
                            braceCount++;
                        } else if (c == '}') {
                            braceCount--;
                            if (braceCount == 0) {
                                end = i + 1;
                                break;
                            }
                        }
                    }
                    if (end > start) {
                        return content.substring(start, end);
                    }
                }
            }
            // Also look for module.exports
            int moduleIndex = content.indexOf("module.exports");
            if (moduleIndex != -1) {
                int start = content.indexOf("{", moduleIndex);
                if (start != -1) {
                    int braceCount = 0;
                    int end = start;
                    for (int i = start; i < content.length(); i++) {
                        char c = content.charAt(i);
                        if (c == '{') {
                            braceCount++;
                        } else if (c == '}') {
                            braceCount--;
                            if (braceCount == 0) {
                                end = i + 1;
                                break;
                            }
                        }
                    }
                    if (end > start) {
                        return content.substring(start, end);
                    }
                }
            }
        }
        // If it's a Java file, it might not contain JSON at all
        // In that case, return null
        return null;
    }
    
    private static void createPlaceholderJar(Path jarPath, String testPath) throws IOException {
        // Create a simple manifest
        String manifest = "Manifest-Version: 1.0\nMain-Class: TestRunner\n";
        
        // Create a simple test runner
        String testRunner = 
            "public class TestRunner {\n" +
            "    public static void main(String[] args) {\n" +
            "        System.out.println(\"Java test runner for: " + testPath + "\");\n" +
            "        System.out.println(\"This is a placeholder implementation.\");\n" +
            "    }\n" +
            "}\n";
        
        // Create a temporary directory
        Path tempDir = Files.createTempDirectory("java-builder");
        try {
            // Write manifest
            Path metaInfDir = tempDir.resolve("META-INF");
            Files.createDirectories(metaInfDir);
            Files.write(metaInfDir.resolve("MANIFEST.MF"), manifest.getBytes());
            
            // Write test runner
            Files.write(tempDir.resolve("TestRunner.java"), testRunner.getBytes());
            
            // Create JAR file
            List<String> jarCommand = Arrays.asList(
                "jar", "cfm", jarPath.toString(),
                metaInfDir.resolve("MANIFEST.MF").toString(),
                "-C", tempDir.toString(), "."
            );
            
            ProcessBuilder pb = new ProcessBuilder(jarCommand);
            Process process = pb.start();
            int exitCode;
            try {
                exitCode = process.waitFor();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.err.println("Warning: JAR creation interrupted");
                exitCode = 1;
            }
            
            if (exitCode != 0) {
                System.err.println("Warning: jar command failed with exit code " + exitCode);
                // Create a minimal JAR anyway
                Files.write(jarPath, "Placeholder JAR".getBytes());
            }
        } finally {
            // Clean up
            Files.walk(tempDir)
                .sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
        }
    }
}
