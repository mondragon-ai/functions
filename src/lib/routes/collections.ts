import * as express from "express";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createDocument, getProductsWithTags, updateDocument } from "../../firebase";
import { Product } from "../types/products";

export type CollectionProducts = 
    {
        id: string,
        title: string,
        status: boolean
    }

export type CreateColleciton = {
    title: string,
    status: boolean,
    compare_against: string[],
    image: string,
    condition: string,
    item_to_compare: string,
    product_list?: CollectionProducts
}

export type Collection = {
    title: string,
    status: boolean,
    compare_against: string[],
    condition: string,
    image?: string,
    item_to_compare: string,
    product_list: CollectionProducts,
    updated_at: FirebaseFirestore.Timestamp,
    created_at: FirebaseFirestore.Timestamp,
}

export const collectionRoutes = async (app: express.Router)  => {

    app.post("/collections/test", async (req: express.Request, res: express.Response) => {
        // Status & Text to send back for handling 
        let status = 500, text = "ERROR: Check logs - Likely collections 😭";
        
        const data = {};

        res.status(status).json({m: text, d: data});
    });

    app.post("/collections/create", async (req: express.Request, res: express.Response) => {
        // Status & Text to send back for handling 
        let status = 500, text = "ERROR: Check logs - Likely collections 😭";

        // Merchant Token ==> Soon to be header
        const FB_MERCHANT_UUID: string = req.body.FB_MERCHANT_UUID;
        
        // New data used to create
        const data: CreateColleciton = req.body.new_data;

        // Products with tags
        let product_list: CollectionProducts[] = [];

        let collection_id: string = "";

        if (data?.compare_against?.length > 0) {
            data.compare_against.forEach(async (v) => {

                const result = await getProductsWithTags(
                    {
                        key: "tags",
                        value: v
                    },
                    "merchants",FB_MERCHANT_UUID,
                    "products"
                )

                if (result.size > 0) {
                    functions.logger.info(" ==> EXISTS");
                    let i = 0;

                    result.forEach((product) => {

                        functions.logger.info(i);
                        const p: Product = {...product.data(), updated_at: admin.firestore.Timestamp.now()};
                        functions.logger.info(p);

                        product_list = [
                            ...product_list,
                            {
                                id: p?.id ? p.id : "",
                                title: p?.title ? p.title : "",
                                status: p?.status ? p.status : false 
                            }
                        ];

                        // if (i === 0) {
                        //     product_list.
                        //     product_list.concat({
                        //         id: p?.id ? p.id : "",
                        //         title: p?.title ? p.title : "",
                        //         status: p?.status ? p.status : false 
                        //     });
                        // } else {
                        //     product_list.concat({
                        //         id: p?.id ? p.id : "",
                        //         title: p?.title ? p.title : "",
                        //         status: p?.status ? p.status : false 
                        //     });
                        // }
                        // console.log(product_list);
                        functions.logger.info(product_list);
                        i = i + 1;
                    });

                } else {
                    functions.logger.info(" ==> !EXISTS");
                }
            })
        }

        try {

            collection_id = await createDocument(
                "merchants", FB_MERCHANT_UUID,
                "collections", "",
                {
                    ...data,
                    product_list: [...product_list],
                    updated_at: admin.firestore.Timestamp.now(),
                    created_at: admin.firestore.Timestamp.now(),
                }
            )
            
        } catch (e) {
            functions.logger.error(text + " - Creating Document");
            text = text + " - Creating Document";
        }

        try {

            await updateDocument(
                {
                    id: "col_" + collection_id,
                    product_list: product_list,
                    updated_at: admin.firestore.Timestamp.now(),
                },
                "merchants", FB_MERCHANT_UUID,
                "collections", collection_id
            )
            
        } catch (e) {
            functions.logger.error(text + " - Updating Documen");
            text = text + " - Updating Document";
        }

        

        res.status(status).json({m: text, d: product_list});
    });
}