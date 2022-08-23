import * as functions from "firebase-functions";
import {rest} from "./rest";
import {db} from "./firebase";

const app = rest(db);
const settings: functions.RuntimeOptions = {
    timeoutSeconds: 60,
    memory: '512MB'
}
export const platform = functions.runWith(settings).https.onRequest(app);
