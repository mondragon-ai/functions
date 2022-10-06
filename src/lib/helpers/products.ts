import * as crypto from "crypto";
import * as admin from "firebase-admin";
import { EcomReturn } from "../types/stripe";
import { NewProduct, Option, Product, Variant } from "../types/products";
import { createDocument, updateDocument } from "../../firebase";

/**
 * Create a list of variants from the options || single variant in instance of no options. 
 * @param product: Product
 * @param options1: string[]
 * @param options2: string[]
 * @param options3: string[]
 * @returns Variant[]
 */
export const createVariantsFromOptions = (
  product: Product | NewProduct,
  options1?: string[],
  options2?: string[],
  options3?: string[],
): Variant[] => {

  // Variant var instance returned
  let variants: Variant[] = [];

  // if only ONE option list exists, loop & create variants (ONE)
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
      });
    })
  }

  // if TWO option lists exists, loop & create variants (ONE * TWO)
  if (options1?.length != 0  && options2?.length != 0 &&  options3?.length == 0) {
    options1?.forEach((one,i) => {
      options2?.forEach((two,i) => {
        variants.push({
          variant_id: "var_" + crypto.randomBytes(10).toString('hex'),
          product_id: product.id,
          sku: "",
          price: product.price,
          option1: one,
          option2: two,
          option3: "",
          quantity: product.quantity,
          updated_at: admin.firestore.Timestamp.now(),
          created_at: admin.firestore.Timestamp.now(),
        });
      });
    })
  }

  // if TWO option lists exists, loop & create variants (ONE * TWO * THREE)
  if (options1?.length != 0  && options2?.length != 0 && options3?.length != 0) {
    options1?.forEach((one,i) => {
      options2?.forEach((two,i) => {
        options3?.forEach((three,i) => {
          variants.push({
            variant_id: "var_" + crypto.randomBytes(10).toString('hex'),
            product_id: product.id,
            sku: "",
            price: product.price,
            option1: one,
            option2: two,
            option3: three,
            quantity: product.quantity,
            updated_at: admin.firestore.Timestamp.now(),
            created_at: admin.firestore.Timestamp.now(),
          });
        });
      });
    })
  }
  return variants;
}

export const checkIfOptionWasCleared = (
  product: Product,
  NEW_option: Option[],
  OLD_option: Option[]
): Variant[] | [] => {
  // Vars to return
  let updated_variants: Variant[] = [];

  // NEW Options 1 - 3
  let new_options1 = NEW_option[0]?.option1 || [];
  let new_options2 = NEW_option[1]?.option2 || [];
  let new_options3 = NEW_option[2]?.option3 || [];

  // OLD Options 1 - 3
  let old_options1 = OLD_option[0]?.option1 || [];
  let old_options2 = OLD_option[1]?.option2 || [];
  let old_options3 = OLD_option[2]?.option3 || [];

  if (
    old_options3.length !== 0 && 
    new_options3.length == 0
  ) {
    updated_variants = [];
    updated_variants = createVariantsFromOptions(product,new_options1,new_options2,[]);
  }

  if (
    old_options2.length !== 0 && 
    new_options2.length == 0
  ) {
    updated_variants = [];
    updated_variants = createVariantsFromOptions(product,new_options1,[],[]);
  }

  if (
    old_options1.length !== 0 && 
    new_options1.length == 0
  ) {
    updated_variants = [];
    updated_variants.push({
      variant_id: "var_" + crypto.randomBytes(10).toString('hex'),
      product_id: product.id,
      sku: "",
      price: product.price,
      option1: "",
      option2: "",
      option3: "",
      quantity: product.quantity,
      updated_at: admin.firestore.Timestamp.now(),
      created_at: admin.firestore.Timestamp.now(),
    });
  }

  // Print Result
  console.log(" NEW Variant[] after option[1 || 2 || 3] Cleared ");
  console.log("-----------------------------------------------------");
  console.log(" NEW VARS: ", updated_variants.length);
  updated_variants.forEach((v,i) => {
    console.log(" " + (i > 10 ? ("0" + i) : i) + " VAR: ", v.variant_id);
  });
  console.log("-----------------------------------------------------\n\n");

  return updated_variants;

};

