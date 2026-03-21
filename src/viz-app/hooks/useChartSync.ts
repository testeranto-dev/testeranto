import { useCallback } from 'react';
import { Node } from 'viz';
import { MarkdownFile } from '../types';

export function useChartSync(
  files: MarkdownFile[],
  updateFile: (filePath: string, updates: Record<string, any>) => Promise<MarkdownFile>,
  attributeMapping: { idAttribute: string; xAttribute?: string; yAttribute?: string }
) {
  const handleNodeUpdate = useCallback(async (
    node: Node,
    updates: Record<string, any>
  ) => {
    const filePath = node.attributes._path;
    if (!filePath) {
      console.warn('Node has no associated file path:', node.id);
      return;
    }
    
    // Remove internal attributes from updates
    const cleanUpdates = { ...updates };
    delete cleanUpdates._path;
    delete cleanUpdates._body;
    
    try {
      await updateFile(filePath, cleanUpdates);
    } catch (error) {
      console.error('Failed to update file:', error);
      throw error;
    }
  }, [updateFile]);

  const handleNodeDrag = useCallback(async (
    node: Node,
    newPosition: { x: number; y: number }
  ) => {
    // Map screen coordinates back to attribute values
    // This depends on the projection configuration
    const updates: Record<string, any> = {};
    
    if (attributeMapping.xAttribute) {
      // This is a simplification - actual mapping would depend on projection config
      updates[attributeMapping.xAttribute] = newPosition.x;
    }
    
    if (attributeMapping.yAttribute) {
      updates[attributeMapping.yAttribute] = newPosition.y;
    }
    
    return handleNodeUpdate(node, updates);
  }, [handleNodeUpdate, attributeMapping]);

  const handleNodeAttributeChange = useCallback(async (
    node: Node,
    attribute: string,
    value: any
  ) => {
    return handleNodeUpdate(node, { [attribute]: value });
  }, [handleNodeUpdate]);

  return {
    handleNodeUpdate,
    handleNodeDrag,
    handleNodeAttributeChange
  };
}
