import * as functions from "firebase-functions";
import {rest} from "./rest";
import {db} from "./firebase";

const app = rest(db);
const settings: functions.RuntimeOptions = {
    timeoutSeconds: 60,
    memory: '512MB'
}

export const platform = functions.runWith(settings).https.onRequest(app);


// TODO: Create folder/{FnName}
// export const testFn = functions.firestore
//     .document("merchants/QilaBD5FGdnF9iX5K9k7/customers/{customersID}")
//     .onCreate(snap => {
//         const customer = snap.data();
//         console.log(customer)
// });


// TODO: Create folder/{FnName}
// export const scheduledFunction = functions.pubsub
//     .schedule('every 5 minutes')
//     .timeZone('America/New_York')
//     .onRun((context) => {
//         console.log('This will be run every 5 minutes!');
//         console.log(context);
//         return null;
//     }
// );