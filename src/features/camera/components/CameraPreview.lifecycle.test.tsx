import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  type BrowserMediaMocks,
  installBrowserMediaMocks,
} from '../../../../tests/mocks/browser-media';
import { createDeferred } from '../../../../tests/mocks/deferred';
import {
  createFakeMediaStream,
  getFakeVideoTrack,
} from '../../../../tests/mocks/media-stream';
import {
  findStatusHeading,
  getPreviewVideo,
  queryStatusHeading,
  renderCameraPreview,
  restoreCameraPreviewMocks,
  startCamera,
} from '../tests/camera-preview-helpers';

describe('CameraPreview lifecycle', () => {
  let mocks: BrowserMediaMocks;

  beforeEach(() => {
    mocks = installBrowserMediaMocks();
  });

  afterEach(() => {
    restoreCameraPreviewMocks(mocks);
  });

  it('pauses the live track without stopping it', async () => {
    const { user } = renderCameraPreview();
    await startCamera(user);
    const track = getFakeVideoTrack(mocks.streams[0]);

    await user.click(screen.getByRole('button', { name: 'Pausar' }));

    expect(await findStatusHeading('Câmera pausada')).toBeInTheDocument();
    expect(
      screen.getByText('Câmera pausada', { selector: 'p' })
    ).toBeInTheDocument();
    expect(getPreviewVideo()).toHaveClass('hidden');
    expect(track?.enabled).toBe(false);
    expect(track?.readyState).toBe('live');
    expect(track?.stop).not.toHaveBeenCalled();
    expect(mocks.getUserMedia).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('checkbox', { name: 'Espelhar prévia' })
    ).not.toBeInTheDocument();
  });

  it('resumes the same track without a new getUserMedia call', async () => {
    const { user } = renderCameraPreview();
    await startCamera(user);
    const track = getFakeVideoTrack(mocks.streams[0]);

    await user.click(screen.getByRole('button', { name: 'Pausar' }));
    await user.click(screen.getByRole('button', { name: 'Retomar' }));

    expect(await findStatusHeading('Câmera ativa')).toBeInTheDocument();
    expect(track?.enabled).toBe(true);
    expect(mocks.getUserMedia).toHaveBeenCalledTimes(1);
    expect(getPreviewVideo()).not.toHaveClass('hidden');
  });

  it('restarts by stopping the current stream and requesting a new one', async () => {
    const { user } = renderCameraPreview();
    await startCamera(user);
    const firstTrack = getFakeVideoTrack(mocks.streams[0]);

    await user.click(screen.getByRole('button', { name: 'Reiniciar' }));

    await waitFor(() => {
      expect(mocks.getUserMedia).toHaveBeenCalledTimes(2);
    });
    expect(firstTrack?.stop).toHaveBeenCalled();
    expect(await findStatusHeading('Câmera ativa')).toBeInTheDocument();
    expect(getFakeVideoTrack(mocks.streams[1])?.readyState).toBe('live');
  });

  it('stops tracks, clears the preview and returns to idle', async () => {
    const { user } = renderCameraPreview();
    await startCamera(user);
    const track = getFakeVideoTrack(mocks.streams[0]);

    await user.click(screen.getByRole('button', { name: 'Encerrar câmera' }));

    expect(await findStatusHeading('Câmera desligada')).toBeInTheDocument();
    expect(track?.stop).toHaveBeenCalled();
    expect(getPreviewVideo().srcObject).toBeNull();
    expect(queryStatusHeading('Câmera desconectada')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Iniciar câmera' })
    ).toBeInTheDocument();
  });

  it('releases the stream on unmount', async () => {
    const { user, view } = renderCameraPreview();
    await startCamera(user);
    const track = getFakeVideoTrack(mocks.streams[0]);

    view.unmount();

    expect(track?.stop).toHaveBeenCalled();
  });

  it('discards a late restart stream after unmount', async () => {
    const { user, view } = renderCameraPreview();
    await startCamera(user);

    const deferred = createDeferred<MediaStream>();
    mocks.getUserMedia.mockReturnValueOnce(deferred.promise);
    await user.click(screen.getByRole('button', { name: 'Reiniciar' }));
    await findStatusHeading('Reiniciando câmera');
    view.unmount();

    const lateStream = createFakeMediaStream({ deviceId: 'late-restart' });
    deferred.resolve(lateStream);

    await waitFor(() => {
      expect(getFakeVideoTrack(lateStream)?.stop).toHaveBeenCalled();
    });
  });

  it('discards a late getUserMedia result after unmount', async () => {
    const deferred = createDeferred<MediaStream>();
    mocks.getUserMedia.mockReturnValueOnce(deferred.promise);
    const { user, view } = renderCameraPreview();

    await user.click(screen.getByRole('button', { name: 'Iniciar câmera' }));
    await findStatusHeading('Aguardando permissão');
    view.unmount();

    const lateStream = createFakeMediaStream({ deviceId: 'unmounted' });
    deferred.resolve(lateStream);

    await waitFor(() => {
      expect(getFakeVideoTrack(lateStream)?.stop).toHaveBeenCalled();
    });
  });
});
