import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

export const registerVehicle = (data) => axiosClient.post(endpoints.vehicles.register, data);
export const getMyVehicle = () => axiosClient.get(endpoints.vehicles.myVehicle);
export const getVehicleById = (id) =>
  axiosClient.get(endpoints.vehicles.byId(id));
export const updateVehicleStatus = (id, data) =>
  axiosClient.put(endpoints.vehicles.updateStatus(id), data);
export const getVehiclesByDriver = (driverId) =>
  axiosClient.get(endpoints.vehicles.listByDriver(driverId));
export const getPendingVehicles = () =>
  axiosClient.get(endpoints.vehicles.pending);
