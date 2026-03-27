import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { config } from "./env";

import AppError from "../shared/AppError";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME as string,
  api_key: config.CLOUDINARY_API_KEY as string,
  api_secret: config.CLOUDINARY_API_SECRET as string,
  secure: true,
});

export const uploadFileToCloudinary = async (
  buffer: Buffer,
  filename: string,
): Promise<UploadApiResponse> => {
  if (!buffer || !filename) {
    throw new AppError(
      500,
      "Failed to upload file to cloudinary",
      "uploadFileToCloudinary",
      [
        {
          field: "url",
          message: "Failed to upload file to cloudinary",
        },
      ],
    );
  }

  const fileExtension = filename.split(".").pop()?.toLowerCase();

  const filenameWithoutExtension = filename
    .split(".")
    .slice(0, -1)
    .join(".")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "");

  const uniqueFilename =
    Math.random().toString(36).substring(2) +
    "-" +
    Date.now() +
    "-" +
    filenameWithoutExtension;

  const folder = fileExtension === "pdf" ? "pdf-files" : "images";

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: `EcoSpark-Hub/${folder}/${uniqueFilename}`,
          folder: `EcoSpark-Hub/${folder}`,
        },
        (error, result) => {
          if (error) {
            return reject(
              new AppError(
                500,
                "Failed to upload file to cloudinary",
                "uploadFileToCloudinary",
                [
                  {
                    field: "url",
                    message: "Failed to upload file to cloudinary",
                  },
                ],
              ),
            );
          } else {
            resolve(result as UploadApiResponse);
          }
        },
      )
      .end(buffer);
  });
};

export const deleteFileFromCloudinary = async (url: string) => {
  try {
    const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)?$/;
    const match = url.match(regex);

    if (match && match[1]) {
      const publicId = match[1];
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });
      console.log(`File with public ID ${publicId} deleted successfully.`);
    }
  } catch (error) {
    console.error(error);

    throw new AppError(
      500,
      "Failed to delete file from cloudinary",
      "deleteFileFromCloudinary",
      [
        {
          field: "url",
          message: "Failed to delete file from cloudinary",
        },
      ],
    );
  }
};

export const cloudinaryUpload = cloudinary;
