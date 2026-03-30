// src/stakeholderApp/index.tsx
import React12, { useState } from "react";
import ReactDOM from "react-dom/client";

// src/stakeholderApp/stateless/fileUtils.ts
function getLanguageFromPath(path) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext) return "text";
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "py":
      return "python";
    case "rb":
      return "ruby";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "java":
      return "java";
    case "html":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    case "md":
      return "markdown";
    case "yml":
    case "yaml":
      return "yaml";
    case "xml":
      return "xml";
    case "sh":
      return "bash";
    case "log":
      return "log";
    default:
      return "text";
  }
}

// src/stakeholderApp/stateless/createFileContentFromNode.ts
function createFileContentFromNode(node, embeddedData) {
  if (node.type === "file") {
    if (embeddedData && embeddedData.fileContents && embeddedData.fileContents[node.path]) {
      const content = embeddedData.fileContents[node.path];
      const language = getLanguageFromPath(node.path);
      return {
        type: "file",
        path: node.path,
        name: node.name,
        content,
        language,
        size: content.length,
        fileType: node.fileType
      };
    } else if (embeddedData && embeddedData.documentation && embeddedData.documentation.contents && embeddedData.documentation.contents[node.path]) {
      const content = embeddedData.documentation.contents[node.path];
      return {
        type: "documentation",
        path: node.path,
        name: node.name,
        content,
        language: "markdown",
        size: content.length
      };
    } else {
      return {
        type: "file",
        path: node.path,
        name: node.name,
        message: `File content not embedded: ${node.path}`,
        fileType: node.fileType
      };
    }
  } else if (node.fileType === "documentation") {
    if (embeddedData && embeddedData.documentation && embeddedData.documentation.contents && embeddedData.documentation.contents[node.path]) {
      const content = embeddedData.documentation.contents[node.path];
      return {
        type: "documentation",
        path: node.path,
        name: node.name,
        content,
        language: "markdown",
        size: content.length
      };
    } else {
      return {
        type: "documentation",
        path: node.path,
        name: node.name,
        message: `Documentation file: ${node.path}. Content not embedded.`
      };
    }
  } else if (node.type === "test") {
    return {
      type: "test",
      path: node.path,
      name: node.name,
      bddStatus: node.bddStatus || { status: "unknown", color: "gray" },
      children: node.children
    };
  } else if (node.type === "feature") {
    return {
      type: "feature",
      path: node.path,
      name: node.name,
      feature: node.feature,
      status: node.status || "unknown"
    };
  } else if (node.type === "directory") {
    return {
      type: "directory",
      path: node.path,
      name: node.name,
      children: node.children
    };
  } else {
    return null;
  }
}

// src/stakeholderApp/stateless/setUtils.ts
function togglePathInSet(currentSet, path) {
  const newSet = new Set(currentSet);
  if (newSet.has(path)) {
    newSet.delete(path);
  } else {
    newSet.add(path);
  }
  return newSet;
}

// src/stakeholderApp/TabNavigation.tsx
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
var TabNavigation = ({
  activeTab,
  onTabChange
}) => {
  const getTabButtonStyle = (isActive) => ({
    padding: "10px 20px",
    border: "none",
    background: isActive ? "#007acc" : "#f0f0f0",
    color: isActive ? "white" : "#333",
    cursor: "pointer",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "14px"
  });
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "10px", marginBottom: "20px" }, children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        style: getTabButtonStyle(activeTab === "tree"),
        onClick: () => onTabChange("tree"),
        children: "File Tree"
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        style: getTabButtonStyle(activeTab === "viz"),
        onClick: () => onTabChange("viz"),
        children: "Visualizations"
      }
    )
  ] });
};

