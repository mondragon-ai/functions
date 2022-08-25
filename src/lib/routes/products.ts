import * as express from "express";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createDocument, getDocument, updateDocument, updateSubcollectionDocumentWithID } from "../../firebase";
import { handleDataToChange } from "../helpers/firebase";
// import { createDocument,
//     deleteDocumentWithID,
//     updateCustomerDocumentWithID,
//     updateDocument 
// } from "../../firebase";
import * as crypto from "crypto";

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
   * @param title: string
   * @param description: string
   * @param images: Image![]
   * @param hasOption: boolean
   * @param status: string
   * @param variants: Variant![]
   * @param FB_MERCHANT_UUID: string
   */
  app.post("/products/create", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ";
    const FB_MERCHANT_UUID = "QilaBD5FGdnF9iX5K9k7";
    const PRODUCT_ID =  "pro_" + Math.floor(100000000 + Math.random() * 9000000000);
    const PRODUCT_DATA = {
      id: PRODUCT_ID,
      title: "VIP Club",
      handle: "vip-club",
      description: "",
      status: false,
      hasOptions: true,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now(),
      taxable: false,
      requires_shipping: true,
      // options: [
      //   {option1: ["SMALL", "MEDIUM", "LARGE", "XLARGE", "2XLARGE", "3XLARGE"]},
      //   {option2: ["BROWN", "WHITE", "BLACK", "RED"]},
      //   {option3: ["SLEVES", "SLEVELESS"]},
      // ],
      inventory_polocy: {
        over_sold: true,
      },
      dimentations: {
        weight: 1,
        length: "",
        width: ""
      },
      variants: [
        {
          product_id: PRODUCT_ID,
          variant_id: "var_" + Math.floor(100000000 + Math.random() * 9000000000),
          sku: "TESTSKU-MAIN",
          compare_at: 9000,
          price: 1000,
          option1: "MEDIUM",
          option2: "WHITE",
          option3: "SLEVELESS"
        }
      ]
    };

    try {

      const result = await createDocument("merchants", FB_MERCHANT_UUID, "products", PRODUCT_DATA);
      console.log(result);
      status = 200;
      text = "SUCCES: Product created 🧑🏻‍🍳.  ";
    } catch (e) {
      res.status(status).json(text);
    };
    res.status(status).json(text);

  });

  /**
   * Update an existing Product
   * @param NEEDS TO BE passed as an array with the key: vlaue pair inside another array: [["title": "VIP CLub"], ...[...]]
   * @param FB_MERCHANT_UUID: string
   * @param FB_PRODUCT_UUID: string
   * @param title: string
   * @param description: string
   * @param hasOption: boolean
   * @param status: string
   */
  app.put("/products/update", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ";
    // Req Data: UUIDs
    const FB_MERCHANT_UUID = "QilaBD5FGdnF9iX5K9k7";
    const FB_PRODUCT_UUID = "uC1REi9qh2Ku1orEbARL";

    // Req Data: Product Data to update
    const REQUEST_DATA = [
      ["title", "VIP Club"],
      ["handle", "vip-club"],
      ["description", ""],
      ["status", true],
      ["hasOptions", true],
      ["updated_at", `${admin.firestore.Timestamp.now()}`]
    ];

    // Helper Fn that returns PRODUCT_DATA to push to primary DB
    const PRODUCT_DATA = handleDataToChange(REQUEST_DATA);

    try {
      // Update primary DB
      await updateDocument(PRODUCT_DATA, "merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);

      // update Response
      status = 200;
      text = "SUCCES: Product updated 🧑🏻‍🍳.  ";
    } catch (e) {
      res.status(status).json(text);
    };
    res.status(status).json(text);

  });

  interface Image {
    id: string,
    src: string,
    alt_text: string,
    height: number,
    width: number,
  }

  /**
   * Add images to an existing PRODUCT_UUID
   * @param NEEDS TO BE passed as an array with the key: vlaue pair inside another array: [["title": "VIP CLub"], ...[...]]
   * @param FB_MERCHANT_UUID: string
   * @param FB_PRODUCT_UUID: string
   * @param images: Image!
   * @param title: string
   * @param description: string
   * @param hasOption: boolean
   * @param status: string
   * @param variants: Variant![]
   */
  app.post("/products/add/images", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 🤦🏻‍♂️. ";

    // Req Data: UUIDs
    const FB_MERCHANT_UUID = "QilaBD5FGdnF9iX5K9k7";
    const FB_PRODUCT_UUID = "uC1REi9qh2Ku1orEbARL";

    // Req Data: Product Data to update
    let IMAGE_DATA = [
      {
        id: "pimg_" + crypto.randomUUID(),
        src: "", 
        alt_text: "EMPTY",
        height: 60,
        width: 100,
      }
    ];

    try {
      // Get PRODUCT_UUID product document
      const PRODUCT_DATA = await getDocument("merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);

      console.log("186: ", PRODUCT_DATA);

      if (PRODUCT_DATA) {
        // Get Images from PRODUCT_UUID_DOC 
        const IMAGES: Image[] = PRODUCT_DATA.images

        // Append to new REQUEST_DATA
        IMAGE_DATA = [
          ...IMAGE_DATA,
          ...IMAGES
        ]
        // 
        console.log("198: ", IMAGES);

        status = 200, text = "SUCCES: Product image added 🧑🏻‍🍳.  ";

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
      await updateSubcollectionDocumentWithID({images: IMAGE_DATA}, "merchants", FB_MERCHANT_UUID, "products", FB_PRODUCT_UUID);

      // Update Response
      status = 200;
      text = "SUCCES: Product image added 🧑🏻‍🍳.  ";
    } catch (e) {
      // Error
      res.status(status).json(text);
    };
    // non 500 status
    res.status(status).json(text);

  });
}