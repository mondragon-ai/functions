import * as express from "express";

export const paymentRoutes = (app: express.Router) => {
  app.get("/payments/test", async (req: express.Request, res: express.Response) => {
    let status = 200, text = "ERROR: Likely internal -- Check payment Logs 😅. ";
    res.status(status).json(text);
  });

  // TODO: CREATE || FIND customer && Send back client secret

  // TODO: handle payment

  // TODO: Store card in vault 

  // TODO: Add Payment method

  // TODO: Remove Payment Method

  // TODO: webhook? Listen to subscirption

  // TODO: onCreate draft_order send checkout URL link

  // TODO: Handle Refund

};