/**
 * Check existing variants against new 
 * @param DB_variants 
 * @param NEW_option 
 * @param is_updated 
 * @returns 
 */
export const checkExistingOptions = (
  DB_variants: Variant[],
  NEW_option: Option[],
  is_updated: boolean
): Variant[] | [] => {
  console.log(" Check Existing Options ");
  console.log("-----------------------------------------------------");
  // Vars to return
  let updated_variants: Variant[] = [];

  // NEW Options 1 - 3
  let new_options1 = NEW_option[0]?.option1 || [];
  let new_options2 = NEW_option[1]?.option2 || [];
  let new_options3 = NEW_option[2]?.option3 || [];
  console.log(new_options1);
  console.log(new_options2);
  console.log(new_options3);

  // All options options present, santitize current Variant[] against OLD & NEW options and update Variant[] to return
  if (
    new_options1.length != 0 &&
    new_options2.length == 0 &&
    new_options3.length == 0 &&
    !is_updated
  ) {

    // Count mostly for printing
    let t = 1;

    // Only update Variant[] that have existing valid pairs based on NEW Option[]
    console.log("\n\n Filter Variant[] against NEW options - 1");
    console.log("==============================================");

    // Loop through to only grab the variants with pairs that have valid pairs
    DB_variants.forEach((v,j) =>{
      new_options1.forEach((one) => {
        if (v.option1 == one) {
          updated_variants.push(v);
          console.log(` ${t++} %cVARS: [${v.option1}, ${v.option2}, ${v.option3}] - INDEX: ${j} ` , 'color: #bada55;');
        } else {
          console.log(` ${t++} %cVARS: [${v.option1}, ${v.option2}, ${v.option3}]  ` , 'color: red;');
        }
      });
    });

  }

  // All options options present, santitize current Variant[] against OLD & NEW options and update Variant[] to return
  if (
    new_options1.length != 0 &&
    new_options2.length != 0 &&
    new_options3.length == 0 &&
    !is_updated
  ) {

    // Count mostly for printing
    let t = 1;

    // Only update Variant[] that have existing valid pairs based on NEW Option[]
    console.log("\n\n Filter Variant[] against NEW options - 1-2");
    console.log("==============================================");

    // Loop through to only grab the variants with pairs that have valid pairs
    DB_variants.forEach((v,j) =>{
      new_options1.forEach((one) => {
        if (v.option1 == one) {
          new_options2.forEach((two) => {
            if (v.option2 == two) {
              updated_variants.push(v);
              console.log(` ${t++} ARS: [${v.option1}, ${v.option2}] - ` + (v.option2 == two));
            } else {
              console.log(` ${t++} VARS: [${v.option1}, ${v.option2}] - ` + (v.option2 == two));
            }
          });
        }
      });
    });

  }

  // All options options present, santitize current Variant[] against OLD & NEW options and update Variant[] to return
  if (
      new_options1.length != 0 &&
      new_options2.length != 0 &&
      new_options3.length != 0 &&
      !is_updated
    ) {

    // Count mostly for printing
    let t = 1;

    // Only update Variant[] that have existing valid pairs based on NEW Option[]
    console.log("\n\n Filter Variant[] against NEW options - 1-3");
    console.log("==============================================");

    // Loop through to only grab the variants with pairs that have valid pairs
    DB_variants.forEach((v,j) =>{
      new_options1.forEach((one) => {
        if (v.option1 == one) {
          new_options2.forEach((two) => {
            if (v.option2 == two) {
              new_options3.forEach((three) => {
                if (v.option3 == three) {
                  updated_variants.push(v);
                  console.log(` ${t++} %cVARS: [${v.option1}, ${v.option2}, ${v.option3}] - INDEX: ${j} ` , 'color: #bada55;');
                } else {
                  console.log(` ${t++} %cVARS: [${v.option1}, ${v.option2}, ${v.option3}]  ` , 'color: red;');
                }
              });
            }
          });
        }
      });
    });

  } 

  // Print Result
  console.log(" NEW Variant[] after option[1 || 2 || 3] checked ");
  console.log("-----------------------------------------------------");
  console.log(" REMAINING VARS: ", updated_variants.length);
  updated_variants.forEach((v,i) => {
    console.log(" " + (i < 9 ? ("0" + (i+1)) : i+1) + " REMAINING VAR: ", v.variant_id);
  });
  console.log("-----------------------------------------------------\n\n");

  return updated_variants;
};


