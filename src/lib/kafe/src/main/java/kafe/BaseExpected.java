package kafe;

import java.util.function.Function;

/**
 * BaseExpected extends BaseCheck for TDT pattern.
 * Validates each row in table-driven testing.
 */
public abstract class BaseExpected<R> extends BaseCheck<R> {
    public BaseExpected(String name, Function<R, Object> expectedCb) {
        super(name, expectedCb);
    }
    
    // Alias verifyCheck to expectThat for TDT pattern
    @Override
    public abstract Object verifyCheck(
        R store,
        Function<R, Object> checkCB,
        ITTestResourceConfiguration testResourceConfiguration,
        Object artifactory
    );
    
    // Alias test to expectTest for TDT pattern
    public Object expectTest(R store, ITTestResourceConfiguration testResourceConfiguration, String filepath) throws Exception {
        return super.test(store, testResourceConfiguration, filepath);
    }
}
