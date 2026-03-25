import React from "react";
import { getNodeIcon } from "testeranto/src/server/serverClasses/StakeholderUtils";
import { getNodeBackgroundColor } from "./nodeStyleUtils";

export interface TreeViewProps {
  node: any;
  depth?: number;
  expandedPaths: Set<string>;
  selectedFile: string | null;
  onToggleExpand: (path: string) => void;
  onFileSelect: (node: any) => void;
}

export const TreeView: React.FC<TreeViewProps> = ({
  node,
  depth = 0,
  expandedPaths,
  selectedFile,
  onToggleExpand,
  onFileSelect,
}) => {
  if (!node) return null;

  const paddingLeft = depth * 20;
  const isExpanded = expandedPaths.has(node.path);

  if (node.type === "directory") {
    return (
      <div
        key={node.path}
        style={{ marginLeft: paddingLeft, marginBottom: "5px" }}
      >
        <div
          style={{
            fontWeight: "bold",
            color: "#007acc",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
          onClick={() => onToggleExpand(node.path)}
        >
          <span style={{ marginRight: "5px" }}>
            {isExpanded ? "📂" : "📁"}
          </span>
          {node.name}
          <span
            style={{ fontSize: "0.8rem", marginLeft: "5px", color: "#666" }}
          >
            ({Object.keys(node.children || {}).length} items)
          </span>
        </div>
        {isExpanded &&
          node.children &&
          Object.keys(node.children).length > 0 && (
            <div style={{ marginLeft: "10px" }}>
              {Object.values(node.children).map((child: any) => (
                <TreeView
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  expandedPaths={expandedPaths}
                  selectedFile={selectedFile}
                  onToggleExpand={onToggleExpand}
                  onFileSelect={onFileSelect}
                />
              ))}
            </div>
          )}
      </div>
    );
  } else if (node.type === "file") {
    const { icon, color } = getNodeIcon(node);
    const bgColor = getNodeBackgroundColor(node, selectedFile);

    const hasChildren =
      node.children && Object.keys(node.children).length > 0;
    const isExpanded = expandedPaths.has(node.path);

    return (
      <div
        key={node.path}
        style={{
          marginLeft: paddingLeft,
          marginBottom: "3px",
          backgroundColor: bgColor,
          borderRadius: "4px",
          padding: "5px",
          cursor: "pointer",
        }}
      >
        <div
          style={{ color, display: "flex", alignItems: "center" }}
          onClick={() => onFileSelect(node)}
        >
          <span style={{ marginRight: "5px" }}>{icon}</span>
          {node.name}
          {node.fileType && (
            <span
              style={{ fontSize: "0.8rem", marginLeft: "5px", color: "#666" }}
            >
              ({node.fileType})
            </span>
          )}
          {hasChildren && (
            <span
              style={{
                marginLeft: "5px",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.path);
              }}
            >
              {isExpanded ? "▼" : "▶"}
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div style={{ marginLeft: "10px", marginTop: "5px" }}>
            {Object.values(node.children).map((child: any) => (
              <TreeView
                key={child.path}
                node={child}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                selectedFile={selectedFile}
                onToggleExpand={onToggleExpand}
                onFileSelect={onFileSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  } else if (node.type === "feature") {
    const bgColor = getNodeBackgroundColor(node, selectedFile);

    return (
      <div
        key={node.path}
        style={{
          marginLeft: paddingLeft,
          marginBottom: "3px",
          backgroundColor: bgColor,
          borderRadius: "4px",
          padding: "5px",
        }}
      >
        <div style={{ color: "#ff9800", display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: "5px" }}>⭐</span>
          {node.name}
          {node.status && (
            <span
              style={{
                fontSize: "0.8rem",
                marginLeft: "5px",
                color: "#666",
              }}
            >
              (status: {node.status})
            </span>
          )}
        </div>
      </div>
    );
  } else if (node.type === "test") {
    // Handle test nodes with BDD status
    const bgColor = getNodeBackgroundColor(node, selectedFile);
    const status = node.bddStatus || { status: 'unknown', color: 'gray' };

    return (
      <div
        key={node.path}
        style={{
          marginLeft: paddingLeft,
          marginBottom: "3px",
          backgroundColor: bgColor,
          borderRadius: "4px",
          padding: "5px",
          cursor: "pointer",
        }}
        onClick={() => onFileSelect(node)}
      >
        <div style={{ color: "#9c27b0", display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: "5px" }}>🧪</span>
          {node.name}
          <span
            style={{
              fontSize: "0.8rem",
              marginLeft: "5px",
              color: status.color === 'green' ? '#4caf50' :
                status.color === 'yellow' ? '#ff9800' :
                  status.color === 'red' ? '#f44336' : '#666',
              fontWeight: 'bold'
            }}
          >
            (BDD: {status.status})
          </span>
        </div>
        {node.children && Object.keys(node.children).length > 0 && (
          <div style={{ marginLeft: "10px", marginTop: "5px" }}>
            {Object.values(node.children).map((child: any) => (
              <TreeView
                key={child.path}
                node={child}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                selectedFile={selectedFile}
                onToggleExpand={onToggleExpand}
                onFileSelect={onFileSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};