// src/stakeholderApp/TestResultsSummary.tsx
import "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var TestResultsSummary = ({
  allTestResults,
  onTestResultClick
}) => {
  if (!allTestResults || Object.keys(allTestResults).length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsxs2("div", { style: { marginTop: "30px" }, children: [
    /* @__PURE__ */ jsx2("h3", { children: "Test Results Summary" }),
    Object.entries(allTestResults).map(([configKey, tests]) => /* @__PURE__ */ jsxs2("div", { style: { marginBottom: "20px" }, children: [
      /* @__PURE__ */ jsx2("h4", { children: configKey }),
      Object.entries(tests).map(
        ([testName, testData]) => /* @__PURE__ */ jsxs2(
          "div",
          {
            style: {
              padding: "10px",
              marginBottom: "10px",
              backgroundColor: testData.failed ? "#ffebee" : "#e8f5e9",
              borderRadius: "5px",
              border: "1px solid #ddd",
              cursor: "pointer"
            },
            onClick: () => onTestResultClick(configKey, testName, testData),
            children: [
              /* @__PURE__ */ jsxs2(
                "div",
                {
                  style: {
                    display: "flex",
                    justifyContent: "space-between"
                  },
                  children: [
                    /* @__PURE__ */ jsx2("strong", { children: testName }),
                    /* @__PURE__ */ jsx2(
                      "span",
                      {
                        style: {
                          fontWeight: "bold",
                          color: testData.failed ? "#f44336" : "#4caf50"
                        },
                        children: testData.failed ? "\u274C Failed" : "\u2705 Passed"
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxs2("div", { style: { fontSize: "14px", marginTop: "5px" }, children: [
                /* @__PURE__ */ jsxs2("div", { children: [
                  "Total Tests: ",
                  testData.runTimeTests || 0
                ] }),
                /* @__PURE__ */ jsxs2("div", { children: [
                  "Failures: ",
                  testData.fails || 0
                ] }),
                testData.features && /* @__PURE__ */ jsxs2("div", { children: [
                  "Features: ",
                  testData.features.length
                ] })
              ] }),
              testData.features && testData.features.length > 0 && /* @__PURE__ */ jsxs2("div", { style: { marginTop: "10px" }, children: [
                /* @__PURE__ */ jsx2("div", { style: { fontSize: "12px", fontWeight: "bold" }, children: "Features:" }),
                /* @__PURE__ */ jsxs2(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "5px",
                      marginTop: "5px"
                    },
                    children: [
                      testData.features.slice(0, 3).map((feature, i) => /* @__PURE__ */ jsx2(
                        "span",
                        {
                          style: {
                            backgroundColor: "#e3f2fd",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            fontSize: "11px"
                          },
                          children: feature
                        },
                        i
                      )),
                      testData.features.length > 3 && /* @__PURE__ */ jsxs2(
                        "span",
                        {
                          style: {
                            backgroundColor: "#f5f5f5",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            fontSize: "11px"
                          },
                          children: [
                            "+",
                            testData.features.length - 3,
                            " more"
                          ]
                        }
                      )
                    ]
                  }
                )
              ] })
            ]
          },
          testName
        )
      )
    ] }, configKey))
  ] });
};

// src/stakeholderApp/TreePanel.tsx
import "react";

// src/stakeholderApp/stateless/TreeView.tsx
import "react";

// src/server/serverClasses/StakeholderUtils.tsx
import "react";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var getNodeIcon = (node) => {
  let icon = "\u{1F4C4}";
  let color = "#333";
  let bgColor = "transparent";
  if (node.fileType === "documentation") {
    icon = "\u{1F4DA}";
    color = "#4caf50";
  } else if (node.fileType === "test-results") {
    icon = "\u{1F9EA}";
    color = "#ff9800";
  } else if (node.fileType === "log") {
    icon = "\u{1F4DD}";
    color = "#795548";
  } else if (node.fileType === "test-directory") {
    icon = "\u{1F4C1}";
    color = "#9c27b0";
  } else if (node.fileType === "test-source") {
    icon = "\u{1F9EA}";
    color = "#9c27b0";
  } else if (node.fileType === "test-artifact") {
    icon = "\u{1F4CE}";
    color = "#795548";
  } else if (node.fileType === "html") {
    icon = "\u{1F310}";
    color = "#2196f3";
  } else if (node.fileType === "javascript") {
    icon = "\u{1F4DC}";
    color = "#ff9800";
  }
  if (node.type === "directory") {
    icon = "\u{1F4C1}";
    color = "#007acc";
  } else if (node.type === "feature") {
    icon = "\u2B50";
    color = "#ff9800";
  } else if (node.type === "test-summary") {
    icon = "\u{1F4CA}";
    color = "#2196f3";
  } else if (node.type === "test-job") {
    icon = "\u{1F4CB}";
    color = "#9c27b0";
  } else if (node.type === "test-given") {
    icon = "\u{1F4DD}";
    color = "#4caf50";
  } else if (node.type === "test-when") {
    icon = "\u26A1";
    color = "#ff9800";
  } else if (node.type === "test-then") {
    icon = "\u2705";
    color = "#f44336";
  }
  return { icon, color, bgColor };
};

// src/stakeholderApp/stateless/nodeStyleUtils.ts
function getNodeBackgroundColor(node, selectedFile) {
  if (selectedFile === node.path) {
    if (node.fileType === "documentation") {
      return "#e8f5e9";
    }
    if (node.type === "feature") {
      return "#fff3e0";
    }
    if (node.type === "test") {
      return "#e3f2fd";
    }
    return "transparent";
  }
  return "transparent";
}

// src/stakeholderApp/stateless/TreeView.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var TreeView = ({
  node,
  depth = 0,
  expandedPaths,
  selectedFile,
  onToggleExpand,
  onFileSelect
}) => {
  if (!node) return null;
  const paddingLeft = depth * 20;
  const isExpanded = expandedPaths.has(node.path);
  if (node.type === "directory") {
    return /* @__PURE__ */ jsxs4(
      "div",
      {
        style: { marginLeft: paddingLeft, marginBottom: "5px" },
        children: [
          /* @__PURE__ */ jsxs4(
            "div",
            {
              style: {
                fontWeight: "bold",
                color: "#007acc",
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              },
              onClick: () => onToggleExpand(node.path),
              children: [
                /* @__PURE__ */ jsx4("span", { style: { marginRight: "5px" }, children: isExpanded ? "\u{1F4C2}" : "\u{1F4C1}" }),
                node.name,
                /* @__PURE__ */ jsxs4(
                  "span",
                  {
                    style: { fontSize: "0.8rem", marginLeft: "5px", color: "#666" },
                    children: [
                      "(",
                      Object.keys(node.children || {}).length,
                      " items)"
                    ]
                  }
                )
              ]
            }
          ),
          isExpanded && node.children && Object.keys(node.children).length > 0 && /* @__PURE__ */ jsx4("div", { style: { marginLeft: "10px" }, children: Object.values(node.children).map((child) => /* @__PURE__ */ jsx4(
            TreeView,
            {
              node: child,
              depth: depth + 1,
              expandedPaths,
              selectedFile,
              onToggleExpand,
              onFileSelect
            },
            child.path
          )) })
        ]
      },
      node.path
    );
  } else if (node.type === "file") {
    const { icon, color } = getNodeIcon(node);
    const bgColor = getNodeBackgroundColor(node, selectedFile);
    const hasChildren = node.children && Object.keys(node.children).length > 0;
    const isExpanded2 = expandedPaths.has(node.path);
    return /* @__PURE__ */ jsxs4(
      "div",
      {
        style: {
          marginLeft: paddingLeft,
          marginBottom: "3px",
          backgroundColor: bgColor,
          borderRadius: "4px",
          padding: "5px",
          cursor: "pointer"
        },
        children: [
          /* @__PURE__ */ jsxs4(
            "div",
            {
              style: { color, display: "flex", alignItems: "center" },
              onClick: () => onFileSelect(node),
              children: [
                /* @__PURE__ */ jsx4("span", { style: { marginRight: "5px" }, children: icon }),
                node.name,
                node.fileType && /* @__PURE__ */ jsxs4(
                  "span",
                  {
                    style: { fontSize: "0.8rem", marginLeft: "5px", color: "#666" },
                    children: [
                      "(",
                      node.fileType,
                      ")"
                    ]
                  }
                ),
                hasChildren && /* @__PURE__ */ jsx4(
                  "span",
                  {
                    style: {
                      marginLeft: "5px",
                      fontSize: "0.8rem",
                      cursor: "pointer"
                    },
                    onClick: (e) => {
                      e.stopPropagation();
                      onToggleExpand(node.path);
                    },
                    children: isExpanded2 ? "\u25BC" : "\u25B6"
                  }
                )
              ]
            }
          ),
          hasChildren && isExpanded2 && /* @__PURE__ */ jsx4("div", { style: { marginLeft: "10px", marginTop: "5px" }, children: Object.values(node.children).map((child) => /* @__PURE__ */ jsx4(
            TreeView,
            {
              node: child,
              depth: depth + 1,
              expandedPaths,
              selectedFile,
              onToggleExpand,
              onFileSelect
            },
            child.path
          )) })
        ]
      },
      node.path
    );
  } else if (node.type === "feature") {
    const bgColor = getNodeBackgroundColor(node, selectedFile);
    return /* @__PURE__ */ jsx4(
      "div",
      {
        style: {
          marginLeft: paddingLeft,
          marginBottom: "3px",
          backgroundColor: bgColor,
          borderRadius: "4px",
          padding: "5px"
        },
        children: /* @__PURE__ */ jsxs4("div", { style: { color: "#ff9800", display: "flex", alignItems: "center" }, children: [
          /* @__PURE__ */ jsx4("span", { style: { marginRight: "5px" }, children: "\u2B50" }),
          node.name,
          node.status && /* @__PURE__ */ jsxs4(
            "span",
            {
              style: {
                fontSize: "0.8rem",
                marginLeft: "5px",
                color: "#666"
              },
              children: [
                "(status: ",
                node.status,
                ")"
              ]
            }
          )
        ] })
      },
      node.path
    );
  } else if (node.type === "test") {
    const bgColor = getNodeBackgroundColor(node, selectedFile);
    const status = node.bddStatus || { status: "unknown", color: "gray" };
    return /* @__PURE__ */ jsxs4(
      "div",
      {
        style: {
          marginLeft: paddingLeft,
          marginBottom: "3px",
          backgroundColor: bgColor,
          borderRadius: "4px",
          padding: "5px",
          cursor: "pointer"
        },
        onClick: () => onFileSelect(node),
        children: [
          /* @__PURE__ */ jsxs4("div", { style: { color: "#9c27b0", display: "flex", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx4("span", { style: { marginRight: "5px" }, children: "\u{1F9EA}" }),
            node.name,
            /* @__PURE__ */ jsxs4(
              "span",
              {
                style: {
                  fontSize: "0.8rem",
                  marginLeft: "5px",
                  color: status.color === "green" ? "#4caf50" : status.color === "yellow" ? "#ff9800" : status.color === "red" ? "#f44336" : "#666",
                  fontWeight: "bold"
                },
                children: [
                  "(BDD: ",
                  status.status,
                  ")"
                ]
              }
            )
          ] }),
          node.children && Object.keys(node.children).length > 0 && /* @__PURE__ */ jsx4("div", { style: { marginLeft: "10px", marginTop: "5px" }, children: Object.values(node.children).map((child) => /* @__PURE__ */ jsx4(
            TreeView,
            {
              node: child,
              depth: depth + 1,
              expandedPaths,
              selectedFile,
              onToggleExpand,
              onFileSelect
            },
            child.path
          )) })
        ]
      },
      node.path
    );
  }
  return null;
};

// src/stakeholderApp/stateless/renderFileContent.tsx
import "react";

// src/stakeholderApp/stateless/helpers.tsx
import "react";

// src/stakeholderApp/stateless/renderFileContentFile.tsx
import "react";
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function renderFileContentFile(selectedFile, selectedFileContent) {
  const isDocumentation = selectedFileContent.type === "documentation";
  const title = isDocumentation ? "Documentation" : "File";
  return /* @__PURE__ */ jsxs5("div", { style: { marginTop: "20px" }, children: [
    /* @__PURE__ */ jsxs5("h3", { children: [
      title,
      ": ",
      selectedFile?.split("/").pop()
    ] }),
    /* @__PURE__ */ jsxs5("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "10px" }, children: [
      /* @__PURE__ */ jsxs5("div", { children: [
        "Path: ",
        selectedFileContent.path
      ] }),
      /* @__PURE__ */ jsxs5("div", { children: [
        "Size: ",
        selectedFileContent.size || (selectedFileContent.content?.length || 0),
        " characters"
      ] }),
      selectedFileContent.language && /* @__PURE__ */ jsxs5("div", { children: [
        "Language: ",
        selectedFileContent.language
      ] })
    ] }),
    selectedFileContent.content ? /* @__PURE__ */ jsx5("div", { children: /* @__PURE__ */ jsx5(
      "pre",
      {
        style: {
          backgroundColor: "#f5f5f5",
          padding: "15px",
          borderRadius: "4px",
          overflow: "auto",
          maxHeight: "500px",
          border: "1px solid #ddd",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          fontFamily: "monospace",
          fontSize: "14px",
          margin: 0
        },
        children: selectedFileContent.content
      }
    ) }) : selectedFileContent.message ? /* @__PURE__ */ jsxs5(
      "div",
      {
        style: {
          backgroundColor: "#f9f9f9",
          padding: "20px",
          borderRadius: "4px",
          border: "1px solid #ddd"
        },
        children: [
          /* @__PURE__ */ jsx5("p", { children: selectedFileContent.message }),
          /* @__PURE__ */ jsxs5("p", { children: [
            "Path: ",
            selectedFileContent.path
          ] }),
          isDocumentation && /* @__PURE__ */ jsx5("p", { children: "Note: Documentation content was not embedded in the static site." })
        ]
      }
    ) : /* @__PURE__ */ jsx5(
      "div",
      {
        style: {
          backgroundColor: "#ffebee",
          padding: "20px",
          borderRadius: "4px",
          border: "1px solid #f44336"
        },
        children: /* @__PURE__ */ jsx5("p", { children: "No content available for this file." })
      }
    )
  ] });
}

