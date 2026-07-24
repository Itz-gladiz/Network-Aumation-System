import client from "./client";

export const deploymentsApi = {
  list: (params) => client.get("/deployments/", { params }),
  deployNow: (payload) => client.post("/deployments/deploy_now/", payload),
  get: (id) => client.get(`/deployments/${id}/`),
};
