import java.io.*;
import java.nio.file.*;
import java.util.*;
import org.json.*;

public class JarCreator {
    public static void createJarFile(String testPath, Path jarPath, JSONObject javaConfig, 
                                      boolean isNativeTest, String frameworkType) throws IOException {
        Path testFilePath = TestFileFinder.findTestFile(testPath);
        if (testFilePath == null) {
            throw new IOException("Test file not found: " + testPath);
        }
        
        String testFileName = testFilePath.getFileName().toString();
        String testBaseName = testFileName.substring(0, testFileName.lastIndexOf('.'));
        
        String packageName = FileUtils.extractPackageName(testFilePath);
        String fullyQualifiedClassName = packageName.isEmpty() ? testBaseName : packageName + "." + testBaseName;
        
        String wrapperClassName = testBaseName + "Wrapper";
        String wrapperContent;
        
        if (isNativeTest) {
            wrapperContent = WrapperGenerator.generateNativeTestWrapper(wrapperClassName, fullyQualifiedClassName, frameworkType);
        } else {
            wrapperContent = WrapperGenerator.generateTesterantoWrapper(wrapperClassName, fullyQualifiedClassName);
        }
        
        String manifest = "Manifest-Version: 1.0\n";
        manifest += "Main-Class: " + wrapperClassName + "\n";
        
        if (javaConfig.has("classpath")) {
            JSONArray classpathArray = javaConfig.getJSONArray("classpath");
            StringBuilder classpathBuilder = new StringBuilder();
            for (int i = 0; i < classpathArray.length(); i++) {
                if (i > 0) classpathBuilder.append(" ");
                classpathBuilder.append(classpathArray.getString(i));
            }
            manifest += "Class-Path: " + classpathBuilder.toString() + "\n";
        }
        
        Path tempDir = Files.createTempDirectory("java-builder");
        try {
            Path metaInfDir = tempDir.resolve("META-INF");
            Files.createDirectories(metaInfDir);
            Files.write(metaInfDir.resolve("MANIFEST.MF"), manifest.getBytes());
            
            Path testFileInJar;
            if (!packageName.isEmpty()) {
                String packagePath = packageName.replace('.', '/');
                Path packageDir = tempDir.resolve(packagePath);
                Files.createDirectories(packageDir);
                testFileInJar = packageDir.resolve(testFileName);
            } else {
                testFileInJar = tempDir.resolve(testFileName);
            }
            Files.copy(testFilePath, testFileInJar);
            
            Path wrapperFileInJar = tempDir.resolve(wrapperClassName + ".java");
            Files.write(wrapperFileInJar, wrapperContent.getBytes());
            
            Path workspace = Paths.get("/workspace");
            Path buildDir = workspace.resolve("build");
            Path classesDir = buildDir.resolve("classes/java/main");
            Path testClassesDir = buildDir.resolve("classes/java/test");
            
            if (Files.exists(classesDir)) {
                System.out.println("  Found compiled classes from Gradle build");
                
                Path tempClassesDir = tempDir.resolve("classes");
                Files.createDirectories(tempClassesDir);
                
                FileUtils.copyDirectory(classesDir, tempClassesDir);
                
                if (Files.exists(testClassesDir)) {
                    FileUtils.copyDirectory(testClassesDir, tempClassesDir);
                }
                
                System.out.println("  Cleaning temp directory, keeping wrapper file: " + wrapperFileInJar);
                Files.walk(tempDir)
                    .filter(path -> {
                        if (path.equals(tempDir)) {
                            return false;
                        }
                        if (path.startsWith(tempClassesDir)) {
                            return false;
                        }
                        if (path.equals(wrapperFileInJar)) {
                            System.out.println("    Keeping: " + path);
                            return false;
                        }
                        System.out.println("    Deleting: " + path);
                        return true;
                    })
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
                
                Files.walk(tempClassesDir)
                    .forEach(source -> {
                        try {
                            Path relative = tempClassesDir.relativize(source);
                            Path dest = tempDir.resolve(relative);
                            if (Files.isDirectory(source)) {
                                Files.createDirectories(dest);
                            } else {
                                Files.createDirectories(dest.getParent());
                                Files.copy(source, dest, StandardCopyOption.REPLACE_EXISTING);
                            }
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    });
                
                Files.walk(tempClassesDir)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
            } else {
                throw new IOException("Compiled classes not found. Gradle build must succeed before creating JAR.");
            }
            
            if (Files.exists(classesDir)) {
                StringBuilder classpath = new StringBuilder();
                classpath.append(classesDir.toString());
                
                if (Files.exists(testClassesDir)) {
                    classpath.append(":");
                    classpath.append(testClassesDir.toString());
                }
                
                if (javaConfig.has("classpath")) {
                    JSONArray classpathArray = javaConfig.getJSONArray("classpath");
                    for (int i = 0; i < classpathArray.length(); i++) {
                        String entry = classpathArray.getString(i);
                        if (entry == null || entry.trim().isEmpty()) {
                            continue;
                        }
                        entry = entry.trim();
                        
                        if (entry.equals("src/java/main/java") || 
                            entry.equals("src/java/test/java") ||
                            entry.equals(".")) {
                            System.out.println("  Skipping source directory from classpath: " + entry);
                            continue;
                        }
                        
                        if (entry.endsWith("/*")) {
                            Path dirPath = Paths.get("/workspace", entry.substring(0, entry.length() - 2));
                            if (Files.exists(dirPath) && Files.isDirectory(dirPath)) {
                                try (DirectoryStream<Path> jarStream = Files.newDirectoryStream(dirPath, "*.jar")) {
                                    for (Path jarFile : jarStream) {
                                        String jarFilePath = jarFile.toString();
                                        if (!classpath.toString().contains(jarFilePath)) {
                                            classpath.append(":").append(jarFilePath);
                                        }
                                    }
                                } catch (IOException e) {
                                    System.err.println("  Warning: Could not list JARs in " + dirPath + ": " + e.getMessage());
                                }
                            }
                        } else {
                            Path entryPath = Paths.get("/workspace", entry);
                            if (Files.exists(entryPath)) {
                                String pathStr = entryPath.toString();
                                if (pathStr.endsWith(".jar") || Files.isDirectory(entryPath)) {
                                    if (!classpath.toString().contains(pathStr)) {
                                        classpath.append(":").append(pathStr);
                                    }
                                } else {
                                    System.out.println("  Skipping non-JAR file from classpath: " + entry);
                                }
                            } else {
                                if (entry.startsWith("/") || entry.contains(":") || entry.equals(".")) {
                                    if (!classpath.toString().contains(entry)) {
                                        classpath.append(":").append(entry);
                                    }
                                } else {
                                    System.err.println("  Warning: Classpath entry not found: " + entry);
                                }
                            }
                        }
                    }
                }
                
                Path libDir = Paths.get("/workspace/lib");
                if (Files.exists(libDir) && Files.isDirectory(libDir)) {
                    try (DirectoryStream<Path> jarStream = Files.newDirectoryStream(libDir, "*.jar")) {
                        for (Path jarFile : jarStream) {
                            String jarFilePath = jarFile.toString();
                            if (!classpath.toString().contains(jarFilePath)) {
                                classpath.append(":").append(jarFilePath);
                            }
                        }
                    } catch (IOException e) {
                        System.err.println("  Warning: Could not list JARs in lib directory: " + e.getMessage());
                    }
                }
                
                System.out.println("  Compiling wrapper class...");
                System.out.println("  Wrapper file path: " + wrapperFileInJar);
                
                try {
                    wrapperContent = new String(Files.readAllBytes(wrapperFileInJar));
                    System.out.println("  Wrapper content (first 10 lines):");
                    String[] lines = wrapperContent.split("\n");
                    for (int i = 0; i < Math.min(10, lines.length); i++) {
                        System.out.println("    " + lines[i]);
                    }
                } catch (IOException e) {
                    System.err.println("  Could not read wrapper file: " + e.getMessage());
                }
                
                List<String> compileCommand = Arrays.asList(
                    "javac",
                    "-d", tempDir.toString(),
                    wrapperFileInJar.toString()
                );
                
                ProcessBuilder compilePb = new ProcessBuilder(compileCommand);
                Process compileProcess = compilePb.start();
                
                BufferedReader errorReader = new BufferedReader(new InputStreamReader(compileProcess.getErrorStream()));
                StringBuilder errorOutput = new StringBuilder();
                String line;
                while ((line = errorReader.readLine()) != null) {
                    errorOutput.append(line).append("\n");
                }
                
                BufferedReader outputReader = new BufferedReader(new InputStreamReader(compileProcess.getInputStream()));
                StringBuilder outputOutput = new StringBuilder();
                while ((line = outputReader.readLine()) != null) {
                    outputOutput.append(line).append("\n");
                }
                
                int compileExitCode = compileProcess.waitFor();
                if (compileExitCode != 0) {
                    System.err.println("  Compilation failed with errors:");
                    System.err.println(errorOutput.toString());
                    System.err.println("  Output:");
                    System.err.println(outputOutput.toString());
                    throw new IOException("Failed to compile wrapper class: " + errorOutput.toString());
                } else {
                    System.out.println("  Successfully compiled wrapper class");
                }
                Files.delete(wrapperFileInJar);
            
                Path metaInfInTemp = tempDir.resolve("META-INF");
                if (Files.exists(metaInfInTemp)) {
                    Files.walk(metaInfInTemp)
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
                }
            }
            
            Path tempManifest = Files.createTempFile("MANIFEST", ".MF");
            Files.write(tempManifest, manifest.getBytes());
        
            System.out.println("  Contents of tempDir before jar creation:");
            Files.walk(tempDir)
                .forEach(path -> System.out.println("    " + tempDir.relativize(path)));
            
            List<String> jarCommand = Arrays.asList(
                "jar", "cfm", jarPath.toString(),
                tempManifest.toString(),
                "-C", tempDir.toString(), "."
            );
            
            System.out.println("  Running jar command: " + String.join(" ", jarCommand));
        
            ProcessBuilder pb = new ProcessBuilder(jarCommand);
            Process process = pb.start();
            int exitCode;
            try {
                exitCode = process.waitFor();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("JAR creation interrupted", e);
            }
        
            Files.deleteIfExists(tempManifest);
        
            if (exitCode != 0) {
                BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
                StringBuilder errorOutput = new StringBuilder();
                String line;
                while ((line = errorReader.readLine()) != null) {
                    errorOutput.append(line).append("\n");
                }
                throw new IOException("jar command failed with exit code " + exitCode + "\n" + errorOutput.toString());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Interrupted during JAR creation", e);
        } finally {
            Files.walk(tempDir)
                .sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
        }
    }
}
