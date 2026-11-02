import React from 'react';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  return <HomeScreen />;
}

// import React, { useEffect, useState } from 'react';
// import {
//   SafeAreaView,
//   View,
//   Text,
//   Button,
//   FlatList,
//   StyleSheet,
//   Platform,
//   PermissionsAndroid,
// } from 'react-native';
// import { BleManager, Device } from 'react-native-ble-plx';

// const manager = new BleManager();

// export default function App() {
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [scanning, setScanning] = useState(false);
//   const [status, setStatus] = useState('Ready to scan');

//   useEffect(() => {
//     return () => {
//       manager.stopDeviceScan();
//       manager.destroy();
//     };
//   }, []);

//   const scanForDevices = async () => {
//     setDevices([]);
//     setScanning(true);
//     setStatus('Checking Bluetooth...');

//     try {
//       const state = await manager.state();

//       if (state !== 'PoweredOn') {
//         setStatus(`Bluetooth is not ready: ${state}`);
//         setScanning(false);
//         return;
//       }

//       setStatus('Scanning for BLE devices...');

//       manager.startDeviceScan(null, null, (error, device) => {
//         if (error) {
//           setStatus(`Scan error: ${error.message}`);
//           setScanning(false);
//           manager.stopDeviceScan();
//           return;
//         }

//         if (!device) {
//           return;
//         }
//         console.log('device ', device);
//         setDevices(previous => {
//           if (previous.some(item => item.id === device.id)) {
//             return previous.map(item =>
//               item.id === device.id ? device : item,
//             );
//           }

//           return [...previous, device];
//         });
//       });

//       setTimeout(() => {
//         manager.stopDeviceScan();
//         setScanning(false);
//         setStatus('Scan finished');
//       }, 10000);
//     } catch (error) {
//       setStatus(
//         `Error: ${error instanceof Error ? error.message : String(error)}`,
//       );
//       setScanning(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>BLE Lab</Text>
//       <Text style={styles.subtitle}>
//         Discover nearby Bluetooth Low Energy devices
//       </Text>

//       <Button
//         title={scanning ? 'Scanning...' : 'Scan for devices'}
//         onPress={scanForDevices}
//         disabled={scanning}
//       />

//       <Text style={styles.status}>{status}</Text>
//       <Text style={styles.heading}>Discovered devices ({devices.length})</Text>

//       <FlatList
//         data={devices}
//         keyExtractor={item => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.device}>
//             <Text style={styles.deviceName}>
//               {item.name ?? item.localName ?? 'Unknown device'}
//             </Text>
//             <Text>Device ID: {item.id}</Text>
//             <Text>RSSI: {item.rssi ?? 'Unknown'} dBm</Text>
//           </View>
//         )}
//         ListEmptyComponent={<Text>No devices found yet. Start a scan.</Text>}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     paddingTop: 40,
//     backgroundColor: '#FFFFFF',
//     paddingHorizontal: 16,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     marginBottom: 8,
//   },
//   subtitle: {
//     color: '#555555',
//     marginBottom: 20,
//   },
//   status: {
//     marginVertical: 16,
//     color: '#176B57',
//   },
//   heading: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginBottom: 12,
//   },
//   device: {
//     borderWidth: 1,
//     borderColor: '#DDDDDD',
//     borderRadius: 10,
//     padding: 12,
//     marginBottom: 10,
//   },
//   deviceName: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 6,
//   },
// });
