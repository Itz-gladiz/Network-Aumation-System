import client from "./client";

export const templatesApi = {
  list: () => client.get("/templates/"),
  create: (payload) => client.post("/templates/", payload),
  update: (id, payload) => client.patch(`/templates/${id}/`, payload),
  remove: (id) => client.delete(`/templates/${id}/`),
};
