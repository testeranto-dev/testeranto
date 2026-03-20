package kafe;

import java.util.function.Function;

/**
 * BaseWhen extends BaseAction to support BDD pattern.
 * It reuses all Action functionality but with BDD naming.
 */
public abstract class BaseWhen<S, R> extends BaseAction<S, R> {
    public BaseWhen(String name, Function<R, R> whenCb) {
        super(name, whenCb);
    }
    
    // Alias performAction to andWhen for BDD pattern
    @Override
    public abstract R performAction(
        R store,
        Function<R, R> actionCB,
        ITTestResourceConfiguration testResourceConfiguration
    );
    
    // Alias test to andWhenTest for BDD pattern
    public R andWhenTest(R store, ITTestResourceConfiguration testResourceConfiguration) throws Exception {
        return super.test(store, testResourceConfiguration);
    }
}
