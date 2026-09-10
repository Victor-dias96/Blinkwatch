import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createDeviceVideoConstraints } from '@/features/camera/services/camera-stream';

import {
  type BrowserMediaMocks,
  installBrowserMediaMocks,
} from '../../../../tests/mocks/browser-media';
import { createDeferred } from '../../../../tests/mocks/deferred';
import {
  createFakeMediaDevice,
  DEFAULT_VIDEO_DEVICES,
} from '../../../../tests/mocks/media-devices';
import { getFakeVideoTrack } from '../../../../tests/mocks/media-stream';
import {
  findStatusHeading,
  getStatusHeading,
  queryStatusHeading,
  renderCameraPreview,
  restoreCameraPreviewMocks,
  startCamera,
} from '../tests/camera-preview-helpers';

describe('CameraPreview devices', () => {
  let mocks: BrowserMediaMocks;

  beforeEach(() => {
    mocks = installBrowserMediaMocks();
  });

  afterEach(() => {
    restoreCameraPreviewMocks(mocks);
  });

  it('enumerates video devices after a successful start', async () => {
    const { user } = renderCameraPreview();
    await startCamera(user);

    expect(mocks.enumerateDevices).toHaveBeenCalled();
    expect(screen.getByLabelText('Câmera utilizada')).toHaveValue('cam-front');
    expect(
      screen.getByRole('option', { name: 'Câmera frontal' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Câmera traseira' })
    ).toBeInTheDocument();
  });

  it('switches to another camera and stops the previous stream', async () => {
    const { user } = renderCameraPreview();
    await startCamera(user);
    const previousTrack = getFakeVideoTrack(mocks.streams[0]);

    await user.selectOptions(
      screen.getByLabelText('Câmera utilizada'),
      'cam-back'
    );

    await waitFor(() => {
      expect(mocks.getUserMedia).toHaveBeenLastCalledWith(
        createDeviceVideoConstraints('cam-back')
      );
    });
    expect(previousTrack?.stop).toHaveBeenCalled();
    expect(screen.getByLabelText('Câmera utilizada')).toHaveValue('cam-back');
    expect(getStatusHeading('Câmera ativa')).toBeInTheDocument();
  });

  it('preserves the previous stream when a switch fails', async () => {
    const { user } = renderCameraPreview();
    await startCamera(user);
    const previousTrack = getFakeVideoTrack(mocks.streams[0]);
    mocks.getUserMedia.mockRejectedValueOnce(
      new DOMException('Device busy', 'NotReadableError')
    );

    await user.selectOptions(
      screen.getByLabelText('Câmera utilizada'),
      'cam-back'
    );

    expect(
      await screen.findByText('Troca de câmera não concluída')
    ).toBeInTheDocument();
    expect(previousTrack?.stop).not.toHaveBeenCalled();
    expect(previousTrack?.readyState).toBe('live');
    expect(getStatusHeading('Câmera ativa')).toBeInTheDocument();
    expect(screen.getByLabelText('Câmera utilizada')).toHaveValue('cam-front');
  });

  it('disables device switching while paused', async () => {
    const { user } = renderCameraPreview();
    await startCamera(user);

    await user.click(screen.getByRole('button', { name: 'Pausar' }));

    expect(screen.getByLabelText('Câmera utilizada')).toBeDisabled();
    expect(
      screen.getByText('Retome a câmera antes de trocar de dispositivo.')
    ).toBeInTheDocument();
  });

  it('keeps the preview when device enumeration fails', async () => {
    mocks.enumerateDevices.mockRejectedValueOnce(new Error('enumerate failed'));
    const { user } = renderCameraPreview();
    await startCamera(user);

    expect(
      await screen.findByText('A lista de câmeras não pôde ser carregada.')
    ).toBeInTheDocument();
    expect(getStatusHeading('Câmera ativa')).toBeInTheDocument();
    expect(getFakeVideoTrack(mocks.streams[0])?.stop).not.toHaveBeenCalled();
  });

  it('ignores a late device list after the camera is stopped', async () => {
    const deferred = createDeferred<MediaDeviceInfo[]>();
    mocks.enumerateDevices.mockReturnValueOnce(deferred.promise);
    const { user } = renderCameraPreview();
    await startCamera(user);

    await user.click(screen.getByRole('button', { name: 'Encerrar câmera' }));
    deferred.resolve(DEFAULT_VIDEO_DEVICES);

    await waitFor(() => {
      expect(getStatusHeading('Câmera desligada')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('Câmera utilizada')).not.toBeInTheDocument();
    expect(queryStatusHeading('Câmera desconectada')).not.toBeInTheDocument();
  });

  it('treats an unexpected track ended event as a disconnection', async () => {
    const { user } = renderCameraPreview();
    await startCamera(user);
    const track = getFakeVideoTrack(mocks.streams[0]);

    track?.dispatchEvent(new Event('ended'));

    expect(await findStatusHeading('Câmera desconectada')).toBeInTheDocument();
    expect(track?.stop).toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Iniciar câmera' })
    ).toBeInTheDocument();
  });

  it('does not treat a manual stop as a disconnection', async () => {
    const { user } = renderCameraPreview();
    await startCamera(user);

    await user.click(screen.getByRole('button', { name: 'Encerrar câmera' }));

    expect(queryStatusHeading('Câmera desconectada')).not.toBeInTheDocument();
    expect(getStatusHeading('Câmera desligada')).toBeInTheDocument();
  });

  it('uses a generic label when the browser omits device names', async () => {
    mocks.restore();
    mocks = installBrowserMediaMocks({
      devices: [
        createFakeMediaDevice({ deviceId: 'cam-front', label: '' }),
        createFakeMediaDevice({ deviceId: 'cam-back', label: '' }),
      ],
    });
    const { user } = renderCameraPreview();
    await startCamera(user);

    expect(
      screen.getByRole('option', { name: 'Câmera 1' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Câmera 2' })
    ).toBeInTheDocument();
  });
});
