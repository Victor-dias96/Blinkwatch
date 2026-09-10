import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { VIDEO_ONLY_CONSTRAINTS } from '@/features/camera/services/camera-stream';

import {
  type BrowserMediaMocks,
  installBrowserMediaMocks,
  removeMediaDevices,
  setSecureContext,
} from '../../../../tests/mocks/browser-media';
import { createDeferred } from '../../../../tests/mocks/deferred';
import {
  createFakeMediaStream,
  getFakeVideoTrack,
} from '../../../../tests/mocks/media-stream';
import {
  findStatusHeading,
  getPreviewVideo,
  getStatusHeading,
  renderCameraPreview,
  restoreCameraPreviewMocks,
  startCamera,
} from '../tests/camera-preview-helpers';

describe('CameraPreview activation', () => {
  let mocks: BrowserMediaMocks;

  beforeEach(() => {
    mocks = installBrowserMediaMocks();
  });

  afterEach(() => {
    restoreCameraPreviewMocks(mocks);
  });

  it('starts idle without requesting the camera or enumerating devices', () => {
    renderCameraPreview();

    expect(getStatusHeading('Câmera desligada')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Iniciar câmera' })
    ).toBeInTheDocument();
    expect(screen.getByText('A câmera está desligada')).toBeInTheDocument();
    expect(mocks.getUserMedia).not.toHaveBeenCalled();
    expect(mocks.enumerateDevices).not.toHaveBeenCalled();
    expect(mocks.permissionsQuery).not.toHaveBeenCalled();
    expect(document.querySelector('video')).toHaveClass('hidden');
  });

  it('does not infer camera availability from the first render', () => {
    setSecureContext(false);
    removeMediaDevices();
    renderCameraPreview();

    expect(getStatusHeading('Câmera desligada')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Iniciar câmera' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        level: 2,
        name: 'Conexão segura necessária',
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Câmera não suportada' })
    ).not.toBeInTheDocument();
  });

  it('requests a local video-only stream only after an explicit start action', async () => {
    const { user } = renderCameraPreview();

    await startCamera(user);

    expect(mocks.getUserMedia).toHaveBeenCalledTimes(1);
    expect(mocks.getUserMedia).toHaveBeenCalledWith(VIDEO_ONLY_CONSTRAINTS);
    expect(getPreviewVideo().srcObject).toBe(mocks.streams[0]);
    expect(getFakeVideoTrack(mocks.streams[0])?.kind).toBe('video');
    expect(
      screen.getByText('Prévia local da câmera em reprodução.')
    ).toBeInTheDocument();
  });

  it('shows a pending permission state while getUserMedia is unresolved', async () => {
    const deferred = createDeferred<MediaStream>();
    mocks.getUserMedia.mockReturnValueOnce(deferred.promise);
    const { user } = renderCameraPreview();

    await user.click(screen.getByRole('button', { name: 'Iniciar câmera' }));

    expect(await findStatusHeading('Aguardando permissão')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Iniciar câmera' })
    ).not.toBeInTheDocument();

    deferred.resolve(createFakeMediaStream());
    expect(await findStatusHeading('Câmera ativa')).toBeInTheDocument();
  });

  it('presents permission denied with a retry action', async () => {
    mocks.getUserMedia.mockRejectedValueOnce(
      new DOMException('Permission denied', 'NotAllowedError')
    );
    const { user } = renderCameraPreview();

    await user.click(screen.getByRole('button', { name: 'Iniciar câmera' }));

    expect(await findStatusHeading('Permissão necessária')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Permissão indisponível'
    );
    expect(
      screen.getAllByRole('button', { name: 'Tentar novamente' }).length
    ).toBeGreaterThan(0);
  });

  it('distinguishes a blocked permission when the Permissions API reports denied', async () => {
    mocks.restore();
    mocks = installBrowserMediaMocks({ permissionState: 'denied' });
    mocks.getUserMedia.mockRejectedValueOnce(
      new DOMException('Permission denied', 'NotAllowedError')
    );
    const { user } = renderCameraPreview();

    await user.click(screen.getByRole('button', { name: 'Iniciar câmera' }));

    expect(
      await screen.findByText(
        'A permissão da câmera está bloqueada nas configurações do navegador.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Tentar novamente' })
    ).not.toBeInTheDocument();
  });

  it('does not call getUserMedia in an insecure context', async () => {
    setSecureContext(false);
    const { user } = renderCameraPreview();

    await user.click(screen.getByRole('button', { name: 'Iniciar câmera' }));

    expect(
      await findStatusHeading('Conexão segura necessária')
    ).toBeInTheDocument();
    expect(mocks.getUserMedia).not.toHaveBeenCalled();
  });

  it('does not call getUserMedia when the media API is unavailable', async () => {
    removeMediaDevices();
    const { user } = renderCameraPreview();

    await user.click(screen.getByRole('button', { name: 'Iniciar câmera' }));

    expect(await findStatusHeading('Câmera não suportada')).toBeInTheDocument();
  });

  it('rejects an unexpected audio track and stops that stream', async () => {
    const stream = createFakeMediaStream({ audio: true });
    mocks.getUserMedia.mockResolvedValueOnce(stream);
    const { user } = renderCameraPreview();

    await user.click(screen.getByRole('button', { name: 'Iniciar câmera' }));

    await waitFor(() => {
      expect(getFakeVideoTrack(stream)?.stop).toHaveBeenCalled();
    });
    expect(stream.getAudioTracks()[0]?.stop).toHaveBeenCalled();
    expect(
      screen.getAllByText(
        'Não foi possível ativar a câmera com a configuração esperada.'
      ).length
    ).toBeGreaterThan(0);
  });

  it('mirrors the preview visually by default without changing the stream', async () => {
    const { user } = renderCameraPreview();

    await startCamera(user);

    const video = getPreviewVideo();
    expect(video).toHaveClass('[transform:scaleX(-1)]');
    expect(
      screen.getByRole('checkbox', { name: 'Espelhar prévia' })
    ).toBeChecked();
    expect(screen.getByText('Ativado')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Espelhar prévia' }));

    expect(video).not.toHaveClass('[transform:scaleX(-1)]');
    expect(screen.getByText('Desativado')).toBeInTheDocument();
    expect(mocks.getUserMedia).toHaveBeenCalledTimes(1);
    expect(getFakeVideoTrack(mocks.streams[0])?.stop).not.toHaveBeenCalled();
  });
});
