package kafe;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.*;

public class KafeMain {
    
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
