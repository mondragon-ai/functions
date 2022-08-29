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
line_items?: LineItem[],
customer_tags?: string[],
}

export interface Omitted {
collections?: string[],
line_items?: LineItem[],
customer_tags?: string[],
}

export interface Discount {
id?: string,
automatic_type: string,
created_at: string,
updated_at: string,
value_type: string
type: string,
status: boolean
isAutomatic: boolean,
code: "",
once_per_customer: false,
usage_limit: 1000,
pre_reqs: DiscountPreReqs,
entitled: Entitled,
omitted: Omitted
all_products: boolean,
}
    
