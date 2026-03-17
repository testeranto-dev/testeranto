import React from 'react';
import { BaseChart, VizComponentProps } from './BaseChart';
import { VizConfig } from '../core/types';

export interface TreeConfig extends VizConfig {
  rootId?: string;
  orientation: 'horizontal' | 'vertical';
  nodeSeparation: number;
  levelSeparation: number;
}

export const TreeGraph: React.FC<VizComponentProps & { config: TreeConfig }> = (props) => {
  // TreeGraph uses the BaseChart with tree layout
  // Additional tree-specific rendering can be added here
  
  return <BaseChart {...props} />;
};
