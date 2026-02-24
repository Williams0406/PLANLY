// src/config/plans.js

export const PLANS = {
  FREE: {
    name: "Free",
    maxGroups: 3,
    maxMovimientos: 50,
    reports: false,
    export: false,
  },
  PREMIUM: {
    name: "Premium",
    maxGroups: Infinity,
    maxMovimientos: Infinity,
    reports: true,
    export: true,
  },
};