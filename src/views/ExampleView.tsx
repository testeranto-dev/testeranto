// import React from 'react';
// import { View } from './View';

// interface ExampleData {
//   title: string;
//   items: string[];
//   count: number;
// }

// function ExampleComponent({ data, onUpdate }: { data: ExampleData; onUpdate?: (data: ExampleData) => void }) {
//   const handleAddItem = () => {
//     if (!onUpdate) return;
    
//     const newItem = `Item ${data.items.length + 1}`;
//     const newData = {
//       ...data,
//       items: [...data.items, newItem],
//       count: data.count + 1,
//     };
//     onUpdate(newData);
//   };

//   const handleReset = () => {
//     if (!onUpdate) return;
    
//     const newData = {
//       ...data,
//       items: [],
//       count: 0,
//     };
//     onUpdate(newData);
//   };

//   return (
//     <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
//       <h1>{data.title}</h1>
//       <p>Count: {data.count}</p>
//       <ul>
//         {data.items.map((item, index) => (
//           <li key={index}>{item}</li>
//         ))}
//       </ul>
//       {onUpdate && (
//         <div style={{ marginTop: '20px' }}>
//           <button onClick={handleAddItem} style={{ marginRight: '10px' }}>
//             Add Item
//           </button>
//           <button onClick={handleReset}>
//             Reset
//           </button>
//         </div>
//       )}
//       {!onUpdate && (
//         <p><em>Static mode - updates disabled</em></p>
//       )}
//     </div>
//   );
// }

// export function ExampleView() {
//   // Example data path
//   const dataPath = '/data/example.json';
  
//   return (
//     <View
//       dataPath={dataPath}
//       component={ExampleComponent}
//       staticMode={false}
//       onSendUpdate={async (path, data) => {
//         // In a real implementation, send to server
//         console.log('Sending update to server:', { path, data });
//         // Simulate API call
//         await new Promise(resolve => setTimeout(resolve, 500));
//       }}
//     />
//   );
// }
