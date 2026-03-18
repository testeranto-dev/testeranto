package kafe;

import java.util.function.Function;

// Make ITestAdapter generic for type safety
public interface ITestAdapter<I, S, R> {
    S beforeAll(I input, ITTestResourceConfiguration tr);
    R afterAll(R store);
    R beforeEach(S subject, Function<S, R> initializer, ITTestResourceConfiguration testResource, 
                 Object initialValues);
    R afterEach(R store, String key);
    R andWhen(R store, Function<R, R> whenCb, ITTestResourceConfiguration testResource);
    Object butThen(R store, Function<R, Object> thenCb, ITTestResourceConfiguration testResource);
    boolean assertThis(Object t);
}
