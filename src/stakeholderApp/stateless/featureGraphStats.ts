import { type GraphData } from "../../grafeovidajo";

export interface FeatureGraphStats {
  totalFeatures: number;
  dependencies: number;
  todo: number;
  doing: number;
  done: number;
}

export function getFeatureGraphStats(featureGraph?: GraphData): FeatureGraphStats {
  if (!featureGraph || !featureGraph.nodes) {
    return {
      totalFeatures: 0,
      dependencies: featureGraph?.edges?.length || 0,
      todo: 0,
      doing: 0,
      done: 0,
    };
  }

  const nodes = featureGraph.nodes;
  const todo = nodes.filter((n: any) => n.attributes?.status === 'todo').length;
  const doing = nodes.filter((n: any) => n.attributes?.status === 'doing').length;
  const done = nodes.filter((n: any) => n.attributes?.status === 'done').length;

  return {
    totalFeatures: nodes.length,
    dependencies: featureGraph.edges?.length || 0,
    todo,
    doing,
    done,
  };
}
