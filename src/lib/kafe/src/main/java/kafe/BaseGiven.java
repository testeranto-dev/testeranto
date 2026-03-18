package kafe;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

// Make BaseGiven generic for type safety
public abstract class BaseGiven<I, S, R> {
    public String key;
    public List<String> features;
    public List<BaseWhen<S, R>> whens;
    public List<BaseThen<R>> thens;
    public Function<S, R> givenCb;
    public Object initialValues;
    public List<String> artifacts;
    public Exception error;
    public boolean failed;
    public R store;
    public int fails;
    
    public BaseGiven(String key, List<String> features, List<BaseWhen<S, R>> whens, 
                    List<BaseThen<R>> thens, Function<S, R> givenCb, Object initialValues) {
        this.key = key;
        this.features = features != null ? features : new ArrayList<>();
        this.whens = whens != null ? whens : new ArrayList<>();
        this.thens = thens != null ? thens : new ArrayList<>();
        this.givenCb = givenCb;
        this.initialValues = initialValues;
        this.artifacts = new ArrayList<>();
        this.failed = false;
        this.fails = 0;
    }
    
    public void addArtifact(String path) {
        String normalizedPath = path.replace('\\', '/');
        artifacts.add(normalizedPath);
    }
    
    public Map<String, Object> toObj() {
        List<Map<String, Object>> whenObjs = new ArrayList<>();
        for (BaseWhen<S, R> w : whens) {
            whenObjs.add(w.toObj());
        }
        
        List<Map<String, Object>> thenObjs = new ArrayList<>();
        for (BaseThen<R> t : thens) {
            thenObjs.add(t.toObj());
        }
        
        Map<String, Object> obj = new HashMap<>();
        obj.put("key", key);
        obj.put("whens", whenObjs);
        obj.put("thens", thenObjs);
        obj.put("error", error != null ? error.getMessage() : null);
        obj.put("failed", failed);
        obj.put("features", features);
        obj.put("artifacts", artifacts);
        obj.put("status", !failed);
        return obj;
    }
    
    public abstract R givenThat(S subject, ITTestResourceConfiguration testResourceConfiguration,
                               Function<String, Object> artifactory, Function<S, R> givenCb, 
                               Object initialValues);
    
    public abstract R afterEach(R store, String key, 
                               Function<String, Object> artifactory);
    
    public void uberCatcher(Exception e) {
        this.error = e;
    }
    
    public R give(S subject, String key, ITTestResourceConfiguration testResourceConfiguration,
                 Function<Object, Boolean> tester, 
                 Function<String, Object> artifactory,
                 int suiteNdx) throws Exception {
        this.failed = false;
        this.fails = 0;
        
        // TypeScript doesn't pass artifactory to give(), so we ignore it
        // and create a null artifactory function
        Function<String, Object> givenArtifactory = (fPath) -> null;
        
        try {
            // Match TypeScript: givenThat doesn't receive artifactory
            store = givenThat(subject, testResourceConfiguration, givenArtifactory, 
                             givenCb, initialValues);
        } catch (Exception e) {
            failed = true;
            fails++;
            error = e;
            throw e;
        }
        
        try {
            // Process whens
            for (int whenNdx = 0; whenNdx < whens.size(); whenNdx++) {
                BaseWhen<S, R> whenStep = whens.get(whenNdx);
                try {
                    store = whenStep.test(store, testResourceConfiguration);
                } catch (Exception e) {
                    failed = true;
                    fails++;
                    error = e;
                }
            }
            
            // Process thens - TypeScript passes filepath parameter
            for (int thenNdx = 0; thenNdx < thens.size(); thenNdx++) {
                BaseThen<R> thenStep = thens.get(thenNdx);
                try {
                    // Create filepath parameter like TypeScript does
                    String filepath = suiteNdx != -1 ? 
                        "suite-" + suiteNdx + "/given-" + key + "/then-" + thenNdx :
                        "given-" + key + "/then-" + thenNdx;
                    
                    // TypeScript BaseThen.test() takes store, testResourceConfiguration, filepath
                    Object result = thenStep.test(store, testResourceConfiguration, filepath);
                    if (!tester.apply(result)) {
                        failed = true;
                        fails++;
                    }
                } catch (Exception e) {
                    failed = true;
                    fails++;
                    error = e;
                }
            }
        } catch (Exception e) {
            error = e;
            failed = true;
            fails++;
        } finally {
            try {
                // Match TypeScript: afterEach receives store, key, and artifactory
                afterEach(store, this.key, givenArtifactory);
            } catch (Exception e) {
                failed = true;
                fails++;
            }
        }
        
        return store;
    }
}
