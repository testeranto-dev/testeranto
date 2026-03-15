import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.FileTime;
import java.security.*;
import java.util.*;
import javax.tools.*;
import java.net.*;
import org.json.*;

public class java_runtime {
    public static void main(String[] args) throws Exception {
        System.out.println("🚀 Java builder starting...");
        
        // Get arguments from command line - match Python pattern
        // Expected: java java_runtime <projectConfigPath> <javaConfigPath> <testName> <entryPoints...>
        if (args.length < 4) {
            System.err.println("❌ Usage: java java_runtime <projectConfigPath> <javaConfigPath> <testName> <entryPoints...>");
            System.err.println("   Note: projectConfigPath is kept for compatibility but may not be used");
            System.exit(1);
        }
        
        String projectConfigPath = args[0];
        String javaConfigPath = args[1];
        String testName = args[2];
        String[] entryPoints = Arrays.copyOfRange(args, 3, args.length);
        
        System.out.println("Java config path: " + javaConfigPath);
        System.out.println("Test name: " + testName);
        System.out.println("Entry points: " + Arrays.toString(entryPoints));
        
        // Load Java config file
        JSONObject javaConfig = loadJavaConfig(Paths.get(javaConfigPath));
        System.out.println("✅ Loaded Java config: " + javaConfig.toString(2));
        
        // Create a JSON object to store all tests' information
        JSONObject allTestsInfo = new JSONObject();
        
        // Debug: list files in /workspace
        System.out.println("\n🔍 Debug: Listing /workspace directory:");
        try {
            Files.list(Paths.get("/workspace"))
                .forEach(path -> System.out.println("    " + path.getFileName()));
        } catch (IOException e) {
            System.err.println("  Could not list /workspace: " + e.getMessage());
        }
        
        // Debug: list files in /workspace/src if it exists
        Path srcPath = Paths.get("/workspace/src");
        if (Files.exists(srcPath)) {
            System.out.println("\n🔍 Debug: Listing /workspace/src directory:");
            try {
                Files.list(srcPath)
                    .forEach(path -> System.out.println("    " + path.getFileName()));
            } catch (IOException e) {
                System.err.println("  Could not list /workspace/src: " + e.getMessage());
            }
        }
        
        // Process each entry point
        for (String entryPoint : entryPoints) {
            System.out.println("\n📦 Processing entry point: " + entryPoint);
            
            // Find the actual test file
            Path testFilePath = findTestFile(entryPoint);
            if (testFilePath == null) {
                System.err.println("❌ Test file not found: " + entryPoint);
                continue;
            }
            
            String testFileName = testFilePath.getFileName().toString();
            String testBaseName = testFileName.substring(0, testFileName.lastIndexOf('.'));
            
            // Collect input files using the found path
            List<String> inputFiles = collectInputFiles(entryPoint);
            
            // Compute hash
            String testHash = computeFilesHash(inputFiles);
            
            // Create artifacts directory
            Path artifactsDir = Paths.get("/workspace", "testeranto/bundles", testName);
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
            allTestsInfo.put(entryPoint, testInfo);
            
            // Compile the test
            Path outputJarPath = artifactsDir.resolve(testBaseName + ".jar");
            System.out.println("  🔨 Compiling test to " + outputJarPath + "...");
            
            // Create JAR file using the found path
            createJarFile(entryPoint, outputJarPath, javaConfig);
            
            System.out.println("  ✅ Successfully created JAR");
        }
        
        // Write single inputFiles.json for all tests
        Path inputFilesPath = Paths.get("/workspace", "testeranto/bundles", testName, "inputFiles.json");
        Files.createDirectories(inputFilesPath.getParent());
        Files.write(inputFilesPath, allTestsInfo.toString(2).getBytes());
        System.out.println("\n✅ Created inputFiles.json at " + inputFilesPath + " with " + allTestsInfo.length() + " tests");
        
        System.out.println("\n🎉 Java builder completed successfully");
    }
    
