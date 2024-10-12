export interface SaveFileFunction {
  (
    file: File,
    bucket: string
  ): Promise<{
    path: string;
    id: string;
  }>;
}

export interface GetFileFunction {
  (id: string, bucket: string): Promise<File>;
}

export interface DeleteFileFunction {
  (id: string, bucket: string): Promise<void>;
}
