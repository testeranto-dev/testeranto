package kafe;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

// Make BaseThen generic for type safety
public abstract class BaseThen<R> {
    public String name;
    public Function<R, Object> thenCb;
    public boolean error;
    public List<String> artifacts;
    public Boolean status;
    
    public BaseThen(String name, Function<R, Object> thenCb) {
        this.name = name;
        this.thenCb = thenCb;
        this.error = false;
        this.artifacts = new ArrayList<>();
        this.status = null;
    }
    
    public void addArtifact(String path) {
        String normalizedPath = path.replace('\\', '/');
        artifacts.add(normalizedPath);
    }
    
    public abstract Object butThen(R store, Function<R, Object> thenCb, ITTestResourceConfiguration testResourceConfiguration);
    
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
            Object result = butThen(store, thenCb, testResourceConfiguration);
            status = true;
            return result;
        } catch (Exception e) {
            status = false;
            error = true;
            throw e;
        }
    }
}
