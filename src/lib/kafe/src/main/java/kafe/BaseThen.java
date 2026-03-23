package kafe;

import java.util.function.Function;

/**
 * BaseThen extends BaseCheck to support BDD pattern.
 * It reuses all Check functionality but with BDD naming.
 */
public abstract class BaseThen<R> extends BaseCheck<R> {
    public BaseThen(String name, Function<R, Object> thenCb) {
        super(name, thenCb);
    }
    
    // Alias verifyCheck to butThen for BDD pattern
    @Override
    public abstract Object verifyCheck(
        R store,
        Function<R, Object> checkCB,
        ITTestResourceConfiguration testResourceConfiguration,
        Object artifactory
    );
    
    // Alias test to butThenTest for BDD pattern
    public Object butThenTest(R store, ITTestResourceConfiguration testResourceConfiguration, String filepath) throws Exception {
        return super.test(store, testResourceConfiguration, filepath);
    }
    
    // Overload with artifactory
    public Object butThenTest(R store, ITTestResourceConfiguration testResourceConfiguration, String filepath, Object artifactory) throws Exception {
        return super.test(store, testResourceConfiguration, filepath, artifactory);
    }
}
