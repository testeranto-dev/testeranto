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
    
    // Similar methods for TDT and Describe-It patterns can be added here
    // For brevity, I'm showing the main BDD patterns
}
