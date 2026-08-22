import { createHash } from 'node:crypto';

/** Offline, reproducible embedding used only for corpus bootstrap and CI. */
export const DETERMINISTIC_EMBEDDING_MODEL = 'local-deterministic-corpus';
export const DETERMINISTIC_EMBEDDING_VERSION = '1';
export const DETERMINISTIC_EMBEDDING_DIMENSION = 64;

function tokens(text) {
  const value = String(text ?? '').normalize('NFKC').toLowerCase();
  const chars = [...value].filter((char) => /[\u3400-\u9fff]/u.test(char));
  const words = value.match(/[a-z0-9]+/g) ?? [];
  return [...chars, ...words];
}

function hashIndex(token, dimension) {
  return createHash('sha256').update(token).digest().readUInt32BE(0) % dimension;
}

export function deterministicEmbed(text, dimension = DETERMINISTIC_EMBEDDING_DIMENSION) {
  const vector = Array.from({ length: dimension }, () => 0);
  for (const token of tokens(text)) vector[hashIndex(token, dimension)] += 1;
  const norm = Math.hypot(...vector) || 1;
  return vector.map((value) => Number((value / norm).toFixed(8)));
}

export class DeterministicEmbeddingClient {
  constructor({ dimension = DETERMINISTIC_EMBEDDING_DIMENSION } = {}) {
    this.model = DETERMINISTIC_EMBEDDING_MODEL;
    this.version = DETERMINISTIC_EMBEDDING_VERSION;
    this.dimension = dimension;
  }

  async embed(texts) {
    if (!Array.isArray(texts) || !texts.length) throw new Error('Embedding 输入不能为空。');
    return texts.map((text) => deterministicEmbed(text, this.dimension));
  }
}
