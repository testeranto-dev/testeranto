import fs from "fs";
import path from "path";
import type { TreeNode } from "./types";

export const addFeaturesFromTestsJson = (
  testNode: TreeNode,
  testsJsonFile: string | undefined,
  outputFiles: string[],
  runtime: string,
  runtimeKey: string,
  testName: string
): void => {
  if (!testsJsonFile || !fs.existsSync(testsJsonFile)) {
    return;
  }

  try {
    const content = fs.readFileSync(testsJsonFile, "utf-8");
    const testData = JSON.parse(content);
    let features: string[] = [];

    if (testData.features && Array.isArray(testData.features)) {
      features = testData.features;
    } else if (testData.testJob?.givens) {
      const allFeatures = new Set<string>();
      for (const given of testData.testJob.givens) {
        if (given.features && Array.isArray(given.features)) {
          for (const feature of given.features) {
            allFeatures.add(feature);
          }
        }
      }
      features = Array.from(allFeatures);
    }

    if (features.length === 0) {
      return;
    }

    const regularFeatures: string[] = [];
    const docFilePaths: string[] = [];

    for (const feature of features) {
      const docExtensions = [
        ".md", ".txt", ".rst", ".adoc", ".asciidoc", ".markdown", ".mdown"
      ];
      const isDocByExtension = docExtensions.some((ext) =>
        feature.toLowerCase().endsWith(ext)
      );
      const looksLikePath =
        feature.includes("/") ||
        feature.includes("\\") ||
        feature.startsWith("./") ||
        feature.startsWith("/") ||
        feature.includes(".");

      if (isDocByExtension || looksLikePath) {
        let normalizedPath = feature;
        if (normalizedPath.startsWith("./")) {
          normalizedPath = normalizedPath.substring(2);
        }
        if (normalizedPath.startsWith("/")) {
          normalizedPath = normalizedPath.substring(1);
        }
        normalizedPath = normalizedPath.replace(/\\/g, "/");
        docFilePaths.push(normalizedPath);
      } else {
        regularFeatures.push(feature);
      }
    }

    if (regularFeatures.length > 0 && testNode.children?.source?.children) {
      const featuresSectionKey = "features";
      if (!testNode.children.source.children[featuresSectionKey]) {
        testNode.children.source.children[featuresSectionKey] = {
          type: "directory",
          name: "Features",
          children: {},
        };
      }

      const featuresSection = testNode.children.source.children[featuresSectionKey];
      if (!featuresSection.children) {
        featuresSection.children = {};
      }

      for (const feature of regularFeatures) {
        const featureKey = `feature:${feature}`.replace(/[^a-zA-Z0-9]/g, "_");
        featuresSection.children[featureKey] = {
          type: "feature",
          name: feature,
          runtime,
          runtimeKey,
          testName,
          feature: feature,
          clickable: false,
          status: "unknown",
        };
      }
    }

    if (docFilePaths.length > 0 && testNode.children?.source?.children) {
      for (const docPath of docFilePaths) {
        const normalizedPath = docPath.startsWith("/") ? docPath.substring(1) : docPath;
        const parts = normalizedPath.split("/").filter((part) => part.length > 0);

        if (parts.length === 0) continue;

        let currentNode = testNode.children.source.children;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;

          if (!currentNode[part]) {
            if (isLast) {
              currentNode[part] = {
                type: "file",
                path: normalizedPath,
                runtime,
                runtimeKey,
                testName,
                fileType: "documentation",
              };
            } else {
              currentNode[part] = {
                type: "directory",
                name: part,
                children: {},
              };
            }
          }

          if (!isLast && currentNode[part].type === "directory") {
            currentNode = currentNode[part].children!;
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error processing features from tests.json:`, error);
  }
};
