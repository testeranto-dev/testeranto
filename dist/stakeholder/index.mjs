// src/server/serverClasses/index.tsx
import React2, { useState } from "react";
import ReactDOM from "react-dom/client";

// src/server/serverClasses/StakeholderUtils.tsx
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
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

// src/server/serverClasses/index.tsx
import { EisenhowerMatrix, GanttChart, KanbanBoard, TreeGraph } from "grafeovidajo";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var DefaultStakeholderApp = ({
  data
}) => {
  const [expandedPaths, setExpandedPaths] = useState(
    /* @__PURE__ */ new Set([".", "root"])
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileContent, setSelectedFileContent] = useState(null);
  const [activeTab, setActiveTab] = useState("tree");
  const [vizType, setVizType] = useState("eisenhower");
  const toggleExpand = (path) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };
  const handleFileSelect = (node) => {
    setSelectedFile(node.path);
    if (node.type === "file") {
      const embeddedData = window.TESTERANTO_EMBEDDED_DATA;
      if (embeddedData && embeddedData.fileContents && embeddedData.fileContents[node.path]) {
        const content = embeddedData.fileContents[node.path];
        const ext = node.path.split(".").pop()?.toLowerCase();
        let language = "text";
        if (ext === "js" || ext === "jsx") language = "javascript";
        else if (ext === "ts" || ext === "tsx") language = "typescript";
        else if (ext === "py") language = "python";
        else if (ext === "rb") language = "ruby";
        else if (ext === "go") language = "go";
        else if (ext === "rs") language = "rust";
        else if (ext === "java") language = "java";
        else if (ext === "html") language = "html";
        else if (ext === "css") language = "css";
        else if (ext === "json") language = "json";
        else if (ext === "md") language = "markdown";
        else if (ext === "yml" || ext === "yaml") language = "yaml";
        else if (ext === "xml") language = "xml";
        else if (ext === "sh") language = "bash";
        else if (ext === "log") language = "log";
        setSelectedFileContent({
          type: "file",
          path: node.path,
          name: node.name,
          content,
          language,
          size: content.length,
          fileType: node.fileType
        });
      } else if (embeddedData && embeddedData.documentation && embeddedData.documentation.contents && embeddedData.documentation.contents[node.path]) {
        const content = embeddedData.documentation.contents[node.path];
        setSelectedFileContent({
          type: "documentation",
          path: node.path,
          name: node.name,
          content,
          language: "markdown",
          size: content.length
        });
      } else {
        setSelectedFileContent({
          type: "file",
          path: node.path,
          name: node.name,
          message: `File content not embedded: ${node.path}`,
          fileType: node.fileType
        });
      }
    } else if (node.fileType === "documentation") {
      const embeddedData = window.TESTERANTO_EMBEDDED_DATA;
      if (embeddedData && embeddedData.documentation && embeddedData.documentation.contents && embeddedData.documentation.contents[node.path]) {
        const content = embeddedData.documentation.contents[node.path];
        setSelectedFileContent({
          type: "documentation",
          path: node.path,
          name: node.name,
          content,
          language: "markdown",
          size: content.length
        });
      } else {
        setSelectedFileContent({
          type: "documentation",
          path: node.path,
          name: node.name,
          message: `Documentation file: ${node.path}. Content not embedded.`
        });
      }
    } else if (node.type === "test") {
      setSelectedFileContent({
        type: "test",
        path: node.path,
        name: node.name,
        bddStatus: node.bddStatus || { status: "unknown", color: "gray" },
        children: node.children
      });
    } else if (node.type === "feature") {
      setSelectedFileContent({
        type: "feature",
        path: node.path,
        name: node.name,
        feature: node.feature,
        status: node.status || "unknown"
      });
    } else if (node.type === "directory") {
      setSelectedFileContent({
        type: "directory",
        path: node.path,
        name: node.name,
        children: node.children
      });
    } else {
      setSelectedFileContent(null);
    }
  };
  const renderTree = (node, depth = 0) => {
    if (!node) return null;
    const paddingLeft = depth * 20;
    const isExpanded = expandedPaths.has(node.path);
    if (node.type === "directory") {
      return /* @__PURE__ */ jsxs2(
        "div",
        {
          style: { marginLeft: paddingLeft, marginBottom: "5px" },
          children: [
            /* @__PURE__ */ jsxs2(
              "div",
              {
                style: {
                  fontWeight: "bold",
                  color: "#007acc",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                },
                onClick: () => toggleExpand(node.path),
                children: [
                  /* @__PURE__ */ jsx2("span", { style: { marginRight: "5px" }, children: isExpanded ? "\u{1F4C2}" : "\u{1F4C1}" }),
                  node.name,
                  /* @__PURE__ */ jsxs2(
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
            isExpanded && node.children && Object.keys(node.children).length > 0 && /* @__PURE__ */ jsx2("div", { style: { marginLeft: "10px" }, children: Object.values(node.children).map(
              (child) => renderTree(child, depth + 1)
            ) })
          ]
        },
        node.path
      );
    } else if (node.type === "file") {
      const { icon, color } = getNodeIcon(node);
      const bgColor = selectedFile === node.path ? node.fileType === "documentation" ? "#e8f5e9" : "transparent" : "transparent";
      const hasChildren = node.children && Object.keys(node.children).length > 0;
      const isExpanded2 = expandedPaths.has(node.path);
      return /* @__PURE__ */ jsxs2(
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
            /* @__PURE__ */ jsxs2(
              "div",
              {
                style: { color, display: "flex", alignItems: "center" },
                onClick: () => handleFileSelect(node),
                children: [
                  /* @__PURE__ */ jsx2("span", { style: { marginRight: "5px" }, children: icon }),
                  node.name,
                  node.fileType && /* @__PURE__ */ jsxs2(
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
                  hasChildren && /* @__PURE__ */ jsx2(
                    "span",
                    {
                      style: {
                        marginLeft: "5px",
                        fontSize: "0.8rem",
                        cursor: "pointer"
                      },
                      onClick: (e) => {
                        e.stopPropagation();
                        toggleExpand(node.path);
                      },
                      children: isExpanded2 ? "\u25BC" : "\u25B6"
                    }
                  )
                ]
              }
            ),
            hasChildren && isExpanded2 && /* @__PURE__ */ jsx2("div", { style: { marginLeft: "10px", marginTop: "5px" }, children: Object.values(node.children).map(
              (child) => renderTree(child, depth + 1)
            ) })
          ]
        },
        node.path
      );
    } else if (node.type === "feature") {
      const bgColor = selectedFile === node.path ? "#fff3e0" : "transparent";
      return /* @__PURE__ */ jsx2(
        "div",
        {
          style: {
            marginLeft: paddingLeft,
            marginBottom: "3px",
            backgroundColor: bgColor,
            borderRadius: "4px",
            padding: "5px"
          },
          children: /* @__PURE__ */ jsxs2("div", { style: { color: "#ff9800", display: "flex", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx2("span", { style: { marginRight: "5px" }, children: "\u2B50" }),
            node.name,
            node.status && /* @__PURE__ */ jsxs2(
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
      const bgColor = selectedFile === node.path ? "#e3f2fd" : "transparent";
      const status = node.bddStatus || { status: "unknown", color: "gray" };
      return /* @__PURE__ */ jsxs2(
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
          onClick: () => handleFileSelect(node),
          children: [
            /* @__PURE__ */ jsxs2("div", { style: { color: "#9c27b0", display: "flex", alignItems: "center" }, children: [
              /* @__PURE__ */ jsx2("span", { style: { marginRight: "5px" }, children: "\u{1F9EA}" }),
              node.name,
              /* @__PURE__ */ jsxs2(
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
            node.children && Object.keys(node.children).length > 0 && /* @__PURE__ */ jsx2("div", { style: { marginLeft: "10px", marginTop: "5px" }, children: Object.values(node.children).map(
              (child) => renderTree(child, depth + 1)
            ) })
          ]
        },
        node.path
      );
    }
    return null;
  };
  const renderTestDetails2 = (testData) => {
    if (!testData || typeof testData !== "object") {
      return /* @__PURE__ */ jsxs2("div", { style: { marginTop: "20px" }, children: [
        /* @__PURE__ */ jsx2("h3", { children: "Test Results" }),
        /* @__PURE__ */ jsx2("p", { children: "No test data available or invalid format." })
      ] });
    }
    return /* @__PURE__ */ jsxs2("div", { style: { marginTop: "20px" }, children: [
      /* @__PURE__ */ jsx2("h3", { children: "Test Results Details" }),
      /* @__PURE__ */ jsx2(
        "div",
        {
          style: {
            padding: "15px",
            backgroundColor: testData.failed ? "#ffebee" : "#e8f5e9",
            borderRadius: "4px",
            marginBottom: "20px",
            border: "1px solid #ddd"
          },
          children: /* @__PURE__ */ jsxs2("div", { style: { display: "flex", flexWrap: "wrap", gap: "20px" }, children: [
            /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsx2("strong", { children: "Overall Status:" }),
              " ",
              testData.failed ? "\u274C Failed" : "\u2705 Passed"
            ] }),
            /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsx2("strong", { children: "Total Tests:" }),
              " ",
              testData.runTimeTests || 0
            ] }),
            /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsx2("strong", { children: "Failures:" }),
              " ",
              testData.fails || 0
            ] }),
            testData.features && /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsx2("strong", { children: "Features:" }),
              " ",
              testData.features.length
            ] })
          ] })
        }
      ),
      testData.testJob && testData.testJob.givens && /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsxs2("h4", { children: [
          "Test Cases (",
          testData.testJob.givens.length,
          ")"
        ] }),
        testData.testJob.givens.map((given, index) => /* @__PURE__ */ jsxs2(
          "div",
          {
            style: {
              marginBottom: "20px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              padding: "15px",
              backgroundColor: given.failed ? "#ffebee" : "#e8f5e9"
            },
            children: [
              /* @__PURE__ */ jsxs2(
                "div",
                {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px"
                  },
                  children: [
                    /* @__PURE__ */ jsx2("div", { style: { fontWeight: "bold", fontSize: "1.1rem" }, children: given.key || `Test Case ${index + 1}` }),
                    /* @__PURE__ */ jsx2(
                      "div",
                      {
                        style: {
                          padding: "5px 10px",
                          borderRadius: "4px",
                          backgroundColor: given.failed ? "#f44336" : "#4caf50",
                          color: "white",
                          fontWeight: "bold"
                        },
                        children: given.failed ? "\u274C Failed" : "\u2705 Passed"
                      }
                    )
                  ]
                }
              ),
              given.features && given.features.length > 0 && /* @__PURE__ */ jsxs2("div", { style: { marginBottom: "10px" }, children: [
                /* @__PURE__ */ jsx2("div", { style: { fontWeight: "bold", marginBottom: "5px" }, children: "Features:" }),
                /* @__PURE__ */ jsx2(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "5px",
                      marginBottom: "10px"
                    },
                    children: given.features.map((feature, i) => /* @__PURE__ */ jsx2(
                      "span",
                      {
                        style: {
                          backgroundColor: "#e3f2fd",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "0.85rem"
                        },
                        children: feature
                      },
                      i
                    ))
                  }
                )
              ] }),
              given.whens && given.whens.length > 0 && /* @__PURE__ */ jsxs2("div", { style: { marginBottom: "10px" }, children: [
                /* @__PURE__ */ jsx2("div", { style: { fontWeight: "bold", marginBottom: "5px" }, children: "Steps:" }),
                /* @__PURE__ */ jsx2(
                  "div",
                  {
                    style: {
                      padding: "10px",
                      backgroundColor: "white",
                      borderRadius: "4px",
                      border: "1px solid #eee"
                    },
                    children: given.whens.map((w, i) => /* @__PURE__ */ jsxs2(
                      "div",
                      {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          marginBottom: i < given.whens.length - 1 ? "5px" : "0"
                        },
                        children: [
                          /* @__PURE__ */ jsx2(
                            "div",
                            {
                              style: {
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                backgroundColor: w.status ? "#4caf50" : "#f44336",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: "10px",
                                fontSize: "0.8rem"
                              },
                              children: i + 1
                            }
                          ),
                          /* @__PURE__ */ jsxs2("div", { children: [
                            /* @__PURE__ */ jsx2("div", { style: { fontWeight: "bold" }, children: w.name }),
                            w.error && /* @__PURE__ */ jsxs2(
                              "div",
                              {
                                style: { fontSize: "0.8rem", color: "#f44336" },
                                children: [
                                  "Error:",
                                  " ",
                                  typeof w.error === "string" ? w.error : JSON.stringify(w.error)
                                ]
                              }
                            )
                          ] })
                        ]
                      },
                      i
                    ))
                  }
                )
              ] }),
              given.thens && given.thens.length > 0 && /* @__PURE__ */ jsxs2("div", { style: { marginBottom: "10px" }, children: [
                /* @__PURE__ */ jsx2("div", { style: { fontWeight: "bold", marginBottom: "5px" }, children: "Assertions:" }),
                /* @__PURE__ */ jsx2(
                  "div",
                  {
                    style: {
                      padding: "10px",
                      backgroundColor: "white",
                      borderRadius: "4px",
                      border: "1px solid #eee"
                    },
                    children: given.thens.map((then, i) => /* @__PURE__ */ jsxs2(
                      "div",
                      {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          marginBottom: i < given.thens.length - 1 ? "5px" : "0"
                        },
                        children: [
                          /* @__PURE__ */ jsx2(
                            "div",
                            {
                              style: {
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                backgroundColor: then.status ? "#4caf50" : "#f44336",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: "10px",
                                fontSize: "0.7rem"
                              },
                              children: then.status ? "\u2713" : "\u2717"
                            }
                          ),
                          /* @__PURE__ */ jsxs2("div", { children: [
                            /* @__PURE__ */ jsx2("div", { style: { fontWeight: "bold" }, children: then.name }),
                            then.error && /* @__PURE__ */ jsxs2(
                              "div",
                              {
                                style: { fontSize: "0.8rem", color: "#f44336" },
                                children: [
                                  "Error:",
                                  " ",
                                  typeof then.error === "string" ? then.error : JSON.stringify(then.error)
                                ]
                              }
                            )
                          ] })
                        ]
                      },
                      i
                    ))
                  }
                )
              ] }),
              given.error && /* @__PURE__ */ jsxs2(
                "div",
                {
                  style: {
                    marginTop: "10px",
                    padding: "10px",
                    backgroundColor: "#ffcdd2",
                    borderRadius: "4px",
                    border: "1px solid #f44336"
                  },
                  children: [
                    /* @__PURE__ */ jsx2("div", { style: { fontWeight: "bold", marginBottom: "5px" }, children: "Error Details:" }),
                    /* @__PURE__ */ jsx2(
                      "pre",
                      {
                        style: {
                          margin: 0,
                          fontSize: "0.85rem",
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word"
                        },
                        children: Array.isArray(given.error) ? given.error.map(
                          (err, i) => typeof err === "string" ? err : JSON.stringify(err, null, 2)
                        ).join("\n") : JSON.stringify(given.error, null, 2)
                      }
                    )
                  ]
                }
              )
            ]
          },
          index
        ))
      ] }),
      testData.features && testData.features.length > 0 && /* @__PURE__ */ jsxs2("div", { style: { marginTop: "30px" }, children: [
        /* @__PURE__ */ jsxs2("h4", { children: [
          "All Features (",
          testData.features.length,
          ")"
        ] }),
        /* @__PURE__ */ jsx2(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "10px",
              marginTop: "10px"
            },
            children: testData.features.map((feature, index) => /* @__PURE__ */ jsx2(
              "div",
              {
                style: {
                  padding: "10px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  border: "1px solid #ddd"
                },
                children: feature
              },
              index
            ))
          }
        )
      ] })
    ] });
  };
  const renderFileContent = () => {
    if (!selectedFile) return null;
    if (!selectedFileContent) {
      return /* @__PURE__ */ jsxs2("div", { style: { marginTop: "20px" }, children: [
        /* @__PURE__ */ jsxs2("h3", { children: [
          "No content available for ",
          selectedFile
        ] }),
        /* @__PURE__ */ jsx2("p", { children: "The file exists in the tree but its content could not be loaded." })
      ] });
    }
    switch (selectedFileContent.type) {
      case "file":
      case "documentation":
        const isDocumentation = selectedFileContent.type === "documentation";
        const title = isDocumentation ? "Documentation" : "File";
        return /* @__PURE__ */ jsxs2("div", { style: { marginTop: "20px" }, children: [
          /* @__PURE__ */ jsxs2("h3", { children: [
            title,
            ": ",
            selectedFile.split("/").pop()
          ] }),
          /* @__PURE__ */ jsxs2("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "10px" }, children: [
            /* @__PURE__ */ jsxs2("div", { children: [
              "Path: ",
              selectedFileContent.path
            ] }),
            /* @__PURE__ */ jsxs2("div", { children: [
              "Size: ",
              selectedFileContent.size || (selectedFileContent.content?.length || 0),
              " characters"
            ] }),
            selectedFileContent.language && /* @__PURE__ */ jsxs2("div", { children: [
              "Language: ",
              selectedFileContent.language
            ] })
          ] }),
          selectedFileContent.content ? /* @__PURE__ */ jsx2("div", { children: /* @__PURE__ */ jsx2(
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
          ) }) : selectedFileContent.message ? /* @__PURE__ */ jsxs2(
            "div",
            {
              style: {
                backgroundColor: "#f9f9f9",
                padding: "20px",
                borderRadius: "4px",
                border: "1px solid #ddd"
              },
              children: [
                /* @__PURE__ */ jsx2("p", { children: selectedFileContent.message }),
                /* @__PURE__ */ jsxs2("p", { children: [
                  "Path: ",
                  selectedFileContent.path
                ] }),
                isDocumentation && /* @__PURE__ */ jsx2("p", { children: "Note: Documentation content was not embedded in the static site." })
              ]
            }
          ) : /* @__PURE__ */ jsx2(
            "div",
            {
              style: {
                backgroundColor: "#ffebee",
                padding: "20px",
                borderRadius: "4px",
                border: "1px solid #f44336"
              },
              children: /* @__PURE__ */ jsx2("p", { children: "No content available for this file." })
            }
          )
        ] });
      case "test":
        return /* @__PURE__ */ jsxs2("div", { style: { marginTop: "20px" }, children: [
          /* @__PURE__ */ jsxs2("h3", { children: [
            "Test: ",
            selectedFileContent.name
          ] }),
          /* @__PURE__ */ jsx2(
            "div",
            {
              style: {
                padding: "15px",
                backgroundColor: selectedFileContent.bddStatus.color === "green" ? "#e8f5e9" : selectedFileContent.bddStatus.color === "yellow" ? "#fff3e0" : selectedFileContent.bddStatus.color === "red" ? "#ffebee" : "#f5f5f5",
                borderRadius: "4px",
                marginBottom: "20px",
                border: "1px solid #ddd"
              },
              children: /* @__PURE__ */ jsxs2("div", { style: { display: "flex", flexWrap: "wrap", gap: "20px" }, children: [
                /* @__PURE__ */ jsxs2("div", { children: [
                  /* @__PURE__ */ jsx2("strong", { children: "BDD Status:" }),
                  " ",
                  selectedFileContent.bddStatus.status
                ] }),
                /* @__PURE__ */ jsxs2("div", { children: [
                  /* @__PURE__ */ jsx2("strong", { children: "Path:" }),
                  " ",
                  selectedFileContent.path
                ] })
              ] })
            }
          ),
          selectedFileContent.children && /* @__PURE__ */ jsxs2("div", { children: [
            /* @__PURE__ */ jsx2("h4", { children: "Test Details" }),
            /* @__PURE__ */ jsx2("div", { style: { marginLeft: "20px" }, children: Object.values(selectedFileContent.children).map((child, i) => /* @__PURE__ */ jsx2("div", { style: { marginBottom: "10px" }, children: JSON.stringify(child, null, 2) }, i)) })
          ] })
        ] });
      case "feature":
        return /* @__PURE__ */ jsxs2("div", { style: { marginTop: "20px" }, children: [
          /* @__PURE__ */ jsxs2("h3", { children: [
            "Feature: ",
            selectedFileContent.name
          ] }),
          /* @__PURE__ */ jsx2(
            "div",
            {
              style: {
                padding: "15px",
                backgroundColor: "#fff3e0",
                borderRadius: "4px",
                border: "1px solid #ff9800"
              },
              children: /* @__PURE__ */ jsxs2("div", { style: { display: "flex", flexWrap: "wrap", gap: "20px" }, children: [
                /* @__PURE__ */ jsxs2("div", { children: [
                  /* @__PURE__ */ jsx2("strong", { children: "Feature:" }),
                  " ",
                  selectedFileContent.feature
                ] }),
                /* @__PURE__ */ jsxs2("div", { children: [
                  /* @__PURE__ */ jsx2("strong", { children: "Status:" }),
                  " ",
                  selectedFileContent.status
                ] }),
                /* @__PURE__ */ jsxs2("div", { children: [
                  /* @__PURE__ */ jsx2("strong", { children: "Path:" }),
                  " ",
                  selectedFileContent.path
                ] })
              ] })
            }
          )
        ] });
      case "directory":
        return /* @__PURE__ */ jsxs2("div", { style: { marginTop: "20px" }, children: [
          /* @__PURE__ */ jsxs2("h3", { children: [
            "Directory: ",
            selectedFileContent.name
          ] }),
          /* @__PURE__ */ jsx2(
            "div",
            {
              style: {
                padding: "15px",
                backgroundColor: "#e3f2fd",
                borderRadius: "4px",
                border: "1px solid #2196f3"
              },
              children: /* @__PURE__ */ jsxs2("div", { style: { display: "flex", flexWrap: "wrap", gap: "20px" }, children: [
                /* @__PURE__ */ jsxs2("div", { children: [
                  /* @__PURE__ */ jsx2("strong", { children: "Path:" }),
                  " ",
                  selectedFileContent.path
                ] }),
                /* @__PURE__ */ jsxs2("div", { children: [
                  /* @__PURE__ */ jsx2("strong", { children: "Items:" }),
                  " ",
                  Object.keys(selectedFileContent.children || {}).length
                ] })
              ] })
            }
          )
        ] });
      default:
        return /* @__PURE__ */ jsxs2("div", { style: { marginTop: "20px" }, children: [
          /* @__PURE__ */ jsx2("h3", { children: "File Content" }),
          /* @__PURE__ */ jsx2(
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
  };
  const renderVisualization = () => {
    if (!data.featureGraph || !data.featureGraph.nodes || data.featureGraph.nodes.length === 0) {
      return /* @__PURE__ */ jsxs2("div", { style: { padding: "40px", textAlign: "center" }, children: [
        /* @__PURE__ */ jsx2("h3", { children: "No Feature Graph Available" }),
        /* @__PURE__ */ jsx2("p", { children: "Features need to be extracted from test results to create visualizations." }),
        /* @__PURE__ */ jsx2("p", { children: "Run tests to generate feature data." })
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
      onNodeClick: (node) => {
        console.log("Node clicked:", node);
      },
      onNodeHover: (node) => {
      }
    };
    switch (vizType) {
      case "eisenhower":
        return /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsx2("h3", { children: "Eisenhower Matrix" }),
          /* @__PURE__ */ jsx2("p", { children: "Urgency vs Importance of features" }),
          /* @__PURE__ */ jsx2(
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
        return /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsx2("h3", { children: "Gantt Chart" }),
          /* @__PURE__ */ jsx2("p", { children: "Feature timeline" }),
          /* @__PURE__ */ jsx2(
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
        return /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsx2("h3", { children: "Kanban Board" }),
          /* @__PURE__ */ jsx2("p", { children: "Feature status columns" }),
          /* @__PURE__ */ jsx2(
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
        return /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsx2("h3", { children: "Feature Dependency Tree" }),
          /* @__PURE__ */ jsx2("p", { children: "Feature relationships" }),
          /* @__PURE__ */ jsx2(
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
      default:
        return /* @__PURE__ */ jsx2("div", { children: "Select a visualization type" });
    }
  };
  return /* @__PURE__ */ jsx2(
    "div",
    {
      style: {
        padding: "20px",
        fontFamily: "sans-serif"
      },
      children: /* @__PURE__ */ jsxs2("div", { style: { marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxs2("div", { style: { display: "flex", gap: "10px", marginBottom: "20px" }, children: [
          /* @__PURE__ */ jsx2(
            "button",
            {
              style: {
                padding: "10px 20px",
                backgroundColor: activeTab === "tree" ? "#007acc" : "#f0f0f0",
                color: activeTab === "tree" ? "white" : "black",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              },
              onClick: () => setActiveTab("tree"),
              children: "File Tree"
            }
          ),
          /* @__PURE__ */ jsx2(
            "button",
            {
              style: {
                padding: "10px 20px",
                backgroundColor: activeTab === "viz" ? "#007acc" : "#f0f0f0",
                color: activeTab === "viz" ? "white" : "black",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              },
              onClick: () => setActiveTab("viz"),
              children: "Visualizations"
            }
          )
        ] }),
        activeTab === "viz" && /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsxs2("div", { style: { display: "flex", gap: "10px", marginBottom: "20px" }, children: [
            /* @__PURE__ */ jsx2(
              "button",
              {
                style: {
                  padding: "8px 16px",
                  backgroundColor: vizType === "eisenhower" ? "#4caf50" : "#f0f0f0",
                  color: vizType === "eisenhower" ? "white" : "black",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                },
                onClick: () => setVizType("eisenhower"),
                children: "Eisenhower Matrix"
              }
            ),
            /* @__PURE__ */ jsx2(
              "button",
              {
                style: {
                  padding: "8px 16px",
                  backgroundColor: vizType === "gantt" ? "#4caf50" : "#f0f0f0",
                  color: vizType === "gantt" ? "white" : "black",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                },
                onClick: () => setVizType("gantt"),
                children: "Gantt Chart"
              }
            ),
            /* @__PURE__ */ jsx2(
              "button",
              {
                style: {
                  padding: "8px 16px",
                  backgroundColor: vizType === "kanban" ? "#4caf50" : "#f0f0f0",
                  color: vizType === "kanban" ? "white" : "black",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                },
                onClick: () => setVizType("kanban"),
                children: "Kanban Board"
              }
            ),
            /* @__PURE__ */ jsx2(
              "button",
              {
                style: {
                  padding: "8px 16px",
                  backgroundColor: vizType === "tree" ? "#4caf50" : "#f0f0f0",
                  color: vizType === "tree" ? "white" : "black",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                },
                onClick: () => setVizType("tree"),
                children: "Dependency Tree"
              }
            )
          ] }),
          renderVisualization(),
          /* @__PURE__ */ jsxs2("div", { style: { marginTop: "30px", padding: "20px", backgroundColor: "#f5f5f5", borderRadius: "4px" }, children: [
            /* @__PURE__ */ jsx2("h4", { children: "Feature Graph Statistics" }),
            /* @__PURE__ */ jsxs2("p", { children: [
              "Total Features: ",
              data.featureGraph?.nodes?.length || 0
            ] }),
            /* @__PURE__ */ jsxs2("p", { children: [
              "Dependencies: ",
              data.featureGraph?.edges?.length || 0
            ] }),
            /* @__PURE__ */ jsx2("p", { children: "Features with status:" }),
            /* @__PURE__ */ jsxs2("ul", { children: [
              /* @__PURE__ */ jsxs2("li", { children: [
                "Todo: ",
                data.featureGraph?.nodes?.filter((n) => n.attributes.status === "todo").length || 0
              ] }),
              /* @__PURE__ */ jsxs2("li", { children: [
                "Doing: ",
                data.featureGraph?.nodes?.filter((n) => n.attributes.status === "doing").length || 0
              ] }),
              /* @__PURE__ */ jsxs2("li", { children: [
                "Done: ",
                data.featureGraph?.nodes?.filter((n) => n.attributes.status === "done").length || 0
              ] })
            ] })
          ] })
        ] }),
        activeTab === "tree" && /* @__PURE__ */ jsxs2("div", { style: { display: "flex", gap: "20px" }, children: [
          /* @__PURE__ */ jsx2(
            "div",
            {
              style: {
                flex: "0 0 300px",
                borderRight: "1px solid #ddd",
                paddingRight: "20px"
              },
              children: /* @__PURE__ */ jsx2(
                "div",
                {
                  style: {
                    border: "1px solid #ddd",
                    padding: "15px",
                    background: "#f9f9f9",
                    maxHeight: "600px",
                    overflow: "auto"
                  },
                  children: data.featureTree ? renderTree(data.featureTree) : /* @__PURE__ */ jsxs2("div", { children: [
                    /* @__PURE__ */ jsx2("p", { children: "No feature tree available. The tree should show documentation files in their proper folder structure." }),
                    /* @__PURE__ */ jsxs2("p", { children: [
                      "Documentation files found:",
                      " ",
                      data.documentation?.files?.length || 0
                    ] }),
                    /* @__PURE__ */ jsx2(
                      "div",
                      {
                        style: {
                          border: "1px solid #eee",
                          padding: "10px",
                          background: "#fff",
                          maxHeight: "200px",
                          overflow: "auto"
                        },
                        children: data.documentation?.files?.map((file, i) => /* @__PURE__ */ jsx2(
                          "div",
                          {
                            style: {
                              fontSize: "0.8rem",
                              marginBottom: "2px",
                              padding: "2px",
                              borderBottom: "1px solid #f0f0f0"
                            },
                            children: file
                          },
                          i
                        ))
                      }
                    )
                  ] })
                }
              )
            }
          ),
          /* @__PURE__ */ jsxs2("div", { style: { flex: "1" }, children: [
            selectedFile && /* @__PURE__ */ jsxs2(
              "div",
              {
                style: {
                  marginBottom: "20px",
                  padding: "10px",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "4px"
                },
                children: [
                  /* @__PURE__ */ jsx2("strong", { children: "Selected:" }),
                  " ",
                  selectedFile
                ]
              }
            ),
            renderFileContent(),
            !selectedFile && /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsx2("h3", { children: "Configuration" }),
              data.configs?.runtimes ? /* @__PURE__ */ jsxs2("div", { children: [
                /* @__PURE__ */ jsxs2("p", { children: [
                  "Found ",
                  Object.keys(data.configs.runtimes).length,
                  " runtimes:"
                ] }),
                Object.entries(data.configs.runtimes).map(
                  ([key, runtime]) => /* @__PURE__ */ jsxs2(
                    "div",
                    {
                      style: {
                        marginBottom: "10px",
                        padding: "5px",
                        borderLeft: "3px solid #007acc"
                      },
                      children: [
                        /* @__PURE__ */ jsx2("strong", { children: key }),
                        " (",
                        runtime.runtime,
                        ")",
                        /* @__PURE__ */ jsxs2("div", { style: { marginLeft: "10px" }, children: [
                          "Tests: ",
                          runtime.tests?.length || 0,
                          runtime.tests?.map((test, i) => {
                            const testResult = data.allTestResults?.[key]?.[test];
                            return /* @__PURE__ */ jsxs2("div", { style: {
                              fontSize: "12px",
                              marginBottom: "5px",
                              padding: "3px",
                              backgroundColor: testResult ? testResult.failed ? "#ffebee" : "#e8f5e9" : "#f5f5f5",
                              borderRadius: "3px"
                            }, children: [
                              /* @__PURE__ */ jsxs2("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
                                /* @__PURE__ */ jsx2("span", { children: test }),
                                testResult && /* @__PURE__ */ jsx2("span", { style: {
                                  fontWeight: "bold",
                                  color: testResult.failed ? "#f44336" : "#4caf50"
                                }, children: testResult.failed ? "\u274C Failed" : "\u2705 Passed" })
                              ] }),
                              testResult && /* @__PURE__ */ jsxs2("div", { style: { fontSize: "11px", marginTop: "2px" }, children: [
                                "Tests: ",
                                testResult.runTimeTests || 0,
                                " | Fails: ",
                                testResult.fails || 0,
                                " | Features: ",
                                testResult.features?.length || 0
                              ] })
                            ] }, i);
                          })
                        ] })
                      ]
                    },
                    key
                  )
                )
              ] }) : /* @__PURE__ */ jsx2("p", { children: "No configuration found" }),
              data.allTestResults && Object.keys(data.allTestResults).length > 0 && /* @__PURE__ */ jsxs2("div", { style: { marginTop: "30px" }, children: [
                /* @__PURE__ */ jsx2("h3", { children: "Test Results Summary" }),
                Object.entries(data.allTestResults).map(([configKey, tests]) => /* @__PURE__ */ jsxs2("div", { style: { marginBottom: "20px" }, children: [
                  /* @__PURE__ */ jsx2("h4", { children: configKey }),
                  Object.entries(tests).map(([testName, testData]) => /* @__PURE__ */ jsxs2(
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
                      onClick: () => {
                        setSelectedFile(`${configKey}/${testName}`);
                        setSelectedFileContent(testData);
                      },
                      children: [
                        /* @__PURE__ */ jsxs2("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
                          /* @__PURE__ */ jsx2("strong", { children: testName }),
                          /* @__PURE__ */ jsx2("span", { style: {
                            fontWeight: "bold",
                            color: testData.failed ? "#f44336" : "#4caf50"
                          }, children: testData.failed ? "\u274C Failed" : "\u2705 Passed" })
                        ] }),
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
                          /* @__PURE__ */ jsxs2("div", { style: {
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "5px",
                            marginTop: "5px"
                          }, children: [
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
                            testData.features.length > 3 && /* @__PURE__ */ jsxs2("span", { style: {
                              backgroundColor: "#f5f5f5",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              fontSize: "11px"
                            }, children: [
                              "+",
                              testData.features.length - 3,
                              " more"
                            ] })
                          ] })
                        ] })
                      ]
                    },
                    testName
                  ))
                ] }, configKey))
              ] })
            ] })
          ] })
        ] })
      ] })
    }
  );
};
function renderApp(rootElement, data) {
  const appData = data || typeof window !== "undefined" && window.TESTERANTO_EMBEDDED_DATA;
  if (!appData) {
    console.error("No stakeholder data available");
    return;
  }
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    /* @__PURE__ */ jsx2(React2.StrictMode, { children: /* @__PURE__ */ jsx2(DefaultStakeholderApp, { data: appData }) })
  );
}
var index_default = DefaultStakeholderApp;
export {
  DefaultStakeholderApp,
  index_default as default,
  renderApp
};
