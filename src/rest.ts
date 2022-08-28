import * as express from "express";
import * as cors from "cors";
import {merchantRoutes} from "./lib/routes/merchant"
import { usersRoutes } from "./lib/routes/users";
import { customersRoutes } from "./lib/routes/customers";
import { productRoutes } from "./lib/routes/products";
import { cartRoutes } from "./lib/routes/carts";
import { discountRoutes } from "./lib/routes/discounts";

export const rest = (db: FirebaseFirestore.Firestore) => {

    // Instantiate Express
    const app = express();
    const bearerToken = require("express-bearer-token");
    const API_PREFIX = "platform";

    // Strip API from URL 
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (req.url.indexOf(`/${API_PREFIX}/`) ==0 ) {
            req.url = req.url.substring(API_PREFIX.length + 1);
        }
        next();
    })

    // Handle Reqs
    app.use(bearerToken());
    app.use(express.json())
    app.use(cors({ origin: true }))

    // Handle Routes
    merchantRoutes(app, db);
    usersRoutes(app, db);
    customersRoutes(app, db);
    productRoutes(app, db);
    cartRoutes(app, db);
    discountRoutes(app);
 
    return app
}