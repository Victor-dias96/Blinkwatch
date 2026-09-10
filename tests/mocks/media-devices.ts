export const DEFAULT_VIDEO_DEVICES: MediaDeviceInfo[] = [
  createFakeMediaDevice({
    deviceId: 'cam-front',
    label: 'Câmera frontal',
    groupId: 'group-front',
  }),
  createFakeMediaDevice({
    deviceId: 'cam-back',
    label: 'Câmera traseira',
    groupId: 'group-back',
  }),
];

export function createFakeMediaDevice(options: {
  deviceId: string;
  kind?: MediaDeviceKind;
  label?: string;
  groupId?: string;
}): MediaDeviceInfo {
  return {
    deviceId: options.deviceId,
    kind: options.kind ?? 'videoinput',
    label: options.label ?? '',
    groupId: options.groupId ?? 'group',
    toJSON() {
      return {
        deviceId: this.deviceId,
        kind: this.kind,
        label: this.label,
        groupId: this.groupId,
      };
    },
  };
}

export function resolveRequestedDeviceId(
  constraints?: MediaStreamConstraints
): string {
  const video = constraints?.video;

  if (typeof video === 'object' && video !== null && 'deviceId' in video) {
    const { deviceId } = video;

    if (typeof deviceId === 'string' && deviceId.length > 0) {
      return deviceId;
    }

    if (
      typeof deviceId === 'object' &&
      deviceId !== null &&
      'exact' in deviceId &&
      typeof deviceId.exact === 'string'
    ) {
      return deviceId.exact;
    }
  }

  return 'cam-front';
}
