import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

export const createReport = async (reportData) => {
  try {
    const response = await axiosClient.post(endpoints.reports.create, reportData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getMyReports = async () => {
  try {
    const response = await axiosClient.get(endpoints.reports.my);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getReportById = async (id) => {
  try {
    const response = await axiosClient.get(endpoints.reports.byId(id));
    return response;
  } catch (error) {
    throw error;
  }
};