    private static JSONObject loadJavaConfig(Path javaConfigFile) throws Exception {
        // Read the Java source file
        String source = new String(Files.readAllBytes(javaConfigFile));

        // Extract the class name from the file name
        String fileName = javaConfigFile.getFileName().toString();
        String className = fileName.substring(0, fileName.lastIndexOf('.'));

        // Compile the Java source
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            throw new RuntimeException("No Java compiler available. Make sure you're running with JDK, not JRE.");
        }

        // Create a temporary directory for compilation
        Path tempDir = Files.createTempDirectory("java_config");
        try {
            // Write the source file
            Path sourceFile = tempDir.resolve(fileName);
            Files.write(sourceFile, source.getBytes());

            // Compile with the same classpath used for the runtime
            StandardJavaFileManager fileManager = compiler.getStandardFileManager(null, null, null);
            Iterable<? extends JavaFileObject> compilationUnits =
                fileManager.getJavaFileObjectsFromFiles(Arrays.asList(sourceFile.toFile()));

            // Use current classpath
            String classpath = System.getProperty("java.class.path");
            List<String> options = Arrays.asList(
                "-d", tempDir.toString(),
                "-cp", classpath
            );

            JavaCompiler.CompilationTask task = compiler.getTask(
                null, fileManager, null, options, null, compilationUnits);
            boolean success = task.call();
            fileManager.close();

            if (!success) {
                throw new RuntimeException("Failed to compile Java config file: " + javaConfigFile);
            }

            // Load the compiled class
            URLClassLoader classLoader = new URLClassLoader(
                new URL[]{tempDir.toUri().toURL()},
                Thread.currentThread().getContextClassLoader()
            );
            Class<?> configClass = classLoader.loadClass(className);

            // Look for a getConfig() method that returns JSONObject
            java.lang.reflect.Method getConfigMethod = configClass.getMethod("getConfig");
            Object result = getConfigMethod.invoke(null);
            if (result instanceof JSONObject) {
                return (JSONObject) result;
            } else {
                throw new RuntimeException("getConfig() method must return JSONObject");
            }
        } finally {
            // Clean up
            Files.walk(tempDir)
                .sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
        }
    }
    
    private static String findConfig() {
        return "/workspace/testeranto/runtimes/java/java.json";
    }
    
    private static List<String> collectInputFiles(String testPath) {
        List<String> files = new ArrayList<>();
        
        // Find the actual test file location
        Path testFilePath = findTestFile(testPath);
        if (testFilePath == null) {
            // If not found, just add the original path
            files.add(testPath);
            return files;
        }
        
        // Add the test file itself (relative path)
        // Convert to workspace-relative path if possible
        String workspacePath = testFilePath.toString();
        if (workspacePath.startsWith("/workspace/")) {
            workspacePath = workspacePath.substring(10); // Remove "/workspace/"
        }
        files.add(workspacePath);
        
        // Look for Java files in the same directory
        Path testDir = testFilePath.getParent();
        if (testDir != null && Files.exists(testDir)) {
            try {
                Files.walk(testDir)
                    .filter(path -> path.toString().endsWith(".java"))
                    .forEach(path -> {
                        // Convert to workspace-relative path
                        String relativePath = path.toString();
                        if (relativePath.startsWith("/workspace/")) {
                            relativePath = relativePath.substring(10); // Remove "/workspace/"
                        }
                        if (!files.contains(relativePath)) {
                            files.add(relativePath);
                        }
                    });
            } catch (IOException e) {
                System.err.println("Warning: Could not walk directory: " + e.getMessage());
            }
        }
        
        // Add pom.xml or build.gradle if present (as relative paths)
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
                // Convert to absolute path
                Path filePath;
                if (file.startsWith("/")) {
                    filePath = Paths.get(file);
                } else {
                    filePath = Paths.get("/workspace", file);
                }
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
    
    private static void createJarFile(String testPath, Path jarPath, JSONObject javaConfig) throws IOException {
        // Try to find the test file
        Path testFilePath = findTestFile(testPath);
        if (testFilePath == null) {
            throw new IOException("Test file not found: " + testPath + 
                " (searched in current directory and /workspace)");
        }
        
        String testFileName = testFilePath.getFileName().toString();
        String testBaseName = testFileName.substring(0, testFileName.lastIndexOf('.'));
        
        // Read the test file to extract package name
        String packageName = extractPackageName(testFilePath);
        String fullyQualifiedClassName = packageName.isEmpty() ? testBaseName : packageName + "." + testBaseName;
        
        // Create a wrapper class that serves as the main entry point
        String wrapperClassName = testBaseName + "Wrapper";
        String wrapperContent = 
            "public class " + wrapperClassName + " {\n" +
            "    public static void main(String[] args) throws Exception {\n" +
            "        // Dynamically load and run the test class\n" +
            "        Class<?> testClass = Class.forName(\"" + fullyQualifiedClassName + "\");\n" +
            "        // Look for a main method\n" +
            "        try {\n" +
            "            java.lang.reflect.Method mainMethod = testClass.getMethod(\"main\", String[].class);\n" +
            "            mainMethod.invoke(null, (Object) args);\n" +
            "        } catch (NoSuchMethodException e) {\n" +
            "            // If no main method, try to instantiate and run test methods\n" +
            "            Object instance = testClass.getDeclaredConstructor().newInstance();\n" +
            "            // Look for methods annotated with @Test or similar\n" +
            "            // For now, just print a message\n" +
            "            System.out.println(\"Test class loaded: \" + testClass.getName());\n" +
            "            System.out.println(\"No main method found. You may need to implement a test runner.\");\n" +
            "        }\n" +
            "    }\n" +
            "}\n";
        
        // Create a manifest with the wrapper as main class
        String manifest = "Manifest-Version: 1.0\n";
        manifest += "Main-Class: " + wrapperClassName + "\n";
        
        // Add classpath if specified in config
        if (javaConfig.has("classpath")) {
            JSONArray classpathArray = javaConfig.getJSONArray("classpath");
            StringBuilder classpathBuilder = new StringBuilder();
            for (int i = 0; i < classpathArray.length(); i++) {
                if (i > 0) classpathBuilder.append(" ");
                classpathBuilder.append(classpathArray.getString(i));
            }
            manifest += "Class-Path: " + classpathBuilder.toString() + "\n";
        }
        
        // Create a temporary directory
        Path tempDir = Files.createTempDirectory("java-builder");
        try {
            // Write manifest
            Path metaInfDir = tempDir.resolve("META-INF");
            Files.createDirectories(metaInfDir);
            Files.write(metaInfDir.resolve("MANIFEST.MF"), manifest.getBytes());
            
            // Copy test file
            Path testFileInJar = tempDir.resolve(testFileName);
            Files.copy(testFilePath, testFileInJar);
            
            // Write wrapper class
            Path wrapperFileInJar = tempDir.resolve(wrapperClassName + ".java");
            Files.write(wrapperFileInJar, wrapperContent.getBytes());
            
            // Compile if specified in config (default to true)
            boolean shouldCompile = !javaConfig.has("compile") || javaConfig.getBoolean("compile");
            if (shouldCompile) {
                // Compile Java files
                List<String> compileCommand = new ArrayList<>();
                compileCommand.add("javac");
                compileCommand.add("-cp");
                
                // Build classpath using wildcard for JARs
                StringBuilder classpath = new StringBuilder();
                classpath.append(".");
                classpath.append(":/workspace/lib/*");
                classpath.append(":/workspace/src/java/main/java");
                classpath.append(":/workspace/src/java/test/java");
                classpath.append(":").append(tempDir.toString());
                
                // Add specific entries from config that aren't wildcards
                if (javaConfig.has("classpath")) {
                    JSONArray cpArray = javaConfig.getJSONArray("classpath");
                    for (int i = 0; i < cpArray.length(); i++) {
                        String entry = cpArray.getString(i);
                        // Skip entries that are already covered by wildcard
                        if (entry.equals("lib/*") || entry.endsWith("/*")) {
                            continue;
                        }
                        // Resolve relative paths
                        if (!entry.startsWith("/")) {
                            entry = "/workspace/" + entry;
                        }
                        // Check if not already in classpath
                        if (!classpath.toString().contains(entry)) {
                            classpath.append(":").append(entry);
                        }
                    }
                }
                
                String cp = classpath.toString();
                compileCommand.add(cp);
                System.out.println("  Compilation classpath: " + cp);
                
                // Debug: list JARs in /workspace/lib
                Path libDir = Paths.get("/workspace/lib");
                if (Files.exists(libDir)) {
                    System.out.println("  Debug: Listing JARs in " + libDir.toAbsolutePath());
                    try (DirectoryStream<Path> stream = Files.newDirectoryStream(libDir, "*.jar")) {
                        List<Path> jars = new ArrayList<>();
                        for (Path jar : stream) {
                            jars.add(jar);
                        }
                        jars.sort(Comparator.naturalOrder());
                        for (Path jar : jars) {
                            System.out.println("    JAR: " + jar.getFileName());
                        }
                        if (jars.isEmpty()) {
                            System.err.println("    No JARs found!");
                        }
                    } catch (IOException e) {
                        System.err.println("  Error listing JARs: " + e.getMessage());
                    }
                } else {
                    System.err.println("  Lib directory does not exist!");
                }
                
                // Find all Java files that need to be compiled
                List<String> javaFilesToCompile = new ArrayList<>();
                
                // Add the test file
                javaFilesToCompile.add(testFileInJar.toString());
                
                // Add the wrapper file
                javaFilesToCompile.add(wrapperFileInJar.toString());
                
                // Add Calculator.java if it exists
                Path calculatorSource = Paths.get("/workspace/src/java/main/java/com/example/calculator/Calculator.java");
                if (Files.exists(calculatorSource)) {
                    javaFilesToCompile.add(calculatorSource.toString());
                }
                
                // Don't add other Java files from the original directory to avoid duplicate classes
                // The temp directory already has the necessary files
                
                // Add all Java files to compile command
                compileCommand.addAll(javaFilesToCompile);
                
                System.out.println("  Compilation classpath: " + cp);
                
                System.out.println("  Compiling " + javaFilesToCompile.size() + " Java files");
                
                ProcessBuilder pb = new ProcessBuilder(compileCommand);
                Process process = pb.start();
                int exitCode = process.waitFor();
                if (exitCode != 0) {
                    // Capture error output
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            System.err.println("javac error: " + line);
                        }
                    }
                    throw new IOException("javac failed with exit code " + exitCode);
                }
            }
            
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
                throw new IOException("JAR creation interrupted", e);
            }
            
            if (exitCode != 0) {
                throw new IOException("jar command failed with exit code " + exitCode);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Interrupted during JAR creation", e);
        } finally {
            // Clean up
            Files.walk(tempDir)
                .sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
        }
    }
    
    private static String extractPackageName(Path javaFile) {
        try {
            String content = new String(Files.readAllBytes(javaFile));
            // Simple regex to find package declaration
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^\\s*package\\s+([^;]+);", java.util.regex.Pattern.MULTILINE);
            java.util.regex.Matcher matcher = pattern.matcher(content);
            if (matcher.find()) {
                return matcher.group(1).trim();
            }
        } catch (IOException e) {
            // Ignore
        }
        return "";
    }
    
    private static Path findTestFile(String testPath) {
        // Try the path as given (relative to current directory)
        Path candidate = Paths.get(testPath);
        if (Files.exists(candidate)) {
            System.out.println("  Found test file at: " + candidate.toAbsolutePath());
            return candidate;
        }
        
        // Try relative to /workspace
        candidate = Paths.get("/workspace", testPath);
        if (Files.exists(candidate)) {
            System.out.println("  Found test file at: " + candidate.toAbsolutePath());
            return candidate;
        }
        
        // Not found
        System.err.println("  Could not find test file: " + testPath);
        return null;
    }
}
