package kafe;

import java.util.Map;
import java.util.function.Function;

// Test implementation structure
public class ITestImplementation {
    public Map<String, Object> suites;
    public Map<String, Function<Object, Object>> givens;
    public Map<String, Function<Object, Function<Object, Object>>> whens;
    public Map<String, Function<Object, Function<Object, Object>>> thens;
    
    public ITestImplementation(
        Map<String, Object> suites,
        Map<String, Function<Object, Object>> givens,
        Map<String, Function<Object, Function<Object, Object>>> whens,
        Map<String, Function<Object, Function<Object, Object>>> thens
    ) {
        this.suites = suites;
        this.givens = givens;
        this.whens = whens;
        this.thens = thens;
    }
}
