import client from "./client";

export const settingsApi = {
  get: () => client.get("/settings/"),
  update: (payload) => client.patch("/settings/", payload),
};
