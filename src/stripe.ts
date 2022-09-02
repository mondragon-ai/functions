// IMPORTS
// import { updateCustomerDocumentWithID } from "./firebase";
// import * as functions from "firebase-functions";
import { LineItem } from "./lib/types/orders";
import {EcomReturn, StripeCustomer} from "./lib/types/stipe"

// ============================================================================================================
const Stripe = require("stripe");
export const stripe = Stripe('sk_test_51LCmGyE1N4ioGCdRa25w4oGdXDF9jx72EaLmS7PhXS1SNpzOrPReDMn5T5ERAM6nxc8KTafzhDuWKl3Y5Xmt191j00JfLaAuaJ'); //Stripe(process.env.STRIPE_SECRET);


/**
 * Create a stripe customer and a payment intent secrete key to receive card and store in the vault.
 * @param stripeCustomer
 * @returns {EcomReturn} 200 || 400
 */
export const createStripeCustomer = async (
  stripeCustomer: StripeCustomer
): Promise<EcomReturn> => {
  let STRIPE_UUID: string, 
  STRIPE_PM: string, 
  STRIPE_SECERET: string,
  status: number = 500,
  text: string = "ERROR: Linkly internal. check stripe logs. 💩 ";
  const {address, name, email, metadeta, phone, description} = stripeCustomer

  console.log(stripeCustomer)

  try {
    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      address: {
        line1: address.line1 || "420 Bigly st",
        line2: address.line2  || "",
        city: address.city || "Denver",
        state: address.state || "Co",
        postal_code:  address.zip || ""
      },
      email: email || "allmight@gobigly.com",
      name: name || "All Might",
      phone: phone || "",
      description: description || "Store Front",
      metadata: metadeta || {
        external_id: "cus_" + ""
      }
    });
    STRIPE_UUID = stripeCustomer.id
  } catch (e) {
    return {
      status: status, 
      text: text + " Creating Customer.",
    }
  }


  console.log(STRIPE_UUID)

  try {
    // Create a SetUp Intent to get client side secrete key
    const paymentIntent = await stripe.setupIntents.create({
      customer: STRIPE_UUID,
      payment_method_types: ['card']
    });

    STRIPE_PM = paymentIntent.id;
    STRIPE_SECERET = paymentIntent.client_secret;

    return {
      status: 200, 
      text: "SUCCESS: Customer Created. Ready to be charged. 🤑 " + STRIPE_UUID,
      data: {
        stripe_uuid: STRIPE_UUID,
        stripe_pm: STRIPE_PM,
        stripe_client_secrete: STRIPE_SECERET
      }
    }
  } catch (e) {
    return {
      status: status, 
      text: text + " Creating secret.",
    }
  }
};


/**
 * Updates the strie customer wiht the billing&shipping wiht the same address. Primary DB created as well
 * @param email 
 * @param stripe_uuid 
 * @param shipping 
 * @returns 
 */
 export const updateStripeCustomer = async (
  email: string,
  stripe_uuid: string,
  shipping: any
): Promise<EcomReturn> => {
  // Define vars
  let PUSH_DATA = {},
  status: number = 500,
  text: string = "ERROR: Linkly internal. check stripe logs. 💩 ";
  const STRIPE_UUID: string = stripe_uuid;
  const {address, name} = shipping;
  const {line1, city, state, zip} = address;
  const REQUEST_DATA = [
    [email, email],
    [name, name],
    [shipping, {
      name:  name,
      address: {
        line1: line1,
        city: city,
        state: state,
        postal_code: zip,
        country: "US"
      }
    }],
    [address, {
      city: city,
      country: "US",
      line1: line1,
      postal_code: zip,
      state: state
    }]
  ];

  REQUEST_DATA.forEach((v,i) => {
    PUSH_DATA = {
      [v[0]]: v[1]
    }
  }); 

  console.log("141: Stripe ", PUSH_DATA)

  try {
    
    // Update Stripe Customer 
    await stripe.customers.update(
      STRIPE_UUID,
      PUSH_DATA
    );

    return {
      status: 200, 
      text: "SUCCESS: Customer updated. 🔨 " + STRIPE_UUID,
    }

  } catch {
    return {
      status: status, 
      text: text + " Updating stripe customer object.",
    }
  }

};

