import * as express from "express";

export const paymentRoutes = (app: express.Router) => {
  app.get("/payments/test", async (req: express.Request, res: express.Response) => {
    let status = 200, text = "ERROR: Likely internal -- Check payment Logs 😅. ";
    res.status(status).json(text);
  });
};