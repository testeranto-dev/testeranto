package kafe;

import java.util.function.Function;

/**
 * BaseShould extends BaseAction for TDT pattern.
 * Processes each row in table-driven testing.
 */
public abstract class BaseShould<R> extends BaseAction<Object, R> {
    public BaseShould(String name, Function<R, R> shouldCb) {
        super(name, shouldCb);
    }
    
    // Alias performAction to shouldDo for TDT pattern
    @Override
    public abstract R performAction(
        R store,
        Function<R, R> actionCB,
        ITTestResourceConfiguration testResourceConfiguration,
        Object artifactory
    );
    
    // Alias test to shouldTest for TDT pattern
    public R shouldTest(R store, ITTestResourceConfiguration testResourceConfiguration) throws Exception {
        return super.test(store, testResourceConfiguration);
    }
}
