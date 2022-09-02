import * as express from "express";
import { createDocument, getDocument, updateCustomerDocumentWithID, updateDocument } from "../../firebase";
import { Address, DraftOrder } from "../types/orders";
import * as admin from "firebase-admin";
import { StripeCustomer } from "../types/stipe";
import { createStripeCustomer } from "../../stripe";
import { getDefaultAddress } from "../helpers/orders";

/**
 *  ALL Draft Order routes for the store front API 
 * @param app 
 */
export const draftOrderRoutes = async (app: express.Router) => {

  app.get("", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internall -- Check Draft Order logs. 💩 ";
    res.status(status).json(text);
  });

  /**
   * Create Draft Order Object
   * @param 
   */
  app.post("/draft_orders/create", async  (req: express.Request, res: express.Response) => {
    let status = 500,
    text = "ERROR: Likely internall -- Check Draft Order logs. 💩 ",
    FB_DORDER_UUID: string = "";

    const FB_MERCHANT_UUID: string = "";

    try {
      FB_DORDER_UUID = await createDocument("merchants", FB_MERCHANT_UUID, "draft_orders", "", );
    } catch (e) {
      status = 422;
      text = "ERROR: Likely internall -- could create document. 💩 ";
    };

    try {
      await updateCustomerDocumentWithID({id: `dro_${FB_DORDER_UUID}`}, "merchants", FB_MERCHANT_UUID, "draft_orders", FB_DORDER_UUID);
    } catch (e) {
      status = 422;
      text = "ERROR: Likely internall -- could update draft order. 💩 ";
    };
    res.status(status).json(text);

  });

  /**
   * Update Draft Order in general
   * @param email: string
   * @param shipping: Address
   */
  app.post("/draft-orders/update", async (req: express.Request, res: express.Response) => {
    let status: number = 500,
    text: string = "ERROR: LIkely internal -- check draft_order logs 💩. ",
    FB_DRAFT_UUID: string = req.body.draft_uuid || "";
    FB_DRAFT_UUID = FB_DRAFT_UUID.substring(4);

    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID || "";
    const REQUEST_DATA: DraftOrder = req.body.update_data || {}; 

    // Update doucment 
    const cart: DraftOrder = {
      ...REQUEST_DATA,
      updated_at: admin.firestore.Timestamp.now(),
    };

    try {
      // update doc with new info. 
      await updateDocument(cart,"merchants",FB_MERCHANT_UUID,"draft_orders",FB_DRAFT_UUID);

    } catch (e) {
      text = "ERROR: LIkely internal -- check draft_order logs 💩. " + "Updating document";

    }

    res.status(status).json(text);
  });


  /**
   * Add Shipping & Send client seceret 
   * @param email: string
   * @param shipping: Address
   */
   app.post("/draft-orders/update/add-shipping", async (req: express.Request, res: express.Response) => {
    let status: number = 500,
    text: string = "ERROR: LIkely internal -- check draft_order logs 💩. ",
    FB_DRAFT_UUID: string = req.body.draft_uuid || "";
    FB_DRAFT_UUID = FB_DRAFT_UUID.substring(4);

    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID || "";
    let FB_CUSTOMER_UUID: string = req.body.cus_uuid || "";
    FB_CUSTOMER_UUID = FB_CUSTOMER_UUID.substring(4);

    let customer: any = {};
    const REQUEST_DATA: Address[] = req.body.update_data || {}; 

    let default_address: Address = {};

    try {
      customer = await getDocument("merchants", FB_MERCHANT_UUID, "customers", FB_CUSTOMER_UUID)
      default_address = getDefaultAddress(customer?.addresses);
      
    } catch (e) {
      status = 500,
      text = text + 'Fetching from primary DB';
    }
    console.log(REQUEST_DATA);
    console.log(customer);

    default_address = getDefaultAddress(REQUEST_DATA?.length != 0 ? REQUEST_DATA : customer?.addresses );

    const StripeCustomer: StripeCustomer = {
      address: {
        line1: default_address ? default_address.line1 : "",
        line2:  default_address ? default_address.line2 :  "",
        city:  default_address ? default_address.city :  "",
        state: default_address ? default_address.state :  "",
        zip: default_address ? default_address.zip :  ""
      },
      email: customer?.email ? customer?.email : "",
      name: customer?.name ? customer?.email :"",
      phone: customer?.phone ? customer?.phone :"",
      description: "TEST"|| "",
    }

    const result = await createStripeCustomer(StripeCustomer);

    console.log(result);

    if (result.status >= 300) {
      text = result.text
      status = result.status
    } else {
      const data = {
        stripe: {
          stripe_uuid: result.data?.stripe_uuid,
          stripe_pm: result.data?.stripe_pm,
          stripe_client_secrete: result.data?.stripe_client_secrete
        }
      }
      try {
        await updateDocument(data, "merchants", FB_MERCHANT_UUID, "customers", FB_CUSTOMER_UUID);
        text = "SUCCESS: Customer created with processing and is ready to be charged 🤑. => cus_" + FB_CUSTOMER_UUID;
        status = 200;
      } catch (e) {
        text = text + "Check FB in stripe.ts";
      } 
    }

    // Update doucment 
    const cart: DraftOrder = {
      ...REQUEST_DATA,
      addresses: [default_address],
      updated_at: admin.firestore.Timestamp.now(),
    };

    try {
      // update doc with new info. 
      await updateDocument(cart,"merchants",FB_MERCHANT_UUID,"draft_orders",FB_DRAFT_UUID);

    } catch (e) {
      text = "ERROR: LIkely internal -- check draft_order logs 💩. " + "Updating document";

    }

    res.status(status).json(text);
  });
}