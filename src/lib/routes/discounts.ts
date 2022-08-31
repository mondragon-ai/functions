import * as express from "express";
import * as admin from "firebase-admin";
import {
  createDocument,
  deleteDocumentWithID,
  getDiscountWithCode,
  getDocument,
  updateSubcollectionDocumentWithID
} from "../../firebase";
import { addDiscountToCart } from "../helpers/discounts";
import {
  // DiscountPreReqs,
  Discount
} from "../types/discounts";

/**
 * All discount related api routes
 * @param app 
 */
export const discountRoutes = async (app: express.Router) => {

  app.post("/discounts/test", (req: express.Request, res: express.Response) => {
    let status = 200, text = "SUCCESS 🔥";
    res.status(status).json(text);
  });

  /**
   * Create NEW discount object! 
   * @param FB_MERCHANT_UUID: string
   * @param FB_CART_UUID: string
   * @param FB_DISCOUNT_UUID: string  
   */
   app.post("/discounts/create", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 😓. ";
    let DISCOUNT: Discount;

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = "QilaBD5FGdnF9iX5K9k7";
    let FB_DISCOUNT_UUID: string = "";

    DISCOUNT = {
      created_at: `${admin.firestore.Timestamp.now()}`,
      updated_at: `${admin.firestore.Timestamp.now()}`,
      value_type: "FIXED",
      automatic_type: "TAGS",
      type: "CART",
      status: false,
      isAutomatic: true,
      code: "",
      once_per_customer: false,
      usage_limit: 1000,
      all_products: true,
      pre_reqs: {
        customer_tags: ["VIP_MEMBER"],
        variant_ids: [""],
        collections:[""],
        sub_total: 0,
        goal_target: 10000
      },
      entitled: {
        customer_tags: ["VIP_MEMBER"],
        line_items: [
          {
            variant_id: "var_jojn039j20KJ302", 
            title: "Gas Card",
            price: 900,
            has_discount: true,
            applied_discount: 100,
            isHighRisk: false,
            quantity: 1
          }
        ],
        collections:[""],
      },
      omitted: {
        customer_tags: [""],
        line_items: [],
        collections:[""],
      },
    }

    // Fetch Cart Object 
    try {
      FB_DISCOUNT_UUID = await createDocument("merchants", FB_MERCHANT_UUID, "discounts", "", DISCOUNT);
    } catch (e) {
      status = 422, text = "ERROR: Likely internal -- Check Logs 😓. GETTING CART DOCUMENT.";
    }

    // Update cart document
    try {
      await updateSubcollectionDocumentWithID({id: "dis_" + FB_DISCOUNT_UUID}, "merchants", FB_MERCHANT_UUID, "discounts", FB_DISCOUNT_UUID);
      status = 200, text = "SUCCESS: Draft order created 🔥. ";
    } catch (e) {
      status = 422, text = "ERROR: Likely internal -- Check Logs 😓. GETTING DOCUMENT.";
    }
    res.status(status).json(text);

   });

  /**
   * Link discount with an existing Cart! 
   * @param FB_MERCHANT_UUID: string
   * @param FB_CART_UUID: string
   * @param FB_DISCOUNT_UUID: string  
   */
   app.post("/discounts/add-discount", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 😓. ";
    let customer_cart, discount;

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = "QilaBD5FGdnF9iX5K9k7";
    const FB_CART_UUID: string = "iBXkOR1TI7rH0dMzZZDr";
    const FB_DISCOUNT_UUID: string = "zfWAj266AK4fy5vIdQ4a";
    let CUSTOMER_ID: string = "cus_"+ "3uodpXUJNbYY6Yhj3qBF"; 
    CUSTOMER_ID = CUSTOMER_ID.substring(4);

    try {
      // Fetch Cart Object 
      customer_cart = await getDocument(
        "merchants", 
        FB_MERCHANT_UUID, 
        "carts", 
        FB_CART_UUID);
    } catch (e) {
      status = 422, text = "ERROR: Likely internal -- Check Logs 😓. GETTING CART DOCUMENT.";
    }

    try {
      // Fetch Discount Object
      discount = await getDocument(
        "merchants", 
        FB_MERCHANT_UUID, 
        "carts", 
        FB_DISCOUNT_UUID);
    } catch (e) {
      status = 422, text = "ERROR: Likely internal -- Check Logs 😓. GETTING DISCOUNT DOCUMENT.";
    }

    // Helper Function to handle {CART || LINEITEM}
    customer_cart = addDiscountToCart(customer_cart || {}, discount || {});

    try {
      // Update cart document
      await updateSubcollectionDocumentWithID(
        customer_cart,
        "merchants",
        FB_MERCHANT_UUID,
        "carts",
        FB_CART_UUID);
      status = 200, text = "SUCCESS: Draft order created 🔥. ";
    } catch (e) {
      status = 422, text = "ERROR: Likely internal -- Check Logs 😓. GETTING DOCUMENT.";
    }

    res.status(status).json(text);
   });

  /**
   * Delete Discount with an ID! 
   * @param FB_MERCHANT_UUID: string
   * @param FB_DISCOUNT_UUID: string  
   */
   app.delete("/discounts/delete", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 😓. ";

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = "QilaBD5FGdnF9iX5K9k7";
    let FB_DISCOUNT_UUID: string = "dis_" + "zfWAj266AK4fy5vIdQ4a";
    FB_DISCOUNT_UUID = FB_DISCOUNT_UUID.substring(4);

    // Update cart document
    try {
      await deleteDocumentWithID("merchants", FB_MERCHANT_UUID, "carts", FB_DISCOUNT_UUID);
      status = 200, text = "SUCCESS: Draft order created 🔥. ";
    } catch (e) {
      status = 422, text = "ERROR: Likely internal -- Check Logs 😓. GETTING DOCUMENT.";
    }

    res.status(status).json(text);
   });

  /**
   * Get Discount with an code from Discount Collection! 
   * @param FB_MERCHANT_UUID: string
   * @param FB_DISCOUNT_UUID: string  
   */
   app.get("/discounts", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 😓. ", discount;

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = "QilaBD5FGdnF9iX5K9k7";
    let FB_DISCOUNT_UUID: string = "UBIhb89NI";

    // Get Discount with Disocunt Code
    try {
      discount = await getDiscountWithCode(FB_DISCOUNT_UUID, FB_MERCHANT_UUID);
      status = 200, text = "SUCCESS: Draft order created 🔥. ";
    } catch (e) {
      status = 422, text = "ERROR: Likely internal -- Check Logs 😓. GETTING DISCOUNT DOCUMENT.";
    }

    res.status(status).json({m: text, d: discount});
   });

   

}