export const findNewOptions = (
  NEW_OPTIONS: Option[] | [],
  OLD_OPTIONS: Option[] | [],
): Option[] => {
  // Variant[] var instance to be returned
  let add_options: Option[] = [];

  // New Option var instances
  const new_options1 = NEW_OPTIONS[0]?.option1 || [];
  const new_options2 = NEW_OPTIONS[1]?.option2 || [];
  const new_options3 = NEW_OPTIONS[2]?.option3 || [];

  // New Option var instances
  const old_options1 = OLD_OPTIONS[0]?.option1 || [];
  const old_options2 = OLD_OPTIONS[1]?.option2 || [];
  const old_options3 = OLD_OPTIONS[2]?.option3 || [];

  let add_options1: string[] = [];
  let add_options2: string[] = [];
  let add_options3: string[] = [];

  // Count mostly for printing
  let t = 1;

  // If NEW Option[] is appended Option(s) on the existing Option[]
  if (new_options1.length > old_options1.length) {
    console.log("\n\n 310: NEW > OLD - Options One ");
    console.log("----------------------------------------------------");

    // Loop through new options
    new_options1?.forEach((n,i) => {
      let EXISTS = true;

      // Cross check current options. This will produce multiple FALSE !EXISTS
      old_options1?.forEach((o,k) => {
        console.log(" INITAL CHECK: [" + n + ", " + o + "] - " + (n != o));
        if (n != o) {
          EXISTS = false;
        } else {
          EXISTS = true;
        }
      });

      // Filtering potential FALSE !EXISTS
      if (!EXISTS) { 
        console.log(" \n 176: " +  n + " !EXISTS ");
        console.log("----------------------------------------------------");

        // Check
        old_options1?.forEach(s => {
          console.log(" !EXISTS QA CHECK: [" + n + ", " + s + "] - " + (n != s));
          if (n != s) {
          } else {
            EXISTS = true;
          }
        });

        // if the NEW option does not exist then append 
        if (!EXISTS) {
          add_options1.push(n);
        }
      } else {}
      console.log("----------------------------------------------------");
      console.log("\n " + (t++) + " 189: OPTIONS ARRAY: " + add_options1 || []);
      console.log("----------------------------------------------------");

    });

  } 

  // If NEW Option[] is appended Option(s) on the existing Option[]
  if (new_options2.length > old_options2.length) {
    console.log("\n\n 360: NEW > OLD - Options Two ");
    console.log("----------------------------------------------------");

    // Loop through new options
    new_options2?.forEach((n,i) => {
      let EXISTS = true;

      // Cross check current options. This will produce multiple FALSE !EXISTS
      old_options2?.forEach((o,k) => {
        console.log(" INITAL CHECK: [" + n + ", " + o + "] - " + (n != o));
        if (n != o) {
          EXISTS = false;
        } else {
          EXISTS = true;
        }
      });

      // Filtering potential FALSE !EXISTS
      if (!EXISTS) { 
        console.log(" \n 176: " +  n + " !EXISTS ");
        console.log("----------------------------------------------------");

        // Check
        old_options2?.forEach(s => {
          console.log(" !EXISTS QA CHECK: [" + n + ", " + s + "] - " + (n != s));
          if (n != s) {
          } else {
            EXISTS = true;
          }
        });

        // if the NEW option does not exist then append 
        if (!EXISTS) {
          add_options2.push(n);
        }
      } else {}
      console.log("----------------------------------------------------");
      console.log("\n " + (t++) + " 189: OPTIONS ARRAY: " + add_options2);
      console.log("----------------------------------------------------");

    });

  } 

  // If NEW Option[] is appended Option(s) on the existing Option[]
  if (new_options3.length > old_options3.length) {
    console.log("\n\n 406: NEW > OLD - Options Three ");
    console.log("----------------------------------------------------");

    // Loop through new options
    new_options3?.forEach((n,i) => {
      let EXISTS = false;

      // Cross check current options. This will produce multiple FALSE !EXISTS
      old_options3?.forEach((o,k) => {
        console.log(" INITAL CHECK: [" + n + ", " + o + "] - " + (n != o));
        if (n != o) {
          EXISTS = false;
        } else {
          EXISTS = true;
        }
      });

      // Filtering potential FALSE !EXISTS
      if (!EXISTS) { 
        console.log(" \n 176: " +  n + " !EXISTS ");
        console.log("----------------------------------------------------");

        // Check
        old_options3?.forEach(s => {
          console.log(" !EXISTS QA CHECK: [" + n + ", " + s + "] - " + (n != s));
          if (n != s) {
          } else {
            EXISTS = true;
          }
        });

        // if the NEW option does not exist then append 
        if (!EXISTS) {
          add_options3.push(n);
        }
      } else {}
      console.log("----------------------------------------------------");
      console.log("\n " + (t++) + " 189: OPTIONS ARRAY: " + add_options3 || []);
      console.log("----------------------------------------------------");

    });

  } 

  add_options = [
    {option1: add_options1},
    {option2: add_options2},
    {option3: add_options3}
  ]


  return add_options;
};

