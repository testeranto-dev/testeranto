package kafe;

import java.util.List;

// Final results matching TypeScript IFinalResults
public class IFinalResults {
    public boolean failed;
    public int fails;
    public List<Object> artifacts;
    public List<String> features;
    public int tests;
    public int runTimeTests;
    public Object testJob;
    
    public IFinalResults(boolean failed, int fails, List<Object> artifacts, List<String> features, 
                        int tests, int runTimeTests, Object testJob) {
        this.failed = failed;
        this.fails = fails;
        this.artifacts = artifacts;
        this.features = features;
        this.tests = tests;
        this.runTimeTests = runTimeTests;
        this.testJob = testJob;
    }
    
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"failed\":").append(failed);
        sb.append(",\"fails\":").append(fails);
        sb.append(",\"artifacts\":[");
        if (artifacts != null) {
            for (int i = 0; i < artifacts.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append("\"").append(artifacts.get(i).toString().replace("\"", "\\\"")).append("\"");
            }
        }
        sb.append("],\"features\":[");
        if (features != null) {
            for (int i = 0; i < features.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append("\"").append(features.get(i).replace("\"", "\\\"")).append("\"");
            }
        }
        sb.append("],\"tests\":").append(tests);
        sb.append(",\"runTimeTests\":").append(runTimeTests);
        sb.append("}");
        return sb.toString();
    }
}
