import * as express from "express";
import * as admin from "firebase-admin";
import { createDocument, deleteDocumentWithID, getDocument, updateSubcollectionDocumentWithID } from "../../firebase";
import * as crypto from "crypto";
import { addLineItemSubTotalPrice, checkIfCartIsHighRisk } from "../helpers/carts";

/**
 * All Product! related routes for the storefront API 
 * @param app 
 * @param db 
 */
export const cartRoutes = async (app: express.Router, db: FirebaseFirestore.Firestore) => {
  /**
   * Test api
   */
  app.get("/draft_orders/test", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 😓. ";
    
    res.status(status).json(text);
  });

  interface DicsountCode {
    id: string,
    title: string,
    description: string,
    type: string,
    value: number
  }

  interface ShippingLines {
    id: string,
    title: string,
    price: number
  }

  interface Address {
    name: string,
    type: string,
    line1: string,
    line2: string,
    city: string, 
    state: string, 
    zip: string
  }

  interface LineItem {
    variant_id: string, 
    title: string,
    price: number,
    hasDiscount: boolean,
    isHighRisk?: boolean,
    applied_discount?: number
  } 

  // TODO: Move to seperate type folder
  // Cart Interface for Create
  interface Cart {
    type: string,
    isActive: boolean,
    gateway: string,
    used_gift_card: boolean,
    hasDiscount: boolean,
    gift_car?: string
    discount_code?: DicsountCode,
    browser_ip: string,
    line_item: LineItem[],
    current_subtotal_price: number, 
    current_discount_value: number,
    current_gift_card_value: number, 
    current_total_price: number, 
    customer_id?: string,
    email?: string,
    tags?: string[],
    note?: string,
    addresses?: Address[],
    shipping_line?: ShippingLines,
    created_at: string,
    updated_at: string,
  };

  /**
   * Create a NEW Cart! 
   * @param FB_MERCHANT_UUID: string
   * @param cart: Cart! -- see interface object inside types file  
   */
   app.post("/cart/create", async (req: express.Request, res: express.Response) => {
    let status = 500,
    text = "ERROR: Likely internal -- Check Logs 😓. ",
    SUB_TOTAL_PRICE: number = 0;

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = "QilaBD5FGdnF9iX5K9k7";

    // Req Data To Push to primary DB
    const REQUEST_DATA: Cart = {
      type: "CART",
      isActive: true,
      gateway: "" || "STRIPE", // TODO: Helper function 
      used_gift_card: false,
      hasDiscount: false,
      // gift_card: ""
      // discount_code: {
      //   id: "dis_040340023847",
      //   title: "VIP CLUB MEMBER",
      //   description: "20% off store wide for VIP members",
      //   type: "P",
      //   value: 20
      // },
      browser_ip: "",
      line_item: [
        {
          variant_id: "var_93824798", 
          title: "VIP Club",
          price: 9000,
          hasDiscount: false,
          isHighRisk: false
        },
        {
          variant_id: "var_93824798", 
          title: "VIP Shirt",
          price: 9000,
          hasDiscount: false,
          isHighRisk: false,
          applied_discount: 0
        }   
      ],
      current_subtotal_price: 9000, // TODO: Helper Fn to calculate subtotal value. Probs on FE
      current_discount_value: 9000 * .20,// TODO: Helper Fn to calculate discount total value.  Probs on FE
      current_gift_card_value: 0, 
      current_total_price: 9000 * .20, // TODO: Helper Fn to calculate total value less discounts.  Probs on FE
      // customer_id: "cus_87239487203847",
      // email: "angel@gogigly.com",
      // tags: ["VIP_MEMBER"],
      // note: "",
      // addresses: [
      //   {
      //     type: "BOTH",
      //     name: "obi", 
      //     line1: "420 Bigly ln",
      //     line2: "",
      //     city: "Fayetteille",
      //     state: "Arkansas",
      //     zip: "72704"
      //   }
      // ],
      // shipping_line: {
      //   id: "19aaa23a-a295-4a72-8ff5-36b85caac154",
      //   title: "Standard Domestic",
      //   price: 599
      // },
      created_at: `${admin.firestore.Timestamp.now()}`,
      updated_at: `${admin.firestore.Timestamp.now()}`
    }

    console.log(REQUEST_DATA);

    SUB_TOTAL_PRICE = addLineItemSubTotalPrice(REQUEST_DATA.line_item);

    try {
      const result = await createDocument("merchants", FB_MERCHANT_UUID, "carts", REQUEST_DATA);
      await updateSubcollectionDocumentWithID({
        id: `car_${result}`,
        current_subtotal_price: SUB_TOTAL_PRICE
       }, "merchants", FB_MERCHANT_UUID, "carts", result);
      console.log(result);

      status = 200, text = "SUCCESS: New cart created 🔥. ";
    } catch (e) {
      res.status(status).json(text);
    }
    res.status(status).json(text);
   });

  // Cart Interface for Draft Order
  interface DraftOrder {
    id: string,
    checkout_url?: string
    type?: string,
    isActive?: boolean,
    gateway?: string,
    used_gift_card?: boolean,
    hasDiscount?: boolean,
    gift_car?: string
    discount_code?: DicsountCode,
    browser_ip?: string,
    line_item?: LineItem[],
    current_subtotal_price?: number, 
    current_discount_value?: number,
    current_gift_card_value?: number, 
    current_total_price?: number, 
    customer_id?: string,
    email?: string,
    tags?: string[],
    note?: string,
    addresses?: Address[],
    shipping_line?: ShippingLines,
    created_at?: string,
    updated_at: string,
    fullfillment_status?: string,
    payment_status?: string,
  };

  /**
   * Create a NEW Draft Order! 
   * @param FB_MERCHANT_UUID: string
   * @param cart: Cart! -- see interface object inside types file  
   */
   app.post("/cart/complete", async (req: express.Request, res: express.Response) => {
    let status = 500,
    text = "ERROR: Likely internal -- Check Logs 😓. ",
    customer_cart;

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = "QilaBD5FGdnF9iX5K9k7";
    let FB_CART_UUID: string = "car_" + "aBALJo37WgwAPumlqSqp";
    FB_CART_UUID = FB_CART_UUID.substring(4);

    // TODO: If HIGH_RISK then gateway == SQUARE

    // Req Data To Push to primary DB
    let REQUEST_DATA: DraftOrder = {
      payment_status: "UNPAID",
      fullfillment_status: "UNFULLFILLED",
      id: "dro_" + FB_CART_UUID,
      type: "DRAFT",
      isActive: true,
      checkout_url: "",
      updated_at: `${admin.firestore.Timestamp.now()}`,
      addresses: [
        {
          name: "Obi Kanobi",
          type: "BOTH",
          line1: "420 Bigly Ln",
          line2: "",
          city: "Fayetteville", 
          state: "Arkansas", 
          zip: "72704"
        }
      ]
    }

    try {
      customer_cart = await getDocument("merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID)

      await deleteDocumentWithID("merchants",FB_MERCHANT_UUID,"carts",FB_CART_UUID)
      
    } catch (e) {
      res.status(status).json(text);
    }

    REQUEST_DATA = {
      ...REQUEST_DATA,
      ...customer_cart,
      gateway: checkIfCartIsHighRisk(customer_cart?.line_items)
    }

    try {
      const result = await createDocument("merchants", FB_MERCHANT_UUID, "draft_orders", REQUEST_DATA);
      console.log(result);

      status = 200, text = "SUCCESS: Draft order created 🔥. ";
    } catch (e) {
      res.status(status).json(text);
    }
    res.status(status).json(text);
   });

  /**
   * Add Line Item a existing Cart! 
   * @param FB_MERCHANT_UUID: string
   * @param cart: Cart! -- see interface object inside types file  
   */
   app.put("/cart/update/add_product", async (req: express.Request, res: express.Response) => {
    let status = 500, 
    text = "ERROR: Likely internal -- Check Logs 😓. ",
    customer_cart, 
    SUB_TOTAL_PRICE: number = 0;

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = "QilaBD5FGdnF9iX5K9k7";
    const FB_CART_UUID: string = "iBXkOR1TI7rH0dMzZZDr";

    // TODO: If HIGH_RISK then gateway == SQUARE

    // Req Data To Push to primary DB
    let REQUEST_DATA: any = {
      variant_id: "var_" + crypto.randomBytes(10).toString('hex'), 
      title: "VIP Shirt",
      price: 13530,
      hasDiscount: true,
      applied_discount: 20
      
    }  

    try {
      customer_cart = await getDocument("merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID)

      if (customer_cart) {
        SUB_TOTAL_PRICE = addLineItemSubTotalPrice(customer_cart.line_item);
        customer_cart = {
          ...customer_cart,
          line_item: [
            ...customer_cart.line_item,
            REQUEST_DATA
          ],
          current_subtotal_price: SUB_TOTAL_PRICE
        } 
        console.log(customer_cart);
      } else {
        status = 422, text = "ERROR: Cannot find documetn 😓. DRAFT_ORDERS";
      }

    } catch (e) {
      res.status(status).json(text);
    }

    try {
      const result = await updateSubcollectionDocumentWithID(customer_cart, "merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID);
      console.log(result);

      status = 200, text = "SUCCESS: Draft order created 🔥. ";
    } catch (e) {
      res.status(status).json(text);
    }
    res.status(status).json(text);
   });


  /**
   * Remove Line Item a existing Cart! 
   * @param FB_MERCHANT_UUID: string
   * @param cart: Cart! -- see interface object inside types file  
   */
   app.put("/cart/update/remove_product", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 😓. ";
    let customer_cart;

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = "QilaBD5FGdnF9iX5K9k7";
    const FB_CART_UUID: string = "iBXkOR1TI7rH0dMzZZDr";
    const VARIANT_ID: string = "var_9a5ad7c81e94e889b9e9f089ca2d14";

    // TODO: If HIGH_RISK then gateway == SQUARE

    try {
      customer_cart = await getDocument("merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID)
      const variants: any[] = customer_cart?.line_item

      console.log(customer_cart);
      
      if (customer_cart) {
        customer_cart = {
          ...customer_cart,
          line_item: variants.filter((v) => {
            return v.variant_id != VARIANT_ID
          })
        } 
        console.log(customer_cart);
      } else {
        status = 422, text = "ERROR: Cannot find documetn 😓. DRAFT_ORDERS";
      }

    } catch (e) {
      res.status(status).json(text);
    }


    try {
      const result = await updateSubcollectionDocumentWithID(customer_cart, "merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID);
      console.log(result);

      status = 200, text = "SUCCESS: Draft order created 🔥. ";
    } catch (e) {
      res.status(status).json(text);
    }
    res.status(status).json(text);
   });


  /**
   * Link Customer with an existing Cart! 
   * @param FB_MERCHANT_UUID: string
   * @param cart: Cart! -- see interface object inside types file  
   */
   app.put("/cart/update/link_customer", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 😓. ";
    let customer_cart, customer;

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = "QilaBD5FGdnF9iX5K9k7";
    const FB_CART_UUID: string = "iBXkOR1TI7rH0dMzZZDr";
    let CUSTOMER_ID: string = "cus_"+ "3uodpXUJNbYY6Yhj3qBF" //crypto.randomBytes(10).toString("hex");
    console.log(CUSTOMER_ID);

    CUSTOMER_ID = CUSTOMER_ID.substring(4);
    console.log(CUSTOMER_ID);

    // TODO: If HIGH_RISK then gateway == SQUARE

    try {
      customer = await getDocument("merchants", FB_MERCHANT_UUID, "customers", CUSTOMER_ID);
      console.log(customer);

    } catch (e) {
      res.status(status).json(text);
    }

    try {
      customer_cart = await getDocument("merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID);

      console.log(customer_cart);
      
      if (customer_cart) {
        customer_cart = {
          ...customer_cart,
          customer_id: CUSTOMER_ID,
          shipping: customer?.addresses ? customer?.addresses : [],
          contact_email: customer?.email ? customer?.email : ""
        } 
        console.log(customer_cart);
      } else {
        status = 422, text = "ERROR: Cannot find documetn 😓. DRAFT_ORDERS";
      }

    } catch (e) {
      res.status(status).json(text);
    }

    try {
      const result = await updateSubcollectionDocumentWithID(customer_cart, "merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID);
      console.log(result);

      status = 200, text = "SUCCESS: Draft order created 🔥. ";
    } catch (e) {
      res.status(status).json(text);
    }
    res.status(status).json(text);
   });

}