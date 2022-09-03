import * as admin from "firebase-admin";
import * as express from "express";
import {
    deleteDocumentWithID,
    getDocument,
    searchAndGetWithKey,
    updateDocument 
} from "../../firebase";
// import * as crypto from "crypto"
import { createNewDocumentWithId, handleDataToChange, updateAddressWithID } from "../helpers/firebase";
import { NewCustomer, Customer} from "../types/customers";
import { Address } from "../types/orders";
import { createNewAddresses } from "../helpers/addresses";

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
   * Create NEW store customer instance in Primary DB. Checked to make sure the customer does not already exist
   * @param FB_MERCHANT_UUID: string
   * @param new_data: NewCustomer
   */
  app.post("/customers/create", async (req: express.Request, res: express.Response) => {
    // Status Update for client
    let status: number = 500,
    text: string = "ERROR: Likley internal -- Check Logs. 😅. ";

    // Merchant Acess Token
    const FB_MERCHANT_UUID = req.body.FB_MERCHANT_UUID;

    // Data to Push
    let customer: NewCustomer = req.body.new_data,
    email: string = customer?.email;

    // Fetch | Create cus_uuid
    let FB_CUSTOMER_UUID: string = "";

    try {
      // Check to see if customer exists w/ email && return cus_uuid if exists
      FB_CUSTOMER_UUID = await searchAndGetWithKey({
        key: "email",
        value: email
      },"merchants",FB_MERCHANT_UUID,"customers","");
      
    } catch (e) {
      text = text + " searching cutstomers list.";

    }

    // Create NEW Address[]
    let addresWithId = createNewAddresses(customer?.addresses || []);

    // Finalize data for NEW customer 
    customer = {
      ...customer,
      addresses: addresWithId,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
      
    };

    // Create the customer doc 
    if (FB_CUSTOMER_UUID == "") {
      // Create NEW document with the 
      const result = await createNewDocumentWithId(FB_MERCHANT_UUID, "customers", "cus_", customer);
       console.log(result);

      // Set text/status to send back to client + cus_uuid
      text = result.text;
      status = result.status;
      FB_CUSTOMER_UUID = result.data?.document_id || ""

    } else {
      // Customer exists. Send cus_uuid back
      status = 202,
      text = "SUCCESS: Account already exits. Try loging in? 🤔 => cus_" + FB_CUSTOMER_UUID; 

    }

    res.status(status).json({m: text, d: FB_CUSTOMER_UUID})
  });

  /**
   * Update customer document. Params NEED TO BE passed as an array with the key: vlaue pair inside another array: [["email": "test@gmail.com"], ...[...]]
   * @param FB_MERCHANT_UUID: string
   * @param customer_uuid: string
   * @param update_data: [ ...["key", "value"]]
   */
  app.put("/customers/update", async (req: express.Request, res: express.Response) => {
    // Response data to update & send back
    let status = 500, text = "ERROR: Likley internal -- Check Logs. 😅 CUSTOMERS"

    // Req data for updating primary DB
    const REQUEST_DATA = req.body.update_data; 
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID; 

    // Get FB_UUID from cus_uuid
    let FB_CUSTOMER_UUID: string = req.body.customer_uuid; 
    FB_CUSTOMER_UUID = FB_CUSTOMER_UUID.substring(4);

    // Get the data to be changed from the request object and handle to return {[key]: value} pairs. 
    let CUSTOMER_DATA: Customer = handleDataToChange(REQUEST_DATA);

    let addresWithId: Address[] = CUSTOMER_DATA?.addresses || [];

    console.log(addresWithId);

    if (addresWithId.length > 0) {
      // Create NEW Address[]
      addresWithId = createNewAddresses(addresWithId);

      // Finalize data for NEW customer 
      CUSTOMER_DATA = {
        ...CUSTOMER_DATA,
        addresses: addresWithId,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
        
      };

    }

    // Finalize data for NEW customer 
    CUSTOMER_DATA = {
      ...CUSTOMER_DATA,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
      
    };

    console.log(CUSTOMER_DATA);

    try {
      // Update document 
      await updateDocument(
        CUSTOMER_DATA,
        "merchants",
        FB_MERCHANT_UUID,
        "customers",
        FB_CUSTOMER_UUID
      );

      status = 200, text = "SUCCESS: Customer updated. 💪🏼 " + "cus_" + FB_CUSTOMER_UUID; 
    } catch (e) {
      res.status(status).json(text)
    }
    res.status(status).json(text)
  });

  /**
   * Update addres of customer document
   * @param FB_MERCHANT_UUID: string
   * @param customer_uuid: string
   * @param address_uuid: string
   * @param update_data: Address
   */
  app.put("/customers/update/address", async (req: express.Request, res: express.Response) => {
    // Response data to update & send back
    let status = 500, text = "ERROR: Likley internal -- Check Logs. 😅 CUSTOMERS"

    // Req data for updating primary DB
    const REQUEST_DATA: Address = req.body.update_data; 
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID; 
    const address_uuid: string = req.body.address_uuid; 

    // Customer Obj
    let customer: Customer = {};

    // Get FB_UUID fro cusotmer document
    let FB_CUSTOMER_UUID: string = req.body.customer_uuid;
    FB_CUSTOMER_UUID = FB_CUSTOMER_UUID.substring(4);

    try {
      // Get customer data 
      const doc = await getDocument("merchants",FB_MERCHANT_UUID,"customers",FB_CUSTOMER_UUID);
      customer = {
        ...doc
      }

    } catch (e) {
      
    }

    // Update the Address && return updated list
    let addresWithId = updateAddressWithID(address_uuid, customer, REQUEST_DATA);

    // Reset Customers final object to resubmit t primary DB
    customer = {
      ...customer,
      addresses: addresWithId,
      updated_at: admin.firestore.Timestamp.now()
    };

    try {
      // Update document 
      await updateDocument(
        customer,
        "merchants",
        FB_MERCHANT_UUID,
        "customers",
        FB_CUSTOMER_UUID
      );

      status = 200,
      text = "SUCCESS: Customer updated. 💪🏼 " + "cus_" + FB_CUSTOMER_UUID; 

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
    // Response data to update & send back
    let status = 500, text = "ERROR: Likley internal -- Check Logs. 😅. "

    // Req data for update
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;

    // Get FB_UUID for document 
    let FB_CUSTOMER_UUID: string = req.body.customer_uuid; 
    FB_CUSTOMER_UUID = FB_CUSTOMER_UUID.substring(4);

    try {
      // Delete document 
      await deleteDocumentWithID("merchants", FB_MERCHANT_UUID, "customers", FB_CUSTOMER_UUID);
      status = 200, text = "SUCCESS: Customer deleted. 💀 " + FB_CUSTOMER_UUID;

    } catch (e) {
      res.status(status).json(text)
    }
    res.status(status).json(text)
  });

};