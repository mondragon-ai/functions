import * as express from "express";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createDocument, getCollection, getDocument, updateDocument, updateSubcollectionDocumentWithID } from "../../firebase";
import { handleDataToChange } from "../helpers/firebase";
import * as crypto from "crypto";
import { Price } from "../types/customers";

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



interface Option {
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
    status?: string,
    updated_at?: string,
    image_url?: string,
    inventory?: number
  }


export interface Product {
  id?: string,
  title?: string,
  handle?: string,
  description?: string,
  status?: boolean,
  has_options?: boolean,
  created_at?: FirebaseFirestore.Timestamp | null,
  updated_at: FirebaseFirestore.Timestamp | null,
  has_recurring?: boolean,
  price?: Price,
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
  varaints?: Variant[]
}

export interface NewProduct {
  id?: string,
  title: string,
  handle: string,
  description?: string,
  status: boolean,
  has_options?: boolean,
  created_at?: FirebaseFirestore.Timestamp | null,
  updated_at?: FirebaseFirestore.Timestamp | null,
  has_recurring?: boolean,
  price: Price,
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
/**
 * All Product! related routes for the storefront API 
 * @param app 
 * @param db 
 */
export const productRoutes = async (app: express.Router, db: FirebaseFirestore.Firestore) => {

  /**
   * Test api
   */
  app.get("/products/test", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 💩. ";
    try {
        
      status = 200;
      text = "SUCCESS: Product created 💅🏽. ";
    } catch (e) {
      functions.logger.error(text + e)
        
    }
    res.status(status).json(text);
  });

  /**
   * Create a NEW Product! 
   * @param Product
   * @param FB_MERCHANT_UUID: string
   */
  app.post("/products/create", async (req: express.Request, res: express.Response) => {
    // Response data to update & send back
    let status = 500, 
    text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ",
    variants: Variant [] = [],
    PRODUCT_ID: string = "",
    product: NewProduct = req.body.new_data || null;
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID || "";

    try {
      // Push to primary DB
      PRODUCT_ID = await createDocument("merchants", FB_MERCHANT_UUID, "products", "", product);
      status = 200;
      text = "SUCCES: Product created 🧑🏻‍🍳.  " + "Product id: pro_" + PRODUCT_ID;

    } catch (e) {
      res.status(status).json(text);

    };

    const variants_length = product.variants?.length || 0;

    if (variants_length !== 0) {

      product.variants?.forEach((v,i) => {
        variants.push({
          ...v,
          variant_id: "var_" + crypto.randomBytes(10).toString('hex'),
          product_id: PRODUCT_ID
        })
      });
    }

    try {
      // Update Product Document in Primar DB 
      await updateDocument(
        {
          created_at: admin.firestore.Timestamp.now(),
          updated_at: admin.firestore.Timestamp.now(),
          variants: variants,
          id: `pro_${PRODUCT_ID}`
        },
        "merchants",
        FB_MERCHANT_UUID,
        "products",
        PRODUCT_ID
      );
      status = 200;
      text = "SUCCES: Product created 🧑🏻‍🍳. Product => " + `pro_${PRODUCT_ID}`;

    } catch (e) {
      res.status(status).json(text);
    };
    res.status(status).json(text);

  });

