import { BleManager, Device, Subscription } from 'react-native-ble-plx';

import { decode, encode } from 'base-64';

import {
  BLE_DEVICE_NAME,
  BLE_SERVICE_UUID,
  TEMPERATURE_CHARACTERISTIC_UUID,
  LED_COMMAND_CHARACTERISTIC_UUID,
  LED_STATUS_CHARACTERISTIC_UUID,
} from '../constants/bleUUIDs';

class BLEService {
  // Bluetooth manager handles all BLE operations.
  private manager: BleManager;

  // Stores our connected ESP32 device.
  private connectedDevice: Device | null = null;

  // Stores active notification subscriptions.
  private temperatureSubscription: Subscription | null = null;
  private ledStatusSubscription: Subscription | null = null;

  // Constructor runs when we create the BLEService object.
  constructor() {
    this.manager = new BleManager();

    console.log('[BLE] Bluetooth manager initialized');
  }

  // ------------------------------------------
  // 1. SCAN FOR ESP32
  // ------------------------------------------

  startScan(
    onDeviceFound: (device: Device) => void,
    onError: (error: Error) => void,
  ): void {
    console.log('[BLE] Starting device scan...');

    // Stop any previous scan before starting a new one.
    this.manager.stopDeviceScan();

    this.manager.startDeviceScan(
      [BLE_SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.log('[BLE] Scan error:', error.message);

          onError(error);
          return;
        }

        if (device === null) {
          return;
        }

        // Get the advertised device name.
        const deviceName = device.name || device.localName;

        // Check whether this is our ESP32.
        if (deviceName === BLE_DEVICE_NAME) {
          console.log('[BLE] ESP32 discovered!');
          console.log('[BLE] Device ID:', device.id);
          console.log('[BLE] RSSI:', device.rssi);

          onDeviceFound(device);
        }
      },
    );
  }

  // Stop scanning for nearby devices.
  stopScan(): void {
    this.manager.stopDeviceScan();

    console.log('[BLE] Device scan stopped');
  }

  // ------------------------------------------
  // 2. CONNECT TO ESP32
  // ------------------------------------------

  async connectToDevice(deviceId: string): Promise<Device> {
    try {
      console.log('[BLE] Connecting to ESP32...');

      // Establish BLE connection.
      const device = await this.manager.connectToDevice(deviceId, {
        timeout: 10000,
      });

      console.log('[BLE] Connection established');

      // Discover GATT services and characteristics.
      const discoveredDevice =
        await device.discoverAllServicesAndCharacteristics();

      console.log('[BLE] GATT discovery completed');

      // Get all services available on the ESP32.
      const services = await discoveredDevice.services();

      // Verify our expected BLE service exists.
      const expectedService = services.find(
        service =>
          service.uuid.toLowerCase() === BLE_SERVICE_UUID.toLowerCase(),
      );

      if (!expectedService) {
        throw new Error('BLE Lab service not found');
      }

      console.log('[BLE] BLE Lab service verified');

      // Get characteristics belonging to our service.
      const characteristics = await discoveredDevice.characteristicsForService(
        BLE_SERVICE_UUID,
      );

      // Check temperature characteristic.
      const temperatureExists = characteristics.some(
        item =>
          item.uuid.toLowerCase() ===
          TEMPERATURE_CHARACTERISTIC_UUID.toLowerCase(),
      );

      // Check LED command characteristic.
      const ledCommandExists = characteristics.some(
        item =>
          item.uuid.toLowerCase() ===
          LED_COMMAND_CHARACTERISTIC_UUID.toLowerCase(),
      );

      // Check LED status characteristic.
      const ledStatusExists = characteristics.some(
        item =>
          item.uuid.toLowerCase() ===
          LED_STATUS_CHARACTERISTIC_UUID.toLowerCase(),
      );

      // Stop if any required characteristic is missing.
      if (!temperatureExists || !ledCommandExists || !ledStatusExists) {
        throw new Error('Required BLE characteristics are missing');
      }

      console.log('[BLE] All characteristics verified');

      // Save the connected device.
      this.connectedDevice = discoveredDevice;

      return discoveredDevice;
    } catch (error) {
      console.log('[BLE] Connection failed:', error);

      // Clean up a partially established connection.
      try {
        await this.manager.cancelDeviceConnection(deviceId);
      } catch (disconnectError) {
        console.log('[BLE] Connection cleanup error:', disconnectError);
      }

      this.connectedDevice = null;

      throw error;
    }
  }

  // ------------------------------------------
  // 3. RECEIVE TEMPERATURE NOTIFICATIONS
  // ------------------------------------------

  monitorTemperature(
    onTemperatureReceived: (temperature: number) => void,
    onError: (error: Error) => void,
  ): void {
    if (!this.connectedDevice) {
      onError(new Error('ESP32 is not connected'));
      return;
    }

    console.log('[BLE] Subscribing to temperature notifications...');

    if (this.temperatureSubscription) {
      this.temperatureSubscription.remove();
      this.temperatureSubscription = null;
    }

    this.temperatureSubscription = this.manager.monitorCharacteristicForDevice(
      this.connectedDevice.id,
      BLE_SERVICE_UUID,
      TEMPERATURE_CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          console.log('[BLE] Temperature error:', error.message);
          onError(error);
          return;
        }

        if (!characteristic || !characteristic.value) {
          return;
        }

        const receivedValue = decode(characteristic.value);
        const temperature = Number(receivedValue);

        if (Number.isNaN(temperature)) {
          console.log('[BLE] Invalid temperature:', receivedValue);
          return;
        }

        console.log('[BLE] Temperature:', temperature, '°C');

        onTemperatureReceived(temperature);
      },
    );
  }

  // ------------------------------------------
  // 4. RECEIVE LED STATUS NOTIFICATIONS
  // ------------------------------------------

  monitorLedStatus(
    onStatusReceived: (isOn: boolean) => void,
    onError: (error: Error) => void,
  ): void {
    if (!this.connectedDevice) {
      console.log('ESP32 Device is not connected');
      return;
    }

    console.log('[BLE] Subscribing to LED status notifications...');

    // Remove an older subscription if it exists.
    if (this.ledStatusSubscription) {
      this.ledStatusSubscription.remove();
      this.ledStatusSubscription = null;
    }

    this.ledStatusSubscription = this.manager.monitorCharacteristicForDevice(
      this.connectedDevice.id,
      BLE_SERVICE_UUID,
      LED_STATUS_CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          console.log('[BLE] LED status error:', error.message);

          onError(error);
          return;
        }

        if (!characteristic || !characteristic.value) {
          return;
        }

        // Decode the received LED status.
        const receivedValue = decode(characteristic.value);

        if (receivedValue === '1') {
          console.log('[BLE] ESP32 confirms LED is ON');

          onStatusReceived(true);
        } else if (receivedValue === '0') {
          console.log('[BLE] ESP32 confirms LED is OFF');

          onStatusReceived(false);
        } else {
          console.log('[BLE] Unknown LED status:', receivedValue);
        }
      },
    );
  }

  // ------------------------------------------
  // 5. READ CURRENT LED STATUS
  // ------------------------------------------

  async readLedStatus(): Promise<boolean> {
    if (!this.connectedDevice) {
      throw new Error('ESP32 is not connected');
    }

    console.log('[BLE] Reading current LED status...');

    const characteristic =
      await this.connectedDevice.readCharacteristicForService(
        BLE_SERVICE_UUID,
        LED_STATUS_CHARACTERISTIC_UUID,
      );

    if (!characteristic.value) {
      throw new Error('Could not read LED status');
    }

    const value = decode(characteristic.value);

    if (value === '1') {
      console.log('[BLE] Current LED state: ON');

      return true;
    }

    if (value === '0') {
      console.log('[BLE] Current LED state: OFF');

      return false;
    }

    throw new Error('Invalid LED status received');
  }

  // ------------------------------------------
  // 6. SEND LED COMMAND TO ESP32
  // ------------------------------------------

  async setLed(isOn: boolean): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('ESP32 is not connected');
    }

    // Prepare the command.
    let command = '0';

    if (isOn === true) {
      command = '1';
    }

    // Encode the command into Base64.
    const encodedCommand = encode(command);

    console.log('[BLE] Sending LED command:', command);

    // Write command to ESP32.
    await this.connectedDevice.writeCharacteristicWithResponseForService(
      BLE_SERVICE_UUID,
      LED_COMMAND_CHARACTERISTIC_UUID,
      encodedCommand,
    );

    console.log('[BLE] LED command write acknowledged');
  }

  // ------------------------------------------
  // 7. DISCONNECT FROM ESP32
  // ------------------------------------------

  async disconnect(): Promise<void> {
    console.log('[BLE] Starting disconnect...');

    // Remove temperature notification listener.
    if (this.temperatureSubscription) {
      this.temperatureSubscription.remove();
      this.temperatureSubscription = null;
    }

    // Remove LED notification listener.
    if (this.ledStatusSubscription) {
      this.ledStatusSubscription.remove();
      this.ledStatusSubscription = null;
    }

    // Disconnect from ESP32.
    if (this.connectedDevice) {
      const deviceId = this.connectedDevice.id;

      try {
        await this.manager.cancelDeviceConnection(deviceId);

        console.log('[BLE] ESP32 disconnected');
      } catch (error) {
        console.log('[BLE] Disconnect error:', error);
      } finally {
        this.connectedDevice = null;
      }
    }
  }

  // ------------------------------------------
  // 8. DESTROY BLUETOOTH MANAGER
  // ------------------------------------------

  destroy(): void {
    console.log('[BLE] Cleaning up Bluetooth manager...');

    this.stopScan();

    // Remove notification subscriptions.
    if (this.temperatureSubscription) {
      this.temperatureSubscription.remove();
      this.temperatureSubscription = null;
    }

    if (this.ledStatusSubscription) {
      this.ledStatusSubscription.remove();
      this.ledStatusSubscription = null;
    }

    this.connectedDevice = null;

    // Release native Bluetooth resources.
    this.manager.destroy();

    console.log('[BLE] Bluetooth manager destroyed');
  }
}

// ------------------------------------------
// SINGLETON INSTANCE
// ------------------------------------------

// Create one shared BLEService instance.
const bleService = new BLEService();

// Export the same instance throughout the application.
export default bleService;
