export type Chunk = { text: string; header: string | undefined; order: number };

export type ChunkWithEmbedding = Chunk & {
  embedding: { embedding: number[]; model: string };
};
