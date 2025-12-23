import axiosClient from '../api/axiosClient';
import endpoints from '../api/endpoints';

export const getMyNotifications = async () => {
  try {
    const response = await axiosClient.get(endpoints.notifications.list);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const markAsRead = async (id) => {
  try {
    const response = await axiosClient.put(endpoints.notifications.markRead(id));
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const markAllAsRead = async () => {
  try {
    const response = await axiosClient.put(endpoints.notifications.markAllRead);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteNotification = async (id) => {
  // Assuming backend implements delete, though endpoints.js had it mapping to /notifications/{id}
  // If backend doesn't support DELETE, this might fail, but we'll add it for completeness based on design.
  try {
    const response = await axiosClient.delete(endpoints.notifications.delete(id));
    return response.data;
  } catch (error) {
    throw error;
  }
};
