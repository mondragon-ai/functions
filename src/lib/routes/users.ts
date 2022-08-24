import * as express from "express";
// import * as functions from "firebase-functions";
// import {createDocument} from "../../firebase";
import * as crypto from "crypto";
import { addNewUserToPrimaryDB } from "../helpers/users";
import { deleteDocumentWithID, updateDocument } from "../../firebase";
/**
 * Merhcant API Routes 
 * @param app 
 * @param db 
 */
export const usersRoutes = async (app: express.Express, db: FirebaseFirestore.Firestore) => {

  app.get("/users/test", async (req: express.Request, res: express.Response) => {
    res.status(200).json("SUCCESS");
  });

  /**
   * Create NEW User document in primary DB 
   * @param password
   * @param email
   * @param first_name
   * @param last_name
   */
  app.post("/users/create", async (req: express.Request, res: express.Response) => {
    const FB_UUID: string = "QilaBD5FGdnF9iX5K9k7"
    let user_data: {} = 
      {
        id: crypto.randomUUID(),
        first_name: "Obi",
        last_name: "Kanobi",
        name: "Obi Kanobi",
        scopes: "all",
        password: "sha256(passwrod + email)"
      }

    const result = await addNewUserToPrimaryDB(FB_UUID, user_data);
    res.status(result.status).json(result.text);

  });

  /**
   * Create NEW User document in primary DB 
   * @param password
   * @param email
   * @param first_name
   * @param last_name
   */
  app.put("/users/update", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 😭. "

    const FB_UUID: string = "QilaBD5FGdnF9iX5K9k7";
    const FB_USER_UUID: string= "Xk2SzjgBoJh8dyUW3VcR";
    const USER_INFO =
    {
      first_name: "Obi",
      last_name: "Kanobi",
      name: "Obi Kanobi",
      scopes: "all",
      password: "sha256(passwrod + email)"
    }

    try {

      const result = await updateDocument(USER_INFO, "merchants", FB_UUID, "users", FB_USER_UUID);
      console.log(result);

      status = 200;
      text = "SUCCESS: User updated succesffully 👏🏻. "

    } catch (e) {
      
    }
    res.status(status).json(text);
  });


  /**
   * Create NEW User document in primary DB 
   * @param password
   * @param email
   * @param first_name
   * @param last_name
   */
   app.delete("/users", async (req: express.Request, res: express.Response) => {
    let status = 500, text = "ERROR: Likely internal -- Check Logs 😭. "

    const FB_MERCHANT_UUID: string = "QilaBD5FGdnF9iX5K9k7";
    const FB_USER_UUID: string= "PR7boV3Blce6oXsQJiPU";

    try {

      await deleteDocumentWithID("merchants", FB_MERCHANT_UUID, "users", FB_USER_UUID);

      status = 200;
      text = "SUCCESS: User updated succesffully 👏🏻. ";

    } catch (e) {
      
    }
    res.status(status).json(text);
  });

}