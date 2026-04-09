import java.io.*;
import java.nio.file.*;
import java.util.*;
import org.json.*;

public class java_runtime {
    public static void main(String[] args) throws Exception {
        System.out.println("🚀 Java builder starting...");
        
        if (args.length < 2) {
            System.err.println("❌ Usage: java java_runtime <projectConfigPath> <configJson>");
            System.err.println("   Note: projectConfigPath is kept for compatibility but may not be used");
            System.exit(1);
        }
    
        String projectConfigPath = args[0];
        String javaConfigPath = args.length > 1 ? args[1] : "";
    
        String[] entryPoints = new String[0];
        String[] outputs = new String[0];
        String testName = "";
    
        if (args.length > 1) {
            try {
                String configJson = args[1];
                JSONObject config = new JSONObject(configJson);
        
                if (config.has("tests")) {
                    JSONArray testsArray = config.getJSONArray("tests");
                    entryPoints = new String[testsArray.length()];
                    for (int i = 0; i < testsArray.length(); i++) {
                        entryPoints[i] = testsArray.getString(i);
                    }
                }
        
                if (config.has("outputs")) {
                    JSONArray outputsArray = config.getJSONArray("outputs");
                    outputs = new String[outputsArray.length()];
                    for (int i = 0; i < outputsArray.length(); i++) {
                        outputs[i] = outputsArray.getString(i);
                    }
                }
            
                if (config.has("name")) {
                    testName = config.getString("name");
                }
            } catch (Exception e) {
                System.err.println("[Java Builder] Failed to parse config JSON: " + e.getMessage());
                if (args.length > 3) {
                    entryPoints = Arrays.copyOfRange(args, 3, args.length);
                }
            }
        }
        
        String mode = System.getenv("MODE");
        boolean isDevMode = "dev".equals(mode);
        
        System.out.println("[Java Builder] Java config path: " + javaConfigPath);
        System.out.println("[Java Builder] Test name: " + testName);
        System.out.println("[Java Builder] Entry points: " + Arrays.toString(entryPoints));
        System.out.println("[Java Builder] Mode: " + (isDevMode ? "dev" : "once"));
        
        JSONObject javaConfig = ConfigLoader.loadJavaConfig(Paths.get(javaConfigPath));
        System.out.println("✅ Loaded Java config: " + javaConfig.toString(2));
        
        JSONObject allTestsInfo = new JSONObject();
        
        System.out.println("\n🔍 Debug: Listing /workspace directory:");
        try {
            Files.list(Paths.get("/workspace"))
                .forEach(path -> System.out.println("    " + path.getFileName()));
        } catch (IOException e) {
            System.err.println("  Could not list /workspace: " + e.getMessage());
        }
        
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
        
        for (String entryPoint : entryPoints) {
            System.out.println("\n📦 Processing entry point: " + entryPoint);
            
            Path testFilePath = TestFileFinder.findTestFile(entryPoint);
            
            String testFileName = testFilePath.getFileName().toString();
            String testBaseName = testFileName.substring(0, testFileName.lastIndexOf('.'));
            
            boolean isNativeTest = false;
            String frameworkType = null;
            try {
                Class<?> detectionClass = Class.forName("JavaNativeTestDetection");
                java.lang.reflect.Method translateMethod = detectionClass.getMethod("translateNativeTest", String.class);
                Object result = translateMethod.invoke(null, testFilePath.toString());
                
                if (result != null) {
                    Class<?> resultClass = result.getClass();
                    java.lang.reflect.Method isNativeMethod = resultClass.getMethod("isNativeTest");
                    java.lang.reflect.Method getFrameworkMethod = resultClass.getMethod("getFrameworkType");
                    
                    isNativeTest = (Boolean) isNativeMethod.invoke(result);
                    if (isNativeTest) {
                        frameworkType = (String) getFrameworkMethod.invoke(result);
                        System.out.println("  Detected native " + frameworkType + " test");
                    }
                }
            } catch (Exception e) {
                System.out.println("  Note: Native test detection not available: " + e.getMessage());
            }
            
            List<String> inputFiles = FileUtils.collectInputFiles(entryPoint);
            
            if (isNativeTest) {
                Path detectionClassPath = Paths.get("/workspace/testeranto/runtimes/java/native_detection.java");
                if (Files.exists(detectionClassPath)) {
                    String relativePath = "/workspace/testeranto/runtimes/java/native_detection.java";
                    if (!inputFiles.contains(relativePath)) {
                        inputFiles.add(relativePath);
                    }
                }
            }
            
            String testHash = FileUtils.computeFilesHash(inputFiles);
            
            Path artifactsDir = Paths.get("/workspace", "testeranto/bundles", testName);
            Files.createDirectories(artifactsDir);
            
            JSONObject testInfo = new JSONObject();
            testInfo.put("hash", testHash);
            JSONArray filesArray = new JSONArray();
            for (String file : inputFiles) {
                filesArray.put(file);
            }
            testInfo.put("files", filesArray);
            testInfo.put("isNativeTest", isNativeTest);
            if (isNativeTest) {
                testInfo.put("framework", frameworkType);
            }
            
            allTestsInfo.put(entryPoint, testInfo);
            
            Path outputJarPath = artifactsDir.resolve(testBaseName + ".jar");
            System.out.println("  🔨 Compiling test to " + outputJarPath + "...");
            
            try {
                JarCreator.createJarFile(entryPoint, outputJarPath, javaConfig, isNativeTest, frameworkType);
                System.out.println("  ✅ Successfully created JAR");
            } catch (Exception e) {
                System.err.println("  ❌ Failed to create JAR for " + entryPoint + ": " + e.getMessage());
                e.printStackTrace();
                continue;
            }
        }
        
        Path inputFilesPath = Paths.get("/workspace", "testeranto/bundles", testName, "inputFiles.json");
        Files.createDirectories(inputFilesPath.getParent());
        Files.write(inputFilesPath, allTestsInfo.toString(2).getBytes());
        System.out.println("\n✅ Created inputFiles.json at " + inputFilesPath + " with " + allTestsInfo.length() + " tests");
        
        System.out.println("\n🎉 Java builder completed successfully");
        
        final String finalProjectConfigPath = projectConfigPath;
        final String finalTestName = testName;
    
        Runtime.getRuntime().addShutdownHook(new Thread() {
            public void run() {
                System.out.println("[Java Builder] Received shutdown signal - producing output artifacts");
                OutputArtifactProducer.produceOutputArtifacts(finalProjectConfigPath, finalTestName);
            }
        });
        
        if (isDevMode) {
            System.out.println("[Java Builder] Dev mode active - process will stay running");
            
            while (true) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        } else {
            System.out.println("[Java Builder] Once mode completed");
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
