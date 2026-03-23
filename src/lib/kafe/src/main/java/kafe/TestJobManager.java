package kafe;

import java.util.*;
import java.util.function.Function;

public class TestJobManager<I, S, R, Sel> {
    private final Kafe<I, S, R, Sel> kafe;
    
    public TestJobManager(Kafe<I, S, R, Sel> kafe) {
        this.kafe = kafe;
    }
    
    public int calculateTotalTests() {
        int total = 0;
        if (kafe.specs instanceof List) {
            List<?> specsList = (List<?>) kafe.specs;
            for (Object suite : specsList) {
                if (suite instanceof BaseSuite) {
                    BaseSuite baseSuite = (BaseSuite) suite;
                    total += baseSuite.givens.size();
                }
            }
        }
        return total;
    }
    
    public List<ITestJob> initializeTestJobs() {
        List<ITestJob> testJobs = new ArrayList<>();
        if (kafe.specs instanceof List) {
            List<?> specsList = (List<?>) kafe.specs;
            for (Object suiteObj : specsList) {
                if (suiteObj instanceof BaseSuite) {
                    BaseSuite suite = (BaseSuite) suiteObj;
                    suite.setParent(kafe);
                    
                    Function<ITTestResourceConfiguration, Object> runner = (testResourceConfig) -> {
                        try {
                            return suite.run(null, testResourceConfig);
                        } catch (Exception e) {
                            System.err.println(e.getMessage());
                            e.printStackTrace();
                            throw e;
                        }
                    };
                    
                    ITestJob testJob = new ITestJob() {
                        @Override
                        public Object toObj() {
                            return suite.toObj();
                        }
                        
                        @Override
                        public Object getTest() {
                            return suite;
                        }
                        
                        @Override
                        public Function<ITTestResourceConfiguration, Object> getRunner() {
                            return runner;
                        }
                        
                        @Override
                        public IFinalResults receiveTestResourceConfig(ITTestResourceConfiguration testResourceConfig) {
                            try {
                                BaseSuite suiteDone = (BaseSuite) runner.apply(testResourceConfig);
                                int fails = suiteDone.fails;
                                String reportJson = testResourceConfig.fs + "/tests.json";
                                IFinalResults results = new IFinalResults(
                                    fails > 0,
                                    fails,
                                    new ArrayList<>(),
                                    suiteDone.features(),
                                    0,
                                    kafe.totalTests,
                                    toObj()
                                );
                                kafe.writeFileSync(reportJson, results.toString());
                                return results;
                            } catch (Exception e) {
                                System.err.println(e.getMessage());
                                e.printStackTrace();
                                return new IFinalResults(
                                    true,
                                    -1,
                                    new ArrayList<>(),
                                    new ArrayList<>(),
                                    0,
                                    -1,
                                    toObj()
                                );
                            }
                        }
                    };
                    testJobs.add(testJob);
                }
            }
        }
        return testJobs;
    }
}
