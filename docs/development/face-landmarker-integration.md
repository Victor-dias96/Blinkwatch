# Face Landmarker integration

This document describes the **loading-only** MediaPipe Face Landmarker infrastructure introduced in Issue 23. It records what the repository does today. It does not describe frame analysis.

**No camera frame is processed by the Face Landmarker in this issue.**

**Last reviewed:** 2026-09-12

## 1. Purpose

Create an isolated boundary between Blinkwatch and `@mediapipe/tasks-vision` so the Face Landmarker can be initialized, observed, and disposed in the browser without detecting faces, drawing landmarks, or reading eye indices.

The camera feature consumes only Blinkwatch-owned types and methods (`initialize`, `getState`, `isReady`, `dispose`).

## 2. Package and version

| Field     | Value                     |
| --------- | ------------------------- |
| Package   | `@mediapipe/tasks-vision` |
| Version   | `1.0.1`                   |
| License   | Apache-2.0                |
| Installed | `package.json` / lockfile |

No other computer-vision library is installed (no TensorFlow.js, OpenCV, or legacy `@mediapipe/face_mesh`).

## 3. Official model source

Official Google AI Edge / MediaPipe model bundle (float16, version `1`):

https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

The URL uses a **pinned version path** (`float16/1`). Runtime code does not use `latest`.

Sources consulted:

- [Face landmark detection guide (Web)](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js)
- [Face landmark detection overview](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)
- [FaceLandmarker class](https://developers.google.com/edge/api/mediapipe/js/tasks-vision.facelandmarker)
- [FilesetResolver class](https://developers.google.com/edge/api/mediapipe/js/tasks-vision.filesetresolver)
- [FaceLandmarkerOptions](https://developers.google.com/edge/api/mediapipe/js/tasks-vision.facelandmarkeroptions)
- Package README (`node_modules/@mediapipe/tasks-vision/README.md`)
- [Face Mesh V2 model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf)

## 4. Model filename

| Field           | Value                                |
| --------------- | ------------------------------------ |
| Original name   | `face_landmarker.task`               |
| Repository path | `public/models/face-landmarker.task` |
| Runtime URL     | `/models/face-landmarker.task`       |

The file contents were not modified after download.

## 5. Model size

`3,758,596` bytes (downloaded 2026-09-12).

## 6. SHA-256 hash

`64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`

Computed with `Get-FileHash -Algorithm SHA256` on the stored file.

## 7. Model licensing

The `@mediapipe/tasks-vision` package is Apache-2.0. The Face Mesh V2 model card, which is part of the Face Landmarker bundle, is licensed under Apache License 2.0. The model is versioned in this repository so sessions do not depend on a CDN download of the `.task` file.

## 8. WASM strategy

WASM assets are copied from the installed npm package into `public/mediapipe/wasm` **without renaming**:

- `vision_wasm_internal.js`
- `vision_wasm_internal.wasm`
- `vision_wasm_nosimd_internal.js`
- `vision_wasm_nosimd_internal.wasm`

`FilesetResolver.forVisionTasks` requires those filenames to remain unchanged so SIMD detection can select the correct pair.

Copy command:

```bash
npm run copy:mediapipe-wasm
```

The script reads only `node_modules/@mediapipe/tasks-vision/wasm` and does not use the network. Run it after upgrading `@mediapipe/tasks-vision`.

The SDK may create an internal WebGL canvas while initializing the WASM runtime. The application does not create a canvas, does not draw landmarks, and does not read pixels.

## 9. Local versus CDN resources

Runtime loads **only same-origin static files**:

- WASM from `/mediapipe/wasm`
- model from `/models/face-landmarker.task`

No jsDelivr URL, no `latest` tag, and no remote inference endpoint. Opening `/`, `/play/setup`, or `/play/camera` without the diagnostic action does not fetch these files.

## 10. Adapter location

```
src/infrastructure/mediapipe/
  face-landmarker-adapter.ts
  face-landmarker-adapter.test.ts
  face-landmarker-config.ts
  types.ts
```

## 11. Initialization states

Discriminated union in `types.ts`:

- `idle`
- `loading`
- `ready`
- `failed`
- `disposed`

`loading-wasm` and `loading-model` are **not** used. `createFromOptions` also initializes the WASM runtime, so splitting those phases would invent precision the API does not give.

Impossible combinations such as ready+loading or failed+ready cannot be represented.

## 12. Initialization behavior

1. The adapter is created lazily by `useFaceLandmarkerPreparation` (client hook). Construction does not import the SDK.
2. `initialize()` runs only after **Preparar rastreamento facial**.
3. Browser environment is checked before `import('@mediapipe/tasks-vision')`.
4. `FilesetResolver.forVisionTasks` loads local WASM.
5. `FaceLandmarker.createFromOptions` creates the task.
6. Success → `ready`. Failure → `failed` with a typed error. Dispose during the await → stale result discarded, state `disposed`.

Re-initialization after `dispose()` is allowed and creates a **new** task. A closed instance is never reused.

## 13. Face Landmarker options

Configured in `face-landmarker-config.ts`, matching official Web defaults/recommendations:

| Option                               | Value   |
| ------------------------------------ | ------- |
| `runningMode`                        | `VIDEO` |
| `numFaces`                           | `1`     |
| `outputFaceBlendshapes`              | `false` |
| `outputFacialTransformationMatrixes` | `false` |
| `minFaceDetectionConfidence`         | `0.5`   |
| `minFacePresenceConfidence`          | `0.5`   |
| `minTrackingConfidence`              | `0.5`   |
| `baseOptions.delegate`               | `GPU`   |

GPU is the delegate used by official Web samples. This issue does **not** silently retry on CPU, does not expose a delegate selector, and does not guarantee GPU availability. Initialization failure is a `failed` state with retry.

## 14. Instance ownership

`CameraPreview` owns the adapter through `useFaceLandmarkerPreparation`. The adapter is not a module-level singleton. One controller instance holds at most one Face Landmarker.

## 15. Instance reuse

- Concurrent `initialize()` calls share the same Promise.
- `initialize()` while `ready` returns success and does not reload WASM or the model.
- `initialize()` after `failed` retries.
- `initialize()` after `dispose()` starts a new load.

## 16. Dispose behavior

`dispose()` calls the official `close()` inherited from `TaskRunner`, drops the instance reference, increments a generation counter so late promises are ignored, and sets `disposed`. A second `dispose()` does not throw.

## 17. Relationship with the camera lifecycle

| Camera event                    | Face Landmarker                  |
| ------------------------------- | -------------------------------- |
| Pause / resume                  | Kept loaded; no frames processed |
| Device switch                   | Kept loaded                      |
| Restart camera                  | Kept loaded                      |
| Stop camera (`Encerrar câmera`) | Disposed                         |
| Unexpected track `ended`        | Disposed                         |
| Leave `/play/camera` / unmount  | Disposed                         |

The landmarker is **not** bound to the `MediaStream` or video track in this issue.

## 18. Privacy

- No frames, images, or video are sent anywhere.
- `detect` / `detectForVideo` are not called, so no landmarks are produced or stored.
- Identity recognition is absent.
- `enableLogging` is not called.
- Failures are not sent to telemetry.
- Same-origin WASM/model fetches do not include camera data.

## 19. Network behavior

Allowed during the explicit prepare action:

- `GET /models/face-landmarker.task`
- `GET /mediapipe/wasm/vision_wasm_internal.js` (or nosimd pair)
- `GET /mediapipe/wasm/vision_wasm_internal.wasm` (or nosimd pair)
- normal JS chunks for the dynamically imported SDK

Forbidden: image/video upload, inference HTTP APIs, analytics, landmark payloads.

## 20. Testing strategy

Unit tests mock `FilesetResolver.forVisionTasks` and `FaceLandmarker.createFromOptions`. They never load the real model or WASM and do not use a physical camera.

Coverage includes idle state, successful options, VIDEO / `numFaces: 1` / disabled blendshapes and matrices, concurrent initialize, ready reuse, WASM failure, model failure, retry, `close()`, idempotent dispose, late results after dispose, no import-time init, SSR guard, diagnostic button gating, and the absence of detection calls.

## 21. SSR and dynamic import behavior

`src/app/play/camera/page.tsx` remains a Server Component. Only `CameraPreview` is a Client Component. The adapter calls `import('@mediapipe/tasks-vision')` inside `initialize()`, after the browser check. The landing page and setup route do not import the adapter.

## 22. Current limitations

- GPU initialization may fail on some devices; there is no automatic CPU fallback.
- The diagnostic action is temporary validation UI, not a product feature.
- React Strict Mode in development disposes the idle adapter on the extra unmount; the next `initialize()` still works.

## 23. Functionality intentionally not implemented

- `detect` / `detectForVideo`
- `requestAnimationFrame` loops
- canvas drawing / `DrawingUtils`
- eye landmark indices, Eye Aspect Ratio, blink detection
- blendshape interpretation
- face presence gameplay events
- Web Workers, OffscreenCanvas
- realtime sync, database, analytics, identity

## 24. Future frame processing

A later issue may call `detectForVideo` while the camera is `active` and the track is `live`. That work must stay behind the adapter, remain local, and must not start from this loading infrastructure alone.

## 25. Future ocular landmark work

Eye openness and blink classification remain out of scope. They must not be inferred from this loading-only integration.

## Updating the model

1. Download the official pinned URL (never `latest`).
2. Replace `public/models/face-landmarker.task` without editing bytes.
3. Record size, SHA-256, date, and source URL in this document.
4. After a package upgrade, run `npm run copy:mediapipe-wasm` and commit the copied WASM files if they changed.