// src/stakeholderApp/stateless/renderTestDetails.tsx
import "react";
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";

// src/stakeholderApp/stateless/renderFileContent.tsx
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function renderFileContent({
  selectedFile,
  selectedFileContent
}) {
  if (!selectedFile) return null;
  if (!selectedFileContent) {
    return /* @__PURE__ */ jsxs7("div", { style: { marginTop: "20px" }, children: [
      /* @__PURE__ */ jsxs7("h3", { children: [
        "No content available for ",
        selectedFile
      ] }),
      /* @__PURE__ */ jsx7("p", { children: "The file exists in the tree but its content could not be loaded." })
    ] });
  }
  switch (selectedFileContent.type) {
    case "file":
    case "documentation":
      return renderFileContentFile(
        selectedFile,
        selectedFileContent
      );
    case "test":
      return /* @__PURE__ */ jsxs7("div", { style: { marginTop: "20px" }, children: [
        /* @__PURE__ */ jsxs7("h3", { children: [
          "Test: ",
          selectedFileContent.name
        ] }),
        /* @__PURE__ */ jsx7(
          "div",
          {
            style: {
              padding: "15px",
              backgroundColor: selectedFileContent.bddStatus.color === "green" ? "#e8f5e9" : selectedFileContent.bddStatus.color === "yellow" ? "#fff3e0" : selectedFileContent.bddStatus.color === "red" ? "#ffebee" : "#f5f5f5",
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #ddd"
            },
            children: /* @__PURE__ */ jsxs7("div", { style: { display: "flex", flexWrap: "wrap", gap: "20px" }, children: [
              /* @__PURE__ */ jsxs7("div", { children: [
                /* @__PURE__ */ jsx7("strong", { children: "BDD Status:" }),
                " ",
                selectedFileContent.bddStatus.status
              ] }),
              /* @__PURE__ */ jsxs7("div", { children: [
                /* @__PURE__ */ jsx7("strong", { children: "Path:" }),
                " ",
                selectedFileContent.path
              ] })
            ] })
          }
        ),
        selectedFileContent.children && /* @__PURE__ */ jsxs7("div", { children: [
          /* @__PURE__ */ jsx7("h4", { children: "Test Details" }),
          /* @__PURE__ */ jsx7("div", { style: { marginLeft: "20px" }, children: Object.values(selectedFileContent.children).map((child, i) => /* @__PURE__ */ jsx7("div", { style: { marginBottom: "10px" }, children: JSON.stringify(child, null, 2) }, i)) })
        ] })
      ] });
    case "feature":
      return /* @__PURE__ */ jsxs7("div", { style: { marginTop: "20px" }, children: [
        /* @__PURE__ */ jsxs7("h3", { children: [
          "Feature: ",
          selectedFileContent.name
        ] }),
        /* @__PURE__ */ jsx7(
          "div",
          {
            style: {
              padding: "15px",
              backgroundColor: "#fff3e0",
              borderRadius: "4px",
              border: "1px solid #ff9800"
            },
            children: /* @__PURE__ */ jsxs7("div", { style: { display: "flex", flexWrap: "wrap", gap: "20px" }, children: [
              /* @__PURE__ */ jsxs7("div", { children: [
                /* @__PURE__ */ jsx7("strong", { children: "Feature:" }),
                " ",
                selectedFileContent.feature
              ] }),
              /* @__PURE__ */ jsxs7("div", { children: [
                /* @__PURE__ */ jsx7("strong", { children: "Status:" }),
                " ",
                selectedFileContent.status
              ] }),
              /* @__PURE__ */ jsxs7("div", { children: [
                /* @__PURE__ */ jsx7("strong", { children: "Path:" }),
                " ",
                selectedFileContent.path
              ] })
            ] })
          }
        )
      ] });
    case "directory":
      return /* @__PURE__ */ jsxs7("div", { style: { marginTop: "20px" }, children: [
        /* @__PURE__ */ jsxs7("h3", { children: [
          "Directory: ",
          selectedFileContent.name
        ] }),
        /* @__PURE__ */ jsx7(
          "div",
          {
            style: {
              padding: "15px",
              backgroundColor: "#e3f2fd",
              borderRadius: "4px",
              border: "1px solid #2196f3"
            },
            children: /* @__PURE__ */ jsxs7("div", { style: { display: "flex", flexWrap: "wrap", gap: "20px" }, children: [
              /* @__PURE__ */ jsxs7("div", { children: [
                /* @__PURE__ */ jsx7("strong", { children: "Path:" }),
                " ",
                selectedFileContent.path
              ] }),
              /* @__PURE__ */ jsxs7("div", { children: [
                /* @__PURE__ */ jsx7("strong", { children: "Items:" }),
                " ",
                Object.keys(selectedFileContent.children || {}).length
              ] })
            ] })
          }
        )
      ] });
    default:
      return /* @__PURE__ */ jsxs7("div", { style: { marginTop: "20px" }, children: [
        /* @__PURE__ */ jsx7("h3", { children: "File Content" }),
        /* @__PURE__ */ jsx7(
          "pre",
          {
            style: {
              backgroundColor: "#f5f5f5",
              padding: "10px",
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "400px"
            },
            children: JSON.stringify(selectedFileContent, null, 2)
          }
        )
      ] });
  }
}

