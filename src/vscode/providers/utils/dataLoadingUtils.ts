export async function loadProcesses(): Promise<any[]> {
    try {
        const response = await fetch('http://localhost:3000/~/processes');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return data.processes || [];
    } catch (error) {
        console.error('Error loading processes:', error);
        return [];
    }
}
