/**
 * Type declarations for the Three.js renderer utility
 */

export interface ThreeJSSceneInitParams {
  container: HTMLElement;
  updateProgress?: (progress: number) => void;
}

export function initThreeJSScene(params: ThreeJSSceneInitParams): () => void;