// src/stakeholderApp/TreePanel.tsx
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
var TreePanel = ({
  featureTree,
  expandedPaths,
  selectedFile,
  onToggleExpand,
  onFileSelect,
  selectedFileContent,
  configs,
  allTestResults,
  onTestResultClick
}) => {
  return /* @__PURE__ */ jsxs8("div", { style: { display: "flex", gap: "20px" }, children: [
    /* @__PURE__ */ jsx8(
      "div",
      {
        style: {
          flex: "0 0 300px",
          borderRight: "1px solid #ddd",
          paddingRight: "20px"
        },
        children: /* @__PURE__ */ jsx8(
          "div",
          {
            style: {
              border: "1px solid #ddd",
              padding: "15px",
              background: "#f9f9f9",
              maxHeight: "600px",
              overflow: "auto"
            },
            children: featureTree ? /* @__PURE__ */ jsx8(
              TreeView,
              {
                node: featureTree,
                expandedPaths,
                selectedFile,
                onToggleExpand,
                onFileSelect
              }
            ) : /* @__PURE__ */ jsx8("div", { children: /* @__PURE__ */ jsx8("p", { children: "No feature tree available. The tree should show documentation files in their proper folder structure." }) })
          }
        )
      }
    ),
    /* @__PURE__ */ jsxs8("div", { style: { flex: "1" }, children: [
      selectedFile && /* @__PURE__ */ jsxs8(
        "div",
        {
          style: {
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#e3f2fd",
            borderRadius: "4px"
          },
          children: [
            /* @__PURE__ */ jsx8("strong", { children: "Selected:" }),
            " ",
            selectedFile
          ]
        }
      ),
      renderFileContent({ selectedFile, selectedFileContent }),
      !selectedFile && /* @__PURE__ */ jsxs8("div", { children: [
        /* @__PURE__ */ jsx8("h3", { children: "Configuration" }),
        configs?.runtimes ? /* @__PURE__ */ jsxs8("div", { children: [
          /* @__PURE__ */ jsxs8("p", { children: [
            "Found ",
            Object.keys(configs.runtimes).length,
            " runtimes:"
          ] }),
          Object.entries(configs.runtimes).map(
            ([key, runtime]) => /* @__PURE__ */ jsxs8(
              "div",
              {
                style: {
                  marginBottom: "10px",
                  padding: "5px",
                  borderLeft: "3px solid #007acc"
                },
                children: [
                  /* @__PURE__ */ jsx8("strong", { children: key }),
                  " (",
                  runtime.runtime,
                  ")",
                  /* @__PURE__ */ jsxs8("div", { style: { marginLeft: "10px" }, children: [
                    "Tests: ",
                    runtime.tests?.length || 0,
                    runtime.tests?.map((test, i) => {
                      const testResult = allTestResults?.[key]?.[test];
                      return /* @__PURE__ */ jsxs8(
                        "div",
                        {
                          style: {
                            fontSize: "12px",
                            marginBottom: "5px",
                            padding: "3px",
                            backgroundColor: testResult ? testResult.failed ? "#ffebee" : "#e8f5e9" : "#f5f5f5",
                            borderRadius: "3px"
                          },
                          children: [
                            /* @__PURE__ */ jsxs8(
                              "div",
                              {
                                style: {
                                  display: "flex",
                                  justifyContent: "space-between"
                                },
                                children: [
                                  /* @__PURE__ */ jsx8("span", { children: test }),
                                  testResult && /* @__PURE__ */ jsx8(
                                    "span",
                                    {
                                      style: {
                                        fontWeight: "bold",
                                        color: testResult.failed ? "#f44336" : "#4caf50"
                                      },
                                      children: testResult.failed ? "\u274C Failed" : "\u2705 Passed"
                                    }
                                  )
                                ]
                              }
                            ),
                            testResult && /* @__PURE__ */ jsxs8(
                              "div",
                              {
                                style: {
                                  fontSize: "11px",
                                  marginTop: "2px"
                                },
                                children: [
                                  "Tests: ",
                                  testResult.runTimeTests || 0,
                                  " | Fails:",
                                  " ",
                                  testResult.fails || 0,
                                  " | Features:",
                                  " ",
                                  testResult.features?.length || 0
                                ]
                              }
                            )
                          ]
                        },
                        i
                      );
                    })
                  ] })
                ]
              },
              key
            )
          )
        ] }) : /* @__PURE__ */ jsx8("p", { children: "No configuration found" })
      ] })
    ] })
  ] });
};

