import * as express from "express";
import * as admin from "firebase-admin";
import { 
  createDocument,
  deleteDocumentWithID,
  getDocument,
  updateDocument,
  updateSubcollectionDocumentWithID
} from "../../firebase";
// import * as crypto from "crypto";
import {
  addLineItemSubTotalPrice,
  checkIfCartIsHighRisk
} from "../helpers/carts";
import {
  LineItem,
  DraftOrder,
  Cart
} from "../types/orders"

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
  /**
   * Create a NEW Cart! 
   * @param FB_MERCHANT_UUID: string
   * @param cart: Cart! -- see interface object inside types file  
   */
   app.post("/cart/create", async (req: express.Request, res: express.Response) => {
    let status = 500,
    text = "ERROR: Likely internal -- Check Logs 😓. ",
    REQUEST_DATA = req.body.new_data,
    FB_CART_UUID: string = "";

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;
    const line_items: LineItem[] = REQUEST_DATA.line_items;


    // Req Data To Push to primary DB
    const cart = {
      ...REQUEST_DATA,
      current_subtotal_price: addLineItemSubTotalPrice(line_items),
      current_discount_value: 0,// TODO: Helper Fn to calculate discount total value.  Probs on FE
      current_gift_card_value: 0, 
      current_total_price: 0, // TODO: Helper Fn to calculate total value less discounts.  Probs on FE
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    }

    try {
      FB_CART_UUID = await createDocument("merchants", FB_MERCHANT_UUID, "carts", "", cart);

    } catch (e) {
      res.status(status).json(text);
    }

    try {
      await updateSubcollectionDocumentWithID({
        id: `car_${FB_CART_UUID}`,
      }, "merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID);
      console.log(FB_CART_UUID);
      status = 200, text = "SUCCESS: New cart created 🔥.  car_" + FB_CART_UUID;
    } catch (e) {
      res.status(status).json(text);
    }

    res.status(status).json(text);
   });

  /**
   * Create a NEW Draft Order! 
   * @param FB_MERCHANT_UUID: string
   * @param cart: Cart! -- see interface object inside types file  
   */
   app.post("/cart/complete", async (req: express.Request, res: express.Response) => {
    // Status to send back 
    let status = 500,
    text = "ERROR: Likely internal -- Check Logs 😓. ",
    customer_cart,
    FB_CART_UUID: string = req.body.cart_uuid;
    FB_CART_UUID = FB_CART_UUID.substring(4);

    let REQUEST_DATA: DraftOrder;

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;

    try {
      // Fetch Cart obj from primary DB
      customer_cart = await getDocument("merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID)

      // Delete Cart obj from primary DB
      await deleteDocumentWithID("merchants",FB_MERCHANT_UUID,"carts",FB_CART_UUID)
      
    } catch (e) {
      res.status(status).json(text);
    }

    // Req Data To Push to primary DB
    REQUEST_DATA = {
      ...customer_cart,
      payment_status: "UNPAID",
      fullfillment_status: "UNFULLFILLED",
      id: "dro_" + FB_CART_UUID,
      type: "DRAFT",
      isActive: true,
      phone: "",
      checkout_url: "",
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };
 

    // Check If HIGH_RISK then gateway == SQUARE
    REQUEST_DATA = {
      ...REQUEST_DATA,
      ...customer_cart,
      gateway: checkIfCartIsHighRisk(customer_cart?.line_items)
    }

    try {
      // Create new document with CART id
      await createDocument("merchants", FB_MERCHANT_UUID, "draft_orders", FB_CART_UUID, REQUEST_DATA);

      status = 200, text = "SUCCESS: Draft order created 🔥. =>  dor_" + FB_CART_UUID;
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
   app.put("/cart/update/add-product", async (req: express.Request, res: express.Response) => {
    // Status to update
    let status = 500, 
    text = "ERROR: Likely internal -- Check Logs 😓. ",
    customer_cart, 
    FB_CART_UUID: string = req.body.cart_uuid; 

    FB_CART_UUID = FB_CART_UUID.substring(4);

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID; 
    const line_item: LineItem = req.body.line_item

    // Req Data To Push to primary DB
    let REQUEST_DATA: LineItem = {
      variant_id: line_item.variant_id || "", 
      title: line_item.title || "",
      price: line_item.price || 0,
      has_discount: line_item.has_discount || false,
      applied_discount: line_item.applied_discount || 0,
      isHighRisk: line_item.isHighRisk  || false,
      quantity: line_item.quantity || 1
    }

    try {
      // Get documents
      customer_cart = await getDocument("merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID)

      // TODO: Check if LineItem.variant_id exists in customer_cart
      
    } catch (e) {
      res.status(status).json(text);
    }

    if (customer_cart) {
      // Add Subtotal of LineItem[]
      customer_cart = {
        ...customer_cart,
        line_items: [
          ...customer_cart.line_items,
          REQUEST_DATA
        ],
        current_subtotal_price: addLineItemSubTotalPrice(customer_cart.line_items) + (line_item?.price*line_item?.quantity)
      };

    } else {
      status = 422, text = "ERROR: Cannot find documetn 😓. DRAFT_ORDERS";
    }


    try {
      // Update Doc
      await updateDocument(customer_cart, "merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID);

      status = 200, text = "SUCCESS: Product added to the cart 🔥.  =>  car_" + FB_CART_UUID;
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
   app.put("/cart/update/remove-product", async (req: express.Request, res: express.Response) => {
    // Status to send back to client
    let status = 500,
    text = "ERROR: Likely internal -- Check Logs 😓. ",
    customer_cart,
    FB_CART_UUID: string = req.body.cart_uuid,
    VARIANT_ID: string =  req.body.var_uuid;

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;

    FB_CART_UUID = FB_CART_UUID.substring(4);

    try {
      // Fetch Cart Obj from primary DB
      customer_cart = await getDocument("merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID)
      const variants: any[] = customer_cart?.line_items

      if (customer_cart) {
        customer_cart = {
          ...customer_cart,
          line_items: variants.filter((v) => {
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
      await updateDocument(customer_cart, "merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID);

      status = 200, text = "SUCCESS: Product removed from the cart 🗑. =>  car_" + FB_CART_UUID ;
    } catch (e) {
      res.status(status).json(text);
    }
    res.status(status).json(text);
   });


  /**
   * Link Customer with an existing Cart! 
   * @param FB_MERCHANT_UUID: string
   * @param FB_CUSTOMER_ID: string
   * @param FB_CUSTOMER_ID: string
   */
   app.put("/cart/update/link-customer", async (req: express.Request, res: express.Response) => {
    // Status to send back to client
    let status = 500,
    text = "ERROR: Likely internal -- Check Logs 😓. ",
    cart: Cart,
    customer,
    FB_CART_UUID: string = req.body.cart_uuid,
    FB_CUSTOMER_ID: string = req.body.cus_uuid;

    // UUID for DB
    FB_CUSTOMER_ID = FB_CUSTOMER_ID.substring(4);
    FB_CART_UUID = FB_CART_UUID.substring(4);

    // Req path data for primary DB
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;

    try {
      customer = await getDocument("merchants", FB_MERCHANT_UUID, "customers", FB_CUSTOMER_ID);

    } catch (e) {
      res.status(status).json(text);
    }

    // try {
    //   customer_cart = await getDocument("merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID);
    //   cart = {
    //     ...customer_cart,
    //     updated_at: admin.firestore.Timestamp.now()
    //   }
    //   if (cart) {
    //     cart = {
    //       ...customer_cart,
    //       customer_id: "cus_" + FB_CUSTOMER_ID,
    //       addresses: customer?.addresses ? customer?.addresses : [],
    //       email: customer?.email ? customer?.email : "",
    //       updated_at: admin.firestore.Timestamp.now()
    //     };

    //   } else {
    //     status = 422, text = "ERROR: Cannot find documetn 😓. DRAFT_ORDERS";
    //   }

    // } catch (e) {
    //   res.status(status).json(text);
    // }

    // TODO: Check to see if cart exists == All needed is UUID
    cart = {
      customer_id: "cus_" + FB_CUSTOMER_ID,
      addresses: customer?.addresses ? customer?.addresses : [],
      email: customer?.email ? customer?.email : "",
      updated_at: admin.firestore.Timestamp.now()
    };

    try {
      await updateDocument(cart, "merchants", FB_MERCHANT_UUID, "carts", FB_CART_UUID);

      status = 200, text = "SUCCESS: Customer linked to cart 🔥. =>  car_" +  FB_CART_UUID;
    } catch (e) {
      res.status(status).json(text);
    }
    res.status(status).json(text);
   });

}