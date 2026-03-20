package kafe;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.function.Function;

/**
 * BaseCheck is the unified base class for all verification phases.
 * It covers BDD's Then, AAA's Assert, and TDT's Validate.
 */
public abstract class BaseCheck<R> {
    public String name;
    public Function<R, Object> checkCB;
    public boolean error;
    public List<String> artifacts;
    public Boolean status;
    
    public BaseCheck(String name, Function<R, Object> checkCB) {
        this.name = name;
        this.checkCB = checkCB;
        this.error = false;
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
    
    public abstract Object verifyCheck(
        R store,
        Function<R, Object> checkCB,
        ITTestResourceConfiguration testResourceConfiguration
    );
    
    public Map<String, Object> toObj() {
        Map<String, Object> obj = new HashMap<>();
        obj.put("name", name);
        obj.put("error", error);
        obj.put("artifacts", artifacts);
        obj.put("status", status);
        return obj;
    }
    
    public Object test(R store, ITTestResourceConfiguration testResourceConfiguration, String filepath) throws Exception {
        try {
            Object result = verifyCheck(store, checkCB, testResourceConfiguration);
            status = true;
            return result;
        } catch (Exception e) {
            status = false;
            error = true;
            throw e;
        }
    }
}
