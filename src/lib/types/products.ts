export interface Image 
  {
    id?: string,
    src?: string, 
    alt_text?: string,
    height?: number ,
    width?: number,
  }

export interface ProductOptions {
  options?: [
    {option1?: string[]},
    {option2?: string[]},
    {option3?: string[]},
  ]
}



export interface Option {
  option1?: string[],
  option2?: string[],
  option3?: string[]
}

export interface Variant 
  {
    product_id?: string,
    variant_id?: string,
    sku?: string,
    compare_at?: number,
    price?: number,
    option1?: string,
    option2?: string,
    option3?: string,
    quantity?: number,
    status?: boolean,
    updated_at?: FirebaseFirestore.Timestamp,
    created_at?: FirebaseFirestore.Timestamp
    image_url?: string,
    inventory?: number
  }


export interface Product {
  on_sale?: boolean,
  compare_at?: number,
  id?: string,
  title?: string,
  quantity?: number,
  handle?: string,
  description?: string,
  status?: boolean,
  has_options?: boolean,
  created_at?: FirebaseFirestore.Timestamp | null,
  updated_at: FirebaseFirestore.Timestamp | null,
  has_recurring?: boolean,
  price?: number,
  has_discount?: boolean,
  discounts_eliglble?: string[],
  taxable?: boolean,
  requires_shipping?: boolean,
  images?: Image[],
  options?: ProductOptions["options"],
  inventory_polocy?: {
    over_sold?: true,
  },
  dimentations?: {
    weight?: number,
    length?: string,
    width?: string
  },
  variants?: Variant[]
}

export interface NewProduct {
  on_sale?: boolean,
  compare_at?: number,
  id?: string,
  title: string,
  handle: string,
  quantity?: number,
  description?: string,
  status: boolean,
  has_options?: boolean,
  created_at?: FirebaseFirestore.Timestamp | null,
  updated_at?: FirebaseFirestore.Timestamp | null,
  has_recurring?: boolean,
  price: number,
  has_discount?: boolean,
  discounts_eliglble?: string[],
  taxable?: boolean,
  requires_shipping?: boolean,
  images?: Image[],
  options: ProductOptions["options"],
  inventory_polocy?: {
    over_sold?: true,
  },
  dimentations?: {
    weight?: number,
    length?: string,
    width?: string
  },
  variants?: Variant[]
}