import { useEffect, useRef, useState } from 'react';
import { Device } from 'react-native-ble-plx';

import bleService from '../services/BLEService';

export default function useBLE() {
  // ------------------------------------------
  // REACT STATES
  // ------------------------------------------

  const [devices, setDevices] = useState<Device[]>([]);

  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const [isScanning, setIsScanning] = useState(false);

  const [isConnecting, setIsConnecting] = useState(false);

  const [isConnected, setIsConnected] = useState(false);

  const [temperature, setTemperature] = useState<number | null>(null);

  const [ledOn, setLedOn] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Keep track of the connection listener.
  const disconnectSubscription = useRef<any>(null);

  // ------------------------------------------
  // 1. SCAN FOR ESP32
  // ------------------------------------------

  function scanDevices() {
    console.log('[APP] Starting BLE scan');

    setDevices([]);
    setError(null);
    setIsScanning(true);

    bleService.startScan(
      device => {
        // Avoid adding the same device multiple times.
        setDevices(previousDevices => {
          const alreadyExists = previousDevices.some(
            item => item.id === device.id,
          );

          if (alreadyExists) {
            return previousDevices;
          }

          return [...previousDevices, device];
        });
      },

      scanError => {
        console.log('[APP] Scan failed:', scanError.message);

        setError(scanError.message);
        setIsScanning(false);
      },
    );
  }

  // ------------------------------------------
  // 2. STOP SCANNING
  // ------------------------------------------

  function stopScan() {
    bleService.stopScan();

    setIsScanning(false);
  }

  // ------------------------------------------
  // 3. CONNECT TO ESP32
  // ------------------------------------------

  async function connectToDevice(device: Device) {
    try {
      console.log('[APP] Connecting to:', device.name);

      stopScan();

      setIsConnecting(true);
      setError(null);

      const connected = await bleService.connectToDevice(device.id);

      setConnectedDevice(connected);
      setIsConnected(true);

      console.log('[APP] ESP32 connected successfully');

      // Listen for unexpected disconnections.
      if (disconnectSubscription.current) {
        disconnectSubscription.current.remove();
      }

      disconnectSubscription.current = connected.onDisconnected(
        disconnectError => {
          console.log('[APP] ESP32 disconnected');

          if (disconnectError) {
            console.log('[APP] Disconnect reason:', disconnectError.message);
          }

          setConnectedDevice(null);
          setIsConnected(false);
          setTemperature(null);
          setLedOn(false);
        },
      );

      // Subscribe to temperature updates.
      bleService.monitorTemperature(
        newTemperature => {
          setTemperature(newTemperature);
        },

        monitorError => {
          setError(monitorError.message);
        },
      );

      // Subscribe to LED status updates.
      bleService.monitorLedStatus(
        isOn => {
          setLedOn(isOn);
        },

        monitorError => {
          setError(monitorError.message);
        },
      );

      // Read the initial LED state.
      const currentLedStatus = await bleService.readLedStatus();

      setLedOn(currentLedStatus);
    } catch (connectionError) {
      console.log('[APP] Connection failed:', connectionError);

      setError(
        connectionError instanceof Error
          ? connectionError.message
          : 'Connection failed',
      );

      setConnectedDevice(null);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }

  // ------------------------------------------
  // 4. CONTROL ESP32 LED
  // ------------------------------------------

  async function toggleLed() {
    if (!isConnected) {
      setError('Connect to ESP32 first');
      return;
    }

    try {
      // Request the opposite of the currently reported state.
      const requestedState = !ledOn;

      console.log('[APP] Requesting LED state:', requestedState);

      await bleService.setLed(requestedState);

      // Do not update ledOn here.
      // Wait for the ESP32 status notification to confirm it.
    } catch (ledError) {
      console.log('[APP] LED command failed:', ledError);

      setError(
        ledError instanceof Error ? ledError.message : 'LED command failed',
      );
    }
  }

  // ------------------------------------------
  // 5. DISCONNECT
  // ------------------------------------------

  async function disconnect() {
    try {
      console.log('[APP] Disconnecting from ESP32');

      await bleService.disconnect();

      if (disconnectSubscription.current) {
        disconnectSubscription.current.remove();
        disconnectSubscription.current = null;
      }

      setConnectedDevice(null);
      setIsConnected(false);
      setTemperature(null);
      setLedOn(false);

      console.log('[APP] Disconnected');
    } catch (disconnectError) {
      console.log('[APP] Disconnect failed:', disconnectError);

      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : 'Disconnect failed',
      );
    }
  }

  // ------------------------------------------
  // 6. CLEANUP
  // ------------------------------------------

  useEffect(() => {
    return () => {
      console.log('[APP] Cleaning up BLE hook');

      bleService.stopScan();

      if (disconnectSubscription.current) {
        disconnectSubscription.current.remove();
        disconnectSubscription.current = null;
      }

      // Disconnect the device and remove subscriptions.
      bleService.disconnect().catch(error => {
        console.log('[APP] Cleanup error:', error);
      });
    };
  }, []);

  // ------------------------------------------
  // RETURN VALUES TO THE SCREEN
  // ------------------------------------------

  return {
    devices,

    connectedDevice,

    isScanning,
    isConnecting,
    isConnected,

    temperature,
    ledOn,

    error,

    scanDevices,
    stopScan,
    connectToDevice,
    toggleLed,
    disconnect,
  };
}
