import * as express from "express";
import { createDocument, updateCustomerDocumentWithID, updateDocument } from "../../firebase";
import { Cart } from "../types/orders";
import * as admin from "firebase-admin";

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
   * Add Shipping & Send client seceret 
   * @param email: string
   * @param shipping: Address
   */
  app.post("/draft-orders/update", async (req: express.Request, res: express.Response) => {
    let status: number = 500,
    text: string = "ERROR: LIkely internal -- check draft_order logs 💩. ",
    FB_DRAFT_UUID: string = req.body.draft_uuid || "";
    FB_DRAFT_UUID = FB_DRAFT_UUID.substring(4);

    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID || "";
    const REQUEST_DATA: Cart = req.body.update_data || ""; 

    // Update doucment 
    const cart: Cart = {
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
}