package kafe;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

/**
 * BaseConfirm for TDT pattern - independent implementation
 * Similar to BaseGiven but for table-driven testing
 */
public abstract class BaseConfirm<I, S, R> extends BaseSetup<I, S, R> {
    public List<List<Object>> tableRows;
    
    public BaseConfirm(
        List<String> features,
        List<List<Object>> tableRows,
        Function<S, R> confirmCb,
        Object initialValues
    ) {
        // For TDT, we'll process table rows differently
        // Pass empty actions and checks for now
        super(
            features,
            new ArrayList<>(),
            new ArrayList<>(),
            confirmCb,
            initialValues
        );
        this.tableRows = tableRows != null ? tableRows : new ArrayList<>();
    }
    
    // Alias setupThat to confirmThat for TDT pattern
    @Override
    public abstract R setupThat(
        S subject,
        ITTestResourceConfiguration testResourceConfiguration,
        Object artifactory,
        Function<S, R> setupCB,
        Object initialValues
    );
    
    // Alias setup to confirm for TDT pattern
    public R confirm(
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
