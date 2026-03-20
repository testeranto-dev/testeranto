package kafe;

import java.util.function.Function;

public class SimpleTestAdapter<I, S, R> implements ITestAdapter<I, S, R> {
    @Override
    public S prepareAll(I input, ITTestResourceConfiguration tr) {
        return (S) input;
    }
    
    @Override
    public R cleanupAll(R store) {
        return store;
    }
    
    @Override
    public R prepareEach(S subject, Function<S, R> initializer, ITTestResourceConfiguration testResource, 
                       Object initialValues) {
        return initializer.apply(subject);
    }
    
    @Override
    public R cleanupEach(R store, String key) {
        return store;
    }
    
    @Override
    public R execute(R store, Function<R, R> actionCB, ITTestResourceConfiguration testResource) {
        return actionCB.apply(store);
    }
    
    @Override
    public Object verify(R store, Function<R, Object> checkCB, ITTestResourceConfiguration testResource) {
        return checkCB.apply(store);
    }
    
    @Override
    public boolean assertThis(Object t) {
        // Simple implementation
        return true;
    }
    
    // The default methods in the interface will handle the legacy method calls
}