/**
 * TODO: Crate helper fn to filter 
 * Handle new options added, removed, lists of options appended, removed, etc. 
 * @param product: Product
 * @param REQUEST_DATA: Option[] | []
 * @param old_options1: string[] 
 * @param old_options2: string[]  
 * @param old_options3: string[] 
 * @returns Variant[]
 */
 export const handleNewOptions = (
  product: Product,
  NEW_OPTIONS: Option[] | [],
  OLD_OPTIONS: Option[] | [],
): Variant[] => {

  // Variant[] from current product being updated
  let DB_variants: Variant[] = product.variants || [];

  // Variant[] var instance to be returned
  let updated_variants: Variant[] = [];

  // New Option var instances
  const new_options1 = NEW_OPTIONS[0]?.option1 || [];
  const new_options2 = NEW_OPTIONS[1]?.option2 || [];
  const new_options3 = NEW_OPTIONS[2]?.option3 || [];

  // Check if varaints_updated
  let is_updated: boolean = false;

  // Check if option was cleared
  updated_variants = checkIfOptionWasCleared(product, NEW_OPTIONS, OLD_OPTIONS);

  // Check if updated 
  is_updated = updated_variants.length > 0 ? true : false

  if (!is_updated) {
    // if not cleared, find existing option pairs
    updated_variants = checkExistingOptions(DB_variants, NEW_OPTIONS, is_updated);
    console.log(updated_variants);
  }

  // Check if new options exists
  const addtionalOptions = findNewOptions(NEW_OPTIONS, OLD_OPTIONS);

  // Creatae new variants and append to current existing list
  addtionalOptions.forEach(v => {
    if (v.option1?.length != 0) {
      // Create otpions from new option/s
      const result = createVariantsFromOptions(product,v.option1,new_options2,new_options3);

      console.log(" New Variants From Option One: ");
      console.log("--------------------------------------");
      console.log(" " + result.length);

      // Push new updates to the Variant[] being returned
      result.forEach(v => updated_variants.push(v));

    }

    if (v.option2?.length != 0) {
      // Create otpions from new option/s
      const result = createVariantsFromOptions(product,new_options1,v.option2,new_options3);

      console.log(" New Variants From Option Two: ");
      console.log("--------------------------------------");
      console.log(" " + result.length);

      // Push new updates to the Variant[] being returned
      result.forEach(v => updated_variants.push(v));

    }

    if (v.option3?.length != 0) {
      // Create otpions from new option/s
      const result = createVariantsFromOptions(product,new_options1,new_options2,v.option3);

      console.log(" New Variants From Option Three: ");
      console.log("--------------------------------------");
      console.log(" " + result.length);

      // Push new updates to the Variant[] being returned
      result.forEach(v => updated_variants.push(v));

    }
  });

  return updated_variants;
}

