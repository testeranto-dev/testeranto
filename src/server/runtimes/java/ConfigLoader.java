import java.io.*;
import java.nio.file.*;
import java.util.*;
import javax.tools.*;
import java.net.*;
import org.json.*;

public class ConfigLoader {
    public static JSONObject loadJavaConfig(Path javaConfigFile) throws Exception {
        String source = new String(Files.readAllBytes(javaConfigFile));

        String fileName = javaConfigFile.getFileName().toString();
        String className = fileName.substring(0, fileName.lastIndexOf('.'));

        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            throw new RuntimeException("No Java compiler available. Make sure you're running with JDK, not JRE.");
        }

        Path tempDir = Files.createTempDirectory("java_config");
        try {
            Path sourceFile = tempDir.resolve(fileName);
            Files.write(sourceFile, source.getBytes());

            StandardJavaFileManager fileManager = compiler.getStandardFileManager(null, null, null);
            Iterable<? extends JavaFileObject> compilationUnits =
                fileManager.getJavaFileObjectsFromFiles(Arrays.asList(sourceFile.toFile()));

            String currentClasspath = System.getProperty("java.class.path");
            Path libDir = Paths.get("/workspace/lib");
            StringBuilder classpathBuilder = new StringBuilder();
            classpathBuilder.append(currentClasspath);
            
            if (Files.exists(libDir) && Files.isDirectory(libDir)) {
                try (DirectoryStream<Path> jarStream = Files.newDirectoryStream(libDir, "*.jar")) {
                    for (Path jarFile : jarStream) {
                        classpathBuilder.append(":").append(jarFile.toString());
                    }
                } catch (IOException e) {
                    System.err.println("Warning: Could not list JARs in lib directory: " + e.getMessage());
                }
            }
            
            List<String> options = Arrays.asList(
                "-d", tempDir.toString(),
                "-cp", classpathBuilder.toString()
            );

            JavaCompiler.CompilationTask task = compiler.getTask(
                null, fileManager, null, options, null, compilationUnits);
            boolean success = task.call();
            fileManager.close();

            if (!success) {
                throw new RuntimeException("Failed to compile Java config file: " + javaConfigFile);
            }

            URLClassLoader classLoader = new URLClassLoader(
                new URL[]{tempDir.toUri().toURL()},
                Thread.currentThread().getContextClassLoader()
            );
            Class<?> configClass = classLoader.loadClass(className);

            java.lang.reflect.Method getConfigMethod = configClass.getMethod("getConfig");
            Object result = getConfigMethod.invoke(null);
            if (result instanceof JSONObject) {
                return (JSONObject) result;
            } else {
                throw new RuntimeException("getConfig() method must return JSONObject");
            }
        } finally {
            Files.walk(tempDir)
                .sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
        }
    }
}
