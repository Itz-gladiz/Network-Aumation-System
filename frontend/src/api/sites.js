import client from "./client";

export const sitesApi = {
  list: () => client.get("/sites/"),
};