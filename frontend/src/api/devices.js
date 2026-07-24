import client from "./client";

export const devicesApi = {
  list: (params) => client.get("/devices/", { params }),
  get: (id) => client.get(`/devices/${id}/`),
  create: (payload) => client.post("/devices/", payload),
  update: (id, payload) => client.patch(`/devices/${id}/`, payload),
  remove: (id) => client.delete(`/devices/${id}/`),
  testConnection: (id) => client.post(`/devices/${id}/test_connection/`),
};
