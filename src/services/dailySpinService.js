import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

export const checkDailySpin = async () => {
  const response = await axiosClient.get(endpoints.dailySpin.check);
  return response.data;
};

export const performSpin = async () => {
  const response = await axiosClient.post(endpoints.dailySpin.spin);
  return response.data;
};
