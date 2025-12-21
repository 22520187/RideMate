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

    // NOTE: Axios multipart uploads on React Native can throw ERR_NETWORK even when the server is reachable.
    // We try axios first, then fallback to fetch (more reliable with FormData/boundary handling).
    let response;
    try {
      response = await axios.post(url, formData, {
        timeout: 60000,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          Accept: "application/json",
        },
        transformRequest: (data) => data,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
    } catch (axiosErr) {
      const isNetwork =
        axiosErr?.code === "ERR_NETWORK" && !axiosErr?.response;
      console.warn("[UPLOAD] Axios upload failed, network:", isNetwork);
      if (!isNetwork) throw axiosErr;

      console.log("[UPLOAD] Retrying upload via fetch...");
      const fetchRes = await fetch(url, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          Accept: "application/json",
          // IMPORTANT: do NOT set Content-Type for FormData (RN sets boundary)
        },
        body: formData,
      });

      const contentType = fetchRes.headers.get("content-type") || "";
      let payload;
      try {
        payload = contentType.includes("application/json")
          ? await fetchRes.json()
          : await fetchRes.text();
      } catch (e) {
        payload = null;
      }

      if (!fetchRes.ok) {
        const msg =
          (payload && payload.message) ||
          (typeof payload === "string" ? payload.slice(0, 200) : null) ||
          `Upload failed: ${fetchRes.status}`;
        const err = new Error(msg);
        err.status = fetchRes.status;
        err.response = { data: payload, status: fetchRes.status };
        throw err;
      }

      // Normalize to axios-like object
      response = { data: payload, status: fetchRes.status };
    }
    
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
      const url = error.config?.url || "";
      const isPrivateIp =
        /http:\/\/(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(url);
      throw new Error(
        isPrivateIp
          ? "Không thể kết nối đến server nội bộ. Hãy đảm bảo điện thoại và máy chạy backend cùng mạng Wi‑Fi/LAN, mở port 8080 trên firewall, hoặc dùng đúng IP LAN của máy."
          : "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại."
      );
    } else {
      throw new Error(error.message || "Không thể tải ảnh lên. Vui lòng thử lại.");
    }
  }
};

export { normalizeMimeType };