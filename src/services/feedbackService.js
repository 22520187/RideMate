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
    return response.data;
  } catch (error) {
    throw error;
  }
};
