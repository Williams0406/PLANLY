// src/utils/formatCurrency.js

export const formatCurrency = (
  amount,
  currency = "PEN",
  locale = "es-PE"
) => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
};