import axios from "axios"

/**
 * Uploads a file to Cloudinary
 * @param file The file to upload
 * @param onProgress Optional callback for upload progress
 * @returns Promise with the Cloudinary URL
 */
export async function uploadToCloudinary(file: File, onProgress?: (progress: number) => void): Promise<string> {
  try {
    // Create form data for Cloudinary upload
    const cloudinaryData = new FormData()
    cloudinaryData.append("file", file)
    cloudinaryData.append("upload_preset", "AllPDF")
    cloudinaryData.append("cloud_name", "db9um0dp4")
    cloudinaryData.append("resource_type", "raw")
    // Upload to Cloudinary with progress tracking
    const response = await axios.post(`https://api.cloudinary.com/v1_1/db9um0dp4/image/upload`, cloudinaryData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted)
        }
      },
    })

    // Return the secure URL from the Cloudinary response
    return response.data.secure_url
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    throw new Error("Failed to upload file to Cloudinary")
  }
}
export async function uploadToCloudinaryForTextExtraction(file: File): Promise<string> {
    try {
      // Create form data for Cloudinary upload
      const cloudinaryData = new FormData()
      cloudinaryData.append("file", file)
      cloudinaryData.append("upload_preset", "AllPDF")
        cloudinaryData.append("cloud_name", "db9um0dp4")
        cloudinaryData.append("asset_folder", "textExtractedPdf")
        cloudinaryData.append("resource_type", "raw")
  
      // Upload to Cloudinary with progress tracking
      const response = await axios.post(`https://api.cloudinary.com/v1_1/db9um0dp4/image/upload`, cloudinaryData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
  
      // Return the secure URL from the Cloudinary response
      return response.data.secure_url
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error)
      throw new Error("Failed to upload file to Cloudinary")
    }
  }
  export async function uploadAvatarToCloudinary(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        throw new Error("Please select an image file");
      }
  
      // Create form data for Cloudinary upload
      const cloudinaryData = new FormData();
      cloudinaryData.append("file", file);
      cloudinaryData.append("upload_preset", "AllPDF");
      cloudinaryData.append("cloud_name", "db9um0dp4");
      
      // Special settings for avatars
      cloudinaryData.append("asset_folder", "avatars");
      cloudinaryData.append("resource_type", "image");

  
      // Upload to Cloudinary with progress tracking
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/db9um0dp4/image/upload`, 
        cloudinaryData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          },
        }
      );
  
      // Return the secure URL from the Cloudinary response
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading avatar to Cloudinary:", error);
      throw new Error("Failed to upload avatar image");
    }
  }