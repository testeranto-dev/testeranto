/**
 * Apply a graph update
 */
export function applyUpdate(update: any): any {
  // Log the update and return it
  // console.log('[applyUpdate] Applying graph update:', update);
  return {
    success: true,
    update,
    timestamp: new Date().toISOString()
  };
}
