import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getConversionRate = (symbol: string) => {
  let conversionRate = 1;
  if (symbol === "BTC") {
    conversionRate = 0.000025;
  } else if (symbol === "ETH") {
    conversionRate = 0.0003;
  } else if (symbol === "USDT") {
    conversionRate = 1;
  }
  return conversionRate;
};
