package kafe;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

// Make BaseWhen generic for type safety
public abstract class BaseWhen<S, R> {
    public String name;
    public Function<R, R> whenCb;
    public Exception error;
    public List<String> artifacts;
    public Boolean status;
    
    public BaseWhen(String name, Function<R, R> whenCb) {
        this.name = name;
        this.whenCb = whenCb;
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
    
    public abstract R andWhen(R store, Function<R, R> whenCb, ITTestResourceConfiguration testResourceConfiguration);
    
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
        try {
            R result = andWhen(store, whenCb, testResourceConfiguration);
            status = true;
            return result;
        } catch (Exception e) {
            status = false;
            error = e;
            throw e;
        }
    }
}