// src/stakeholderApp/VisualizationPanel.tsx
import "react";

// src/stakeholderApp/stateless/featureGraphStats.ts
import "grafeovidajo";
function getFeatureGraphStats(featureGraph) {
  if (!featureGraph || !featureGraph.nodes) {
    return {
      totalFeatures: 0,
      dependencies: featureGraph?.edges?.length || 0,
      todo: 0,
      doing: 0,
      done: 0
    };
  }
  const nodes = featureGraph.nodes;
  const todo = nodes.filter((n) => n.attributes?.status === "todo").length;
  const doing = nodes.filter((n) => n.attributes?.status === "doing").length;
  const done = nodes.filter((n) => n.attributes?.status === "done").length;
  return {
    totalFeatures: nodes.length,
    dependencies: featureGraph.edges?.length || 0,
    todo,
    doing,
    done
  };
}

// src/stakeholderApp/stateless/renderVisualization.tsx
import "react";
import { EisenhowerMatrix, GanttChart, KanbanBoard, TreeGraph } from "grafeovidajo";
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
function renderVisualization({
  data,
  vizType,
  onNodeClick,
  onNodeHover
}) {
  if (!data.featureGraph || !data.featureGraph.nodes || data.featureGraph.nodes.length === 0) {
    return /* @__PURE__ */ jsxs9("div", { style: { padding: "40px", textAlign: "center" }, children: [
      /* @__PURE__ */ jsx9("h3", { children: "No Feature Graph Available" }),
      /* @__PURE__ */ jsx9("p", { children: "Features need to be extracted from test results to create visualizations." }),
      /* @__PURE__ */ jsx9("p", { children: "Run tests to generate feature data." })
    ] });
  }
  const graphData = {
    nodes: data.featureGraph.nodes,
    edges: data.featureGraph.edges || []
  };
  const baseConfig = data.vizConfig || {
    projection: {
      xAttribute: "status",
      yAttribute: "points",
      xType: "categorical",
      yType: "continuous",
      layout: "grid"
    },
    style: {
      nodeSize: (node) => {
        if (node.attributes.points) return Math.max(10, node.attributes.points * 5);
        return 10;
      },
      nodeColor: (node) => {
        const status = node.attributes.status;
        if (status === "done") return "#4caf50";
        if (status === "doing") return "#ff9800";
        if (status === "todo") return "#f44336";
        return "#9e9e9e";
      },
      nodeShape: "circle",
      labels: {
        show: true,
        attribute: "name",
        fontSize: 12
      }
    }
  };
  const commonProps = {
    data: graphData,
    width: 800,
    height: 500,
    onNodeClick: onNodeClick || (() => {
    }),
    onNodeHover: onNodeHover || (() => {
    })
  };
  switch (vizType) {
    case "eisenhower":
      return /* @__PURE__ */ jsxs9("div", { children: [
        /* @__PURE__ */ jsx9("h3", { children: "Eisenhower Matrix" }),
        /* @__PURE__ */ jsx9("p", { children: "Urgency vs Importance of features" }),
        /* @__PURE__ */ jsx9(
          EisenhowerMatrix,
          {
            ...commonProps,
            config: {
              ...baseConfig,
              projection: {
                ...baseConfig.projection,
                xAttribute: "urgency",
                yAttribute: "importance",
                xType: "continuous",
                yType: "continuous"
              },
              quadrants: {
                urgentImportant: { x: [0, 0.5], y: [0, 0.5] },
                notUrgentImportant: { x: [0.5, 1], y: [0, 0.5] },
                urgentNotImportant: { x: [0, 0.5], y: [0.5, 1] },
                notUrgentNotImportant: { x: [0.5, 1], y: [0.5, 1] }
              }
            }
          }
        )
      ] });
    case "gantt":
      return /* @__PURE__ */ jsxs9("div", { children: [
        /* @__PURE__ */ jsx9("h3", { children: "Gantt Chart" }),
        /* @__PURE__ */ jsx9("p", { children: "Feature timeline" }),
        /* @__PURE__ */ jsx9(
          GanttChart,
          {
            ...commonProps,
            config: {
              ...baseConfig,
              timeRange: [/* @__PURE__ */ new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)],
              rowHeight: 30,
              showDependencies: true
            }
          }
        )
      ] });
    case "kanban":
      return /* @__PURE__ */ jsxs9("div", { children: [
        /* @__PURE__ */ jsx9("h3", { children: "Kanban Board" }),
        /* @__PURE__ */ jsx9("p", { children: "Feature status columns" }),
        /* @__PURE__ */ jsx9(
          KanbanBoard,
          {
            ...commonProps,
            config: {
              ...baseConfig,
              columns: [
                {
                  id: "todo",
                  title: "To Do",
                  statusFilter: (node) => node.attributes.status === "todo",
                  width: 25
                },
                {
                  id: "doing",
                  title: "Doing",
                  statusFilter: (node) => node.attributes.status === "doing",
                  width: 25
                },
                {
                  id: "review",
                  title: "Review",
                  statusFilter: (node) => node.attributes.status === "review",
                  width: 25
                },
                {
                  id: "done",
                  title: "Done",
                  statusFilter: (node) => node.attributes.status === "done",
                  width: 25
                }
              ]
            }
          }
        )
      ] });
    case "tree":
      return /* @__PURE__ */ jsxs9("div", { children: [
        /* @__PURE__ */ jsx9("h3", { children: "Feature Dependency Tree" }),
        /* @__PURE__ */ jsx9("p", { children: "Feature relationships" }),
        /* @__PURE__ */ jsx9(
          TreeGraph,
          {
            ...commonProps,
            config: {
              ...baseConfig,
              projection: {
                ...baseConfig.projection,
                layout: "tree"
              },
              orientation: "horizontal",
              nodeSeparation: 100,
              levelSeparation: 80
            }
          }
        )
      ] });
    case "file-tree":
      const fileTreeData = data.fileTreeGraph || data.featureGraph;
      if (!fileTreeData || !fileTreeData.nodes || fileTreeData.nodes.length === 0) {
        return /* @__PURE__ */ jsxs9("div", { style: { padding: "40px", textAlign: "center" }, children: [
          /* @__PURE__ */ jsx9("h3", { children: "No File Tree Graph Available" }),
          /* @__PURE__ */ jsx9("p", { children: "File tree data needs to be extracted to create visualizations." })
        ] });
      }
      return /* @__PURE__ */ jsxs9("div", { children: [
        /* @__PURE__ */ jsx9("h3", { children: "File Tree Structure" }),
        /* @__PURE__ */ jsx9("p", { children: "Hierarchical view of files and directories" }),
        /* @__PURE__ */ jsx9(
          TreeGraph,
          {
            data: fileTreeData,
            config: {
              projection: {
                layout: "tree",
                xAttribute: "depth",
                yAttribute: "name",
                xType: "continuous",
                yType: "categorical"
              },
              style: {
                nodeSize: (node) => {
                  const type = node.attributes.type;
                  if (type === "directory") return 15;
                  if (type === "file") return 10;
                  return 8;
                },
                nodeColor: (node) => {
                  const type = node.attributes.type;
                  if (type === "directory") return "#007acc";
                  if (type === "file") return "#4caf50";
                  if (type === "documentation") return "#ff9800";
                  return "#9e9e9e";
                },
                nodeShape: (node) => {
                  const type = node.attributes.type;
                  if (type === "directory") return "square";
                  return "circle";
                },
                labels: {
                  show: true,
                  attribute: "name",
                  fontSize: 12
                }
              }
            },
            width: 800,
            height: 500,
            onNodeClick: onNodeClick || (() => {
            }),
            onNodeHover: onNodeHover || (() => {
            })
          }
        )
      ] });
    default:
      return /* @__PURE__ */ jsx9("div", { children: "Select a visualization type" });
  }
}

