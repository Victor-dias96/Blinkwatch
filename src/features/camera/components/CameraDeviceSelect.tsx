'use client';

import type { CameraDeviceOption } from '@/features/camera/services/camera-devices';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';

const SELECT_ID = 'camera-device-select';

type CameraDeviceSelectProps = {
  devices: CameraDeviceOption[];
  activeDeviceId: string | null;
  disabled: boolean;
  isSwitching: boolean;
  listError: string | null;
  isRefreshingList: boolean;
  showRefreshButton: boolean;
  onDeviceChange: (deviceId: string) => void;
  onRefreshList: () => void;
};

export function CameraDeviceSelect({
  devices,
  activeDeviceId,
  disabled,
  isSwitching,
  listError,
  isRefreshingList,
  showRefreshButton,
  onDeviceChange,
  onRefreshList,
}: CameraDeviceSelectProps) {
  const hasKnownDevices = devices.length > 0;
  const isSingleDevice = devices.length === 1;
  const selectDisabled =
    disabled || isSwitching || isSingleDevice || !hasKnownDevices;

  return (
    <section aria-labelledby="camera-device-heading" className="space-y-3">
      <h2 id="camera-device-heading" className="sr-only">
        Seleção de câmera
      </h2>

      {activeDeviceId === null && !listError ? (
        <p className="text-sm text-zinc-300">Câmera padrão em uso.</p>
      ) : null}

      {hasKnownDevices ? (
        <div className="space-y-2">
          <Label htmlFor={SELECT_ID}>Câmera utilizada</Label>
          <select
            id={SELECT_ID}
            className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus-visible:ring-3 focus-visible:ring-zinc-400/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            disabled={selectDisabled}
            value={activeDeviceId ?? ''}
            onChange={(event) => {
              onDeviceChange(event.target.value);
            }}
          >
            {activeDeviceId === null ? (
              <option value="">Câmera padrão</option>
            ) : null}
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
          {isSingleDevice ? (
            <p className="text-sm text-zinc-400">
              Apenas uma câmera foi detectada neste dispositivo.
            </p>
          ) : null}
        </div>
      ) : null}

      {!hasKnownDevices && !listError ? (
        <p className="text-sm text-zinc-400">
          A lista de câmeras não pôde ser determinada. A prévia continua ativa.
        </p>
      ) : null}

      {listError ? (
        <p className="text-sm leading-relaxed text-zinc-300">{listError}</p>
      ) : null}

      {isSwitching ? (
        <p aria-live="polite" className="text-sm text-zinc-400">
          Trocando câmera...
        </p>
      ) : null}

      {showRefreshButton ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-11 w-full sm:w-auto"
          disabled={disabled || isSwitching || isRefreshingList}
          onClick={onRefreshList}
        >
          {isRefreshingList ? 'Atualizando câmeras...' : 'Atualizar câmeras'}
        </Button>
      ) : null}
    </section>
  );
}
