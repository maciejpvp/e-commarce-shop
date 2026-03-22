export const formatCurrency = (val: number, currency: string = "usd"): string => {
  const currencyUpper = currency.toUpperCase();
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyUpper,
    minimumFractionDigits: 2,
  });
  return formatter.format(val);
};
