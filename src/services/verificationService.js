import axiosClient from "../api/axiosClient";

/**
 * Upload ID card image for verification
 * @param {string} phoneNumber - User's phone number
 * @param {string} imageUri - Local file URI of the ID card image
 * @returns {Promise} Verification response
 */
export const uploadIdCard = async (phoneNumber, imageUri) => {
  try {
    const formData = new FormData();
    formData.append("phoneNumber", phoneNumber);

    // Create file object for upload
    const file = {
      uri: imageUri,
      type: "image/jpeg",
      name: `id_card_${Date.now()}.jpg`,
    };

    formData.append("idCardImage", file);

    const response = await axiosClient.post("/verification/id-card", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading ID card:", error);
    throw error;
  }
};

/**
 * Verify liveness with selfie image
 * @param {string} phoneNumber - User's phone number
 * @param {string} imageUri - Local file URI of the selfie image
 * @returns {Promise} Verification response with similarity score
 */
export const verifyLiveness = async (phoneNumber, imageUri) => {
  try {
    const formData = new FormData();
    formData.append("phoneNumber", phoneNumber);

    // Create file object for upload
    const file = {
      uri: imageUri,
      type: "image/jpeg",
      name: `selfie_${Date.now()}.jpg`,
    };

    formData.append("selfieImage", file);

    const response = await axiosClient.post(
      "/verification/liveness",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error verifying liveness:", error);
    throw error;
  }
};

/**
 * Get verification status for a phone number
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise} Verification status details
 */
export const getVerificationStatus = async (phoneNumber) => {
  try {
    const response = await axiosClient.get(
      `/verification/status/${phoneNumber}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting verification status:", error);
    throw error;
  }
};

/**
 * Verify liveness phase (LOOK_STRAIGHT, BLINK, TURN_LEFT)
 * @param {string} identifier - Phone number or tempId
 * @param {string} phase - Phase ID (LOOK_STRAIGHT, BLINK, TURN_LEFT)
 * @param {string} imageUri - Local file URI of the phase image
 * @returns {Promise} Phase verification response
 */
export const verifyLivenessPhase = async (identifier, phase, imageUri) => {
  try {
    const formData = new FormData();
    formData.append("phoneNumber", identifier); // Backend accepts both phoneNumber and tempId as "phoneNumber" param
    formData.append("phase", phase);

    const file = {
      uri: imageUri,
      type: "image/jpeg",
      name: `phase_${phase}_${Date.now()}.jpg`,
    };

    formData.append("image", file);

    const response = await axiosClient.post(
      "/verification/liveness/verify-phase",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Error verifying liveness phase:", error);
    throw error;
  }
};

/**
 * Upload ID card with temporary identifier (new registration flow)
 * @param {string} tempId - Temporary identifier
 * @param {string} imageUri - Local file URI of the ID card image
 * @returns {Promise} Verification response
 */
export const uploadIdCardWithTempId = async (tempId, imageUri) => {
  try {
    const formData = new FormData();
    formData.append("tempId", tempId);

    const file = {
      uri: imageUri,
      type: "image/jpeg",
      name: `id_card_${Date.now()}.jpg`,
    };

    formData.append("idCardImage", file);

    const response = await axiosClient.post(
      "/verification/id-card-temp",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error uploading ID card with tempId:", error);
    throw error;
  }
};

/**
 * Verify liveness selfie with CCCD using temporary identifier
 * @param {string} tempId - Temporary identifier
 * @param {string} imageUri - Local file URI of the selfie image
 * @returns {Promise} Verification response with similarity score
 */
export const verifyLivenessWithTempId = async (tempId, imageUri) => {
  try {
    const formData = new FormData();
    formData.append("tempId", tempId);

    const file = {
      uri: imageUri,
      type: "image/jpeg",
      name: `selfie_${Date.now()}.jpg`,
    };

    formData.append("selfieImage", file);

    const response = await axiosClient.post(
      "/verification/liveness-temp",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error verifying liveness with tempId:", error);
    throw error;
  }
};

/**
 * Link temporary verification data to user account
 * @param {string} tempId - Temporary identifier
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise} Response
 */
export const linkTempVerificationToUser = async (tempId, phoneNumber) => {
  try {
    const response = await axiosClient.post("/verification/link-temp", null, {
      params: {
        tempId,
        phoneNumber,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error linking temp verification:", error);
    throw error;
  }
};
