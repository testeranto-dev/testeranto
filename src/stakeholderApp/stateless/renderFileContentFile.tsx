import React from "react";
import { FileContentData } from "./helpers";

export function renderFileContentFile(
  selectedFile: string | null,
  selectedFileContent: FileContentData
) {
  const isDocumentation = selectedFileContent.type === "documentation";
  const title = isDocumentation ? "Documentation" : "File";
  return (
    <div style={{ marginTop: "20px" }}>
      <h3>{title}: {selectedFile?.split("/").pop()}</h3>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>Path: {selectedFileContent.path}</div>
        <div>Size: {selectedFileContent.size || (selectedFileContent.content?.length || 0)} characters</div>
        {selectedFileContent.language && (
          <div>Language: {selectedFileContent.language}</div>
        )}
      </div>
      {selectedFileContent.content ? (
        <div>
          <pre
            style={{
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
            }}
          >
            {selectedFileContent.content}
          </pre>
        </div>
      ) : selectedFileContent.message ? (
        <div
          style={{
            backgroundColor: "#f9f9f9",
            padding: "20px",
            borderRadius: "4px",
            border: "1px solid #ddd",
          }}
        >
          <p>{selectedFileContent.message}</p>
          <p>Path: {selectedFileContent.path}</p>
          {isDocumentation && (
            <p>Note: Documentation content was not embedded in the static site.</p>
          )}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#ffebee",
            padding: "20px",
            borderRadius: "4px",
            border: "1px solid #f44336",
          }}
        >
          <p>No content available for this file.</p>
        </div>
      )}
    </div>
  );
}
