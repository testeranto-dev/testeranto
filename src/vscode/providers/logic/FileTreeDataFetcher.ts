// import { ApiUtils } from '../utils/apiUtils';
// import { GraphData } from './FileTreeLogic';

// export class FileTreeDataFetcher {
//   async fetchGraphData(): Promise<GraphData | null> {
//     try {
//       console.log('[FileTreeDataFetcher] Loading graph data from files slice');
//       const url = ApiUtils.getFilesSliceUrl();
//       console.log(`[FileTreeDataFetcher] Fetching from URL: ${url}`);
      
//       // Create an AbortController for timeout
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 3000);
      
//       const response = await fetch(url, { 
//         signal: controller.signal 
//       }).catch(error => {
//         console.log(`[FileTreeDataFetcher] Fetch error: ${error.message}`);
//         if (error.name === 'AbortError') {
//           throw new Error(`Connection timeout to server at ${url}. Make sure the Testeranto server is running.`);
//         } else {
//           throw new Error(`Cannot connect to server at ${url}: ${error.message}`);
//         }
//       }).finally(() => {
//         clearTimeout(timeoutId);
//       });
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
//       }
      
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('[FileTreeDataFetcher] Failed to load graph data:', error);
//       throw error;
//     }
//   }
// }
