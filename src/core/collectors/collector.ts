import type { Recorder } from '../recorder';

export interface Collector {
  name: string;
  install(recorder: Recorder): () => void;
}
