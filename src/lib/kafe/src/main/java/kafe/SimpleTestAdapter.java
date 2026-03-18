package kafe;

import java.util.function.Function;

public class SimpleTestAdapter<I, S, R> implements ITestAdapter<I, S, R> {
    @Override
    public S beforeAll(I input, ITTestResourceConfiguration tr) {
        return (S) input;
    }
    
    @Override
    public R afterAll(R store) {
        return store;
    }
    
    @Override
    public R beforeEach(S subject, Function<S, R> initializer, ITTestResourceConfiguration testResource, 
                       Object initialValues) {
        return initializer.apply(subject);
    }
    
    @Override
    public R afterEach(R store, String key) {
        return store;
    }
    
    @Override
    public R andWhen(R store, Function<R, R> whenCb, ITTestResourceConfiguration testResource) {
        return whenCb.apply(store);
    }
    
    @Override
    public Object butThen(R store, Function<R, Object> thenCb, ITTestResourceConfiguration testResource) {
        return thenCb.apply(store);
    }
    
    @Override
    public boolean assertThis(Object t) {
        // Simple implementation
        return true;
    }
}