/**
 * Get Stripe pm & create pi to charge customer. If cusomer does not have a PM availabel handle before submitting to charge.
 * TODO: Redirect to card form with client secret. 
 * @param STRIPE_UUID 
 * @param email 
 * @param price 
 * @returns 
 */
export const handleStripeChargeWithCard = async (
  STRIPE_UUID: string,
  email: string,
  price: number,
): Promise<EcomReturn>  => {
  let PM_UUID: string = "";
  let status: number = 500;
  let text: string = "ERROR: Linkly internal. check stripe logs. 💩 ";

  try {
    // Get Customers Payment Methods (from PI)
    const paymentMethods = await stripe.paymentMethods.list({
      customer: STRIPE_UUID,
      type: "card"
    });

    // Check if the PM exists
    if ( paymentMethods.data[0].id ) {
      PM_UUID = paymentMethods.data[0].id;
      status = 200;
      text= "SUCCESS: Payment Method retrieved 🙌🏼 - " + PM_UUID;
    } 
    
  } catch (e) {
    return {
      status: status, 
      text: text + "Retreiving PM",
    }
  }

  try {
    // Make the initial Stripe charge based on product price
    const stripe_pi = await stripe.paymentIntents.create({
      amount: price,
      currency: 'USD',
      customer: STRIPE_UUID,
      payment_method: PM_UUID,
      off_session: true,
      confirm: true,
      receipt_email: email, 
    });

    return {
      status: 200,
      text: "SUCCESS: Customer charged with saved card on file 🙌🏼 - " + stripe_pi,
      data: {
        stripe_pi: stripe_pi
      }
    }
    
  } catch (e) {
    return {
      status: status, 
      text: text + "Retreiving PM",
    }
  }
    
};

/**
 * Create subscription based on product & customer. write in subscirpiton[] & ID! in the customer array of SubscriptionSummmary[]
 * @param STRIPE_UUID 
 * @param STRIPE_PM 
 * @returns 
 */
export const createSubscription = async (
  STRIPE_UUID: string,
  STRIPE_PM: string,
  product: LineItem
) => {
  
  let SRIPE_SUBSCRIPTION_PRODUCT: string = "prod_M5BDYb70j19Und";
  let status: number = 500;
  let text: string = "ERROR: Linkly internal. check stripe logs. 💩 ";
  
  try {
    // Create charte using PM stored 
    const subscription = await stripe.subscriptions.create({
      customer: STRIPE_UUID,
      items: [
        {
          price_data: {
            currency: "usd",
            product: SRIPE_SUBSCRIPTION_PRODUCT,
            recurring: {
              interval: "month"
            },
            unit_amount: 4000
          }
        },
      ],
      default_payment_method: STRIPE_PM,
    });

    // Handle results
    return {
      status: status,
      text: text + " Subscription",
      data: new Object(subscription)
    }
  } catch (err) {
    return {
        status: status,
        text: text + " Subscription",
        data: null
      }
  }
};


/**
 * Create Subscription Product in stripe || in primary DB
 * @param STRIPE_UUID 
 * @param STRIPE_PM 
 * @returns 
 */
 export const createSubscriptionProduct = async (
    STRIPE_UUID: string,
    STRIPE_PM: string
  ) => {
    
    let SRIPE_SUBSCRIPTION_PRODUCT: string = "prod_M5BDYb70j19Und";
    let status: number = 500;
    let text: string = "ERROR: Linkly internal. check stripe logs. 💩 ";
    
    try {
      // Create charte using PM stored 
      const subscription = await stripe.subscriptions.create({
        customer: STRIPE_UUID,
        items: [
          {
            price_data: {
              currency: "usd",
              product: SRIPE_SUBSCRIPTION_PRODUCT,
              recurring: {
                interval: "month"
              },
              unit_amount: 4000
            }
          },
        ],
        default_payment_method: STRIPE_PM,
      });
  
      // Handle results
      return {
        status: status,
        text: text + " Subscription",
        data: new Object(subscription)
      }
    } catch (err) {
      return {
          status: status,
          text: text + " Subscription",
          data: null
        }
    }
  };
  
