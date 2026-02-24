// src/features/user/useUser.js

import { useEffect, useState } from "react";
import * as userService from "./userService";

export const useUser = () => {
  const [profile, setProfile] = useState(null);

  const loadProfile = async () => {
    const data = await userService.fetchProfile();
    setProfile(data);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return {
    profile,
    editProfile: userService.editProfile,
  };
};