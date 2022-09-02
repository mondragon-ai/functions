import { Address } from "../types/orders";

export const getDefaultAddress = (
  addresses: Address[]
): Address => {
  let default_address: Address = {};

  if (addresses?.length == 0) {
    return default_address;

  } else {
    addresses?.forEach((v,i) => {
        if (v.isDefault) {
          default_address = {
            ...v
          }
        } else if (v.type == "BILLING") {
          default_address = {
            ...v
          }
        }
      });
      return default_address;
  }
  
};