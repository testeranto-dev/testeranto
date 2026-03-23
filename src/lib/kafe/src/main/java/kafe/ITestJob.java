package kafe;

import java.util.function.Function;

public interface ITestJob {
    Object toObj();
    Object getTest();
    Function<ITTestResourceConfiguration, Object> getRunner();
    IFinalResults receiveTestResourceConfig(ITTestResourceConfiguration testResourceConfig);
}
