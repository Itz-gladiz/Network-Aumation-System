import client from "./client";

export const usersApi = {
  list: () => client.get("/users/"),
  create: (payload) => client.post("/users/", payload),
  update: (id, payload) => client.patch(`/users/${id}/`, payload),
  remove: (id) => client.delete(`/users/${id}/`),
};
