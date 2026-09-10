export type CameraDeviceOption = {
  deviceId: string;
  label: string;
};

export function formatDeviceLabel(label: string, index: number): string {
  if (label.trim().length > 0) {
    return label;
  }

  return `Câmera ${index + 1}`;
}

export function mapVideoInputDevices(
  devices: MediaDeviceInfo[]
): CameraDeviceOption[] {
  return devices
    .filter((device) => device.kind === 'videoinput')
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: formatDeviceLabel(device.label, index),
    }));
}

export async function enumerateVideoInputDevices(): Promise<
  CameraDeviceOption[]
> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return mapVideoInputDevices(devices);
}

export function getActiveDeviceIdFromStream(
  stream: MediaStream
): string | null {
  const videoTrack = stream.getVideoTracks()[0];

  if (!videoTrack) {
    return null;
  }

  const { deviceId } = videoTrack.getSettings();

  if (typeof deviceId === 'string' && deviceId.length > 0) {
    return deviceId;
  }

  return null;
}

export function supportsDeviceChangeEvent(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.addEventListener === 'function' &&
    typeof navigator.mediaDevices.removeEventListener === 'function'
  );
}
