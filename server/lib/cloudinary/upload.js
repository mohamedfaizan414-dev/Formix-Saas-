const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function uploadDataUri(dataUri, opts) {
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: opts.folder,
    resource_type: opts.resourceType || "auto",
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    bytes: result.bytes,
  };
}

async function deleteAsset(publicId, resourceType = "image") {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = {
  uploadDataUri,
  deleteAsset,
  cloudinary,
};
