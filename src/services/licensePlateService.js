import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "@env";
import * as FileSystem from 'expo-file-system/legacy';


// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * List all available Gemini models
 * @returns {Promise<Array>} List of available models
 */
export const listAvailableModels = async () => {
  try {
    console.log('📋 Fetching available Gemini models...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Available models:');
    data.models?.forEach(model => {
      console.log(`  - ${model.name}`);
      console.log(`    Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
    });
    
    return data.models;
  } catch (error) {
    console.error('❌ Error listing models:', error);
    throw error;
  }
};

/**
 * Convert image URI to base64
 * @param {string} uri - Image URI from camera or file picker
 * @returns {Promise<string>} Base64 encoded image
 */
const imageToBase64 = async (uri) => {
  try {
    console.log('📸 Converting image to base64:', uri);
    
    // Check if FileSystem is properly loaded
    if (!FileSystem) {
      throw new Error('FileSystem module not available');
    }
    
    // Use the encoding type - with fallback for older versions
    const encoding = FileSystem.EncodingType?.Base64 || 'base64';
    
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: encoding,
    });
    
    console.log('✅ Successfully converted to base64, length:', base64.length);
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Không thể đọc ảnh');
  }
};

/**
 * Step 1: Detect if image contains a license plate using Gemini AI
 * @param {string} imageUri - Image URI
 * @returns {Promise<{isLicensePlate: boolean, confidence: string}>}
 */
export const detectLicensePlate = async (imageUri) => {
  try {
    console.log('🔍 Detecting license plate with Gemini...');
    
    const base64Image = await imageToBase64(imageUri);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    const prompt = `Phân tích ảnh này và trả lời:
1. Đây có phải là ảnh biển số xe không? (xe máy hoặc ô tô Việt Nam)
2. Đọc chính xác các ký tự trên biển số
3. Đánh giá độ rõ nét của biển số

Trả về CHÍNH XÁC theo format JSON sau (không thêm markdown hay text khác):
{
  "isLicensePlate": true/false,
  "plateNumber": "biển số đọc được (nếu có)",
  "confidence": "high/medium/low",
  "reason": "lý do ngắn gọn"
}`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      },
      prompt
    ]);
    
    const responseText = result.response.text();
    console.log('Gemini raw response:', responseText);
    
    // Parse JSON from response (remove markdown if present)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    console.log('✅ Gemini analysis:', analysis);
    
    return analysis;
  } catch (error) {
    console.error('❌ Error detecting license plate:', error);
    
    // Check for quota exceeded error
    if (error.message && error.message.includes('quota')) {
      throw new Error('Đã vượt quá giới hạn API. Vui lòng thử lại sau vài phút.');
    }
    
    // Check for 404 model not found
    if (error.message && error.message.includes('404')) {
      throw new Error('Lỗi cấu hình API. Vui lòng kiểm tra lại.');
    }
    
    throw new Error('Không thể phân tích ảnh. Vui lòng thử lại.');
  }
};

/**
 * Step 2: Extract license plate number using ML Kit Text Recognition
 * @param {string} imageUri - Image URI
 * @returns {Promise<{plateNumber: string, rawText: string}>}
 */
/**
 * Step 2: Extract plate number (Deprecated/Merged into Step 1)
 * Logic is now handled by Gemini in Step 1
 */
export const extractPlateNumber = async (imageUri) => {
  return { plateNumber: null, rawText: null };
};

/**
 * Clean and format license plate number
 * Vietnamese license plate format: 
 * - Old: 12A-12345 (2 digits, 1 letter, 5 digits)
 * - New: 12A1-12345 (2 digits, 1 letter, 1 digit, 5 digits)
 * @param {string} rawText - Raw OCR text
 * @returns {string} Cleaned plate number
 */
const cleanPlateNumber = (rawText) => {
  // 1. Remove all non-alphanumeric chars first to get raw string
  let cleaned = rawText.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  
  // 2. Format: XX-XX YYYY or XX-XX YYYYY
  // Example: 54L19999 -> 54-L1 9999
  if (cleaned.length >= 7) {
    // Group 1: Area code (2 chars)
    // Group 2: Series (1-2 chars)
    // Group 3: Numbers (4-5 digits)
    const match = cleaned.match(/^([A-Z0-9]{2})([A-Z0-9]+)(\d{4,5})$/);
    if (match) {
      return `${match[1]}-${match[2]} ${match[3]}`;
    }
  }
  
  console.log('Cleaned plate number:', cleaned);
  return cleaned;
};

/**
 * Main function: Process vehicle image and extract license plate
 * @param {string} imageUri - Image URI from camera
 * @returns {Promise<{success: boolean, plateNumber?: string, error?: string}>}
 */
export const processVehicleImage = async (imageUri) => {
  try {
    // Step 1: Detect if it's a license plate
    const detection = await detectLicensePlate(imageUri);
    
    if (!detection.isLicensePlate) {
      return {
        success: false,
        error: `Không phải ảnh biển số xe. ${detection.reason || ''}`,
      };
    }
    
    if (detection.confidence === 'low') {
      return {
        success: false,
        error: 'Ảnh không đủ rõ. Vui lòng chụp lại với ánh sáng tốt hơn.',
      };
    }
    
    // Priority: Gemini (since ML Kit is removed for Expo Go compatibility)
    let plateNumber = detection.plateNumber;
    let rawText = detection.plateNumber;
    
    console.log('Using Gemini plate number:', plateNumber);

    // Clean the plate number again to be sure
    if (plateNumber) {
      plateNumber = cleanPlateNumber(plateNumber);
    }
    
    if (!plateNumber || plateNumber.length < 5) {
      return {
        success: false,
        error: 'Không đọc được biển số. Vui lòng chụp ảnh rõ hơn.',
      };
    }
    
    return {
      success: true,
      plateNumber: plateNumber, // Use clean plate number
      rawText: rawText,
      confidence: detection.confidence,
    };
  } catch (error) {
    console.error('❌ Error processing vehicle image:', error);
    return {
      success: false,
      error: error.message || 'Có lỗi xảy ra khi xử lý ảnh',
    };
  }
};

export default {
  detectLicensePlate,
  extractPlateNumber,
  processVehicleImage,
};
