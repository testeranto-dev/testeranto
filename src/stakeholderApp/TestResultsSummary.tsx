import React from "react";

export interface TestResultsSummaryProps {
  allTestResults: any;
  onTestResultClick: (
    configKey: string,
    testName: string,
    testData: any,
  ) => void;
}

export const TestResultsSummary: React.FC<TestResultsSummaryProps> = ({
  allTestResults,
  onTestResultClick,
}) => {
  if (!allTestResults || Object.keys(allTestResults).length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: "30px" }}>
      <h3>Test Results Summary</h3>
      {Object.entries(allTestResults).map(([configKey, tests]) => (
        <div key={configKey} style={{ marginBottom: "20px" }}>
          <h4>{configKey}</h4>
          {Object.entries(tests as Record<string, any>).map(
            ([testName, testData]) => (
              <div
                key={testName}
                style={{
                  padding: "10px",
                  marginBottom: "10px",
                  backgroundColor: testData.failed ? "#ffebee" : "#e8f5e9",
                  borderRadius: "5px",
                  border: "1px solid #ddd",
                  cursor: "pointer",
                }}
                onClick={() => onTestResultClick(configKey, testName, testData)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <strong>{testName}</strong>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: testData.failed ? "#f44336" : "#4caf50",
                    }}
                  >
                    {testData.failed ? "❌ Failed" : "✅ Passed"}
                  </span>
                </div>
                <div style={{ fontSize: "14px", marginTop: "5px" }}>
                  <div>Total Tests: {testData.runTimeTests || 0}</div>
                  <div>Failures: {testData.fails || 0}</div>
                  {testData.features && (
                    <div>Features: {testData.features.length}</div>
                  )}
                </div>
                {testData.features && testData.features.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                      Features:
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "5px",
                        marginTop: "5px",
                      }}
                    >
                      {testData.features
                        .slice(0, 3)
                        .map((feature: string, i: number) => (
                          <span
                            key={i}
                            style={{
                              backgroundColor: "#e3f2fd",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              fontSize: "11px",
                            }}
                          >
                            {feature}
                          </span>
                        ))}
                      {testData.features.length > 3 && (
                        <span
                          style={{
                            backgroundColor: "#f5f5f5",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            fontSize: "11px",
                          }}
                        >
                          +{testData.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      ))}
    </div>
  );
};
