import fs from "fs";
import path from "path";
// import { glob } from "glob";
import { getBddExitCodeForTest } from "./getBddExitCodeForTest";

export const extractFeaturesAndDocsFromTestResults = async (
  allTestResults: any,
): Promise<{
  features: Array<{
    testKey: string;
    feature: string;
    isDocumentation: boolean;
    path?: string;
    frontmatter?: Record<string, any>;
    content?: string;
  }>;
  documentationFiles: string[];
  bddStatus: Record<string, { status: string; color: string }>;
  featureGraph?: any;
}> => {
  const features: Array<{
    testKey: string;
    feature: string;
    isDocumentation: boolean;
    path?: string;
    frontmatter?: Record<string, any>;
    content?: string;
  }> = [];
  const documentationFiles: string[] = [];
  const bddStatus: Record<string, { status: string; color: string }> = {};
  const featureNodes: any[] = [];
  const featureEdges: any[] = [];

  // Process each test result
  for (const [runtimeKey, tests] of Object.entries(allTestResults)) {
    const testsObj = tests as Record<string, any>;
    for (const [testName, testData] of Object.entries(testsObj)) {
      const testKey = `${runtimeKey}/${testName}`;

      // Extract features from test data
      if (testData && typeof testData === "object") {
        // Get features from various locations
        let testFeatures: string[] = [];
        const data = testData as any;
        if (data.features && Array.isArray(data.features)) {
          testFeatures = data.features;
        } else if (data.testJob && data.testJob.givens) {
          const allFeatures = new Set<string>();
          for (const given of data.testJob.givens) {
            if (given.features && Array.isArray(given.features)) {
              for (const feature of given.features) {
                allFeatures.add(feature);
              }
            }
          }
          testFeatures = Array.from(allFeatures);
        }

        // Process each feature
        for (const feature of testFeatures) {
          // Check if feature is a documentation file reference
          const docExtensions = [
            ".md",
            ".txt",
            ".rst",
            ".adoc",
            ".asciidoc",
            ".markdown",
            ".mdown",
          ];
          const isDocByExtension = docExtensions.some((ext) =>
            feature.toLowerCase().endsWith(ext),
          );
          const looksLikePath =
            feature.includes("/") ||
            feature.includes("\\") ||
            feature.startsWith("./") ||
            feature.startsWith("/") ||
            feature.includes(".");

          if (isDocByExtension || looksLikePath) {
            // Normalize the path
            let normalizedPath = feature;
            if (normalizedPath.startsWith("./")) {
              normalizedPath = normalizedPath.substring(2);
            }
            if (normalizedPath.startsWith("/")) {
              normalizedPath = normalizedPath.substring(1);
            }
            normalizedPath = normalizedPath.replace(/\\/g, "/");

            // Try to read and parse markdown file
            let frontmatter: Record<string, any> = {};
            let content: string | undefined;

            try {
              const fullPath = path.join(process.cwd(), normalizedPath);
              if (fs.existsSync(fullPath)) {
                const fileContent = await fs.promises.readFile(
                  fullPath,
                  "utf-8",
                );
                content = fileContent;

                // Parse markdown frontmatter
                const match = fileContent.match(
                  /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/,
                );
                if (match) {
                  const [, frontmatterStr] = match;
                  // frontmatter = this.parseYamlFrontmatter(frontmatterStr);
                  // For now, leave frontmatter empty
                  frontmatter = {};
                }

                // Create feature node for graph
                const nodeId = `feature:${normalizedPath}`;
                featureNodes.push({
                  id: nodeId,
                  attributes: {
                    ...frontmatter,
                    _path: normalizedPath,
                    _type: "feature",
                    _testKey: testKey,
                    _feature: feature,
                  },
                });

                // Add edges for dependencies
                if (frontmatter.dependsUpon) {
                  const dependencies = Array.isArray(frontmatter.dependsUpon)
                    ? frontmatter.dependsUpon
                    : [frontmatter.dependsUpon];

                  for (const dep of dependencies) {
                    let depPath = dep;
                    if (depPath.startsWith("./")) {
                      depPath = depPath.substring(2);
                    }
                    if (depPath.startsWith("/")) {
                      depPath = depPath.substring(1);
                    }
                    depPath = depPath.replace(/\\/g, "/");

                    const depNodeId = `feature:${depPath}`;
                    featureEdges.push({
                      source: depNodeId,
                      target: nodeId,
                      attributes: {
                        type: "dependsUpon",
                      },
                    });
                  }
                }
              }
            } catch (error) {
              console.warn(
                `Could not read or parse feature file ${normalizedPath}:`,
                error,
              );
            }

            features.push({
              testKey,
              feature,
              isDocumentation: true,
              path: normalizedPath,
              frontmatter,
              content,
            });

            // Add to documentation files if not already present
            if (!documentationFiles.includes(normalizedPath)) {
              documentationFiles.push(normalizedPath);
            }
          } else {
            // Plain string feature
            features.push({
              testKey,
              feature,
              isDocumentation: false,
            });

            // Create node for plain feature
            const nodeId = `feature:plain:${feature.replace(/[^a-zA-Z0-9]/g, "_")}`;
            featureNodes.push({
              id: nodeId,
              attributes: {
                _type: "plain_feature",
                _testKey: testKey,
                _feature: feature,
                name: feature,
              },
            });
          }
        }

        // Get BDD status
        // Look for BDD log exit code in the test directory
        const bddExitCode = await getBddExitCodeForTest(
          runtimeKey,
          testName,
        );
        bddStatus[testKey] = bddExitCode;
      }
    }
  }

  // Create feature graph
  const featureGraph = {
    nodes: featureNodes,
    edges: featureEdges.length > 0 ? featureEdges : undefined,
  };

  return { features, documentationFiles, bddStatus, featureGraph };
};
