import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import useBLE from '../hooks/useBLE';

export default function HomeScreen() {
  // Get BLE data and functions from our custom hook.
  const {
    devices,
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
  } = useBLE();

  return (
    <ScrollView style={styles.container}>
      {/* APP HEADER */}

      <View style={styles.header}>
        <Text style={styles.title}>BLE Lab</Text>
        <Text style={styles.subtitle}>ESP32 Device Monitor</Text>
      </View>

      {/* CONNECTION STATUS */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bluetooth Connection</Text>

        <Text style={styles.statusText}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>

        <Text style={styles.smallText}>
          {isConnected
            ? 'ESP32 is communicating with your phone'
            : 'No device connected'}
        </Text>

        {!isConnected && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={scanDevices}
            disabled={isScanning || isConnecting}
          >
            {isScanning || isConnecting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Scan for ESP32</Text>
            )}
          </TouchableOpacity>
        )}

        {isScanning && (
          <TouchableOpacity style={styles.secondaryButton} onPress={stopScan}>
            <Text style={styles.secondaryButtonText}>Stop Scanning</Text>
          </TouchableOpacity>
        )}

        {isConnecting && (
          <Text style={styles.smallText}>Connecting to ESP32...</Text>
        )}

        {isConnected && (
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={disconnect}
          >
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DISCOVERED DEVICES */}

      {!isConnected && devices.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Discovered Devices</Text>

          {devices.map(device => (
            <TouchableOpacity
              key={device.id}
              style={styles.deviceItem}
              onPress={() => connectToDevice(device)}
              disabled={isConnecting}
            >
              <View>
                <Text style={styles.deviceName}>
                  {device.name || 'Unknown Device'}
                </Text>

                <Text style={styles.smallText}>
                  Signal: {device.rssi ?? 'N/A'} dBm
                </Text>
              </View>

              <Text style={styles.connectText}>Connect →</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* TEMPERATURE CARD */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Temperature Sensor</Text>

        <Text style={styles.temperature}>
          {isConnected && temperature !== null
            ? `${temperature.toFixed(1)} °C`
            : '-- °C'}
        </Text>

        <Text style={styles.smallText}>
          {isConnected
            ? 'Live ESP32 temperature'
            : 'Connect to view temperature'}
        </Text>
      </View>

      {/* LED CONTROL CARD */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ESP32 Built-in LED</Text>

        <Text style={styles.ledStatus}>
          {isConnected
            ? ledOn
              ? 'LED is ON'
              : 'LED is OFF'
            : 'Device not connected'}
        </Text>

        <TouchableOpacity
          style={[styles.ledButton, ledOn ? styles.ledOn : styles.ledOff]}
          onPress={toggleLed}
          disabled={!isConnected}
        >
          <Text style={styles.buttonText}>
            {ledOn ? 'Turn LED OFF' : 'Turn LED ON'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ERROR MESSAGE */}

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ------------------------------------------
// STYLES
// ------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  header: {
    padding: 24,
    paddingTop: 55,
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
  },

  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 5,
  },

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 14,
  },

  statusText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16A34A',
  },

  smallText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },

  primaryButton: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 10,
    marginTop: 18,
    alignItems: 'center',
  },

  secondaryButton: {
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#2563EB',
    fontWeight: '600',
  },

  disconnectButton: {
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 10,
    marginTop: 18,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  connectText: {
    color: '#2563EB',
    fontWeight: '600',
  },

  temperature: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#2563EB',
    marginTop: 8,
  },

  ledStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  ledButton: {
    padding: 15,
    borderRadius: 10,
    marginTop: 18,
    alignItems: 'center',
  },

  ledOn: {
    backgroundColor: '#DC2626',
  },

  ledOff: {
    backgroundColor: '#16A34A',
  },

  errorCard: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 18,
    marginBottom: 25,
    padding: 15,
    borderRadius: 10,
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
});
