package kafe;

import java.util.Map;
import java.util.function.Function;

// Test implementation structure supporting all patterns
public class ITestImplementation {
    public Map<String, Object> suites;
    // BDD pattern
    public Map<String, Function<Object, Object>> givens;
    public Map<String, Function<Object, Function<Object, Object>>> whens;
    public Map<String, Function<Object, Function<Object, Object>>> thens;
    // TDT pattern
    public Map<String, Function<Object, Object>> values;
    public Map<String, Function<Object, Function<Object, Object>>> shoulds;
    public Map<String, Function<Object, Function<Object, Object>>> expecteds;
    // Describe-It pattern
    public Map<String, Function<Object, Object>> describes;
    public Map<String, Function<Object, Function<Object, Object>>> its;
    
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
        // Initialize other patterns to empty maps
        this.values = new java.util.HashMap<>();
        this.shoulds = new java.util.HashMap<>();
        this.expecteds = new java.util.HashMap<>();
        this.describes = new java.util.HashMap<>();
        this.its = new java.util.HashMap<>();
    }
    
    // Full constructor with all patterns
    public ITestImplementation(
        Map<String, Object> suites,
        Map<String, Function<Object, Object>> givens,
        Map<String, Function<Object, Function<Object, Object>>> whens,
        Map<String, Function<Object, Function<Object, Object>>> thens,
        Map<String, Function<Object, Object>> values,
        Map<String, Function<Object, Function<Object, Object>>> shoulds,
        Map<String, Function<Object, Function<Object, Object>>> expecteds,
        Map<String, Function<Object, Object>> describes,
        Map<String, Function<Object, Function<Object, Object>>> its
    ) {
        this.suites = suites;
        this.givens = givens;
        this.whens = whens;
        this.thens = thens;
        this.values = values != null ? values : new java.util.HashMap<>();
        this.shoulds = shoulds != null ? shoulds : new java.util.HashMap<>();
        this.expecteds = expecteds != null ? expecteds : new java.util.HashMap<>();
        this.describes = describes != null ? describes : new java.util.HashMap<>();
        this.its = its != null ? its : new java.util.HashMap<>();
    }
}
