import { Address, LineItem } from "./orders"

export interface OrderSummary {
    id?: string,
    total_price?: string,
    line_items?: LineItem[],
    sub_total_price?: number,
    has_discount?: boolean,
    gift_card_value?: number,
    discount_value?: number,
    code_used?: number,
    tags?: string[],
    address?: Address[],
    fulfillment_status: "UNFULLFILLED" | "PARTIALLY_FULFILLED" | "DELAYED" | "FULLFILLED",
  }
  
  export interface GiftCardSummary {
    id?: string,
    balance?: string,
    starting_value?: number,
    expiration_date?: string,
    code?: string,
  }
  
  export interface Price {
    id?: string
    created_at?: string, 
    interval?: {},
    active?: boolean,
    type?: "RECURRING" | "ONCE",
    recurring?: {
      aggregate_usage: any,
      interval: "DAY" | "WEEK" | "MONTH" | "YEAR",
      interval_count: number,
      usage_type: "SUBSCRIPTION" | "SUPPORT" | "LICENSE" | "LOAN"
    },
    unit_amount?: number,
    products?: LineItem[]
  }
  
  export interface SubscriptionSummary {
    id?: string, 
    product?: LineItem,
    price?: Price
  }
  
  export interface Customer {
    id?: string,
    email?: string,
    first_name?: string,
    last_name?: string,
    currency_code?: string,
    last_order_id?: string,
    status?: "SPENDING" | "DELINQUENT" | "LOYAL" | "AVERAGE" | "NEW",
    total_spent?: number,
    tags?: string[],
    addresses?: Address[],
    orders?: OrderSummary[],
    has_subscription?: boolean,
    subscriptions?: SubscriptionSummary[]
    gift_cards?: GiftCardSummary[],
    verified_email?: boolean,
    created_at?: any
    updated_at?: any
  };
  
  export interface NewCustomer {
    id?: string,
    email: string,
    first_name: string,
    last_name?: string,
    currency_code?: "USD",
    status?: "SPENDING" | "DELINQUENT" | "LOYAL" | "AVERAGE" | "NEW",
    tags?: string[],
    addresses?: Address[],
    created_at: any
    updated_at: any
  };