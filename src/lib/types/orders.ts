export interface DicsountCode {
  id: string,
  title: string,
  type: string,
  value_type: string,
  value: number,
}

export interface ShippingLines {
id: string,
title: string,
price: number
}

export interface Address {
  id?: string | "",
  title?: string,
  isDefault?: boolean,
  type?: "BOTH" | "SHIPPING" | "BILLING",
  line1?: string,
  line2?: string,
  city?: string, 
  state?: string, 
  zip?: string
}

export interface LineItem {
  variant_id?: string, 
  title?: string,
  price: number | 0,
  has_discount?: boolean,
  isHighRisk?: boolean,
  applied_discount?: number | 0,
  quantity: number | 0,
  image_url?: string
} 

export interface Cart {
type?: string,
isActive?: boolean,
gateway?: string,
used_gift_card?: boolean,
has_discount?: boolean,
gift_card?: string
discount_code?: DicsountCode,
browser_ip?: string,
line_item?: LineItem[],
current_subtotal_price?: number, 
current_discount_value?: number,
current_gift_card_value?: number, 
current_total_price?: number, 
customer_id?: string,
customer_tags?: string[],
email?: string,
tags?: string[],
note?: string,
addresses?: Address[],
shipping_line?: ShippingLines,
created_at?: FirebaseFirestore.Timestamp,
updated_at?: FirebaseFirestore.Timestamp,
};

export interface DraftOrder {
  id?: string,
  phone?: string,
  checkout_url?: string
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
  created_at?: FirebaseFirestore.Timestamp,
  updated_at: FirebaseFirestore.Timestamp,
  fullfillment_status?: string,
  payment_status?: string,
};
