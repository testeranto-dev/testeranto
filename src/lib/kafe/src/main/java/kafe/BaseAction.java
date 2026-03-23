package kafe;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.function.Function;

/**
 * BaseAction is the unified base class for all action phases.
 * It covers BDD's When, AAA's Act, and TDT's Feed.
 */
public abstract class BaseAction<S, R> {
    public String name;
    public Function<R, R> actionCB;
    public Exception error;
    public List<String> artifacts;
    public Boolean status;
    
    public BaseAction(String name, Function<R, R> actionCB) {
        this.name = name;
        this.actionCB = actionCB;
        this.artifacts = new ArrayList<>();
        this.status = null;
    }
    
    public void addArtifact(String path) {
        if (!(path instanceof String)) {
            throw new RuntimeException(
                "[ARTIFACT ERROR] Expected string, got " + path.getClass().getName() + ": " + path
            );
        }
        String normalizedPath = path.replace('\\', '/');
        artifacts.add(normalizedPath);
    }
    
    public abstract R performAction(
        R store,
        Function<R, R> actionCB,
        ITTestResourceConfiguration testResourceConfiguration,
        Object artifactory
    );
    
    public Map<String, Object> toObj() {
        String errorStr = null;
        if (error != null) {
            errorStr = error.getClass().getName() + ": " + error.getMessage();
        }
        Map<String, Object> obj = new HashMap<>();
        obj.put("name", name);
        obj.put("status", status);
        obj.put("error", errorStr);
        obj.put("artifacts", artifacts);
        return obj;
    }
    
    public R test(R store, ITTestResourceConfiguration testResourceConfiguration) throws Exception {
        return test(store, testResourceConfiguration, null);
    }
    
    public R test(R store, ITTestResourceConfiguration testResourceConfiguration, Object artifactory) throws Exception {
        try {
            R result = performAction(store, actionCB, testResourceConfiguration, artifactory);
            status = true;
            return result;
        } catch (Exception e) {
            status = false;
            error = e;
            throw e;
        }
    }
}
