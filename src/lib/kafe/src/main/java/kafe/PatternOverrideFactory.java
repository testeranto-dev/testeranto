package kafe;

import java.util.*;
import java.util.function.Function;

public class PatternOverrideFactory<I, S, R, Sel> {
    private final Kafe<I, S, R, Sel> kafe;
    private final ITestAdapter<I, S, R> testAdapter;
    private final ITestImplementation testImplementation;
    
    public PatternOverrideFactory(Kafe<I, S, R, Sel> kafe, ITestAdapter<I, S, R> testAdapter, 
                                  ITestImplementation testImplementation) {
        this.kafe = kafe;
        this.testAdapter = testAdapter;
        this.testImplementation = testImplementation;
    }
    
    public Map<String, Object> createSuiteOverrides() {
        Map<String, Object> suitesOverrides = new HashMap<>();
        if (testImplementation.suites != null) {
            for (String key : testImplementation.suites.keySet()) {
                suitesOverrides.put(key, (Kafe.BiFunction<String, Map<String, BaseGiven>, BaseSuite>) 
                    (name, givens) -> {
                        return new BaseSuite(name, givens) {
                            private int suiteIndex = 0;
                            
                            @Override
                            public Object setup(Object s, ITTestResourceConfiguration tr) {
                                int currentSuiteIndex = this.suiteIndex;
                                Object suiteArtifactory = kafe.createArtifactory(new HashMap<String, Object>() {{
                                    put("suiteIndex", currentSuiteIndex);
                                }});
                                return testAdapter.prepareAll((I) s, tr, suiteArtifactory);
                            }
                            
                            @Override
                            public boolean assertThat(Object t) {
                                return testAdapter.assertThat(t);
                            }
                            
                            @Override
                            public Object afterAll(Object store) {
                                int currentSuiteIndex = this.suiteIndex;
                                Object suiteArtifactory = kafe.createArtifactory(new HashMap<String, Object>() {{
                                    put("suiteIndex", currentSuiteIndex);
                                }});
                                return testAdapter.cleanupAll((R) store, suiteArtifactory);
                            }
                        };
                    });
            }
        }
        return suitesOverrides;
    }
    
    public Map<String, Object> createGivenOverrides() {
        Map<String, Object> givenOverrides = new HashMap<>();
        if (testImplementation.givens != null) {
            for (String key : testImplementation.givens.keySet()) {
                givenOverrides.put(key, (Function<Object[], BaseGiven>) 
                    args -> {
                        @SuppressWarnings("unchecked")
                        List<String> features = (List<String>) args[0];
                        @SuppressWarnings("unchecked")
                        List<BaseWhen<S,R>> whens = (List<BaseWhen<S,R>>) args[1];
                        @SuppressWarnings("unchecked")
                        List<BaseThen<R>> thens = (List<BaseThen<R>>) args[2];
                        @SuppressWarnings("unchecked")
                        Function<S, R> givenCB = (Function<S, R>) args[3];
                        Object initialValues = args[4];
                        
                        return new BaseGiven<I, S, R>(
                            features,
                            whens,
                            thens,
                            givenCB,
                            initialValues
                        ) {
                            @Override
                            public R setupThat(
                                S subject,
                                ITTestResourceConfiguration testResourceConfiguration,
                                Object artifactory,
                                Function<S, R> setupCB,
                                Object initialValues
                            ) {
                                return testAdapter.prepareEach(
                                    subject,
                                    setupCB,
                                    testResourceConfiguration,
                                    initialValues,
                                    artifactory
                                );
                            }
                            
                            @Override
                            public R afterEach(
                                R store,
                                String key,
                                Object artifactory
                            ) {
                                return testAdapter.cleanupEach(store, key, artifactory);
                            }
                        };
                    });
            }
        }
        return givenOverrides;
    }
    
