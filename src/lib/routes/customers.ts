// import * as funcitons from "firebase-functions";
import * as express from "express";
import { createDocument,
    deleteDocumentWithID,
    updateCustomerDocumentWithID,
    updateDocument 
} from "../../firebase";
import * as crypto from "crypto"
import { handleDataToChange } from "../helpers/firebase";
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
    res.status(status).json(text)

  })
  /**
   * Create store customer instance
   * @param email
   * @param FB_UUID
   * @param first_name
   * @param last_name
   * @param addresses?
   * @param currency_code?
   * @param password?
   * @param tags?
   * @param last_order_id?
   * @param verified_email?
   * @param status?
   */
  app.post("/customers/create", async (req: express.Request, res: express.Response) => {
    let status = 500, 
    text = "ERROR: Likley internal -- Check Logs. 😅",
    email: any = "angel@gobigly.com",
    FB_CUSTOMER_UUID: string; 
    const FB_MERCHANT_UUID = "QilaBD5FGdnF9iX5K9k7";
    const CUSTOMER_DATA = {
      email: email,
      first_name: "Darth",
      last_name: "Vader",
      addresses: [
        {
          id: "cad_" + crypto.randomUUID(),
          title: "main",
          type: "BOTH",
          isDefault: true,
          line1: "420 Bigly LN",
          line2: "",
          city: "fayetteville",
          state:"Arkansas",
          zip: "72704"
        }
      ],
      currency_code: "USD", // use store 
      password: "sha256(password + email)",
      last_order_id: "GB-" + crypto.randomUUID(),
      tags: ["VIP"],
      verified_email: false,
      status: "PAYING"
    }

    // TODO: REG EX CHECK ON VALID EMAIL BOTH FE && BE
    try {
      if (!email) {
        status = 422, text = "ERROR: Valid email required. 🤷🏻‍♂️";
      } else {
        FB_CUSTOMER_UUID = await createDocument("merchants", FB_MERCHANT_UUID, "customers", CUSTOMER_DATA);
        
        if (FB_CUSTOMER_UUID) {
          await updateDocument({...CUSTOMER_DATA, id: `cus_${FB_CUSTOMER_UUID}`}, "merchants", FB_MERCHANT_UUID, "users", FB_CUSTOMER_UUID);
          status = 200, text = "SUCCESS: User created & added to primary DB. 🧙🏼‍♂️. CustomerID! = " + FB_CUSTOMER_UUID;
        } else {
          status = 400, text = "ERROR: User NOT created -- Check Logs. 🤯";
        }
      };
      
    } catch (e) {
      res.status(status).json(text)
    }
    res.status(status).json(text)
  });

  /**
   * Update customer document
   * @param NEEDS TO BE passed as an array with the key: vlaue pair inside another array: [["email": "test@gmail.com"], ...[...]]
   * @param email?
   * @param FB_MERCHANT_UUID
   * @param FB_CUSTOMER_UUID
   * @param first_name?
   * @param last_name?
   * @param addresses?
   * @param currency_code?
   * @param password?
   * @param tags?
   * @param last_order_id?
   * @param verified_email?
   * @param status?
   */
  app.put("/customers/update", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likley internal -- Check Logs. 😅"

    // Req data for update
    let email: any = "angel@gobigly.com"; 
    const FB_MERCHANT_UUID = "QilaBD5FGdnF9iX5K9k7";
    const FB_CUSTOMER_UUID = "5OokQWw7JgG7JlIj67ZT";

    const REQUEST_DATA = [
      ["email", email],
      ["first_name", "Darth"],
      ["last_name", "Maul"],
      ["verified_email", true],
    //   ['addresses', [
    //     {
    //       title: "HOME",
    //       type: "BOTH",
    //       isDefault: true,
    //       line1: null,
    //       line2: "",
    //       city: "fayetteville",
    //       state:"Arkansas",
    //       zip: "72704"
    //     }
    //   ]],
    //   ["currency_code", "USD"], // use um store no FE
    //   ["password", "sha256(password + email)"],
    //   ["last_order_id", "GB-" + crypto.randomUUID()],
    //   ["tags", ["VIP"]],
    //   ["verified_email", true],
    //   ["status", "PAYING"]
    ]

    // Get the data to be changed from the request object and handle to return {[key]: value} pairs. 
    const CUSTOMER_DATA = handleDataToChange(REQUEST_DATA);

    try {
      // Updae document 
      await updateCustomerDocumentWithID(CUSTOMER_DATA, "merchants", FB_MERCHANT_UUID, "customers", FB_CUSTOMER_UUID);

      status = 200, text = "SUCCESS: Customer updated. 💪🏼 "; // Colocar os [key] 
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
    let status = 500, text = "ERROR: Likley internal -- Check Logs. 😅"

    // Req data for update
    const FB_MERCHANT_UUID = "QilaBD5FGdnF9iX5K9k7";
    const FB_CUSTOMER_UUID = "38z8exyAKwsYRoZ3QKbo";

    try {
      // Updae document 
      await deleteDocumentWithID("merchants", FB_MERCHANT_UUID, "customers", FB_CUSTOMER_UUID);

      status = 200, text = "SUCCESS: Customer updated. 💪🏼 "; // Colocar os [key] 
    } catch (e) {
      res.status(status).json(text)
    }
    res.status(status).json(text)
  });



};