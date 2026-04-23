import React from 'react';
import type { IHome } from './Home';
import type { VizConfig } from '../../grafeovidajo';
import { BaseViewClass } from '../BaseViewClass';

export interface HomeConfig extends VizConfig {
  showDescriptions: boolean;
  columns: number;
  cardWidth: number;
  cardHeight: number;
  showDefaultViews: boolean;
}

export class Home extends BaseViewClass<IHome> {
  state = {
    ...this.state,
    hoveredCardId: null as string | null
  };

  get config(): HomeConfig {
    return this.props.config || {
      showDescriptions: true,
      columns: 3,
      cardWidth: 300,
      cardHeight: 200,
      showDefaultViews: true
    };
  }

  renderViewCard(view: any, index: number, isDefault: boolean = false) {
    const config = this.config;
    const { width = 800 } = this.props;
    const isHovered = this.state.hoveredCardId === (view.id || `view-${index}`);
    
    const cardStyle: React.CSSProperties = {
      width: config.cardWidth,
      height: config.cardHeight,
      margin: '15px',
      padding: '20px',
      border: isDefault ? '2px dashed #4a90e2' : '1px solid #e0e0e0',
      borderRadius: '12px',
      backgroundColor: isDefault ? '#f8fbff' : '#ffffff',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      textDecoration: 'none',
      color: 'inherit'
    };

    const hoverStyle: React.CSSProperties = {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 12px rgba(0, 0, 0, 0.15)',
      borderColor: isDefault ? '#2c6bb3' : '#4a90e2'
    };

    const titleStyle: React.CSSProperties = {
      fontSize: '20px',
      fontWeight: 'bold',
      color: isDefault ? '#2c6bb3' : '#333',
      marginBottom: '10px',
      textAlign: 'center'
    };

    const descriptionStyle: React.CSSProperties = {
      fontSize: '14px',
      color: isDefault ? '#5a8ac8' : '#666',
      lineHeight: '1.5',
      flexGrow: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    };

    const idStyle: React.CSSProperties = {
      fontSize: '12px',
      color: '#999',
      fontFamily: 'monospace',
      marginTop: '10px',
      textAlign: 'center'
    };

    const badgeStyle: React.CSSProperties = {
      fontSize: '10px',
      color: isDefault ? '#2c6bb3' : '#666',
      backgroundColor: isDefault ? '#e3f2fd' : '#f5f5f5',
      padding: '2px 8px',
      borderRadius: '10px',
      marginTop: '5px',
      display: 'inline-block'
    };

    const linkStyle: React.CSSProperties = {
      fontSize: '14px',
      color: isDefault ? '#2c6bb3' : '#4a90e2',
      textDecoration: 'none',
      marginTop: '15px',
      textAlign: 'center',
      fontWeight: '500'
    };

    const handleClick = () => {
      // Navigate to the view
      let viewKey;
      if (view.metadata?.viewKey) {
        viewKey = view.metadata.viewKey;
      } else {
        viewKey = view.label;
      }
      
      // Handle known discrepancies between viewKey and HTML filename
      const specialCases: Record<string, string> = {
        'Kanban': 'KanBan',
        // Add other special cases as needed
      };
      
      if (specialCases[viewKey]) {
        viewKey = specialCases[viewKey];
      }
      
      // Remove any 'view:' prefix if present
      const cleanViewKey = viewKey.replace(/^view:/, '');
      window.location.href = `/testeranto/views/${cleanViewKey}.html`;
    };

    const handleMouseEnter = () => {
      this.setState({ hoveredCardId: view.id || `view-${index}` });
    };

    const handleMouseLeave = () => {
      this.setState({ hoveredCardId: null });
    };

    return (
      <div
        key={`view-${view.id || index}`}
        style={{
          ...cardStyle,
          ...(isHovered ? hoverStyle : {})
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div style={titleStyle}>
          {view.label}
        </div>
        {config.showDescriptions && view.description && (
          <div style={descriptionStyle}>
            {view.description}
          </div>
        )}
        <div style={idStyle}>
          ID: {view.id}
        </div>
        {isDefault && (
          <div style={{ textAlign: 'center' }}>
            <span style={badgeStyle}>Default View</span>
          </div>
        )}
        <div style={linkStyle}>
          Click to open →
        </div>
      </div>
    );
  }

  renderContent() {
    const { width = 800, height = 600 } = this.props;
    const config = this.config;
    const data = this.state.data;

    if (!data) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Loading Home View...</h2>
            <p style={{ color: '#666' }}>Please wait while we load the available views.</p>
          </div>
        </div>
      );
    }

    const views = data.views || [];

    // Calculate grid layout
    const columns = Math.max(1, Math.min(config.columns, Math.floor(width / (config.cardWidth + 30))));
    const gridStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '20px',
      padding: '20px',
      width: '100%',
      boxSizing: 'border-box'
    };

    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'auto',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ 
          padding: '30px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ 
            marginBottom: '30px', 
            paddingBottom: '20px',
            borderBottom: '3px solid #4a90e2'
          }}>
            <h1 style={{ margin: 0, color: '#333', fontSize: '36px' }}>Available Views</h1>
            <div style={{ fontSize: '16px', color: '#666', marginTop: '10px' }}>
              {views.length} view{views.length !== 1 ? 's' : ''} available
            </div>
          </div>
          <div style={gridStyle}>
            {views.map((view: any, index: number) => 
              this.renderViewCard(view, index, false)
            )}
          </div>
          {views.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ color: '#666', marginBottom: '20px' }}>No views available</h3>
              <p style={{ color: '#999' }}>
                View nodes will appear here when they are added to the graph.
              </p>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4a90e2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginTop: '20px'
                }}
              >
                Refresh Page
              </button>
            </div>
          )}
          <div style={{ 
            marginTop: '40px',
            padding: '20px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: '#333', marginBottom: '10px' }}>About Views</h3>
            <p style={{ color: '#666', marginBottom: '10px' }}>
              Views are React components that display slices of graph data. Each view has:
            </p>
            <ul style={{ color: '#666', paddingLeft: '20px' }}>
              <li>A <strong>slicer function</strong> that extracts relevant data from the graph</li>
              <li>A <strong>React component</strong> that renders the data</li>
              <li>A <strong>configuration</strong> for customization</li>
            </ul>
            <p style={{ color: '#666', marginTop: '10px' }}>
              To add view nodes to the graph, create nodes with type <code>{'{ category: "view", type: "view" }'}</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

// Wrapper component for backward compatibility
export const HomeView: React.FC<{ slicePath: string; width?: number; height?: number }> = ({
  slicePath,
  width = 800,
  height = 600
}) => {
  return (
    <Home
      slicePath={slicePath}
      width={width}
      height={height}
    />
  );
};

// Default export for the view
export default HomeView;