    public Map<String, Object> createWhenOverrides() {
        Map<String, Object> whenOverrides = new HashMap<>();
        if (testImplementation.whens != null) {
            for (String key : testImplementation.whens.keySet()) {
                whenOverrides.put(key, (Function<Object[], BaseWhen>) 
                    args -> {
                        return new BaseWhen<S, R>(key + ": " + Arrays.toString(args), 
                            (Function<R, R>) testImplementation.whens.get(key).apply(args)) {
                            @Override
                            public R performAction(
                                R store,
                                Function<R, R> actionCB,
                                ITTestResourceConfiguration testResourceConfiguration,
                                Object artifactory
                            ) {
                                return testAdapter.execute(store, actionCB, testResourceConfiguration, artifactory);
                            }
                        };
                    });
            }
        }
        return whenOverrides;
    }
    
    public Map<String, Object> createThenOverrides() {
        Map<String, Object> thenOverrides = new HashMap<>();
        if (testImplementation.thens != null) {
            for (String key : testImplementation.thens.keySet()) {
                thenOverrides.put(key, (Function<Object[], BaseThen>) 
                    args -> {
                        return new BaseThen<R>(key + ": " + Arrays.toString(args),
                            (Function<R, Object>) testImplementation.thens.get(key).apply(args)) {
                            @Override
                            public Object verifyCheck(
                                R store,
                                Function<R, Object> checkCB,
                                ITTestResourceConfiguration testResourceConfiguration,
                                Object artifactory
                            ) {
                                return testAdapter.verify(store, checkCB, testResourceConfiguration, artifactory);
                            }
                        };
                    });
            }
        }
        return thenOverrides;
    }
    
    public Map<String, Object> createConfirmOverrides() {
        Map<String, Object> confirmOverrides = new HashMap<>();
        if (testImplementation.confirms != null) {
            for (String key : testImplementation.confirms.keySet()) {
                confirmOverrides.put(key, (Function<Object[], BaseConfirm>) 
                    args -> {
                        @SuppressWarnings("unchecked")
                        List<String> features = (List<String>) args[0];
                        @SuppressWarnings("unchecked")
                        List<List<Object>> tableRows = (List<List<Object>>) args[1];
                        @SuppressWarnings("unchecked")
                        Function<S, R> confirmCB = (Function<S, R>) args[2];
                        Object initialValues = args[3];
                        
                        return new BaseConfirm<I, S, R>(
                            features,
                            tableRows,
                            confirmCB,
                            initialValues
                        ) {
                            @Override
                            public R setupThat(
                                S subject,
                                ITTestResourceConfiguration testResourceConfiguration,
                                Object artifactory,
                                Function<S, R> setupCB,
                                Object initialValues
                            ) {
                                return testAdapter.prepareEach(
                                    subject,
                                    setupCB,
                                    testResourceConfiguration,
                                    initialValues,
                                    artifactory
                                );
                            }
                            
                            @Override
                            public R afterEach(
                                R store,
                                String key,
                                Object artifactory
                            ) {
                                return testAdapter.cleanupEach(store, key, artifactory);
                            }
                        };
                    });
            }
        }
        return confirmOverrides;
    }
    
    public Map<String, Object> createValueOverrides() {
        Map<String, Object> valueOverrides = new HashMap<>();
        if (testImplementation.values != null) {
            for (String key : testImplementation.values.keySet()) {
                valueOverrides.put(key, (Function<Object[], BaseValue>) 
                    args -> {
                        @SuppressWarnings("unchecked")
                        List<String> features = (List<String>) args[0];
                        @SuppressWarnings("unchecked")
                        List<List<Object>> tableRows = (List<List<Object>>) args[1];
                        @SuppressWarnings("unchecked")
                        Function<S, R> valueCB = (Function<S, R>) args[2];
                        Object initialValues = args[3];
                        
                        return new BaseValue<I, S, R>(
                            features,
                            tableRows,
                            valueCB,
                            initialValues
                        ) {
                            @Override
                            public R setupThat(
                                S subject,
                                ITTestResourceConfiguration testResourceConfiguration,
                                Object artifactory,
                                Function<S, R> setupCB,
                                Object initialValues
                            ) {
                                return testAdapter.prepareEach(
                                    subject,
                                    setupCB,
                                    testResourceConfiguration,
                                    initialValues,
                                    artifactory
                                );
                            }
                            
                            @Override
                            public R afterEach(
                                R store,
                                String key,
                                Object artifactory
                            ) {
                                return testAdapter.cleanupEach(store, key, artifactory);
                            }
                        };
                    });
            }
        }
        return valueOverrides;
    }
    
