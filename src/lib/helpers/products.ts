import { Product, Variant } from "../routes/products";
import * as crypto from "crypto";
import * as admin from "firebase-admin";

/**
 * 
 */
export const createVariantsFromOptions = (
  product: Product,
  options1?: string[],
  options2?: string[],
  options3?: string[],
): Variant[] => {

  console.log(product);
  console.log(options1);
  console.log(options2);
  console.log(options3);
  let variants: Variant[] = [];

  if (options1?.length != 0 && options2?.length == 0 && options3?.length == 0) {
    options1?.forEach((v,i) => {
      variants.push({
        variant_id: "var_" + crypto.randomBytes(10).toString('hex'),
        product_id: product.id,
        sku: "",
        price: product.price,
        option1: v,
        option2: "",
        option3: "",
        quantity: product.quantity,
        updated_at: admin.firestore.Timestamp.now(),
        created_at: admin.firestore.Timestamp.now(),
      })
    })
  }

  if (options2?.length != 0) {
    options1?.forEach((one,i) => {
      options2?.forEach((two,i) => {
        console.log(one, two);
      });
    })
  }

  if (options3?.length != 0) {
    options1?.forEach((one,i) => {
      options2?.forEach((two,i) => {
        options3?.forEach((three,i) => {
          console.log(one, two, three)
        });
      });
    })
  }
  
  return variants;
}