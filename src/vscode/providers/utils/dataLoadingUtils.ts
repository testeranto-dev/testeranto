// import { ApiUtils } from './apiUtils';

// export async function loadProcesses(): Promise<any[]> {
//     try {
//         const response = await fetch(ApiUtils.getProcessesUrl());
//         if (!response.ok) {
//             throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//         }
//         const data: ProcessesResponse = await response.json();
//         return data.processes || [];
//     } catch (error) {
//         console.error('Error loading processes:', error);
//         return [];
//     }
// }
