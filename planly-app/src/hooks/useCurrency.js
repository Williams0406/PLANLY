// src/hooks/useCurrency.js

import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { formatCurrency } from "../utils/formatCurrency";

export const useCurrency = () => {
  const { country } = useContext(AppContext);

  const format = (amount) =>
    formatCurrency(amount, country.currency, country.locale);

  return { format };
};