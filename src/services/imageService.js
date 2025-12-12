import api from "./axios";
import { compressImage, compressMultipleImages } from "../utils/imageCompression";

const handleError = (error, defaultMessage) => {
  let errorMessage = defaultMessage;
  
  if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error?.message) {
    errorMessage = error.message;
  }
  
  throw new Error(errorMessage);
};

/**
 * Upload images to Cloudinary via server
 * @param {File[]} files - Array of image files
 * @param {String} folderPath - Cloudinary folder path (e.g., 'valuations/properties')
 * @returns {Promise} Response with uploaded images data
 */
export const uploadImages = async (files, folderPath) => {
  try {
    const formData = new FormData();
    
    // Append all files
    if (Array.isArray(files)) {
      files.forEach((file) => {
        if (file) {
          formData.append('images', file);
        }
      });
    } else {
      formData.append('images', files);
    }
    
    formData.append('folderPath', folderPath);

    const response = await api.post("/images/upload", formData);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to upload images");
  }
};

/**
 * Upload base64 image to Cloudinary
 * @param {String} base64String - Base64 encoded image string
 * @param {String} folderPath - Cloudinary folder path
 * @param {String} fileName - Original file name
 * @returns {Promise} Response with uploaded image data
 */
export const uploadBase64Image = async (base64String, folderPath, fileName = "") => {
  try {
    const response = await api.post("/images/upload-base64", {
      base64String,
      folderPath,
      fileName
    });
    return response.data;
  } catch (error) {
    handleError(error, "Failed to upload image");
  }
};

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public ID of the image
 * @returns {Promise} Response confirming deletion
 */
export const deleteImage = async (publicId) => {
  try {
    const response = await api.post("/images/delete", {
      publicId
    });
    return response.data;
  } catch (error) {
    handleError(error, "Failed to delete image");
  }
};

/**
 * Upload multiple images and return array of results
 * @param {Object[]} imageArray - Array of image objects with file property
 * @param {String} folderPath - Cloudinary folder path
 * @returns {Promise} Array of uploaded image data
 */
export const uploadMultipleImages = async (imageArray, folderPath) => {
  try {
    const files = imageArray
      .filter(img => img && img.file)
      .map(img => img.file);

    if (files.length === 0) {
      return [];
    }

    const result = await uploadImages(files, folderPath);
    return result.images || [];
  } catch (error) {
    handleError(error, "Failed to upload multiple images");
  }
};

/**
 * Upload images from file inputs and maintain structure
 * @param {Object[]} imagePreviews - Array of preview objects with file property
 * @param {String} baseFolder - Base folder path in Cloudinary
 * @returns {Promise} Array of uploaded image data with original structure
 */
export const uploadPropertyImages = async (imagePreviews, uniqueId) => {
  try {
    // Filter valid images
    const validImages = imagePreviews.filter(img => img && img.file);
    
    if (validImages.length === 0) {
      return [];
    }

    // Compress all images in parallel
    const compressionPromises = validImages.map((imagePreview, i) =>
      compressImage(imagePreview.file)
        .then(compressedFile => ({ compressedFile, imagePreview, index: i }))
    );
    
    const compressedImages = await Promise.all(compressionPromises);

    // Upload all compressed images in parallel
    const uploadPromises = compressedImages.map(({ compressedFile, imagePreview, index }) => {
      const formData = new FormData();
      formData.append('images', compressedFile);
      formData.append('folderPath', `valuations/${uniqueId}/property_images`);
      
      return api.post("/images/upload", formData)
        .then(response => {
          if (response.data.images && response.data.images.length > 0) {
            return {
              ...response.data.images[0],
              inputNumber: imagePreview.inputNumber || index + 1
            };
          }
          return null;
        });
    });

    const uploadedImages = await Promise.all(uploadPromises);
    return uploadedImages.filter(img => img !== null);
  } catch (error) {
    handleError(error, "Failed to upload property images");
  }
};

/**
 * Upload location images
 * @param {Object[]} locationImagePreviews - Array of location image preview objects
 * @param {String} uniqueId - Unique ID for the valuation
 * @returns {Promise} Array of uploaded location images
 */
export const uploadLocationImages = async (locationImagePreviews, uniqueId) => {
  try {
    // Filter valid images
    const validImages = locationImagePreviews.filter(img => img && img.file);
    
    if (validImages.length === 0) {
      return [];
    }

    // Compress all images in parallel
    const compressionPromises = validImages.map((imagePreview, i) =>
      compressImage(imagePreview.file)
        .then(compressedFile => ({ compressedFile, imagePreview, index: i }))
    );
    
    const compressedImages = await Promise.all(compressionPromises);

    // Upload all compressed images in parallel
    const uploadPromises = compressedImages.map(({ compressedFile }) => {
      const formData = new FormData();
      formData.append('images', compressedFile);
      formData.append('folderPath', `valuations/${uniqueId}/location_images`);
      
      return api.post("/images/upload", formData)
        .then(response => {
          if (response.data.images && response.data.images.length > 0) {
            return response.data.images[0];
          }
          return null;
        });
    });

    const uploadedImages = await Promise.all(uploadPromises);
    return uploadedImages.filter(img => img !== null);
  } catch (error) {
    handleError(error, "Failed to upload location images");
  }
};
