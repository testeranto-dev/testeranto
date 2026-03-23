package kafe;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

public abstract class BaseSuite {
    public String name;
    public Map<String, BaseGiven> givens;
    public Object store;
    public ITTestResourceConfiguration testResourceConfiguration;
    public int index;
    public boolean failed;
    public int fails;
    public List<String> artifacts;
    public Object parent; // Reference to parent Kafe instance
    
    public BaseSuite(String name, Map<String, BaseGiven> givens) {
        this.name = name;
        this.givens = givens != null ? givens : new HashMap<>();
        this.artifacts = new ArrayList<>();
        this.failed = false;
        this.fails = 0;
        this.index = 0;
    }
    
    public void addArtifact(String path) {
        String normalizedPath = path.replace('\\', '/');
        this.artifacts.add(normalizedPath);
    }
    
    public List<String> features() {
        List<String> features = new ArrayList<>();
        Map<String, Boolean> seen = new HashMap<>();
        
        for (BaseGiven given : givens.values()) {
            if (given.features != null) {
                for (Object featureObj : given.features) {
                    String feature = featureObj.toString();
                    if (!seen.containsKey(feature)) {
                        features.add(feature);
                        seen.put(feature, true);
                    }
                }
            }
        }
        return features;
    }
    
    public Map<String, Object> toObj() {
        List<Map<String, Object>> givenObjs = new ArrayList<>();
        for (BaseGiven given : givens.values()) {
            givenObjs.add(given.toObj());
        }
        
        Map<String, Object> obj = new HashMap<>();
        obj.put("name", name);
        obj.put("givens", givenObjs);
        obj.put("fails", fails);
        obj.put("failed", failed);
        obj.put("features", features());
        obj.put("artifacts", artifacts);
        return obj;
    }
    
    public abstract Object setup(Object s, ITTestResourceConfiguration tr);
    
    public abstract boolean assertThat(Object t);
    
    public abstract Object afterAll(Object store);
    
    public Object run(Object input, ITTestResourceConfiguration testResourceConfiguration) {
        this.testResourceConfiguration = testResourceConfiguration;
        
        // Create artifactory for suite
        Object suiteArtifactory = createSuiteArtifactory();
        
        // Call setup with artifactory
        Object subject;
        try {
            subject = setup(input, testResourceConfiguration);
        } catch (Exception e) {
            System.err.println("Error in suite setup: " + e.getMessage());
            this.failed = true;
            this.fails++;
            return this;
        }
        
        fails = 0;
        failed = false;
        
        for (Map.Entry<String, BaseGiven> entry : givens.entrySet()) {
            String gKey = entry.getKey();
            BaseGiven g = entry.getValue();
            try {
                // Create artifactory for given
                Object givenArtifactory = createGivenArtifactory(gKey);
                
                store = g.give(subject, gKey, testResourceConfiguration, this::assertThat,
                              givenArtifactory, // Pass artifactory as Object
                              this.index);
                if (g.failed) {
                    fails += g.fails;
                }
            } catch (Exception e) {
                failed = true;
                fails++;
                System.err.println("Error in given " + gKey + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        if (fails > 0) {
            failed = true;
        }
        
        try {
            // Create artifactory for afterAll
            Object afterAllArtifactory = createSuiteArtifactory();
            afterAll(store);
        } catch (Exception e) {
            System.err.println("Error in after_all: " + e.getMessage());
        }
        
        return this;
    }
    
    private Object createSuiteArtifactory() {
        if (parent != null) {
            try {
                java.lang.reflect.Method createArtifactory = parent.getClass().getMethod("createArtifactory", Map.class);
                Map<String, Object> context = new HashMap<>();
                context.put("suiteIndex", this.index);
                return createArtifactory.invoke(parent, context);
            } catch (Exception e) {
                System.err.println("Could not create suite artifactory: " + e.getMessage());
            }
        }
        return null;
    }
    
    private Object createGivenArtifactory(String givenKey) {
        if (parent != null) {
            try {
                java.lang.reflect.Method createArtifactory = parent.getClass().getMethod("createArtifactory", Map.class);
                Map<String, Object> context = new HashMap<>();
                context.put("givenKey", givenKey);
                context.put("suiteIndex", this.index);
                return createArtifactory.invoke(parent, context);
            } catch (Exception e) {
                System.err.println("Could not create given artifactory: " + e.getMessage());
            }
        }
        return null;
    }
    
    // Set parent reference
    public void setParent(Object parent) {
        this.parent = parent;
    }
}
