package kafe;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.function.Function;

/**
 * BaseSetup is the unified base class for all setup phases.
 * It covers BDD's Given, AAA's Arrange, and TDT's Map.
 */
public abstract class BaseSetup<I, S, R> {
    public List<String> features;
    public List<BaseAction<S, R>> actions;
    public List<BaseCheck<R>> checks;
    public Exception error;
    public Object fail;
    public R store;
    public String recommendedFsPath;
    public Function<S, R> setupCB;
    public Object initialValues;
    public String key;
    public boolean failed;
    public List<String> artifacts;
    public int fails;
    public Boolean status;
    
    public BaseSetup(
        List<String> features,
        List<BaseAction<S, R>> actions,
        List<BaseCheck<R>> checks,
        Function<S, R> setupCB,
        Object initialValues
    ) {
        this.features = features != null ? features : new ArrayList<>();
        this.actions = actions != null ? actions : new ArrayList<>();
        this.checks = checks != null ? checks : new ArrayList<>();
        this.setupCB = setupCB;
        this.initialValues = initialValues;
        this.fails = 0;
        this.failed = false;
        this.error = null;
        this.store = null;
        this.key = "";
        this.status = null;
        this.artifacts = new ArrayList<>();
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
    
    public Map<String, Object> toObj() {
        List<Map<String, Object>> actionObjs = new ArrayList<>();
        for (BaseAction<S, R> action : actions) {
            if (action != null) {
                actionObjs.add(action.toObj());
            }
        }
        
        List<Map<String, Object>> checkObjs = new ArrayList<>();
        for (BaseCheck<R> check : checks) {
            if (check != null) {
                checkObjs.add(check.toObj());
            }
        }
        
        Map<String, Object> obj = new HashMap<>();
        obj.put("key", key);
        obj.put("actions", actionObjs);
        obj.put("checks", checkObjs);
        obj.put("error", error != null ? error.getMessage() : null);
        obj.put("failed", failed);
        obj.put("features", features);
        obj.put("artifacts", artifacts);
        obj.put("status", status);
        return obj;
    }
    
    public abstract R setupThat(
        S subject,
        ITTestResourceConfiguration testResourceConfiguration,
        Object artifactory,
        Function<S, R> setupCB,
        Object initialValues
    );
    
    public R afterEach(
        R store,
        String key,
        Object artifactory
    ) {
        return store;
    }
    
    public R setup(
        S subject,
        String key,
        ITTestResourceConfiguration testResourceConfiguration,
        Function<Object, Boolean> tester,
        Object artifactoryObj,
        int suiteNdx
    ) throws Exception {
        this.key = key;
        this.fails = 0;
        
        // Ensure we have an artifactory - create a default one if none provided
        Object setupArtifactory = artifactoryObj;
        if (setupArtifactory == null) {
            // Create a simple default artifactory that does nothing
            setupArtifactory = new Object() {
                public void writeFileSync(String filename, String payload) {
                    System.out.println("[Default Artifactory] Would write to: " + filename);
                }
            };
        }
        
        try {
            this.store = setupThat(
                subject,
                testResourceConfiguration,
                setupArtifactory,
                this.setupCB,
                this.initialValues
            );
            this.status = true;
        } catch (Exception e) {
            this.status = false;
            this.failed = true;
            this.fails++;
            this.error = e;
            return this.store;
        }
        
        try {
            // Process actions with artifactory
            for (int actionNdx = 0; actionNdx < actions.size(); actionNdx++) {
                BaseAction<S, R> actionStep = actions.get(actionNdx);
                try {
                    // Create context-specific artifactory for this action
                    Object actionArtifactory = createActionArtifactory(key, actionNdx, suiteNdx, artifactoryObj);
                    this.store = actionStep.performAction(
                        this.store,
                        actionStep.actionCB,
                        testResourceConfiguration,
                        actionArtifactory
                    );
                } catch (Exception e) {
                    this.failed = true;
                    this.fails++;
                    this.error = e;
                }
            }
            
            // Process checks with artifactory
            for (int checkNdx = 0; checkNdx < checks.size(); checkNdx++) {
                BaseCheck<R> checkStep = checks.get(checkNdx);
                try {
                    String filepath = suiteNdx != -1 ? 
                        "suite-" + suiteNdx + "/setup-" + key + "/check-" + checkNdx :
                        "setup-" + key + "/check-" + checkNdx;
                    
                    // Create context-specific artifactory for this check
                    Object checkArtifactory = createCheckArtifactory(key, checkNdx, suiteNdx, artifactoryObj);
                    Object result = checkStep.verifyCheck(
                        this.store,
                        checkStep.checkCB,
                        testResourceConfiguration,
                        checkArtifactory
                    );
                    if (!tester.apply(result)) {
                        this.failed = true;
                        this.fails++;
                    }
                } catch (Exception e) {
                    this.failed = true;
                    this.fails++;
                    this.error = e;
                }
            }
        } catch (Exception e) {
            this.error = e;
            this.failed = true;
            this.fails++;
        } finally {
            try {
                this.store = afterEach(this.store, this.key, setupArtifactory);
            } catch (Exception e) {
                this.failed = true;
                this.fails++;
                this.error = e;
            }
        }
        
        return this.store;
    }
    
    private Object createActionArtifactory(String key, int actionIndex, int suiteNdx, Object parentArtifactory) {
        // In a real implementation, this would create a context-specific artifactory
        // For now, return the parent artifactory
        return parentArtifactory;
    }
    
    private Object createCheckArtifactory(String key, int checkIndex, int suiteNdx, Object parentArtifactory) {
        // In a real implementation, this would create a context-specific artifactory
        // For now, return the parent artifactory
        return parentArtifactory;
    }
}
