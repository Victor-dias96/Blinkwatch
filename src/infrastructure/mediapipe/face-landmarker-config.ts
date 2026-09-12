export const FACE_LANDMARKER_WASM_PATH = '/mediapipe/wasm';
export const FACE_LANDMARKER_MODEL_PATH = '/models/face-landmarker.task';

export const FACE_LANDMARKER_RUNNING_MODE = 'VIDEO' as const;
export const FACE_LANDMARKER_NUM_FACES = 1;
export const FACE_LANDMARKER_OUTPUT_BLENDSHAPES = false;
export const FACE_LANDMARKER_OUTPUT_TRANSFORMATION_MATRICES = false;
export const FACE_LANDMARKER_MIN_FACE_DETECTION_CONFIDENCE = 0.5;
export const FACE_LANDMARKER_MIN_FACE_PRESENCE_CONFIDENCE = 0.5;
export const FACE_LANDMARKER_MIN_TRACKING_CONFIDENCE = 0.5;
export const FACE_LANDMARKER_DELEGATE = 'GPU' as const;

export function createFaceLandmarkerOptions(modelAssetPath: string) {
  return {
    baseOptions: {
      modelAssetPath,
      delegate: FACE_LANDMARKER_DELEGATE,
    },
    runningMode: FACE_LANDMARKER_RUNNING_MODE,
    numFaces: FACE_LANDMARKER_NUM_FACES,
    outputFaceBlendshapes: FACE_LANDMARKER_OUTPUT_BLENDSHAPES,
    outputFacialTransformationMatrixes:
      FACE_LANDMARKER_OUTPUT_TRANSFORMATION_MATRICES,
    minFaceDetectionConfidence: FACE_LANDMARKER_MIN_FACE_DETECTION_CONFIDENCE,
    minFacePresenceConfidence: FACE_LANDMARKER_MIN_FACE_PRESENCE_CONFIDENCE,
    minTrackingConfidence: FACE_LANDMARKER_MIN_TRACKING_CONFIDENCE,
  };
}
