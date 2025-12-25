import axiosClient from "../api/axiosClient";
import endpoints from "../api/endpoints";

export const createPayment = (data) => {
  return axiosClient.post(endpoints.payments.create, data);
};

export const confirmStripePayment = (sessionId) => {
  return axiosClient.post(endpoints.payments.stripeConfirm, null, {
    params: { sessionId },
  });
};

export const getStripeConfig = () => {
  return axiosClient.get(endpoints.payments.stripeConfig);
};

export const queryPayment = (orderId) => {
  return axiosClient.get(endpoints.payments.query(orderId));
};

export const getMyPayments = () => {
  return axiosClient.get(endpoints.payments.myPayments);
};

export const getMyMembership = () => {
  return axiosClient.get(endpoints.payments.myMembership);
};
