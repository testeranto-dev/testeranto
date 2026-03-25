/**
 * Utility functions for working with Sets
 */

export function togglePathInSet(
  currentSet: Set<string>,
  path: string
): Set<string> {
  const newSet = new Set(currentSet);
  if (newSet.has(path)) {
    newSet.delete(path);
  } else {
    newSet.add(path);
  }
  return newSet;
}
