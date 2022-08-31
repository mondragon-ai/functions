import { LineItem } from "../types/orders";
/**
 * Add Line Items Sub Total of Cart
 * @param LINE_ITEMS 
 * @returns {SUB_TOTAL_PRICE: number}
 */
 export const addLineItemSubTotalPrice = (
  LINE_ITEMS: LineItem[]
): number => {
  let SUB_TOTAL_PRICE: number = 0;
  
  LINE_ITEMS.forEach((v, i) => {
    SUB_TOTAL_PRICE = SUB_TOTAL_PRICE + v.price;
    console.log(v.price)
    console.log(SUB_TOTAL_PRICE)
  });
  return SUB_TOTAL_PRICE;
  
}

/**
 * Check to see if LineItem[] has High Risk items && change gateway.
 * @param LINE_ITEMS: LineItem
 * @returns {string}
 */
export const checkIfCartIsHighRisk = (
  LINE_ITEMS: LineItem[]
): string => {
  let gataway: string = "STRIPE";

  LINE_ITEMS.forEach((v, i) => {
    if (v.isHighRisk) {
      gataway = "SQUARE";
    }
  });
  return gataway;
  
};