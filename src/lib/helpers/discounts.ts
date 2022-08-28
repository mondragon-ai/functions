import * as admin from "firebase-admin";
import {addLineItemSubTotalPrice} from "./carts"

interface LineItem {
  variant_id: string, 
  title: string,
  price: number,
  hasDiscount: boolean,
  isHighRisk?: boolean,
  applied_discount?: number
} 


interface DicsountCode {
  id: string,
  title: string,
  description: string,
  type: string,
  value: number
}

interface ShippingLines {
  id: string,
  title: string,
  price: number
}

interface Address {
  name: string,
  type: string,
  line1: string,
  line2: string,
  city: string, 
  state: string, 
  zip: string
}


interface Cart {
  type?: string,
  isActive?: boolean,
  gateway?: string,
  used_gift_card?: boolean,
  hasDiscount?: boolean,
  gift_car?: string
  discount_code?: DicsountCode,
  browser_ip?: string,
  line_item?: LineItem[],
  current_subtotal_price?: number, 
  current_discount_value?: number,
  current_gift_card_value?: number, 
  current_total_price?: number, 
  customer_id?: string,
  email?: string,
  tags?: string[],
  note?: string,
  addresses?: Address[],
  shipping_line?: ShippingLines,
  created_at?: string,
  updated_at: string,
};

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
  const line_items: LineItem[] = CART?.line_item || [];
  let SUB_TOTAL_PRICE: number = 0,
  LINEITEM_DISCOUNT_TOTAL: number = 0,
  DISCOUNT_VALUE: number =  DISCOUNT?.value || 0,
  cart: Cart = {
    ...CART,
    updated_at: `${admin.firestore.Timestamp.now()}`
  };

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
        if (v.hasDiscount) {
          totalLineItemsWithDiscount = totalLineItemsWithDiscount + 1
        }
      });
      DISCOUNT_VALUE = DISCOUNT_VALUE * totalLineItemsWithDiscount
      SUB_TOTAL_PRICE = SUB_TOTAL_PRICE - DISCOUNT_VALUE;

    } else {
      // Add subtotal for all eligable items in cart
      line_items.forEach((v, i) => {
        if (v.hasDiscount) {
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
    updated_at: `${admin.firestore.Timestamp.now()}`,
    current_discount_value: DISCOUNT_VALUE
  }

  return cart

};