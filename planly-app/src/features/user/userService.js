// src/features/user/userService.js

import * as userApi from "../../services/userApi";

export const fetchProfile = () => userApi.getProfile();
export const editProfile = (data) => userApi.updateProfile(data);