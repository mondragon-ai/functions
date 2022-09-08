import * as express from "express";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  deleteDocumentWithID,
  getCollection,
  getDocument,
  updateDocument,
} from "../../firebase";
import { handleDataToChange } from "../helpers/firebase";
import * as crypto from "crypto";
import {
  createNewProduct,
  createVariantsFromOptions,
  handleNewOptions
} from "../helpers/products";
import {
  Image,
  NewProduct,
  Option,
  Product,
  Variant
} from "../types/products";

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
   * Create a NEW Product in the primary DB. 
   * ? Create product isntance in Stripe/Square?
   * @param new_data: Product
   * @param FB_MERCHANT_UUID: string
   */
  app.post("/products/create", async (req: express.Request, res: express.Response) => {
    // Response data to update & send back
    let status = 500, 
    text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ";

    // Data to send back to client
    const product: NewProduct = req.body.new_data || null;
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;

    // new product data sanitized and pushed to primary DB
    const result = await createNewProduct(FB_MERCHANT_UUID, product);

    // update 
    status = result.status;
    text = result.text;

    res.status(status).json(text);

  });

  /**
   * Update an existing Product Param NEEDS TO BE passed as an array with the key: vlaue pair inside another array: [["title": "VIP CLub"], ...[...]]
   * @param FB_MERCHANT_UUID: string
   * @param product_uuid: string
   * @param product_uuid: string
   * @param update_data: [ ...["key", "value"]]
   */
  app.put("/products/update", async (req: express.Request, res: express.Response) => {
    // status/text to send back to client
    let status = 500, 
    text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ";

    // Get FB_UUID for product docuemtn
    let FB_PRODUCT_UUID: string = req.body.product_uuid;
    FB_PRODUCT_UUID = FB_PRODUCT_UUID.substring(4);

    // Req Data: UUIDs & data to update
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;
    const REQUEST_DATA = req.body.update_data;

    // Helper fn that santizes input data && returns Product Obj to push to primary DB
    let PRODUCT_DATA: Product = handleDataToChange(REQUEST_DATA);

    // Update document time
    PRODUCT_DATA = {
      ...PRODUCT_DATA,
      updated_at: admin.firestore.Timestamp.now()
    }

    try {
      // Update docuemtn in primary DB
      await updateDocument(PRODUCT_DATA, "merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);

      // Update response
      status = 200;
      text = "SUCCES: Product updated 🧑🏻‍🍳.  Product Updated => " + FB_PRODUCT_UUID;

    } catch (e) {
      res.status(status).json(text);
    };
    res.status(status).json(text);

  });

  /**
   * Add images to an existing product document from primary DB
   * TODO: store image in storage bucket & paste URL
   * @param FB_MERCHANT_UUID: string
   * @param product_uuid: string
   * @param image_data: Image
   */
  app.post("/products/add/images", async (req: express.Request, res: express.Response) => {
    // text & status to send back to client
    let status = 500,
    text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ";

    // Image Data
    let IMAGE_DATA: Image[] = [];

    // Get FB_UUID for product document
    let FB_PRODUCT_UUID: string = req.body.product_uuid || "";
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

        // Append to Image[] from product document from primary DB
        IMAGE_DATA = [
          ...IMAGES,
        ];

        // Append to NEW Image[] to pusht to primary DB
        IMAGE_DATA.push({
          ...REQUEST_DATA,
          id: "img_" + crypto.randomBytes(10).toString('hex')
        })

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
      await updateDocument(
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
    res.status(status).json(text);

  });
  /**
   * Update an existing Product options for Variant[]
   * @param FB_MERCHANT_UUID: string
   * @param product_uuid: string
   * @param update_data: Option[]
   */
   app.put("/products/update/options", async (req: express.Request, res: express.Response) => {
    // Default Status & Text for client
    let status = 500, text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ";

    // Req Data: UUIDs
    const FB_MERCHANT_UUID = req.body.FB_MERCHANT_UUID;

    // Req Data: Product Data to update
    let OPTIONS_DATA: Option[] = [];
    let REQUEST_DATA: Option[] = req.body.update_data || null;

    // Product Data fetched 
    let PRODUCT_DATA: any; // ! CAN BE INPUTED
    // TODO: Create logic to check if fetchign product is necessary
    // PRODUCT_OPTIONS: Options[] = []

    // Get FB-UUID for the 
    let FB_PRODUCT_UUID: string = req.body.product_uuid || "";
    FB_PRODUCT_UUID = FB_PRODUCT_UUID.substring(4);

    try {
      // ? CHECK IF NEED PRODUCT FETHCED FROM INPUT
      // Get PRODUCT_UUID product document
      PRODUCT_DATA = await getDocument(
        "merchants",
        FB_MERCHANT_UUID,
        "products",
        FB_PRODUCT_UUID
      );
      OPTIONS_DATA = PRODUCT_DATA?.options || [];
      
    } catch (e) {
      // Error
      res.status(status).json(text + " TRYING TO FETCH DOC. PRODUCTS.");
      
    }

    // Variant List to push to DB from the new Options
    let variants: Variant[] = [];

    // If options dont exist create single variant
    if (!PRODUCT_DATA.options) {

      // if option1 then [variants * options in option1]
      const result = createVariantsFromOptions(
        PRODUCT_DATA,
        REQUEST_DATA[0]?.option1 || [],
        REQUEST_DATA[1]?.option2 || [],
        REQUEST_DATA[2]?.option3 || [],
      );
      variants = result;

    } else { // Handle new options submitted || create new
      const result = handleNewOptions(
        PRODUCT_DATA,
        REQUEST_DATA,
        OPTIONS_DATA,
      );
      variants = result;

    }
    try {

      if (status != 422) {
        console.log(variants)
        // Update primary DB
        await updateDocument(
          {
            options: REQUEST_DATA,
            variants: variants
          },
          "merchants", FB_MERCHANT_UUID,
          "products", FB_PRODUCT_UUID
        );

        // update Response
        status = 200;
        text = "SUCCES: Product options updated 🧑🏻‍🍳.  =>  pro_" + FB_PRODUCT_UUID;

      }
    } catch (e) {
      res.status(status).json(text);
    };
    res.status(status).json(text);

  });
  

  /**
   * Update an existing Product variant for Variant![]
   * @param FB_MERCHANT_UUID: string
   * @param product_uuid: string
   * @param variant_uuid: string
   * @param update_data: Variant
   */
   app.put("/products/update/variants", async (req: express.Request, res: express.Response) => {
    // Default Status & Text for client
    let status = 500, text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ";

    // Req Data: UUIDs
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;
    const variant_uuid: string = req.body.variant_uuid;

    // Get the FB_UUID for the product document
    let FB_PRODUCT_UUID: string = req.body.product_uuid || "";
    FB_PRODUCT_UUID = FB_PRODUCT_UUID.substring(4);

    // Variant[] to be pushed to the primary DB || from Client
    let VARIANTS_DATA: Variant[] = [];

    // Req Data: Product Data to update
    let REQUEST_DATA: Variant = req.body.update_data || null;

    //TODO: Check if fetching is necessary
    try {
      // Get product document
      const PRODUCT_DATA = await getDocument("merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);


      VARIANTS_DATA = PRODUCT_DATA?.variants || []

    } catch (e) {
      // Error
      res.status(status).json(text + " TRYING TO FETCH DOC. PRODUCTS.");
      
    }

    let index: number = 0
    let variant: Variant = {};

    // Find Var w/ uuid from Varaint[]
    VARIANTS_DATA.forEach((v,i) => {
      if (v.variant_id == variant_uuid) {
        variant = {
          ...v
        }
        index = i;

       console.log(" INDEX: ",index);
      } else {}
    });

    // Replace index with updated + old info
    VARIANTS_DATA[index] = {
      ...variant,
      ...REQUEST_DATA,
      variant_id: variant_uuid
    }

    try {

      if (status != 422) {
        // Update primary DB
        await updateDocument(
          {
            updated_at: admin.firestore.Timestamp.now(),
            variants: VARIANTS_DATA
          },
          "merchants", FB_MERCHANT_UUID,
          "products", FB_PRODUCT_UUID);

        // update Response
        status = 200;
        text = "SUCCES: Product options updated 🧑🏻‍🍳.  => pro_" 
              + FB_PRODUCT_UUID + " && var_" + variant_uuid;

      }
    } catch (e) {
      res.status(status).json(text);
    };
    res.status(status).json(text);

  });

  /**
   * ! SHOULD BE HANDLED WITH OPTIONS OR UPDATE
   * Add an NEW Product Variant for Variant![]
   * @param NEEDS TO BE passed as an array with the key: vlaue pair inside another array: [["title": "VIP CLub"], ...[...]]
   * @param FB_MERCHANT_UUID: string
   * @param FB_PRODUCT_UUID: string
   * @param update_data: Variant
   */
   app.post("/products/add/variant", async (req: express.Request, res: express.Response) => {
    // let status = 500, text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ";
    // Req Data: UUIDs
    // const FB_MERCHANT_UUID = "QilaBD5FGdnF9iX5K9k7";
    // const FB_PRODUCT_UUID = "uC1REi9qh2Ku1orEbARL";

    // // Req Data: Product Data to update
    // let VARIANTS_DATA: Variant[] = []
    // let REQUEST_DATA: Variant[] = [
    //   {
    //     compare_at: 900,
    //     price: 500,
    //     sku: "TESTSKU-UPDATE",
    //     variant_id: "var_08034098",
    //     // status: "OUT_OF_STOCK",
    //     updated_at: admin.firestore.Timestamp.now(),
    //     image_url: "",
    //     inventory: 1000, 
    //     option1: "M",
    //     option2: "B",
    //     option3: "N"
    //   }
    // ];

    // try {
    //   // Get PRODUCT_UUID product document
    //   const PRODUCT_DATA = await getDocument("merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);
    //   VARIANTS_DATA = PRODUCT_DATA?.variants || []

    //   if (PRODUCT_DATA) {

    //     // Append to DB list of Variants!
    //     VARIANTS_DATA = [
    //       ...VARIANTS_DATA,
    //       ...REQUEST_DATA,
    //     ]

    //   } else {
    //     // Send failed Response
    //     res.status(422).json("ERROR: Likely issue with fetching Product! -- Check Logs 👺. ");
    //   }
      
    // } catch (e) {
    //   // Error
    //   res.status(status).json(text + " TRYING TO FETCH DOC. PRODUCTS.");
      
    // }

    // try {

    //   if (status != 422) {
    //     // Update primary DB
    //     await updateSubcollectionDocumentWithID({variants: VARIANTS_DATA}, "merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);

    //     // update Response
    //     status = 200;
    //     text = "SUCCES: Product options updated 🧑🏻‍🍳.  ";

    //   }
    // } catch (e) {
    //   res.status(status).json(text);
    // };
    // res.status(status).json(text);

  });

  app.delete("/products/delete/variant", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal - Check product logs 🤕. ";

    // Req uuid used to delete document 
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;
    const FB_PRODUCT_UUID: string = req.body.product_uuid;
    const var_uuid: string = req.body.variant_uuid;

    let product: FirebaseFirestore.DocumentData | undefined = {};
    let variants: Variant[] = [];

    try {
      // Delete document in primary DB
      product = await getDocument("merchants",FB_MERCHANT_UUID,"products",FB_PRODUCT_UUID.substring(4));
    } catch (e) {
      text = text + " Fetching document from primary DB"
    }

    if (product != undefined) {
      variants = product.variants;

      variants = variants?.filter((v,i) => {
        return var_uuid != v.variant_id
      })
      
      status = 200;
      text = "SUCCESS: Product variant deleted. ⛹🏻‍♀️ " 
      +  FB_PRODUCT_UUID + " New variant total: " + variants?.length ; 
    }
    
    const product_updated: Product = {
      variants: variants,
      updated_at: admin.firestore.Timestamp.now()
    }
    try {
      await updateDocument(product_updated,
         "merchants", FB_MERCHANT_UUID,
         "products", FB_PRODUCT_UUID.substring(4))
    } catch (e) {
      text = text + " Deleting variant from document in primary DB"
    }

    res.status(status).json(text);
  } );


  app.delete("/products/delete", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal - Check product logs 🤕. ";

    // Req uuid used to delete document 
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;
    const FB_PRODUCT_UUID: string = req.body.product_uuid;

    try {
      // Delete document in primary DB
      await deleteDocumentWithID("merchants",FB_MERCHANT_UUID,"products",FB_PRODUCT_UUID.substring(4));
    } catch (e) {
      text = text + " Deleting document from primary DB"
    }

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