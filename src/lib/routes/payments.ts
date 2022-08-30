import * as express from "express";
import { getDocument, updateCustomerDocumentWithID } from "../../firebase";
import { createStripeCustomer } from "../../stripe";
import {StripeCustomer} from "../types/stipe"

export const paymentRoutes = (app: express.Router) => {
  app.get("/payments/test", async (req: express.Request, res: express.Response) => {
    let status = 200, text = "ERROR: Likely internal -- Check payment Logs 😅. ";
    res.status(status).json(text);
  });

  /**
   * Create ustomer && Send back client secret
   * @param FB_MERCHANT_UUID
   * @param FB_CUSTOMER_UUID
   */
  app.post("/payments/send-client-seceret", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely an internal problem. Check stripe logs. 🤷🏻‍♂️ ";
    let customer: any;
    const FB_MERCHANT_UUID: string = "";
    const FB_CUSTOMER_UUID: string = ""
    const {line1, line2, city, state, zip} = customer?.address

    // TODO:: Toggle if the order.gateway == STRIPE \\ SQUARE
    const StripeCustomer: StripeCustomer = {
      address: {
        line1: line1 || "420 Bigly st",
        line2: line2 || "",
        city: city || "Denver",
        state: state || "Co",
        zip:  zip || ""
      },
      email: customer?.email || "allmight@gobigly.com",
      name: customer?.name || "All Might",
      phone: customer?.phone || "",
      description: ""|| "Store Front",
    }

    try {
      customer = await getDocument("merchants", FB_MERCHANT_UUID, "customers", FB_CUSTOMER_UUID)
      
    } catch (e) {
      status = 500,
      text = text + 'Fetching from primary DB';
    }
    const result = await createStripeCustomer(StripeCustomer);

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
        await updateCustomerDocumentWithID(data, "merchants", FB_MERCHANT_UUID, "customers", FB_CUSTOMER_UUID);
        text = "SUCCESS: Customer created with processing and is ready to be charged 🤑. ";
        status = 200;
      } catch (e) {
        text = text + "Check FB in stripe.ts";
      } 
    }

    res.status(status).json(text)

  });

  /**
   * Create ustomer && Send back client secret
   * @param FB_MERCHANT_UUID
   * @param FB_CUSTOMER_UUID
   */
  app.post("/payments/charge", async () => {

  });

  /**
   * Store Card with customer (add Stripe PM)
   * @param FB_MERCHANT_UUID
   * @param FB_CUSTOMER_UUID
   */
   app.post("/payments/store-new-card", async () => {
    // TODO: get secret from FB

    //TODO: Handle charge with stripe usign card (stored PM) 
    
    // TODO: Add PM link
  });

  // TODO: Remove Payment Method

  // TODO: webhook? Listen to subscirption

  // TODO: onCreate draft_order send checkout URL link

  // TODO: Handle Refund

};