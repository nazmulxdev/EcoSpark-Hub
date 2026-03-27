import { Request } from "express";
import { deleteFileFromCloudinary } from "../config/cloudinary.config";

export const deleteUploadedFileFromGlobalErrorHandler = async (
  req: Request,
) => {
  try {
    const fileToDelete: string[] = [];
    if (req?.file && req?.file?.path) {
      fileToDelete.push(req?.file?.path);
    } else if (
      req?.files &&
      typeof req?.files === "object" &&
      !Array.isArray(req?.files)
    ) {
      Object.values(req?.files).forEach((fileArray) => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file) => {
            fileToDelete.push(file.path);
          });
        }
      });
    } else if (req?.files && Array.isArray(req?.files)) {
      req?.files?.map((file) => {
        if (file.path) {
          fileToDelete.push(file.path);
        }
      });
    }

    if (fileToDelete.length > 0) {
      await Promise.all(
        fileToDelete.map((filePath) => deleteFileFromCloudinary(filePath)),
      );
      console.log(
        `\nDeleted ${fileToDelete.join(", ")} uploaded files from cloudinary due to an error during request process.\n`,
      );
    }
  } catch (error) {
    console.error(error);
  }
};
