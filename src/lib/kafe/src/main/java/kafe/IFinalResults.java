package kafe;

import java.util.List;

// Final results
public class IFinalResults {
    public boolean failed;
    public int fails;
    public List<Object> artifacts;
    public List<String> features;
    
    public IFinalResults(boolean failed, int fails, List<Object> artifacts, List<String> features) {
        this.failed = failed;
        this.fails = fails;
        this.artifacts = artifacts;
        this.features = features;
    }
}
