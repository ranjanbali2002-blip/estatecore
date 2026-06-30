const { v2: cloudinary } = require('cloudinary');
const logger = require('./logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads a buffer to Cloudinary under the workspace's logo folder.
 * Returns { url, publicId }.
 */
function uploadLogo(buffer, workspaceId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `estatecore/workspaces/${workspaceId}/logo`,
        resource_type: 'image',
        overwrite: true,
        transformation: [{ width: 400, height: 400, crop: 'limit' }],
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

async function deleteAsset(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    logger.warn('Failed to delete Cloudinary asset', { publicId, error: err.message });
  }
}

module.exports = { cloudinary, uploadLogo, deleteAsset };
