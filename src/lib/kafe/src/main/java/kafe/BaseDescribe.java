package kafe;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

/**
 * BaseDescribe extends BaseSetup for Describe-It pattern.
 * Describe can be nested, and Its can mix mutations and assertions.
 */
public abstract class BaseDescribe<I, S, R> extends BaseSetup<I, S, R> {
    public List<BaseIt<R>> its;
    
    public BaseDescribe(
        List<String> features,
        List<BaseIt<R>> its,
        Function<S, R> describeCb,
        Object initialValues
    ) {
        // For Describe-It, we'll process its differently
        super(
            features,
            new ArrayList<>(),
            new ArrayList<>(),
            describeCb,
            initialValues
        );
        this.its = its != null ? its : new ArrayList<>();
    }
    
    // Alias setupThat to describeThat for Describe-It pattern
    @Override
    public abstract R setupThat(
        S subject,
        ITTestResourceConfiguration testResourceConfiguration,
        Object artifactory,
        Function<S, R> setupCB,
        Object initialValues
    );
    
    // Alias setup to describe for Describe-It pattern
    public R describe(
        S subject,
        String key,
        ITTestResourceConfiguration testResourceConfiguration,
        Function<Object, Boolean> tester,
        Object artifactory,
        int suiteNdx
    ) throws Exception {
        return super.setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx);
    }
}
