const {
  validateCustomerBody,
  validateInstallment,
  validateRecurringBasic,
  validateRecurringFixed,
  validateRetrieveInvoice,
  validateRetrievePaymentIntent,
  validateOneTimePayment,
  validateRetrieveCustomerCard,
} = require("../validation/stripe.js");

// **************************************{CREATE CUSTOMER ON STRIPE}*****************************************************
const CREATE_CUSTOMER_ON_STRIPE = async (body, stripe_secret_key) => {
  try {
    const stripe = require("stripe")(stripe_secret_key);
    //validate body with Joi
    let { error, message } = validateCustomerBody(body);
    if (error) {
      return { error: true, message: message, response: null };
    }
    const customer = await new Promise((resolve, reject) => {
      stripe.customers.create(
        {
          email: body.email,
          source: body.source,
        },
        function (err, customer) {
          if (err) {
            console.log("Error In adding Customer: ", err);
            reject(err);
          } else {
            resolve(customer);
          }
        }
      );
    });
    return { error: false, message: "", response: customer };
  } catch (err) {
    return { error: true, message: err.message, response: null };
  }
};

// ************************************{FUNCTION FOR CREATE RECCURING PAYMENT IN CASE OF INSTALLMENT}**************************************

const CREATE_INSTALLMENT_SUBSRIPTION_ON_STRIPE = async (
  body,
  stripe_secret_key
) => {
  try {
    const stripe = require("stripe")(stripe_secret_key);
    //validate body with Joi
    let { error, message } = validateInstallment(body);
    if (error) {
      return { error: true, message: message, response: null };
    }
    const customer = await stripe.customers.retrieve(body.customer_id);
    let defaultCard;
    const defaultCardId = customer.default_source;
    if (defaultCardId) {
      defaultCard = await stripe.customers.retrieveSource(
        body.customer_id,
        defaultCardId
      );
    } else {
      return { error: true, message: "No default card found" };
    }
    let initial_amount;
    if (body.trial_period_days && body.trial_period_days <= 0) {
      //%%
      initial_amount =
        parseInt(body.initial_amount, 10) - body.installment_amount;
      initial_amount = Math.abs(initial_amount);
    } else {
      initial_amount = body.initial_amount;
    }
    let unit_amount = body.unit_amount / body.interval_count;
    const { product, recurringPrice, oneTimePrice } = await new Promise(
      (resolve, reject) => {
        // Create the product first
        stripe.products.create(
          {
            name: body.product_name,
            description: body.description,
          },
          (err, product) => {
            if (err) {
              console.log("Error in creating product: ", err);
              return reject(err);
            }

            let recurringAmount = Math.round(unit_amount * 100);
            let oneTimeAmount = Math.round(initial_amount * 100); // Assuming one_time_amount is defined

            // Create both prices in parallel
            Promise.all([
              new Promise((resolvePrice, rejectPrice) => {
                // Recurring price creation
                stripe.prices.create(
                  {
                    product: product.id,
                    unit_amount: recurringAmount,
                    currency: body.currency,
                    recurring: {
                      interval: body.interval_time,
                      interval_count: body.interval_count,
                    },
                  },
                  (err, recurringPrice) => {
                    if (err) {
                      console.log("Error in creating recurring price: ", err);
                      return rejectPrice(err);
                    }
                    resolvePrice({ recurringPrice });
                  }
                );
              }),
              new Promise((resolvePrice, rejectPrice) => {
                // One-time price creation
                stripe.prices.create(
                  {
                    product: product.id, // Assuming same product ID for one-time price
                    unit_amount: oneTimeAmount,
                    currency: body.currency,
                  },
                  (err, oneTimePrice) => {
                    if (err) {
                      console.log("Error in creating one-time price: ", err);
                      return rejectPrice(err);
                    }
                    resolvePrice({ oneTimePrice });
                  }
                );
              }),
            ])
              .then(([recurringPriceObj, oneTimePriceObj]) => {
                resolve({
                  product,
                  recurringPrice: recurringPriceObj.recurringPrice,
                  oneTimePrice: oneTimePriceObj.oneTimePrice,
                });
              })
              .catch((err) => reject(err));
          }
        );
      }
    );

    // Create the subscription object based on trial period
    const subscriptionObj =
      trial_period_days > 0
        ? {
            customer: body.customer_id,
            payment_behavior: "allow_incomplete",
            items: [{ price: recurringPrice.id }],
            metadata: body.metadata,
            trial_period_days: body.trial_period_days,
            days_until_due: body.trial_period_days,
            default_source: defaultCard.id,
          }
        : {
            customer: body.customer_id,
            payment_behavior: "allow_incomplete",
            items: [{ price: recurringPrice.id }],
            add_invoice_items: [{ price: oneTimePrice.id }],
            metadata: body.metadata,
            default_source: defaultCard.id,
          };

    // Create the subscription
    const subscription = await stripe.subscriptions.create(subscriptionObj);

    return {
      error: false,
      message: "",
      stripe_plan: recurringPrice,
      one_time_initial_price: oneTimePrice,
      stripe_subscription: subscription,
    };
  } catch (err) {
    console.log("Error in creating subscription: ", err);
    return { error: true, message: err.message };
  }
};

