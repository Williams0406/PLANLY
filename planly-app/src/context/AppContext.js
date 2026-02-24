// src/context/AppContext.js

import React, { createContext, useState } from "react";
import { COUNTRIES } from "../config/countries";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [country, setCountry] = useState(COUNTRIES.PERU);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        country,
        setCountry,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};