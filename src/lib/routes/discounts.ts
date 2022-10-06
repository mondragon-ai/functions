import * as express from "express";
import * as admin from "firebase-admin";
// import { QueryDocumentSnapshot } from "firebase-functions/v1/firestore";
import {
  createDocument,
  deleteDocumentWithID,
  getCollection,
  getDiscountWithCode,
  getDocument,
  updateDocument,
  // updateSubcollectionDocumentWithID
} from "../../firebase";
import { addDiscountToCart } from "../helpers/discounts";
import {
  // DiscountPreReqs,
  Discount
} from "../types/discounts";
// import { Cart } from "../types/orders";

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
   * @param new_data: Discount
   * @param FB_DISCOUNT_UUID: string  
   */
   app.post("/discounts/create", async (req: express.Request, res: express.Response) => {
    let status = 500, 
    text = "ERROR: Likely internal -- Check Logs 😓. ",
    DISCOUNT: Discount = req.body.new_data,
    FB_DISCOUNT_UUID: string = "";

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID; 

    DISCOUNT = {
      title: DISCOUNT.title || "",
      value: DISCOUNT.value || 5,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now(),
      value_type: DISCOUNT.value_type || "",
      automatic_type: DISCOUNT.automatic_type || "",
      type: DISCOUNT.type || "",
      status: DISCOUNT.status || false,
      isAutomatic: DISCOUNT.isAutomatic || false,
      code: DISCOUNT.code || "",
      once_per_customer:  DISCOUNT.once_per_customer || false,
      usage_limit:  DISCOUNT.usage_limit || 0,
      all_products: DISCOUNT.all_products ||  true,
      pre_reqs: {
        customer_tags:  DISCOUNT.pre_reqs?.customer_tags || [],
        variant_ids:  DISCOUNT.pre_reqs?.variant_ids ||  [],
        collections:  DISCOUNT.pre_reqs?.collections || [],
        sub_total:  DISCOUNT.pre_reqs?.sub_total ||  0,
        goal_target: DISCOUNT.pre_reqs?.goal_target || 0
      },
      entitled: {
        customer_tags: DISCOUNT.entitled?.customer_tags || [],
        variant_ids: DISCOUNT.entitled?.variant_ids || [],
        collections: DISCOUNT.entitled?.collections || [],
      },
      omitted: {
        customer_tags: DISCOUNT.entitled?.customer_tags || [],
        variant_ids: DISCOUNT.entitled?.variant_ids || [],
        collections: DISCOUNT.entitled?.collections || [],
      },
    }

    // Fetch Cart Object 
    try {
      FB_DISCOUNT_UUID = await createDocument(
        "merchants",FB_MERCHANT_UUID,
        "discounts", "",DISCOUNT
      );
    } catch (e) {
      status = 422, text = "ERROR: Likely internal -- Check Logs 😓. GETTING CART DOCUMENT.";
    }

    // Update cart document
    try {
      await updateDocument(
        {id: "dis_" + FB_DISCOUNT_UUID},
        "merchants",FB_MERCHANT_UUID,
        "discounts",FB_DISCOUNT_UUID
      );
      status = 200,
      text = "SUCCESS: Draft order created 🔥. => dis_" + FB_DISCOUNT_UUID;

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
    let status = 500,
    text = "ERROR: Likely internal -- Check Logs 😓. ",
    customer_cart, 
    discount,
    FB_DISCOUNT_UUID: string = req.body.dis_uuid || "",
    FB_CART_UUID: string = req.body.car_uuid || "";

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID; 

    //
    FB_DISCOUNT_UUID = FB_DISCOUNT_UUID.substring(4);
    FB_CART_UUID = FB_CART_UUID.substring(4);

    try {
      // Fetch Cart Object 
      customer_cart = await getDocument(
        "merchants",FB_MERCHANT_UUID, 
        "carts",FB_CART_UUID
      );
    } catch (e) {
      status = 422, text = "ERROR: Likely internal -- Check Logs 😓. GETTING CART DOCUMENT.";
    }

    try {
      // Fetch Discount Object
      discount = await getDocument(
        "merchants",FB_MERCHANT_UUID, 
        "discounts",FB_DISCOUNT_UUID
      );
    } catch (e) {
      status = 422, text = "ERROR: Likely internal -- Check Logs 😓. GETTING DISCOUNT DOCUMENT.";
    }
    let applyDsicount = true;

    // TODO: Check if Customer && has tags ==> return customer_cart
    // const checkCustomerTag = async () => {
    //   let clean_cart = {};

    //   CART.customer_tags?.forEach(c_tags => {
    //     DISCOUNT.entitled?.customer_tags?.forEach(
    //       d_tags => {
    //       if (c_tags == d_tags) {
    //         applyDsicount = true;
    //       }
    //     })
    //   });
    //   return clean_cart;
    // }

    // TODO: Check if Product && has tags ==> return customer_cart

    
    // if (DISCOUNT?.code == 'NO_CODE_AUTOMATIC') applyDsicount = true;


    // if (DISCOUNT?.code != "") applyDsicount = true;
  

    if (applyDsicount) {
      // Helper Function to handle {CART || LINEITEM}
      customer_cart = addDiscountToCart(customer_cart || {}, discount || {});
      console.log("CART: \n", customer_cart)
    }

    try {
      // Update cart document
      await updateDocument(
        customer_cart,
        "merchants",
        FB_MERCHANT_UUID,
        "carts",
        FB_CART_UUID);
      status = 200, text = "SUCCESS: Discount added to cart 🔥.  cart => car_"+ FB_CART_UUID + ". Discount => dis_" + FB_DISCOUNT_UUID;
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
   * @param CODE: string  
   */
   app.post("/discounts", async (req: express.Request, res: express.Response) => {
    let status = 500,
    text = "ERROR: Likely internal -- Check Logs 😓. ",
    discount: Discount[] = [];
    // dis_uuid: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;
    const CODE: string = req.body.CODE == undefined ? "" : req.body.CODE;
    const dis_uuid: string = req.body.dis_uuid == undefined ? "" : req.body.dis_uuid;
    
    console.log(CODE);
    console.log(dis_uuid);
    console.log(FB_MERCHANT_UUID);

    // Get Discount with Disocunt Code
    try {
      if (CODE == "" && dis_uuid == "")  {
        const result = await getCollection(
          "merchants",FB_MERCHANT_UUID,
          "discounts");

        result.forEach((d)=> {
          discount = [
            ...discount,
            d.data()
          ];
          
        });
        status = 200, text = "SUCCESS: discount fetched: " + dis_uuid

      } 
      if (CODE != "" && dis_uuid == "") {
        const result = await getDiscountWithCode(CODE, FB_MERCHANT_UUID);
        result.forEach((d)=> {
          discount = [
            ...discount,
            d.data()
          ];
          
        });
        status = 200, text = "SUCCESS: discount fetched: " + dis_uuid
      }
      if (CODE == "" && dis_uuid != "") {
        const result = await getDocument(
          "merchants",FB_MERCHANT_UUID,
          "discounts",dis_uuid.substring(4)
        );
        discount = [
          {...result}
        ];
        status = 200, text = "SUCCESS: discount fetched: " + dis_uuid
      }
    } catch (e) {
      status = 422, text = "ERROR: Likely internal -- Check Logs 😓. GETTING DISCOUNT DOCUMENT.";
    }
    console.log("OTHER");

    console.log(discount);

    res.status(status).json({m: text, d: discount});
   });
}