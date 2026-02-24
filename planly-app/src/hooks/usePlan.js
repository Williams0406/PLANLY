// src/hooks/usePlan.js

import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { PLANS } from "../config/plans";

export const usePlan = () => {
  const { user } = useContext(AppContext);

  const currentPlan = user?.plan || "FREE";

  const planConfig = PLANS[currentPlan];

  const canCreateGroup = (currentCount) =>
    currentCount < planConfig.maxGroups;

  const canCreateMovimiento = (currentCount) =>
    currentCount < planConfig.maxMovimientos;

  return {
    plan: planConfig,
    canCreateGroup,
    canCreateMovimiento,
  };
};