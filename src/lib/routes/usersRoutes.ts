import * as express from "express";
import * as functions from "firebase-functions";
import {createDocument} from "../../firebase";
import * as crypto from "crypto";
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
    let status = 500, text = "ERROR: Likley Internal -- Check Logs. "
    const FB_UUID: string = "QilaBD5FGdnF9iX5K9k7"
    let user_list: any[] = [
      {
        id: crypto.randomUUID(),
        first_name: "Obi",
        last_name: "Kanobi",
        name: "Obi Kanobi",
        scopes: "all",
        password: "sha256(passwrod + email)"

      }
    ]

    try {
      const result = await createDocument("merchants", FB_UUID, "users", {users: user_list})
      status = 200;
      text = "SUCCESS: User succesfully created with the ID! of " + result;
      
    } catch (e) {
      functions.logger.error(text,e)
      res.status(status).json(text)
    }    

    res.status(status).json(text)
  });
}