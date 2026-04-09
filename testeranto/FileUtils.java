import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.FileTime;
import java.security.*;
import java.util.*;
import java.util.regex.*;

public class FileUtils {
    public static List<String> collectInputFiles(String testPath) {
        List<String> files = new ArrayList<>();
        
        Path testFilePath = TestFileFinder.findTestFile(testPath);
        if (testFilePath == null) {
            throw new RuntimeException("Test file not found: " + testPath);
        }
        
        String workspacePath = testFilePath.toString();
        if (workspacePath.startsWith("/workspace/")) {
            workspacePath = workspacePath.substring(10);
        }
        files.add(workspacePath);
        
        Path testDir = testFilePath.getParent();
        if (testDir != null && Files.exists(testDir)) {
            try {
                Files.walk(testDir, 1)
                    .filter(path -> path.toString().endsWith(".java"))
                    .forEach(path -> {
                        String relativePath = path.toString();
                        if (relativePath.startsWith("/workspace/")) {
                            relativePath = relativePath.substring(10);
                        }
                        if (!files.contains(relativePath)) {
                            files.add(relativePath);
                        }
                    });
            } catch (IOException e) {
                throw new RuntimeException("Could not walk directory: " + e.getMessage(), e);
            }
        }
        
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
        
        if (Files.exists(workspace.resolve("kafe-src/pom.xml"))) {
            files.add("kafe-src/pom.xml");
        }
        
        System.out.println("  Collected " + files.size() + " input files");
        return files;
    }
    
    public static String computeFilesHash(List<String> files) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            for (String file : files) {
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
    
    public static String extractPackageName(Path javaFile) {
        try {
            String content = new String(Files.readAllBytes(javaFile));
            Pattern pattern = Pattern.compile("^\\s*package\\s+([^;]+);", Pattern.MULTILINE);
            Matcher matcher = pattern.matcher(content);
            if (matcher.find()) {
                return matcher.group(1).trim();
            }
        } catch (IOException e) {
        }
        return "";
    }
    
    public static void copyDirectory(Path source, Path target) throws IOException {
        Files.walk(source)
            .forEach(sourcePath -> {
                try {
                    Path targetPath = target.resolve(source.relativize(sourcePath));
                    if (Files.isDirectory(sourcePath)) {
                        Files.createDirectories(targetPath);
                    } else {
                        Files.createDirectories(targetPath.getParent());
                        Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
                    }
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            });
    }
}
