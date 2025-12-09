import axiosClient from "../api/axiosClient";

// Upload image to Cloudinary via backend
export const uploadImage = (formData) => {
  return axiosClient.post("/upload/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
