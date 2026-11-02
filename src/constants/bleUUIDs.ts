// All BLE UUIDs used by our ESP32 firmware.

// Main BLE service
export const BLE_SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';

// ESP32 sends temperature readings to the mobile app
export const TEMPERATURE_CHARACTERISTIC_UUID =
  '12345678-1234-1234-1234-1234567890ac';

// Mobile app sends LED ON/OFF commands to ESP32
export const LED_COMMAND_CHARACTERISTIC_UUID =
  '12345678-1234-1234-1234-1234567890ad';

// ESP32 sends its actual LED state back to the mobile app
export const LED_STATUS_CHARACTERISTIC_UUID =
  '12345678-1234-1234-1234-1234567890ae';

// BLE device name advertised by ESP32
export const BLE_DEVICE_NAME = 'BLE-Lab-ESP32';
