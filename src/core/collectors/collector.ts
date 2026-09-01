import type { Recorder } from '../recorder.js';

export interface Collector {
  name: string;
  install(recorder: Recorder): () => void;
}
