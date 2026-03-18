package kafe;

import java.util.*;

public class Default {
    
    // Helper to create a test case with features, whens, and thens
    public static Map<String, Object> testCase(
        String[] features,
        List<Object> whens,
        List<Object> thens
    ) {
        Map<String, Object> testCase = new HashMap<>();
        testCase.put("description", String.join(", ", features));
        testCase.put("features", features != null ? Arrays.asList(features) : Collections.emptyList());
        testCase.put("whens", whens != null ? whens : new ArrayList<>());
        testCase.put("thens", thens != null ? thens : new ArrayList<>());
        return testCase;
    }
    
    // Helper to create a when step
    @SuppressWarnings("unchecked")
    public static Object when(Map<String, Object> whens, String type, Object... params) {
        // The whens map contains functions that take parameters and return a when object
        // We need to call the function with the parameters
        Object whenFunc = whens.get(type);
        if (whenFunc instanceof java.util.function.Function) {
            java.util.function.Function<Object[], Object> func = (java.util.function.Function<Object[], Object>) whenFunc;
            return func.apply(params);
        }
        // Return a placeholder if function not found or not a Function
        Map<String, Object> placeholder = new HashMap<>();
        placeholder.put("type", type);
        placeholder.put("params", params);
        return placeholder;
    }
    
    // Helper to create a then step
    @SuppressWarnings("unchecked")
    public static Object then(Map<String, Object> thens, String type, Object... params) {
        Object thenFunc = thens.get(type);
        if (thenFunc instanceof java.util.function.Function) {
            java.util.function.Function<Object[], Object> func = (java.util.function.Function<Object[], Object>) thenFunc;
            return func.apply(params);
        }
        // Return a placeholder if function not found
        Map<String, Object> placeholder = new HashMap<>();
        placeholder.put("type", type);
        placeholder.put("params", params);
        return placeholder;
    }
    
    // Helper to create a suite
    public static List<Map<String, Object>> suite(
        String name,
        Map<String, Map<String, Object>> testCases
    ) {
        Map<String, Object> suite = new HashMap<>();
        suite.put("name", name);
        suite.put("testCases", testCases);
        return Collections.singletonList(suite);
    }
}
