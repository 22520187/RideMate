import axios from "axios";
import { API_BASE_URL } from "@env";
import endpoints from "../api/endpoints";
import { getToken } from "../utils/storage";

const normalizeMimeType = (type, fileName) => {
  if (!type || type === "image") {
    const ext = fileName?.split(".").pop()?.toLowerCase() || "jpg";
    const mimeMap = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    return mimeMap[ext] || "image/jpeg";
  }
  if (type.startsWith("image/")) {
    return type;
  }
  return "image/jpeg";
};

export const uploadImage = async (formData) => {
  try {
    console.log("[UPLOAD] Preparing to upload image");
    
    const token = await getToken();
    const url = `${API_BASE_URL}${endpoints.upload.image}`;
    
    console.log("[UPLOAD] Uploading to:", url);
    console.log("[UPLOAD] Has token:", !!token);

    const response = await axios.post(url, formData, {
      timeout: 60000,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      transformRequest: (data, headers) => {
        return data;
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    console.log("[UPLOAD] Success, result:", response);
    
    if (response && response.data) {
      if (response.data.data) {
        return { data: response.data.data };
      }
      return { data: response.data };
    }
    return response;
  } catch (error) {
    console.error("[UPLOAD] Upload error:", error);
    console.error("[UPLOAD] Error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
      },
    });

    if (error.response) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          `Upload failed: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.");
    } else {
      throw new Error(error.message || "Không thể tải ảnh lên. Vui lòng thử lại.");
    }
  }
};

export { normalizeMimeType };