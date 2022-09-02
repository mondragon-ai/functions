import * as admin from "firebase-admin";
import * as express from "express";
import { createDocument,
    deleteDocumentWithID,
    getDocument,
    searchAndGetWithKey,
    updateCustomerDocumentWithID,
    updateDocument 
} from "../../firebase";
// import * as crypto from "crypto"
import { handleDataToChange } from "../helpers/firebase";
import { NewCustomer, Customer} from "../types/customers";
import { Address } from "../types/orders";
import * as crypto from "crypto";

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
   * @param new_data: Customer
   */
  app.post("/customers/create", async (req: express.Request, res: express.Response) => {
    // Status Update for client
    let status: number = 500,
    text: string = "ERROR: Likley internal -- Check Logs. 😅. ";

    // Req data
    const FB_MERCHANT_UUID = req.body.FB_MERCHANT_UUID;
    let customer: NewCustomer = req.body.new_data,
    email: string = customer?.email || "",
    IS_NEW = true,
    FB_CUSTOMER_UUID: string = "";

    // Working with Addressess
    let addresses: Address[] = customer?.addresses || [];
    let addresWithId: Address[] = []

    // created uuids for the Address[]
    if (addresses?.length != 0) {
      addresses?.forEach((v, i) => {
        addresWithId.push(
          {
            ...v,
            id: "add_" + crypto.randomBytes(10).toString('hex')
          }
        )
      });
    } 

    // Finalize data for customer 
    customer = {
      ...customer,
      addresses: addresWithId,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    try {
      // Check if email was entered
      // !(MUST BE VERIFIED ON THE FORNT END AS VALID EMAIL)
      if (email == "") {
        status = 422, text = "ERROR: Valid email required. 🤬"; 

      } else {
        // Return standard return obj
        FB_CUSTOMER_UUID = await searchAndGetWithKey({
          key: "email",
          value: email
        },"merchants",FB_MERCHANT_UUID,"customers","");

      };
      
    } catch (e) {
      text = text + "  creating new document.";
    }

    try {
      // Create the Doc 
      if (FB_CUSTOMER_UUID == "") {
        // Create NEW /customers/document
        FB_CUSTOMER_UUID = await createDocument(
          "merchants",
          FB_MERCHANT_UUID,
          "customers", "",
          customer
        );

        console.log("68: ID => ", FB_CUSTOMER_UUID);
      } else {
        IS_NEW = false;
        status = 202, text = "SUCCESS: Account already exits. Try loging in? 🤔 => cus_" + FB_CUSTOMER_UUID; 
      }
      
    } catch (e) {
      
    }


    try {
      // Update Documents if UUID exists.
      if (FB_CUSTOMER_UUID != "" && IS_NEW) {
        await updateDocument(
          {
            id: `cus_${FB_CUSTOMER_UUID}`
          },
          "merchants",
          FB_MERCHANT_UUID,
          "customers",
          FB_CUSTOMER_UUID
        );
        status = 200, text = "SUCCESS: User created & added to primary DB. 🧙🏼‍♂️. CustomerID! = cus_" + FB_CUSTOMER_UUID;

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
    let CUSTOMER_DATA: Customer = handleDataToChange(REQUEST_DATA);


    let addresses: Address[] = CUSTOMER_DATA?.addresses || [];
    let addresWithId: Address[] = []

    if (addresses?.length != 0) {
      addresses?.forEach((v, i) => {
        addresWithId.push(
          {
            ...v,
            id: "add_" + crypto.randomBytes(10).toString('hex')
          }
        )
      });
    } 

    CUSTOMER_DATA = {
      ...CUSTOMER_DATA,
      addresses: addresWithId,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };


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
   * Update customer document
   * ! Params NEED TO BE passed as an array with the key: vlaue pair inside another array: [["email": "test@gmail.com"], ...[...]]
   * @param FB_MERCHANT_UUID
   * @param FB_CUSTOMER_UUID
   * @param address_uuid
   */
  app.put("/customers/update/address", async (req: express.Request, res: express.Response) => {
    // Response data to update & send back
    let status = 500, text = "ERROR: Likley internal -- Check Logs. 😅 CUSTOMERS"

    // Req data for updating primary DB
    const REQUEST_DATA: Address = req.body.update_data; 
    const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID; 
    const address_uuid: string = req.body.address_uuid; 

    let customer: Customer = {},
    FB_CUSTOMER_UUID: string = req.body.customer_uuid; 
    FB_CUSTOMER_UUID = FB_CUSTOMER_UUID.substring(4);

    // Get customer data 
    try {
      const doc = await getDocument("merchants",FB_MERCHANT_UUID,"customers",FB_CUSTOMER_UUID);
      customer = {
        ...doc
      }
    } catch (e) {
      
    }
    // TODO: Compare if ID exists

    // TODO: Update with dot notation

    let addresses: Address[] = customer?.addresses || [];
    let addresWithId: Address[] = []

    if (addresses?.length != 0) {
      addresses?.forEach((v, i) => {
        if (v.id == address_uuid) {
          addresWithId =  [
            ...addresWithId,
            {
              ...v,
              id: v.id,
              ...REQUEST_DATA
            }
          ]
        } else {
          addresWithId = [
            ...addresWithId,
            {...v},
          ]
        }
      });
    } 

    customer = {
      ...customer,
      addresses: addresWithId,
      updated_at: admin.firestore.Timestamp.now()
    };

    try {
      // Updae document 
      await updateDocument(
        customer,
        "merchants",
        FB_MERCHANT_UUID,
        "customers",
        FB_CUSTOMER_UUID
      );

      status = 200,
      text = "SUCCESS: Customer updated. 💪🏼 - " + "cus_" + FB_CUSTOMER_UUID; 

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