import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
}

// Accepts a base64 data URI (what the browser FileReader / signature pad
// produces) and uploads it to Cloudinary under a form-scoped folder.
export async function uploadDataUri(
  dataUri: string,
  opts: { folder: string; resourceType?: "image" | "raw" | "auto" }
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: opts.folder,
    resource_type: opts.resourceType ?? "auto",
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    bytes: result.bytes,
  };
}

export async function deleteAsset(publicId: string, resourceType = "image") {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };
