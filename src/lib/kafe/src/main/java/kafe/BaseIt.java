package kafe;

import java.util.function.Function;

/**
 * BaseIt extends BaseAction for Describe-It pattern.
 * Its can mix mutations and assertions, unlike BDD's When which only does mutations.
 */
public abstract class BaseIt<R> extends BaseAction<Object, R> {
    public BaseIt(String name, Function<R, R> itCb) {
        super(name, itCb);
    }
    
    // Alias performAction to itDoes for Describe-It pattern
    @Override
    public abstract R performAction(
        R store,
        Function<R, R> actionCB,
        ITTestResourceConfiguration testResourceConfiguration,
        Object artifactory
    );
    
    // Alias test to itTest for Describe-It pattern
    public R itTest(R store, ITTestResourceConfiguration testResourceConfiguration) throws Exception {
        return super.test(store, testResourceConfiguration);
    }
}
