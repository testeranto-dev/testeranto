package kafe;

import java.util.function.Function;

// Make ITestAdapter generic for type safety
// Updated to match TypeScript's IUniversalTestAdapter
public interface ITestAdapter<I, S, R> {
    // Lifecycle hooks
    S prepareAll(I input, ITTestResourceConfiguration tr);
    R cleanupAll(R store);
    R prepareEach(S subject, Function<S, R> initializer, ITTestResourceConfiguration testResource, 
                 Object initialValues);
    R cleanupEach(R store, String key);
    
    // Execution
    R execute(R store, Function<R, R> actionCB, ITTestResourceConfiguration testResource);
    
    // Verification
    Object verify(R store, Function<R, Object> checkCB, ITTestResourceConfiguration testResource);
    
    // Assertion
    boolean assertThis(Object t);
    
    // Legacy methods for backward compatibility
    default S beforeAll(I input, ITTestResourceConfiguration tr) {
        return prepareAll(input, tr);
    }
    
    default R afterAll(R store) {
        return cleanupAll(store);
    }
    
    default R beforeEach(S subject, Function<S, R> initializer, ITTestResourceConfiguration testResource, 
                        Object initialValues) {
        return prepareEach(subject, initializer, testResource, initialValues);
    }
    
    default R afterEach(R store, String key) {
        return cleanupEach(store, key);
    }
    
    default R andWhen(R store, Function<R, R> whenCb, ITTestResourceConfiguration testResource) {
        return execute(store, whenCb, testResource);
    }
    
    default Object butThen(R store, Function<R, Object> thenCb, ITTestResourceConfiguration testResource) {
        return verify(store, thenCb, testResource);
    }
}
