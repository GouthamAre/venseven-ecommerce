const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

/**
 * Configure Cloudinary instance with environment variables
 */
const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Check if Cloudinary credentials are fully configured
 *
 * @returns {boolean}
 */
function isCloudinaryConfigured() {
  return isConfigured;
}

/**
 * Upload an image buffer directly to Cloudinary
 *
 * @param {Buffer} fileBuffer - Image file buffer from multer memory storage
 * @param {object} [options] - Additional Cloudinary upload options
 * @returns {Promise<{ url: string, secure_url: string, public_id: string, format: string, width: number, height: number }>}
 */
function uploadToCloudinary(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      // Development fallback when credentials are not configured
      const mockId = `mock_prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const mockUrl = `https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/${mockId}.jpg`;
      console.log(`[Cloudinary Dev Mode]: Simulated image upload for buffer (${fileBuffer?.length || 0} bytes) -> ${mockUrl}`);
      return resolve({
        url: mockUrl,
        secure_url: mockUrl,
        public_id: `venseven/products/${mockId}`,
        format: "jpg",
        width: 1200,
        height: 1600,
        isDevMock: true,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "venseven/products",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        transformation: [
          { quality: "auto:good", fetch_format: "auto" },
        ],
        ...options,
      },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary Upload Error]:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
}

/**
 * Delete an image from Cloudinary by its public ID
 *
 * @param {string} publicId
 * @returns {Promise<object>}
 */
async function deleteFromCloudinary(publicId) {
  if (!isCloudinaryConfigured() || !publicId || publicId.startsWith("mock_")) {
    return { result: "ok", isDevMock: true };
  }

  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("[Cloudinary Delete Error]:", error);
    throw error;
  }
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
};
