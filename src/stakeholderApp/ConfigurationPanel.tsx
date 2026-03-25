import React from "react";

export interface ConfigurationPanelProps {
  configs: any;
  allTestResults: any;
  onTestResultClick: (configKey: string, testName: string, testData: any) => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  configs,
  allTestResults,
  onTestResultClick,
}) => {
  return (
    <div>
      <h3>Configuration</h3>
      {configs?.runtimes ? (
        <div>
          <p>
            Found {Object.keys(configs.runtimes).length} runtimes:
          </p>
          {Object.entries(configs.runtimes).map(
            ([key, runtime]: [string, any]) => (
              <div
                key={key}
                style={{
                  marginBottom: "10px",
                  padding: "5px",
                  borderLeft: "3px solid #007acc",
                }}
              >
                <strong>{key}</strong> ({runtime.runtime})
                <div style={{ marginLeft: "10px" }}>
                  Tests: {runtime.tests?.length || 0}
                  {runtime.tests?.map((test: string, i: number) => {
                    const testResult = allTestResults?.[key]?.[test];
                    return (
                      <div
                        key={i}
                        style={{
                          fontSize: "12px",
                          marginBottom: "5px",
                          padding: "3px",
                          backgroundColor: testResult
                            ? testResult.failed
                              ? "#ffebee"
                              : "#e8f5e9"
                            : "#f5f5f5",
                          borderRadius: "3px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>{test}</span>
                          {testResult && (
                            <span
                              style={{
                                fontWeight: "bold",
                                color: testResult.failed
                                  ? "#f44336"
                                  : "#4caf50",
                              }}
                            >
                              {testResult.failed ? "❌ Failed" : "✅ Passed"}
                            </span>
                          )}
                        </div>
                        {testResult && (
                          <div
                            style={{
                              fontSize: "11px",
                              marginTop: "2px",
                            }}
                          >
                            Tests: {testResult.runTimeTests || 0} |
                            Fails: {testResult.fails || 0} |
                            Features: {testResult.features?.length || 0}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
          )}
        </div>
      ) : (
        <p>No configuration found</p>
      )}
    </div>
  );
};
