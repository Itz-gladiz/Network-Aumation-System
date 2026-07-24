import client from "./client";

export const authApi = {
  login: (username, password) => client.post("/auth/login/", { username, password }),
  me: () => client.get("/auth/me/"),
  updateProfile: (payload) => client.patch("/auth/me/", payload),
  changePassword: (oldPassword, newPassword) =>
    client.post("/auth/change-password/", { old_password: oldPassword, new_password: newPassword }),
};
