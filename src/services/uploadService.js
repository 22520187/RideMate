import axiosClient from "../api/axiosClient";

// Upload image to Cloudinary via backend
export const uploadImage = (formData) => {
  // formData should have "file" parameter with image blob
  // axios will automatically set Content-Type: multipart/form-data
  // when FormData is passed, so we don't need to set it explicitly
  return axiosClient.post("/upload/image", formData);
};
