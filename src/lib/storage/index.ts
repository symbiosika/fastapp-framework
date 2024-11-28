export type FileSourceType = "db" | "local" | "url" | "text" | "plugin";

import {
  saveFileToLocalDisc,
  getFileFromLocalDisc,
  deleteFileFromLocalDisc,
} from "./local";
import { saveFileToDb, getFileFromDb, deleteFileFromDB } from "./db";
import type {
  GeneralSaveFileFunction,
  GeneralDeleteFileFunction,
  GeneralGetFileFunction,
} from "./types";

export const saveFile: GeneralSaveFileFunction = async (
  file,
  bucket,
  storageType
) => {
  if (storageType === "local") {
    const result = await saveFileToLocalDisc(file, bucket);
    return { ...result, name: file.name };
  } else if (storageType === "db") {
    const result = await saveFileToDb(file, bucket);
    return { ...result, name: file.name };
  } else {
    throw new Error("Invalid storage type");
  }
};

export const getFile: GeneralGetFileFunction = async (
  name,
  bucket,
  storageType
) => {
  if (storageType === "local") {
    return await getFileFromLocalDisc(name, bucket);
  } else if (storageType === "db") {
    return await getFileFromDb(name, bucket);
  } else {
    throw new Error("Invalid storage type");
  }
};

export const deleteFile: GeneralDeleteFileFunction = async (
  name,
  bucket,
  storageType
) => {
  if (storageType === "local") {
    await deleteFileFromLocalDisc(name, bucket);
  } else if (storageType === "db") {
    await deleteFileFromDB(name, bucket);
  } else {
    throw new Error("Invalid storage type");
  }
};
