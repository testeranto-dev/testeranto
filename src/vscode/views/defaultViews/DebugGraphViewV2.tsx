import React from 'react';
import type { GraphData } from '../../../graph';
import { BaseViewClass } from '../BaseViewClass';
import { DebugGraphV2 } from './DebugGraphV2';

export class DebugGraphViewV2 extends BaseViewClass<GraphData> {
  renderContent() {
    const data = this.state.data;

    if (!data) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 255, 0.1)'
        }}>
          <div>Loading graph data...</div>
        </div>
      );
    }

    if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 255, 0.1)'
        }}>
          <div>No graph nodes available</div>
        </div>
      );
    }

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <DebugGraphV2 data={data} />
      </div>
    );
  }
}

export default DebugGraphViewV2;
