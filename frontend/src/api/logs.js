import client from "./client";

export const logsApi = {
  list: (params) => client.get("/logs/", { params }),
  export: (params) => client.get("/logs/export/", { params, responseType: "blob" }),
};
