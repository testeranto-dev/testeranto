package kafe;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

/**
 * BaseValue extends BaseSetup for TDT pattern.
 * Sets up table data for table-driven testing.
 */
public abstract class BaseValue<I, S, R> extends BaseSetup<I, S, R> {
    public List<List<Object>> tableRows;
    
    public BaseValue(
        List<String> features,
        List<List<Object>> tableRows,
        Function<S, R> valueCb,
        Object initialValues
    ) {
        // For TDT, we'll process table rows differently
        // Pass empty actions and checks for now
        super(
            features,
            new ArrayList<>(),
            new ArrayList<>(),
            valueCb,
            initialValues
        );
        this.tableRows = tableRows != null ? tableRows : new ArrayList<>();
    }
    
    // Alias setupThat to valueThat for TDT pattern
    @Override
    public abstract R setupThat(
        S subject,
        ITTestResourceConfiguration testResourceConfiguration,
        Object artifactory,
        Function<S, R> setupCB,
        Object initialValues
    );
    
    // Alias setup to value for TDT pattern
    public R value(
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
