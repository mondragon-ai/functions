import * as express from "express";
import { createDocument, updateCustomerDocumentWithID } from "../../firebase";

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
}