// src/services/authApi.js

import api from "./api";

export const loginRequest = async (username, password) => {
  const response = await api.post("/token/", {
    username,
    password,
  });
  return response.data;
};

export const refreshTokenRequest = async (refresh) => {
  const response = await api.post("/token/refresh/", {
    refresh,
  });
  return response.data;
};

export const registerRequest = async (data) => {
  const response = await api.post("/users/register/", data);
  return response.data;
};