package kafe;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

/**
 * BaseGiven extends BaseSetup to support BDD pattern.
 * It reuses all Setup functionality but with BDD naming.
 */
public abstract class BaseGiven<I, S, R> extends BaseSetup<I, S, R> {
    public BaseGiven(
        List<String> features,
        List<BaseWhen<S, R>> whens,  // These will be processed as actions
        List<BaseThen<R>> thens,     // These will be processed as checks
        Function<S, R> givenCb,
        Object initialValues
    ) {
        // Convert whens to actions and thens to checks
        super(
            features,
            new ArrayList<>(whens),
            new ArrayList<>(thens),
            givenCb,
            initialValues
        );
    }
    
    // Alias setupThat to givenThat for BDD pattern
    @Override
    public abstract R setupThat(
        S subject,
        ITTestResourceConfiguration testResourceConfiguration,
        Function<String, Object> artifactory,
        Function<S, R> setupCB,
        Object initialValues
    );
    
    // Alias setup to give for BDD pattern
    public R give(
        S subject,
        String key,
        ITTestResourceConfiguration testResourceConfiguration,
        Function<Object, Boolean> tester,
        Function<String, Object> artifactory,
        int suiteNdx
    ) throws Exception {
        return super.setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx);
    }
}
