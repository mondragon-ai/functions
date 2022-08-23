import { getDocument } from "../../firebase"

export const getDocumentWithShop = async (shop: string) => {

  const doc = await getDocument("merchants", "DepIhbkvkSwMfjqU3bem","","");

  if (doc) {
    return {
      status: 200,
      text: "SUCCESS: Merchant shop found 💯. ",
      data: doc
    }

  } else {
    return {
      status: 500,
      text: "ERROR: Likley internal -- Check Logs",
      data: null
    }
  }
  
}