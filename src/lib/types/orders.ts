export interface DicsountCode {
id: string,
title: string,
description: string,
type: string,
value_type: string,
value: number
}

export interface ShippingLines {
id: string,
title: string,
price: number
}

export interface Address {
name: string,
type: string,
line1: string,
line2: string,
city: string, 
state: string, 
zip: string
}

export interface LineItem {
variant_id: string, 
title: string,
price: number,
hasDiscount: boolean,
isHighRisk?: boolean,
applied_discount?: number
} 

export interface Cart {
type: string,
isActive: boolean,
gateway: string,
used_gift_card: boolean,
hasDiscount: boolean,
gift_car?: string
discount_code?: DicsountCode,
browser_ip: string,
line_item: LineItem[],
current_subtotal_price: number, 
current_discount_value: number,
current_gift_card_value: number, 
current_total_price: number, 
customer_id?: string,
email?: string,
tags?: string[],
note?: string,
addresses?: Address[],
shipping_line?: ShippingLines,
created_at: string,
updated_at: string,
};
