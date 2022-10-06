import { LineItem } from "./orders"

export interface DiscountPreReqs {
customer_tags?: string[],
variant_ids?: string[],
collections?: string[],
sub_total: number,
goal_target: number
}

export interface Entitled {
collections?: string[],
variant_ids?: LineItem[],
customer_tags?: string[],
}

export interface Omitted {
collections?: string[],
variant_ids?: LineItem[],
customer_tags?: string[],
}

export type  Discount = {
    value?: number,
    title?: string,
    id?: string,
    automatic_type?: "TAGS" | "GOALS" | "PRODUCTS" | "COLLECTION" | "",
    created_at?: FirebaseFirestore.Timestamp,
    updated_at?: FirebaseFirestore.Timestamp,
    value_type?: string
    type?: "CART" | "LINEITEM" | "",
    status?: boolean
    isAutomatic?: boolean,
    code?: string,
    once_per_customer?: boolean,
    usage_limit?: number | null,
    pre_reqs?: DiscountPreReqs,
    entitled?: Entitled,
    omitted?: Omitted
    all_products?: boolean,
}
    
