import { Address } from "../types/orders";
import * as crypto from "crypto";

/**
 * Create NEW addresses ready to be pushed onto the primary DB from client
 * @param a: Address[]
 * @returns 
 */
export const createNewAddresses = (
  a: Address[]
): Address[] => {
  // Working with Addressess
  let addresses: Address[] = a || [];
  let addresWithId: Address[] = []

  // created uuids for the Address[]
  if (addresses?.length != 0) {
    addresses?.forEach((v, i) => {
      addresWithId.push(
        {
          ...v,
          id: "add_" + crypto.randomBytes(10).toString('hex')
        }
      )
    });
  }

  return addresWithId

}