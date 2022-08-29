import {Address} from "../types/orders";

export interface EcomReturn {
  status: number, 
  text: string,
  data?: {
    stripe_uuid?: string,
    stripe_pm?: string,
    stripe_client_secrete?: string,
    stripe_pi?: string
  }
};

export interface StripeCustomer {
  address: Address,
  name: string,
  email: string,
  phone?: string,
  description?: string,
  metadeta?: {},
};