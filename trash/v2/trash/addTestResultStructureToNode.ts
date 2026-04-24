/**
 * Add test result structure to a node
 */
export async function addTestResultStructureToNode(
  node: any,
  testData: any,
): Promise<void> {
  if (!node.children) {
    node.children = {};
  }

  node.children["summary"] = {
    type: "test-summary",
    name: "summary",
    path: node.path + "/summary",
    failed: testData.failed,
    fails: testData.fails,
    runTimeTests: testData.runTimeTests,
    features: testData.features || [],
  };

  if (testData.testJob) {
    node.children["testJob"] = {
      type: "test-job",
      name: "testJob",
      path: node.path + "/testJob",
      name: testData.testJob.name,
      fails: testData.testJob.fails,
      failed: testData.testJob.failed,
      features: testData.testJob.features || [],
    };

    if (testData.testJob.givens && Array.isArray(testData.testJob.givens)) {
      node.children["givens"] = {
        type: "directory",
        name: "givens",
        path: node.path + "/givens",
        children: {},
      };

      for (let i = 0; i < testData.testJob.givens.length; i++) {
        const given = testData.testJob.givens[i];
        const givenKey = given.key || `given_${i}`;

        node.children["givens"].children[givenKey] = {
          type: "test-given",
          name: givenKey,
          path: node.path + "/givens/" + givenKey,
          failed: given.failed,
          features: given.features || [],
          error: given.error,
          status: given.status,
          children: {},
        };

        if (given.whens && Array.isArray(given.whens)) {
          node.children["givens"].children[givenKey].children["whens"] = {
            type: "directory",
            name: "whens",
            path: node.path + "/givens/" + givenKey + "/whens",
            children: {},
          };

          for (let j = 0; j < given.whens.length; j++) {
            const when = given.whens[j];
            const whenKey = when.name || `when_${j}`;

            node.children["givens"].children[givenKey].children[
              "whens"
            ].children[whenKey] = {
              type: "test-when",
              name: whenKey,
              path: node.path + "/givens/" + givenKey + "/whens/" + whenKey,
              status: when.status,
              error: when.error,
              artifacts: when.artifacts || [],
            };
          }
        }

        if (given.thens && Array.isArray(given.thens)) {
          node.children["givens"].children[givenKey].children["thens"] = {
            type: "directory",
            name: "thens",
            path: node.path + "/givens/" + givenKey + "/thens",
            children: {},
          };

          for (let j = 0; j < given.thens.length; j++) {
            const then = given.thens[j];
            const thenKey = then.name || `then_${j}`;

            node.children["givens"].children[givenKey].children[
              "thens"
            ].children[thenKey] = {
              type: "test-then",
              name: thenKey,
              path: node.path + "/givens/" + givenKey + "/thens/" + thenKey,
              status: then.status,
              error: then.error,
              artifacts: then.artifacts || [],
            };
          }
        }
      }
    }
  }

  if (testData.features && Array.isArray(testData.features)) {
    node.children["features"] = {
      type: "directory",
      name: "features",
      path: node.path + "/features",
      children: {},
    };

    for (let i = 0; i < testData.features.length; i++) {
      const feature = testData.features[i];
      const featureKey =
        feature.replace(/[^a-zA-Z0-9]/g, "_") || `feature_${i}`;

      node.children["features"].children[featureKey] = {
        type: "feature",
        name: feature,
        path: node.path + "/features/" + featureKey,
      };
    }
  }
}