  /**
   * Update an existing Product
   * ! Param NEEDS TO BE passed as an array with the key: vlaue pair inside another array: [["title": "VIP CLub"], ...[...]]
   * @param FB_MERCHANT_UUID: string
   * @param FB_PRODUCT_UUID: string
   */
  app.put("/products/update", async (req: express.Request, res: express.Response) => {

    let status = 500, 
    text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ",
    PRODUCT_DATA: Product,
    FB_PRODUCT_UUID: string = req.body.product_uuid;
    FB_PRODUCT_UUID = FB_PRODUCT_UUID.substring(4);

    // Req Data: UUIDs
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;
    const REQUEST_DATA = req.body.update_data;

    // Helper Fn that returns PRODUCT_DATA to push to primary DB
    PRODUCT_DATA = handleDataToChange(REQUEST_DATA);
    PRODUCT_DATA = {
      ...PRODUCT_DATA,
      created_at: admin.firestore.Timestamp.now()
    }

    try {
      // Update primary DB
      await updateDocument(PRODUCT_DATA, "merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);

      // update Response
      status = 200;
      text = "SUCCES: Product updated 🧑🏻‍🍳.  Product Updated => " + FB_PRODUCT_UUID;

    } catch (e) {
      res.status(status).json(text);
    };
    res.status(status).json(text);

  });

  /**
   * Add images to an existing PRODUCT_UUID
   * @param NEEDS TO BE passed as an array with the key: vlaue pair inside another array: [["title": "VIP CLub"], ...[...]]
   * @param FB_MERCHANT_UUID: string
   * @param FB_PRODUCT_UUID: string
   * @param Image
   */
  app.post("/products/add/images", async (req: express.Request, res: express.Response) => {
    // text & status to send back to client
    let status = 500,
    text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ",
    IMAGE_DATA: Image[] = [],
    FB_PRODUCT_UUID: string = req.body.product_uuid || "";
    FB_PRODUCT_UUID = FB_PRODUCT_UUID.substring(4);

    // Req Data 
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;
    const REQUEST_DATA: Image = req.body.image_data;

    try {
      // Get PRODUCT_UUID product document
      const PRODUCT_DATA = await getDocument(
        "merchants",
        FB_MERCHANT_UUID,
        "products",
        FB_PRODUCT_UUID
      );

      if (PRODUCT_DATA) {
        // Get Images from PRODUCT_UUID_DOC 
        const IMAGES: Image[] = PRODUCT_DATA?.images || []

        // Append to new REQUEST_DATA
        IMAGE_DATA = [
          ...IMAGES,
        ];

        IMAGE_DATA.push({
          ...REQUEST_DATA,
          id: "img_" + crypto.randomBytes(10).toString('hex')
        })


        console.log(IMAGE_DATA);

      } else {
        // Send failed Response
        res.status(422).json("ERROR: Likely issue with fetching Product! -- Check Logs 👺. ");
      }
      
    } catch (e) {
      // Error
      res.status(status).json(text + " TRYING TO FETCH DOC. PRODUCTS.");
      
    }

    try {
      // Update primary DB
      await updateSubcollectionDocumentWithID(
        {
          images: IMAGE_DATA,
          updated_at: admin.firestore.Timestamp.now()
        },
        "merchants",
        FB_MERCHANT_UUID,
        "products",
        FB_PRODUCT_UUID
      );

      // Update Response
      status = 200;
      text = "SUCCES: Product image added 🧑🏻‍🍳. Image =>  " + IMAGE_DATA[IMAGE_DATA.length-1].id;

    } catch (e) {
      res.status(status).json(text  + " TRYING TO UPDATE DOC. PRODUCTS.");
    };
    // non 500 status
    res.status(status).json(text);

  });
  /**
   * Update an existing Product options for Variant![]
   * @param NEEDS TO BE passed as an array with the key: vlaue pair inside another array: [["title": "VIP CLub"], ...[...]]
   * @param FB_MERCHANT_UUID: string
   * @param FB_PRODUCT_UUID: string
   * @param Product
   */
   app.put("/products/update/options", async (req: express.Request, res: express.Response) => {
    // Default Status & Text for client
    let status = 500, text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ";

    // Req Data: UUIDs
    const FB_MERCHANT_UUID = req.body.FB_MERCHANT_UUID;

    // Req Data: Product Data to update
    let OPTIONS_DATA: Option[] = [],
    REQUEST_DATA: Option[] = req.body.update_data || null,
    FB_PRODUCT_UUID: string = req.body.product_uuid || "";
    FB_PRODUCT_UUID = FB_PRODUCT_UUID.substring(4);

    try {
      // Get PRODUCT_UUID product document
      const PRODUCT_DATA = await getDocument(
        "merchants",
        FB_MERCHANT_UUID,
        "products",
        FB_PRODUCT_UUID
      );
      OPTIONS_DATA = PRODUCT_DATA?.options || []

      if (PRODUCT_DATA) {

        // Append to DB options
        REQUEST_DATA.forEach((v, i) => {
          OPTIONS_DATA[i] = REQUEST_DATA[i]
        });

      } else {
        // Send failed Response
        res.status(422).json("ERROR: Likely issue with fetching Product! -- Check Logs 👺. ");
      }
      
    } catch (e) {
      // Error
      res.status(status).json(text + " TRYING TO FETCH DOC. PRODUCTS.");
      
    }

    // if option1 then [variants * options in option1]
    // if option1 && option2 then [variants * options in option1] * [variants * options in option2]
    // if option1 && option2 && option3 then [variants * options in option1] * [variants * options in option2] * [variants * options in option3]

    try {

      if (status != 422) {
        // Update primary DB
        await updateSubcollectionDocumentWithID(
          {
            options: OPTIONS_DATA
          },
          "merchants",
          FB_MERCHANT_UUID,
          "products",
          FB_PRODUCT_UUID
        );

        // update Response
        status = 200;
        text = "SUCCES: Product options updated 🧑🏻‍🍳.  ";

      }
    } catch (e) {
      res.status(status).json(text);
    };
    res.status(status).json(text);

  });
  

  /**
   * Update an existing Product variant for Variant![]
   * @param NEEDS TO BE passed as an array with the key: vlaue pair inside another array: [["title": "VIP CLub"], ...[...]]
   * @param FB_MERCHANT_UUID: string
   * @param FB_PRODUCT_UUID: string
   * @param inventory: string
   * @param image_url: string
   * @param title: string
   * @param option1: string
   * @param option2: string
   * @param option3: string
   * @param sku: string
   * @param status: string
   * @param price: number
   */
   app.put("/products/update/variants", async (req: express.Request, res: express.Response) => {
    // Default Status & Text for client
    let status = 500, text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ";

    // Req Data: UUIDs
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;
    const variant_uuid: string = req.body.variant_uuid;

    // Req Data: Product Data to update
    let VARIANTS_DATA: Variant[] = [],
    REQUEST_DATA: Variant = req.body.update_data || null,
    FB_PRODUCT_UUID: string = req.body.product_uuid || "";
    FB_PRODUCT_UUID = FB_PRODUCT_UUID.substring(4);

    try {
      // Get PRODUCT_UUID product document
      const PRODUCT_DATA = await getDocument("merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);
      VARIANTS_DATA = PRODUCT_DATA?.variants || []

      VARIANTS_DATA = VARIANTS_DATA.filter((v,i) => {
        return v.variant_id != variant_uuid
      });

      VARIANTS_DATA.push({
        ...REQUEST_DATA,
        variant_id: variant_uuid
      })
      
    } catch (e) {
      // Error
      res.status(status).json(text + " TRYING TO FETCH DOC. PRODUCTS.");
      
    }

    try {

      if (status != 422) {
        // Update primary DB
        await updateSubcollectionDocumentWithID({variants: VARIANTS_DATA}, "merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);

        // update Response
        status = 200;
        text = "SUCCES: Product options updated 🧑🏻‍🍳.  ";

      }
    } catch (e) {
      res.status(status).json(text);
    };
    res.status(status).json(text);

  });

  /**
   * Add an NEW Product Variant for Variant![]
   * @param NEEDS TO BE passed as an array with the key: vlaue pair inside another array: [["title": "VIP CLub"], ...[...]]
   * @param FB_MERCHANT_UUID: string
   * @param FB_PRODUCT_UUID: string
   * @param inventory: string
   * @param image_url: string
   * @param title: string
   * @param option1: string
   * @param option2: string
   * @param option3: string
   * @param sku: string
   * @param status: string
   * @param price: number
   */
   app.post("/products/add/variant", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ";
    // Req Data: UUIDs
    const FB_MERCHANT_UUID = "QilaBD5FGdnF9iX5K9k7";
    const FB_PRODUCT_UUID = "uC1REi9qh2Ku1orEbARL";

    // Req Data: Product Data to update
    let VARIANTS_DATA: Variant[] = []
    let REQUEST_DATA: Variant[] = [
      {
        compare_at: 900,
        price: 500,
        sku: "TESTSKU-UPDATE",
        variant_id: "var_08034098",
        status: "OUT_OF_STOCK",
        updated_at: "DATE",
        image_url: "",
        inventory: 1000, 
        option1: "M",
        option2: "B",
        option3: "N"
      }
    ];

    try {
      // Get PRODUCT_UUID product document
      const PRODUCT_DATA = await getDocument("merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);
      VARIANTS_DATA = PRODUCT_DATA?.variants || []

      if (PRODUCT_DATA) {

        // Append to DB list of Variants!
        VARIANTS_DATA = [
          ...VARIANTS_DATA,
          ...REQUEST_DATA,
        ]

      } else {
        // Send failed Response
        res.status(422).json("ERROR: Likely issue with fetching Product! -- Check Logs 👺. ");
      }
      
    } catch (e) {
      // Error
      res.status(status).json(text + " TRYING TO FETCH DOC. PRODUCTS.");
      
    }

    try {

      if (status != 422) {
        // Update primary DB
        await updateSubcollectionDocumentWithID({variants: VARIANTS_DATA}, "merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);

        // update Response
        status = 200;
        text = "SUCCES: Product options updated 🧑🏻‍🍳.  ";

      }
    } catch (e) {
      res.status(status).json(text);
    };
    res.status(status).json(text);

  });

  /**
   * Add an NEW Product Variant for Variant![]
   * @param NEEDS TO BE passed as an array with the key: vlaue pair inside another array: [["title": "VIP CLub"], ...[...]]
   * @param FB_MERCHANT_UUID: string
   * @param FB_PRODUCT_UUID?: string
   */
   app.post("/products", async (req: express.Request, res: express.Response) => {
    let status = 500,
    text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ",
    PRODUCTS: any[] = [],
    FB_PRODUCT_UUID: string = req.body.product_uuid || "";
    FB_PRODUCT_UUID = FB_PRODUCT_UUID.substring(4);

    // Req Data: UUIDs
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID || "";


    try {

      if (FB_PRODUCT_UUID != "") {
        
        // Get PRODUCT_UUID product document
        const PRODUCT_DATA = await getDocument("merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);

        PRODUCTS.push(PRODUCT_DATA);
        
        status = 200, text = "SUCCESS: Product returned 🥳. =>  " + PRODUCT_DATA?.id;

      } else {
        const PRODUCT_DATA = await getCollection("merchants", FB_MERCHANT_UUID, "products");

        PRODUCT_DATA.forEach((d)=> {
          console.log(d.data());

          PRODUCTS = [
            ...PRODUCTS,
            d.data()
          ];
          
        });

        console.log(PRODUCTS);
        status = 200, text = "SUCCESS: Products returned 🥳. ";
      }
      
    } catch (e) {
      // Error
      res.status(status).json(text + " TRYING TO FETCH DOC. PRODUCTS.");
      
    }
    res.status(status).json({m: text, d: PRODUCTS});

  });
}