import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: async (req, file) => {
    const originalName = file.originalname;
    const fileExtension = originalName.split(".").pop()?.toLowerCase();

    const fileNameWithoutExtension = originalName
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
      fileNameWithoutExtension;

    const folder = fileExtension === "pdf" ? "pdf-files" : "images";

    return {
      folder: `EcoSpark-Hub/${folder}`,
      public_id: `EcoSpark-Hub/${folder}/${uniqueFilename}`,
      resource_type: "auto",
    };
  },
});

export const multerUploader = multer({ storage });
