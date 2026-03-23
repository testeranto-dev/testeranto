package kafe;

import java.util.function.Function;

// Updated to match TypeScript's IUniversalTestAdapter with artifactory support
public interface ITestAdapter<I, S, R> {
    // Lifecycle hooks with artifactory
    S prepareAll(I input, ITTestResourceConfiguration tr, Object artifactory);
    R cleanupAll(R store, Object artifactory);
    R prepareEach(S subject, Function<S, R> initializer, ITTestResourceConfiguration testResource, 
                 Object initialValues, Object artifactory);
    R cleanupEach(R store, String key, Object artifactory);
    
    // Execution with artifactory
    R execute(R store, Function<R, R> actionCB, ITTestResourceConfiguration testResource, Object artifactory);
    
    // Verification with artifactory
    Object verify(R store, Function<R, Object> checkCB, ITTestResourceConfiguration testResource, Object artifactory);
    
    // Assertion - standardized name across all languages
    boolean assertThat(Object t);
    
    // Legacy methods for backward compatibility (without artifactory)
    default S beforeAll(I input, ITTestResourceConfiguration tr) {
        return prepareAll(input, tr, null);
    }
    
    default R afterAll(R store) {
        return cleanupAll(store, null);
    }
    
    default R beforeEach(S subject, Function<S, R> initializer, ITTestResourceConfiguration testResource, 
                        Object initialValues) {
        return prepareEach(subject, initializer, testResource, initialValues, null);
    }
    
    default R afterEach(R store, String key) {
        return cleanupEach(store, key, null);
    }
    
    default R andWhen(R store, Function<R, R> whenCb, ITTestResourceConfiguration testResource) {
        return execute(store, whenCb, testResource, null);
    }
    
    default Object butThen(R store, Function<R, Object> thenCb, ITTestResourceConfiguration testResource) {
        return verify(store, thenCb, testResource, null);
    }
    
    // New methods with artifactory for legacy compatibility
    default S beforeAll(I input, ITTestResourceConfiguration tr, Object artifactory) {
        return prepareAll(input, tr, artifactory);
    }
    
    default R afterAll(R store, Object artifactory) {
        return cleanupAll(store, artifactory);
    }
    
    default R beforeEach(S subject, Function<S, R> initializer, ITTestResourceConfiguration testResource, 
                        Object initialValues, Object artifactory) {
        return prepareEach(subject, initializer, testResource, initialValues, artifactory);
    }
    
    default R afterEach(R store, String key, Object artifactory) {
        return cleanupEach(store, key, artifactory);
    }
    
    default R andWhen(R store, Function<R, R> whenCb, ITTestResourceConfiguration testResource, Object artifactory) {
        return execute(store, whenCb, testResource, artifactory);
    }
    
    default Object butThen(R store, Function<R, Object> thenCb, ITTestResourceConfiguration testResource, Object artifactory) {
        return verify(store, thenCb, testResource, artifactory);
    }
}