    public Map<String, Object> createShouldOverrides() {
        Map<String, Object> shouldOverrides = new HashMap<>();
        if (testImplementation.shoulds != null) {
            for (String key : testImplementation.shoulds.keySet()) {
                shouldOverrides.put(key, (Function<Object[], BaseShould>) 
                    args -> {
                        return new BaseShould<R>(key + ": " + Arrays.toString(args), 
                            (Function<R, R>) testImplementation.shoulds.get(key).apply(args)) {
                            @Override
                            public R performAction(
                                R store,
                                Function<R, R> actionCB,
                                ITTestResourceConfiguration testResourceConfiguration,
                                Object artifactory
                            ) {
                                return testAdapter.execute(store, actionCB, testResourceConfiguration, artifactory);
                            }
                        };
                    });
            }
        }
        return shouldOverrides;
    }
    
    public Map<String, Object> createExpectedOverrides() {
        Map<String, Object> expectedOverrides = new HashMap<>();
        if (testImplementation.expecteds != null) {
            for (String key : testImplementation.expecteds.keySet()) {
                expectedOverrides.put(key, (Function<Object[], BaseExpected>) 
                    args -> {
                        return new BaseExpected<R>(key + ": " + Arrays.toString(args),
                            (Function<R, Object>) testImplementation.expecteds.get(key).apply(args)) {
                            @Override
                            public Object verifyCheck(
                                R store,
                                Function<R, Object> checkCB,
                                ITTestResourceConfiguration testResourceConfiguration,
                                Object artifactory
                            ) {
                                return testAdapter.verify(store, checkCB, testResourceConfiguration, artifactory);
                            }
                        };
                    });
            }
        }
        return expectedOverrides;
    }
    
    public Map<String, Object> createDescribeOverrides() {
        Map<String, Object> describeOverrides = new HashMap<>();
        if (testImplementation.describes != null) {
            for (String key : testImplementation.describes.keySet()) {
                describeOverrides.put(key, (Function<Object[], BaseDescribe>) 
                    args -> {
                        @SuppressWarnings("unchecked")
                        List<String> features = (List<String>) args[0];
                        @SuppressWarnings("unchecked")
                        List<BaseIt<R>> its = (List<BaseIt<R>>) args[1];
                        @SuppressWarnings("unchecked")
                        Function<S, R> describeCB = (Function<S, R>) args[2];
                        Object initialValues = args[3];
                        
                        return new BaseDescribe<I, S, R>(
                            features,
                            its,
                            describeCB,
                            initialValues
                        ) {
                            @Override
                            public R setupThat(
                                S subject,
                                ITTestResourceConfiguration testResourceConfiguration,
                                Object artifactory,
                                Function<S, R> setupCB,
                                Object initialValues
                            ) {
                                return testAdapter.prepareEach(
                                    subject,
                                    setupCB,
                                    testResourceConfiguration,
                                    initialValues,
                                    artifactory
                                );
                            }
                            
                            @Override
                            public R afterEach(
                                R store,
                                String key,
                                Object artifactory
                            ) {
                                return testAdapter.cleanupEach(store, key, artifactory);
                            }
                        };
                    });
            }
        }
        return describeOverrides;
    }
    
    public Map<String, Object> createItOverrides() {
        Map<String, Object> itOverrides = new HashMap<>();
        if (testImplementation.its != null) {
            for (String key : testImplementation.its.keySet()) {
                itOverrides.put(key, (Function<Object[], BaseIt>) 
                    args -> {
                        return new BaseIt<R>(key + ": " + Arrays.toString(args), 
                            (Function<R, R>) testImplementation.its.get(key).apply(args)) {
                            @Override
                            public R performAction(
                                R store,
                                Function<R, R> actionCB,
                                ITTestResourceConfiguration testResourceConfiguration,
                                Object artifactory
                            ) {
                                return testAdapter.execute(store, actionCB, testResourceConfiguration, artifactory);
                            }
                        };
                    });
            }
        }
        return itOverrides;
    }
    
    // Similar methods for TDT and Describe-It patterns can be added here
    // For brevity, I'm showing the main BDD patterns
}