// ************************************{FUNCTION FOR RECURRING BASIC SUBSCRIPTION}**************************************
async function CREATE_RECURRING_BASIC_SUBSCRIPTION_ON_STRIPE(
  body,
  stripe_secret_key
) {
  //validate body with Joi
  let { error, message } = validateRecurringBasic(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  try {
    const stripe = require("stripe")(stripe_secret_key);
    // Step 1: Create product
    const product = await new Promise((resolve, reject) => {
      stripe.products.create(
        {
          name: body.product_name,
          description: body.description,
        },
        (err, product) => {
          if (err) {
            console.log("Error in creating product: ", err);
            reject(err);
          } else {
            resolve(product);
          }
        }
      );
    });

    console.log("Product created successfully: ", product.id);

    // Step 2: Create price/plan based on the product id
    const price = await new Promise((resolve, reject) => {
      stripe.plans.create(
        {
          amount: body.unit_amount * 100,
          currency: body.currency,
          interval: body.interval_time,
          product: product.id,
          interval_count: body.interval_count,
        },
        (err, price) => {
          if (err) {
            console.log("Error in creating price: ", err);
            reject(err);
          } else {
            resolve(price);
          }
        }
      );
    });

    console.log("Plan created successfully: ", price.id);

    // Step 3: Create subscription based on the plan id
    let subscriptionData = {
      customer: body.customer_id,
      payment_behavior: "allow_incomplete",
      items: [{ plan: price.id }],
      trial_period_days: body.trial_period_days,
    };

    const subscription = await new Promise((resolve, reject) => {
      stripe.subscriptions.create(subscriptionData, (err, subscription) => {
        if (err) {
          console.log("Error in creating subscription: ", err);
          reject(err);
        } else {
          resolve(subscription);
        }
      });
    });

    console.log("Subscription created successfully: ", subscription.id);

    return {
      error: false,
      message: "Product, plan, and subscription created successfully",
      stripe_plan: price,
      stripe_subscription: subscription,
    };
  } catch (err) {
    console.log("Error: ", err);
    return { error: true, message: err.message };
  }
}

// ************************************{FUNCTION FOR RECURRING FIXED SUBSCRIPTION}**************************************
const CREATE_RECURRING_FIXED_SUBSCRIPTION_ON_STRIPE = async (
  body,
  stripe_secret_key
) => {
  //validate body with Joi
  let { error, message } = validateRecurringFixed(body);
  if (error) {
    return { error: true, message: message, response: null };
  }

  let unit_amount = body.unit_amount / body.interval_count;
  try {
    const stripe = require("stripe")(stripe_secret_key);
    // Step 1: Create a Stripe product
    const product = await new Promise((resolve, reject) => {
      stripe.products.create(
        {
          name: body.product_name,
          description: body.description,
        },
        (err, product) => {
          if (err) {
            console.log("Error in creating product: ", err);
            reject(err);
          } else {
            resolve(product);
          }
        }
      );
    });

    // Step 2: Create a Stripe price for the product

    let amount = Math.round(unit_amount * 100);

    const price = await new Promise((resolve, reject) => {
      stripe.prices.create(
        {
          product: product.id, // Use the product ID from the created product
          unit_amount: amount,
          currency: body.currency,
          recurring: {
            interval: body.interval_time,
            interval_count: body.interval_count,
          },
        },
        (err, price) => {
          if (err) {
            console.log("Error in creating price: ", err);
            reject(err);
          } else {
            resolve(price);
          }
        }
      );
    });

    // Step 3: Create a Stripe subscription for the customer
    let object = {
      customer: body.customer_id,
      payment_behavior: "allow_incomplete",
      items: [{ plan: price.id }], // Use the price ID from the created price
      trial_period_days: body.trial_period_days,
    };

    const subscription = await new Promise((resolve, reject) => {
      stripe.subscriptions.create(object, (err, subscription) => {
        if (err) {
          console.log("Error in creating subscription: ", err);
          reject(err);
        } else {
          resolve(subscription);
        }
      });
    });

    return {
      error: false,
      message: "",
      stripe_plan: price,
      stripe_subscription: subscription,
    };
  } catch (err) {
    console.log("Error in creating product, price, or subscription: ", err);
    return { error: true, message: err.message };
  }
};

// ************************************{ RETRIEVE INVOICE }**************************************

const RETRIEVE_INVOICE_FROM_STRIPE = async (body, stripe_secret_key) => {
  //validate body with Joi
  let { error, message } = validateRetrieveInvoice(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  try {
    const stripe = require("stripe")(stripe_secret_key);
    const invoice = await stripe.invoices.retrieve(body.invoice_id);
    return { error: false, message: "", response: invoice };
  } catch (err) {
    return { error: true, message: err.message, response: null };
  }
};

// ************************************{ RETRIEVE PAYMENT INTENT }**************************************

const RETRIEVE_PAYMENT_INTENT_FROM_STRIPE = async (body, stripe_secret_key) => {
  //validate body with Joi
  let { error, message } = validateRetrievePaymentIntent(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  try {
    const stripe = require("stripe")(stripe_secret_key);
    const paymentIntent = await stripe.paymentIntents.retrieve(
      body.payment_intent_id
    );
    return { error: false, message: "", response: paymentIntent };
  } catch (err) {
    return { error: true, message: err.message, response: null };
  }
};

// ************************************{ CREATE ONETIME PAYMENT }**************************************

const CREATE_ONE_TIME_PAYMENT_ON_STRIPE = async (body, stripe_secret_key) => {
  //validate body with Joi
  let { error, message } = validateOneTimePayment(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  try {
    const stripe = require("stripe")(stripe_secret_key);
    // Step 1: Create the product
    const product = await new Promise((resolve, reject) => {
      stripe.products.create(
        {
          name: body.product_name,
          description: body.description,
        },
        (err, product) => {
          if (err) {
            console.log("Error in creating product: ", err);
            reject(err);
          } else {
            resolve(product);
          }
        }
      );
    });

    // Step 2: Create the payment intent
    const payment = await new Promise((resolve, reject) => {
      stripe.paymentIntents.create(
        {
          amount: body.amount * 100,
          currency: body.currency,
          customer: body.customer_id,
          description: body.description,
          confirm: true,
          metadata: body.metadata,
          return_url: body.return_url,
        },
        (err, payment) => {
          if (err) {
            console.log("Error in creating payment: ", err);
            reject(err);
          } else {
            resolve(payment);
          }
        }
      );
    });

    return {
      error: false,
      message: "",
      payment: payment,
    };
  } catch (err) {
    console.log("Error: ", err);
    return { error: true, message: err.message };
  }
};

// **********************{RETRIVE CUSTOMER CARD}**********************
const RETRIVE_USER_DEFAULT_CARD_FROM_STRIPE = async (
  body,
  stripe_secret_key
) => {
  //validate body with Joi
  let { error, message } = validateRetrieveCustomerCard(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  try {
    const stripe = require("stripe")(stripe_secret_key);
    const customer = await stripe.customers.retrieve(body.customer_id);
    const defaultCardId = customer.default_source;
    if (defaultCardId) {
      const defaultCard = await stripe.customers.retrieveSource(
        body.customer_id,
        defaultCardId
      );
      return { error: false, message: "", card: defaultCard };
    } else {
      return { error: true, message: "No default card found" };
    }
  } catch (error) {
    console.log(error);
    return { error: true, message: error.message, value: "" };
  }
};

// ************************************{ADD WEBHOOK URL ON STRIPE}**************************************
const ADD_WEBHOOK_URL_ON_STRIPE = async (body, stripe_secret_key) => {
  try {
    const stripe = require("stripe")(stripe_secret_key);
    const webhook = await stripe.webhookEndpoints.create({
      url: body.url,
      enabled_events: body.enabled_events,
    });
    return { error: false, message: "", response: webhook };
  } catch (err) {
    return { error: true, message: err.message, response: null };
  }
};

module.exports = {
  CREATE_INSTALLMENT_SUBSRIPTION_ON_STRIPE,
  CREATE_ONE_TIME_PAYMENT_ON_STRIPE,
  CREATE_CUSTOMER_ON_STRIPE,
  RETRIVE_USER_DEFAULT_CARD_FROM_STRIPE,
  RETRIEVE_INVOICE_FROM_STRIPE,
  RETRIEVE_PAYMENT_INTENT_FROM_STRIPE,
  CREATE_RECURRING_BASIC_SUBSCRIPTION_ON_STRIPE,
  CREATE_RECURRING_FIXED_SUBSCRIPTION_ON_STRIPE,
  ADD_WEBHOOK_URL_ON_STRIPE,
};