// src/stakeholderApp/stateless/buttonStyleUtils.ts
function getVizButtonStyle(active) {
  return {
    padding: "8px 16px",
    backgroundColor: active ? "#4caf50" : "#f0f0f0",
    color: active ? "white" : "black",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  };
}

// src/stakeholderApp/VisualizationPanel.tsx
import { jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
var VisualizationPanel = ({
  data,
  vizType,
  onVizTypeChange,
  onNodeClick,
  onNodeHover
}) => {
  const stats = getFeatureGraphStats(data.featureGraph);
  return /* @__PURE__ */ jsxs10("div", { children: [
    /* @__PURE__ */ jsxs10("div", { style: { display: "flex", gap: "10px", marginBottom: "20px" }, children: [
      /* @__PURE__ */ jsx10(
        "button",
        {
          style: getVizButtonStyle(vizType === "eisenhower"),
          onClick: () => onVizTypeChange("eisenhower"),
          children: "Eisenhower Matrix"
        }
      ),
      /* @__PURE__ */ jsx10(
        "button",
        {
          style: getVizButtonStyle(vizType === "gantt"),
          onClick: () => onVizTypeChange("gantt"),
          children: "Gantt Chart"
        }
      ),
      /* @__PURE__ */ jsx10(
        "button",
        {
          style: getVizButtonStyle(vizType === "kanban"),
          onClick: () => onVizTypeChange("kanban"),
          children: "Kanban Board"
        }
      ),
      /* @__PURE__ */ jsx10(
        "button",
        {
          style: getVizButtonStyle(vizType === "tree"),
          onClick: () => onVizTypeChange("tree"),
          children: "Feature Tree"
        }
      ),
      /* @__PURE__ */ jsx10(
        "button",
        {
          style: getVizButtonStyle(vizType === "file-tree"),
          onClick: () => onVizTypeChange("file-tree"),
          children: "File Tree"
        }
      )
    ] }),
    renderVisualization({
      data,
      vizType,
      onNodeClick,
      onNodeHover
    }),
    /* @__PURE__ */ jsxs10(
      "div",
      {
        style: {
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px"
        },
        children: [
          /* @__PURE__ */ jsx10("h4", { children: "Feature Graph Statistics" }),
          /* @__PURE__ */ jsxs10("p", { children: [
            "Total Features: ",
            stats.totalFeatures
          ] }),
          /* @__PURE__ */ jsxs10("p", { children: [
            "Dependencies: ",
            stats.dependencies
          ] }),
          /* @__PURE__ */ jsx10("p", { children: "Features with status:" }),
          /* @__PURE__ */ jsxs10("ul", { children: [
            /* @__PURE__ */ jsxs10("li", { children: [
              "Todo: ",
              stats.todo
            ] }),
            /* @__PURE__ */ jsxs10("li", { children: [
              "Doing: ",
              stats.doing
            ] }),
            /* @__PURE__ */ jsxs10("li", { children: [
              "Done: ",
              stats.done
            ] })
          ] })
        ]
      }
    )
  ] });
};

// src/stakeholderApp/index.tsx
import { Fragment, jsx as jsx11, jsxs as jsxs11 } from "react/jsx-runtime";
var DefaultStakeholderApp = () => {
  const embeddedData = window.TESTERANTO_EMBEDDED_DATA;
  if (!embeddedData) {
    return /* @__PURE__ */ jsxs11("div", { style: { padding: "40px", textAlign: "center" }, children: [
      /* @__PURE__ */ jsx11("h1", { style: { color: "#d32f2f" }, children: "Error Loading Report" }),
      /* @__PURE__ */ jsx11("p", { children: "No embedded data found. The server may not have generated the report properly." }),
      /* @__PURE__ */ jsx11("p", { children: "Please make sure the Testeranto server has generated the report files." })
    ] });
  }
  const data = embeddedData;
  const [expandedPaths, setExpandedPaths] = useState(
    /* @__PURE__ */ new Set([".", "root"])
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileContent, setSelectedFileContent] = useState(null);
  const [activeTab, setActiveTab] = useState("tree");
  const [vizType, setVizType] = useState("file-tree");
  const toggleExpand = (path) => {
    setExpandedPaths(togglePathInSet(expandedPaths, path));
  };
  const handleFileSelect = (node) => {
    setSelectedFile(node.path);
    const content = createFileContentFromNode(node, embeddedData);
    setSelectedFileContent(content);
  };
  const handleTestResultClick = (configKey, testName, testData) => {
    setSelectedFile(`${configKey}/${testName}`);
    setSelectedFileContent(testData);
  };
  const handleNodeClick = (node) => {
    console.log("Node clicked:", node);
  };
  const handleNodeHover = (node) => {
  };
  return /* @__PURE__ */ jsx11(
    "div",
    {
      style: {
        padding: "20px",
        fontFamily: "sans-serif"
      },
      children: /* @__PURE__ */ jsxs11("div", { style: { marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsx11(TabNavigation, { activeTab, onTabChange: setActiveTab }),
        activeTab === "viz" && /* @__PURE__ */ jsx11(
          VisualizationPanel,
          {
            data,
            vizType,
            onVizTypeChange: setVizType,
            onNodeClick: handleNodeClick,
            onNodeHover: handleNodeHover
          }
        ),
        activeTab === "tree" && /* @__PURE__ */ jsxs11(Fragment, { children: [
          /* @__PURE__ */ jsx11(
            TreePanel,
            {
              featureTree: data.featureTree,
              expandedPaths,
              selectedFile,
              onToggleExpand: toggleExpand,
              onFileSelect: handleFileSelect,
              selectedFileContent,
              configs: data.configs,
              allTestResults: data.allTestResults,
              onTestResultClick: handleTestResultClick
            }
          ),
          !selectedFile && data.allTestResults && /* @__PURE__ */ jsx11(
            TestResultsSummary,
            {
              allTestResults: data.allTestResults,
              onTestResultClick: handleTestResultClick
            }
          )
        ] })
      ] })
    }
  );
};
function renderApp(rootElement) {
  const embeddedData = window.TESTERANTO_EMBEDDED_DATA;
  if (!embeddedData) {
    console.error("No stakeholder data available");
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h1 style="color: #d32f2f;">Error Loading Report</h1>
        <p>No embedded data found. The server may not have generated the report properly.</p>
        <p>Please make sure the Testeranto server has generated the report files.</p>
      </div>
    `;
    return;
  }
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    /* @__PURE__ */ jsx11(React12.StrictMode, { children: /* @__PURE__ */ jsx11(DefaultStakeholderApp, {}) })
  );
}
var index_default = DefaultStakeholderApp;
export {
  DefaultStakeholderApp,
  index_default as default,
  renderApp
};
