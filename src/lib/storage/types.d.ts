export interface SaveFileFunction {
  (
    file: File,
    bucket: string
  ): Promise<{
    path: string;
    id: string;
  }>;
}

export interface GeneralSaveFileFunction {
  (
    file: File,
    bucket: string,
    storageType: "local" | "db"
  ): Promise<{
    path: string;
    id: string;
  }>;
}

export interface GetFileFunction {
  (id: string, bucket: string): Promise<File>;
}

export interface GeneralGetFileFunction {
  (id: string, bucket: string, storageType: "local" | "db"): Promise<File>;
}

export interface DeleteFileFunction {
  (id: string, bucket: string): Promise<void>;
}

export interface GeneralDeleteFileFunction {
  (id: string, bucket: string, storageType: "local" | "db"): Promise<void>;
}
