import * as admin from "firebase-admin";
import {addLineItemSubTotalPrice} from "./carts"
import {LineItem, Cart, } from '../types/orders'

/**
 * check if the Discount.Type == FIXED || PERCENTAGE
 * @param discount_type 
 * @returns  boolean
 */
export const discountValueTypeIsFixed = (
  discount_type: string
): boolean => {
  if (discount_type == "PERCENTAGE") {
    return false
  } 
  return true
};

/**
 * Add Discount to cart object based on discount.type && discount.value_type
 * @param CART: FirebaseFirestore.DocumentData
 * @param DISCOUNT: FirebaseFirestore.DocumentData
 * @returns {Cart}
 */
export const addDiscountToCart = (CART: FirebaseFirestore.DocumentData , DISCOUNT: FirebaseFirestore.DocumentData): Cart => {
  const line_items: LineItem[] = CART?.line_items ;
  let SUB_TOTAL_PRICE: number = 0,
  LINEITEM_DISCOUNT_TOTAL: number = 0,
  DISCOUNT_VALUE: number =  DISCOUNT?.value || 0,
  cart: Cart = {};

  console.log("CUSTOMER_CART: \n", CART)
  console.log("\n\DISCOUNT: \n", DISCOUNT)

  //Reset Sub total
  SUB_TOTAL_PRICE = addLineItemSubTotalPrice(line_items);

  //Check if discount.type has: CART || LINEITEM
  if (DISCOUNT?.type == "CART") {

    //Check if discount.value_type has: PERCENTAGE || FIXED
    if (discountValueTypeIsFixed(DISCOUNT?.value_type)) {
      SUB_TOTAL_PRICE = SUB_TOTAL_PRICE - DISCOUNT_VALUE

    } else {
      DISCOUNT_VALUE = SUB_TOTAL_PRICE * (DISCOUNT_VALUE/100)
      SUB_TOTAL_PRICE = SUB_TOTAL_PRICE - DISCOUNT_VALUE;
    }

  } else {

    //Check if discount.value_type has: PERCENTAGE || FIXED
    if (discountValueTypeIsFixed(DISCOUNT?.value_type)) {
      // Count all eligible items in cart
      let totalLineItemsWithDiscount = 0
      line_items.forEach((v, i) => {
        if (v.has_discount) {
          totalLineItemsWithDiscount = totalLineItemsWithDiscount + 1
        }
      });
      DISCOUNT_VALUE = DISCOUNT_VALUE * totalLineItemsWithDiscount
      SUB_TOTAL_PRICE = SUB_TOTAL_PRICE - DISCOUNT_VALUE;

    } else {
      // Add subtotal for all eligable items in cart
      line_items.forEach((v, i) => {
        if (v.has_discount) {
          LINEITEM_DISCOUNT_TOTAL = LINEITEM_DISCOUNT_TOTAL + v.price;
        }
      });
      DISCOUNT_VALUE = (LINEITEM_DISCOUNT_TOTAL * (DISCOUNT_VALUE/100));
      SUB_TOTAL_PRICE = SUB_TOTAL_PRICE - DISCOUNT_VALUE;
    }

  }

  // Reset Cart obj to push back to primary DB to update
  cart = {
    ...cart,
    current_subtotal_price: SUB_TOTAL_PRICE,
    updated_at: admin.firestore.Timestamp.now(),
    current_discount_value: DISCOUNT_VALUE
  }

  return cart

};