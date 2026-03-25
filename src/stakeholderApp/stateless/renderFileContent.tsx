import React from "react";
import { FileContentData } from "./helpers";
import { renderFileContentFile } from "./renderFileContentFile";

export interface RenderFileContentProps {
  selectedFile: string | null;
  selectedFileContent: any;
}

export function renderFileContent({
  selectedFile,
  selectedFileContent
}: RenderFileContentProps): React.ReactNode {
  if (!selectedFile) return null;

  if (!selectedFileContent) {
    return (
      <div style={{ marginTop: "20px" }}>
        <h3>No content available for {selectedFile}</h3>
        <p>
          The file exists in the tree but its content could not be loaded.
        </p>
      </div>
    );
  }

  // Handle different content types
  switch (selectedFileContent.type) {
    case "file":
    case "documentation":
      return renderFileContentFile(
        selectedFile,
        selectedFileContent as FileContentData
      );
    case "test":
      return (
        <div style={{ marginTop: "20px" }}>
          <h3>Test: {selectedFileContent.name}</h3>
          <div
            style={{
              padding: "15px",
              backgroundColor: selectedFileContent.bddStatus.color === 'green' ? '#e8f5e9' :
                selectedFileContent.bddStatus.color === 'yellow' ? '#fff3e0' :
                  selectedFileContent.bddStatus.color === 'red' ? '#ffebee' : '#f5f5f5',
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #ddd",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
              <div>
                <strong>BDD Status:</strong> {selectedFileContent.bddStatus.status}
              </div>
              <div>
                <strong>Path:</strong> {selectedFileContent.path}
              </div>
            </div>
          </div>
          {selectedFileContent.children && (
            <div>
              <h4>Test Details</h4>
              <div style={{ marginLeft: "20px" }}>
                {Object.values(selectedFileContent.children).map((child: any, i: number) => (
                  <div key={i} style={{ marginBottom: "10px" }}>
                    {JSON.stringify(child, null, 2)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    case "feature":
      return (
        <div style={{ marginTop: "20px" }}>
          <h3>Feature: {selectedFileContent.name}</h3>
          <div
            style={{
              padding: "15px",
              backgroundColor: "#fff3e0",
              borderRadius: "4px",
              border: "1px solid #ff9800",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
              <div>
                <strong>Feature:</strong> {selectedFileContent.feature}
              </div>
              <div>
                <strong>Status:</strong> {selectedFileContent.status}
              </div>
              <div>
                <strong>Path:</strong> {selectedFileContent.path}
              </div>
            </div>
          </div>
        </div>
      );
    case "directory":
      return (
        <div style={{ marginTop: "20px" }}>
          <h3>Directory: {selectedFileContent.name}</h3>
          <div
            style={{
              padding: "15px",
              backgroundColor: "#e3f2fd",
              borderRadius: "4px",
              border: "1px solid #2196f3",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
              <div>
                <strong>Path:</strong> {selectedFileContent.path}
              </div>
              <div>
                <strong>Items:</strong> {Object.keys(selectedFileContent.children || {}).length}
              </div>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div style={{ marginTop: "20px" }}>
          <h3>File Content</h3>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "10px",
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "400px",
            }}
          >
            {JSON.stringify(selectedFileContent, null, 2)}
          </pre>
        </div>
      );
  }
}
