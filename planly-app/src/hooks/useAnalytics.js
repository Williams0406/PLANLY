// src/hooks/useAnalytics.js

export const useAnalytics = () => {
  const track = (event, data = {}) => {
    console.log("Evento:", event, data);
    // Luego conectar con Firebase / Mixpanel
  };

  return { track };
};