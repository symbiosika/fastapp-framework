import fs from "fs/promises";
import path from "path";
import type {
  DeleteFileFunction,
  GetFileFunction,
  SaveFileFunction,
} from "./types";

const ATTACHMENT_DIR = path.join(process.cwd(), "static/upload");
console.log("Server´s upload directory: ", ATTACHMENT_DIR);

export const saveFileToLocalDisc: SaveFileFunction = async (file, bucket) => {
  const id = crypto.randomUUID();
  const fileName = file.name;
  const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

  // Generate the file path
  const filePath = path.join(ATTACHMENT_DIR, bucket, id + "." + fileExtension);

  // Save the file to the disk
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await fs.mkdir(path.join(ATTACHMENT_DIR, bucket), { recursive: true });
  await fs.writeFile(filePath, fileBuffer);
  return {
    path: `/api/v1/files/local/${bucket}/${id}.${file.name.split(".").pop()}`,
    id: id,
  };
};

export const getFileFromLocalDisc: GetFileFunction = async (name, bucket) => {
  // Generate the file path
  const filePath = path.join(ATTACHMENT_DIR, bucket, name);
  // return the file
  try {
    const file = await fs.readFile(filePath);
    return new File([file], name);
  } catch (error) {
    throw new Error("File not found");
  }
};

export const deleteFileFromLocalDisc: DeleteFileFunction = async (
  name,
  bucket
) => {
  // Generate the file path
  const filePath = path.join(ATTACHMENT_DIR, bucket, name);
  // Delete the file
  await fs.unlink(filePath);
};
