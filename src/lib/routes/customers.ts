import * as admin from "firebase-admin";
import * as express from "express";
import { createDocument,
    deleteDocumentWithID,
    updateCustomerDocumentWithID,
    updateDocument 
} from "../../firebase";
// import * as crypto from "crypto"
import { handleDataToChange } from "../helpers/firebase";
import { NewCustomer, Customer} from "../types/customers";

/**
 * all Customer routes for storefront API.
 * @param app 
 * @param db 
 */
export const customersRoutes = async (app: express.Router, db: FirebaseFirestore.Firestore) => {

  /**
   * Test API Routes
   */
  app.get("/customers/test", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likley internal -- Check Logs. 😅"
    res.status(status).json(text);

  });

  /**
     // TODO: REG EX CHECK ON VALID EMAIL BOTH FE && BE
     // TODO: Check to make sure email does NOT exist... 
     // TODO: If email exists fetch customer. 
   * Create NEW store customer instance in Primary DB
   * @param FB_MERCHANT_UUID
   * @param Customer
   */
  app.post("/customers/create", async (req: express.Request, res: express.Response) => {
    // Req data
    const FB_MERCHANT_UUID = req.body.FB_MERCHANT_UUID;
    let customer: NewCustomer = req.body.new_data;

    // Data to update
    let status: number = 500,
    text: string = "ERROR: Likley internal -- Check Logs. 😅. ",
    email: string = customer?.email || "",
    FB_CUSTOMER_UUID: string = "";

    customer = {
      ...customer,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    try {
      // Check if email was entered
      // !(MUST BE VERIFIED ON THE FORNT END AS VALID EMAIL)
      if (email == "") {
        status = 422, text = "ERROR: Valid email required. 🤬";

      } else {
        // Create NEW /customers/document
        FB_CUSTOMER_UUID = await createDocument(
          "merchants",
          FB_MERCHANT_UUID,
          "customers", "",
          customer
        );
      };
      
    } catch (e) {
      res.status(status).json(text + "  creating new document.");
    }

    try {
      // Make sure customer exists
      if (FB_CUSTOMER_UUID != "") {
        // Update Documents if UUID exists.
        await updateDocument(
          {
            ...customer,
            id: `cus_${FB_CUSTOMER_UUID}`
          },
          "merchants",
          FB_MERCHANT_UUID,
          "users",
          FB_CUSTOMER_UUID
        );
        status = 200, text = "SUCCESS: User created & added to primary DB. 🧙🏼‍♂️. CustomerID! = " + FB_CUSTOMER_UUID;

      } else {
        status = 400, text = "ERROR: User NOT created -- Likely related with FB. 🤯" + FB_CUSTOMER_UUID;
      }
    } catch (e) {
      text = text + " Updating the customer in primary DB";
    }
    res.status(status).json(text)
  });

  /**
   * Update customer document
   * ! Params NEED TO BE passed as an array with the key: vlaue pair inside another array: [["email": "test@gmail.com"], ...[...]]
   * @param FB_MERCHANT_UUID
   * @param FB_CUSTOMER_UUID
   */
  app.put("/customers/update", async (req: express.Request, res: express.Response) => {
    // Response data to update & send back
    let status = 500, text = "ERROR: Likley internal -- Check Logs. 😅 CUSTOMERS"

    // Req data for updating primary DB
    const REQUEST_DATA = req.body.update_data; 
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID; 
    let FB_CUSTOMER_UUID: string = req.body.customer_uuid; 
    FB_CUSTOMER_UUID = FB_CUSTOMER_UUID.substring(4);

    // Get the data to be changed from the request object and handle to return {[key]: value} pairs. 
    const CUSTOMER_DATA: Customer = handleDataToChange(REQUEST_DATA);

    try {
      // Updae document 
      await updateCustomerDocumentWithID(
        CUSTOMER_DATA,
        "merchants",
        FB_MERCHANT_UUID,
        "customers",
        FB_CUSTOMER_UUID
      );

      status = 200, text = "SUCCESS: Customer updated. 💪🏼 - " + "cus_" + FB_CUSTOMER_UUID; 
    } catch (e) {
      res.status(status).json(text)
    }
    res.status(status).json(text)
  });

  /**
   * Update customer
   * @param FB_MERCHANT_UUID
   * @param FB_CUSTOMER_UUID
   */
   app.delete("/customers/delete", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likley internal -- Check Logs. 😅. "

    // Req data for update
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;
    let FB_CUSTOMER_UUID: string = req.body.customer_uuid; 
    FB_CUSTOMER_UUID = FB_CUSTOMER_UUID.substring(4);

    try {
      // Updae document 
      await deleteDocumentWithID("merchants", FB_MERCHANT_UUID, "customers", FB_CUSTOMER_UUID);
      status = 200, text = "SUCCESS: Customer deleted. 💀 " + FB_CUSTOMER_UUID;

    } catch (e) {
      res.status(status).json(text)
    }
    res.status(status).json(text)
  });

};