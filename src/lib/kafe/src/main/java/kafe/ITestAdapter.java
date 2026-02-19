package kafe;

// Test adapter interface
public interface ITestAdapter {
    Object beforeAll(Object input, ITTestResourceConfiguration tr, Object pm);
    Object afterAll(Object store, Object pm);
    Object beforeEach(Object subject, Object initializer, ITTestResourceConfiguration testResource, 
                     Object initialValues, Object pm);
    Object afterEach(Object store, String key, Object pm);
    Object andWhen(Object store, Object whenCb, Object testResource, Object pm);
    Object butThen(Object store, Object thenCb, Object testResource, Object pm);
    boolean assertThis(Object t);
}
