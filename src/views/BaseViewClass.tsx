import React from 'react';
import type { GraphData } from '../graph';

export interface BaseViewProps<T = GraphData> {
  /** Path to the slice JSON file */
  slicePath: string;
  /** Width of the view */
  width?: number;
  /** Height of the view */
  height?: number;
  /** Optional configuration for the view */
  config?: Record<string, any>;
}

export abstract class BaseViewClass<T = GraphData> extends React.Component<BaseViewProps<T>> {
  state = {
    data: null as T | null,
    loading: true,
    error: null as string | null,
  };

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps: BaseViewProps<T>) {
    if (prevProps.slicePath !== this.props.slicePath) {
      this.loadData();
    }
  }

  async loadData() {
    const { slicePath } = this.props;
    
    if (!slicePath) {
      this.setState({ error: 'slicePath is empty or undefined', loading: false });
      return;
    }

    try {
      this.setState({ loading: true, error: null });
      const response = await fetch(slicePath);
      
      if (!response.ok) {
        throw new Error(`Failed to load slice data from ${slicePath}: ${response.status} ${response.statusText}`);
      }
      
      const jsonData = await response.json();
      this.setState({ data: jsonData, loading: false });
    } catch (err) {
      this.setState({ 
        error: err instanceof Error ? err.message : 'Unknown error loading slice data',
        loading: false 
      });
    }
  }

  // Abstract method to be implemented by subclasses
  abstract renderContent(): React.ReactNode;

  render() {
    const { loading, error, data } = this.state;
    const { width = 800, height = 600 } = this.props;

    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          width, 
          height,
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h3>Loading view...</h3>
            <p>Loading slice data from:</p>
            <p style={{ 
              fontFamily: 'monospace', 
              backgroundColor: '#f0f0f0', 
              padding: '5px', 
              borderRadius: '3px',
              margin: '10px',
              wordBreak: 'break-all'
            }}>
              {this.props.slicePath}
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ 
          padding: '20px', 
          border: '1px solid #d32f2f',
          borderRadius: '4px',
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          width,
          height,
          overflow: 'auto'
        }}>
          <h3>Error loading view</h3>
          <p><strong>Error message:</strong> {error}</p>
          <p><strong>Slice path:</strong> {this.props.slicePath}</p>
        </div>
      );
    }

    if (!data) {
      return (
        <div style={{ 
          padding: '20px', 
          border: '1px solid #ff9800',
          borderRadius: '4px',
          backgroundColor: '#fff3e0',
          color: '#f57c00',
          width,
          height
        }}>
          <h3>No data available</h3>
          <p>Slice data is empty or could not be parsed.</p>
          <p>Slice path: {this.props.slicePath}</p>
        </div>
      );
    }

    return this.renderContent();
  }
}