export const createNewProduct = async (
  FB_MERCHANT_UUID: string,
  product: NewProduct,
): Promise<EcomReturn> => {

  // Status/text to send back to client 
  let status: number = 500, text: string = "ERROR: Likely internal 🥲."

  // variants (created front end based on options) if any.
  let variants: Variant[] = [];

  // NEW pro_uuid
  let PRODUCT_ID: string = "";


  let product_data: Product = {
    updated_at: admin.firestore.Timestamp.now(),
    created_at: admin.firestore.Timestamp.now(),
  };

  try {
    // Push to primary DB
    PRODUCT_ID = await createDocument("merchants", FB_MERCHANT_UUID, "products", "", product);
    status = 200;
    text = "SUCCES: Product created 🧑🏻‍🍳.  " + "Product id: pro_" + PRODUCT_ID;

  } catch (e) {
    text = text + " - Creating product document";

  };

  // Check to see if variants exists
  const variants_length = product.variants?.length || 0;

  if (variants_length !== 0) {
    // Give new var_uuid rom the list created by the options (FROM FRONT END LOGIC)
    product.variants?.forEach((v,i) => {
      variants.push({
        ...v,
        variant_id: "var_" + crypto.randomBytes(10).toString('hex'),
        product_id: PRODUCT_ID,
        compare_at: product.compare_at || 0,
        price: product.price || 0,
      })
    });
    
  } else {
    // Create a single variant w/ var_uuid
    variants.push({
      inventory: product.quantity,
      variant_id: "var_" + crypto.randomBytes(10).toString('hex'),
      product_id: PRODUCT_ID,
      compare_at: product.compare_at || 0,
      price: product.price || 0,
      updated_at: admin.firestore.Timestamp.now(),
      created_at: admin.firestore.Timestamp.now(),
    });
  }

  // Check if on sale and create NEW sale price & compare price
  if (product.on_sale) {
    product_data = {
      ...product_data,
      compare_at: product.compare_at || 0,
      price: product.price || 0,
      updated_at: admin.firestore.Timestamp.now(),
      created_at: admin.firestore.Timestamp.now(),
    }
  };

  // Finalize data to push to DB sanitized w/ uuid
  product_data = {
    ...product_data,
    variants: variants,
    id: `pro_${PRODUCT_ID}`
  }

  try {
    // Update Product Document in Primary DB 
    await updateDocument(
      product_data,
      "merchants",
      FB_MERCHANT_UUID,
      "products",
      PRODUCT_ID
    );

    status = 200;
    text = "SUCCES: Product created 🧑🏻‍🍳. Product => " + `pro_${PRODUCT_ID}`;

  } catch (e) {
    text = text + "Updating Document => " + PRODUCT_ID

  };

  return {
    text: text,
    status: status,
    data: {
      document_id: PRODUCT_ID
    }
  }
};