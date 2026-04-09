import java.io.*;
import java.nio.file.*;
import java.util.*;

public class TestFileFinder {
    public static Path findTestFile(String testPath) {
        Path candidate = Paths.get(testPath);
        if (Files.exists(candidate)) {
            System.out.println("  Found test file at: " + candidate.toAbsolutePath());
            return candidate;
        }
        
        candidate = Paths.get("/workspace", testPath);
        if (Files.exists(candidate)) {
            System.out.println("  Found test file at: " + candidate.toAbsolutePath());
            return candidate;
        }
        
        candidate = Paths.get("/workspace/src", testPath);
        if (Files.exists(candidate)) {
            System.out.println("  Found test file at: " + candidate.toAbsolutePath());
            return candidate;
        }
        
        candidate = Paths.get("/workspace/test", testPath);
        if (Files.exists(candidate)) {
            System.out.println("  Found test file at: " + candidate.toAbsolutePath());
            return candidate;
        }
        
        String fileName = Paths.get(testPath).getFileName().toString();
        try {
            List<Path> foundFiles = Files.walk(Paths.get("/workspace"))
                .filter(path -> path.getFileName() != null && path.getFileName().toString().equals(fileName))
                .limit(1)
                .collect(java.util.stream.Collectors.toList());
            
            if (!foundFiles.isEmpty()) {
                System.out.println("  Found test file at: " + foundFiles.get(0).toAbsolutePath());
                return foundFiles.get(0);
            }
        } catch (IOException e) {
        }
        
        throw new RuntimeException("Could not find test file: " + testPath);
    }
}
