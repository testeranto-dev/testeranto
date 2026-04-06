package kafe;

// Test specification function type
public interface ITestSpecification {
    Object apply(Object suites, Object givens, Object whens, Object thens,
                 Object describes, Object its, Object confirms, Object values, Object shoulds);
}
