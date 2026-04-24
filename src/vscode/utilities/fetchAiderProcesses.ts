import * as vscode from 'vscode';

export async function fetchAiderProcesses(): Promise<any[]> {
  try {
    // Use the server API to get aider processes
    // TODO: This should be defined in the API
    const response = await fetch('http://localhost:3000/~/open-process-terminal');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.aiderProcesses || [];
  } catch (error) {
    console.error('Failed to fetch aider processes from server:', error);
    return [];
  }
}
