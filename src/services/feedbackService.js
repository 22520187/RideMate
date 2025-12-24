import axiosClient from '../api/axiosClient';
import endpoints from '../api/endpoints';

export const submitFeedback = async (matchId, rating, comment, tags) => {
  try {
    const response = await axiosClient.post(endpoints.feedback.submit, {
      matchId,
      rating,
      comment,
      tags: JSON.stringify(tags), // Backend stores as TEXT/String
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.log('Feedback API error (silent):', error.message);
    return { 
      success: false, 
      error: error?.response?.data?.message || error?.message || 'Unknown error'
    };
  }
};
