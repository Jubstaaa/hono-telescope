import type { Recorder } from '../recorder.js';

export interface Collector {
  install(recorder: Recorder): () => void;
  name: string;
}
