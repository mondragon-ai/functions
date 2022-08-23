import * as express from "express";
import * as functions from "firebase-functions";
import {createDocument, getDocument, updateDocument} from "../../firebase";
import * as crypto from "crypto";
/**
 * Merhcant API Routes 
 * @param app 
 * @param db 
 */
export const merchantRoutes = async (app: express.Express, db: FirebaseFirestore.Firestore) => {

    app.get("/merchants/test", async (req: express.Request, res: express.Response) => {
        res.status(200).json("SUCCESS")
    });

    /**
     * Create NEW Merchant document in primary DB
     * @param shop
     * @param email
     * @param currency_code
     * @param first_name
     * @param last_name
     */
  app.post("/merchants/create", async (req: express.Request, res: express.Response) => {
    let status = 500;
    let text = "ERROR: Internal -- check logs.";

    // Req Data 
    const merchant_info = {
      email: "test@gmail.com",
      shop: "test-name",
      first_name: "obi",
      last_name: "kan obi",
      currency_code: "USD",
    }

    try {
      // Push data to creaete new merchant... extract DocuemntID! from primary DB
      const result = await createDocument("merchants", "", "", merchant_info)
      status = 200;
      text = "SUCCESSFULLY CREATED MERCHANT STORE: " + result
        
    } catch (e) {
      functions.logger.error(text, e)
      res.status(status).json(text);
    }
    res.status(status).json(text);
  });

  /**
   * Add shipping to Merchant document in primary DB
   * @param title
   * @param price
   * @param type
   * @param FB_UUID
 */
  app.post("/merchants/shipping/add", async (req: express.Request, res: express.Response) => {
    let status = 500;
    let text = "ERROR: Internal -- check logs.";

    // Req Data to push
    const FB_UUID = "QilaBD5FGdnF9iX5K9k7";
    let shipping_details: any[] = [];
    const NEW_DETAIL = {
    title: "FREE SHIPPING - Over $99.00",
    price: 0,
    type: "FREE_SHIPPING",
    id: crypto.randomUUID()
    };

    // Get all shipping_details & append new detail
    try {
    // Fetch document from primary DB
    const data = await getDocument("merchants",FB_UUID,"","");
    shipping_details = data?.shipping_details; 

    if (shipping_details) {

        shipping_details = [
        ...shipping_details,
        NEW_DETAIL
        ];

        // New Response
        status = 201;
        text = "SUCCESS: Shipping Rule appended to primary DB.";

    } else {
        shipping_details = [NEW_DETAIL];
        // New Response
        status = 200;
        text = "SUCCESS: Shipping Rule added to primary DB.";
    }

    } catch (e) {
    functions.logger.error(text, e);
    res.status(status).json(text);
    }

    // Try to update primary DB with new shipping_details
    try {
    await updateDocument({shipping_details: shipping_details},"merchants",FB_UUID,"","");
    
    } catch (e) {
    functions.logger.error(text, e);
    res.status(status).json(text);
    }

    res.status(status).json(text);
  });

  /**
   * Delete shipping to Merchant document in primary DB
   * @param FB_UUID
   * @param id
   */
  app.delete("/merchants/shipping", async (req: express.Request, res: express.Response) => {
    let status = 500;
    let text = "ERROR: Internal -- check logs.";

    // Req Data to push
    const FB_UUID: string = "QilaBD5FGdnF9iX5K9k7";
    const SHIPPING_DETAIL_ID: string = "17ed5a77-02bc-4c85-bf62-833088102ca7";
    let shipping_details: any[] = [];

    try {
      const data = await getDocument("merchants",FB_UUID,"","");
      shipping_details = data?.shipping_details ;

      if (shipping_details) {

        for (var i = 0; i < shipping_details.length; i++) {
          shipping_details = shipping_details.filter((el: any, i: number) => {
          return el.id != SHIPPING_DETAIL_ID
        });

      };
      // New Response
      status = 200;
      text = "SUCCESS: Shipping Rule Detail is deleted.";

      } else {
      // New Response
      status = 422;
      text = "ERROR: Shipping details do not exist. Nothing to delete.";

      }

    } catch (e) {
      functions.logger.error(text, e);
      res.status(status).json(text);

    }

    try {
        await updateDocument({shipping_details: shipping_details},"merchants",FB_UUID,"","");
        
    } catch (e) {
        functions.logger.error(text, e);
        res.status(status).json(text);
    }

    res.status(status).json(text);
  });

    // TODO: Tax Details? 

  /**
   * Update Contact information for store. This is most helpful for errors and important notifications.
   * @param FB_UUID
   */
  app.post("/merchants/contact/update", async (req: express.Request, res: express.Response) => {
    let status = 500;
    let text = "ERROR: Internal -- check logs.";

    // Req Data to push
    const FB_UUID = "QilaBD5FGdnF9iX5K9k7";
    let contact_info: {} = {};
    let NEW_CONTACT = {
      first_name: "obi",
      last_name: "kanobi",
      phone: "1234567",
      email: "angel@gobigly.com",
      address: 
        {
          line1: "420 Bigly ln",
          line2: "",
          city: "Fayetteville",
          state: "Arkansas",
          zip: "72704"
        }
    };

    try {
      // Gett Merchant docement 
      const data = await getDocument("merchants",FB_UUID,"","");
      contact_info = data?.contact_info;

      if (!contact_info) {
        contact_info = NEW_CONTACT;
        // New Response
        status = 200;
        text = "SUCCESS: Store contact information added.";

      } else {
        contact_info = {...contact_info, ...NEW_CONTACT};
        // New Response
        status = 201;
        text = "SUCCESS: Store contact information updated.";

      }

    } catch (e) {
      functions.logger.error(text, e);
      res.status(status).json(text);
    }

    try {
      await updateDocument({contact_info: NEW_CONTACT},"merchants",FB_UUID,"","");
        
    } catch (e) {
      functions.logger.error(text, e);
      res.status(status).json(text);
    }

    res.status(status).json(text);
  });

}