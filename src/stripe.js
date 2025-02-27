const {
  validateCustomerBody,
  validateInstallment,
  validateRecurringBasic,
  validateRecurringFixed,
  validateRetrieveInvoice,
  validateRetrievePaymentIntent,
  validateOneTimePayment,
  validateRetrieveCustomerCard,
  validateAddWebhook,
  validateCancelSubscription,
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

    if (body.discount > 0) {
      const amount = body.discount;
      let discountPercentage = 0;

      if (body.discount_type === "percentage") {
        discountPercentage = amount;
      } else {
        discountPercentage = (amount / body.unit_amount) * 100;
      }

      console.log(`Discount Percentage: ${discountPercentage.toFixed(2)}%`);

      // Apply discount based on calculated percentage
      let discountedInitial =
        body.initial_amount * (1 - discountPercentage / 100);
      let discountedInstallmentTotal =
        (body.unit_amount - body.initial_amount) *
        (1 - discountPercentage / 100);

      console.log(discountedInitial.toFixed(2), "Discounted initial amount");
      console.log(
        discountedInstallmentTotal.toFixed(2),
        "Discounted installment total"
      );

      // Adjust interval count for no trial
      // if (body.trial_period_days < 1) {
      //   body.interval_count -= 1;
      // }

      body.unit_amount = discountedInstallmentTotal / body.interval_count;
      console.log(
        body.unit_amount.toFixed(2),
        "Installment amount per interval"
      );
      body.initial_amount = discountedInitial.toFixed(2);
      // if (body.trial_period_days < 1) {
      //   body.initial_amount = parseFloat(body.initial_amount, 10) - body.amount;
      // }
    }
    console.log(body.initial_amount, "body.initial_amount before tax");
    console.log(body.unit_amount, "body.amount before tax");
    // calculating discount
    let tax = 0,
      payment;
    if (body.tax > 0) {
      tax = body.unit_amount * (body.tax / 100);
      body.unit_amount = tax + body.amount;
      body.unit_amount = body.unit_amount.toFixed(2);
      tax = body.initial_amount * (body.tax / 100);
      body.initial_amount = tax + body.initial_amount;
      body.initial_amount = body.initial_amount.toFixed(2);
    }

    let interval_count = 1;
    if (body.interval_time == "custom") {
      body.interval_time = "day";
      interval_count = parseInt(body.custom_days, 10);
    }
    console.log("I am here ---------------");

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
      initial_amount = abs(initial_amount);
    } else {
      initial_amount = body.initial_amount;
    }

    let unit_amount =
      (body.unit_amount - body.initial_amount) / body.interval_count;
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
            console.log("Recurring amount: ---------", recurringAmount);
            console.log("One-time amount: -------------", oneTimeAmount);
            if (body.trial_period_days < 1) {
              oneTimeAmount = oneTimeAmount - recurringAmount;
            }
            console.log("One-time amount after deduction: ", oneTimeAmount);
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
                      interval_count: interval_count,
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
    console.log("recurringPrice successfully:---------- ", recurringPrice);
    // Create the subscription object based on trial period
    const subscriptionObj =
      body.trial_period_days > 0
        ? {
          customer: body.customer_id,
          payment_behavior: "allow_incomplete",
          items: [{ price: recurringPrice.id }],
          metadata: body.metadata,
          trial_period_days: body.trial_period_days,
          default_source: defaultCard.id,
        }
        : {
          customer: body.customer_id,
          payment_behavior: "allow_incomplete",
          items: [{ price: recurringPrice.id }],
          add_invoice_items: [{ price: oneTimePrice.id }],
          metadata: body.metadata,
          // default_source: defaultCard.id,
        };

    // Create the subscription
    const subscription = await stripe.subscriptions.create(subscriptionObj);
    if (body.trial_period_days > 0) {
      await stripe.invoiceItems.create({
        customer: body.customer_id,
        price: oneTimePrice.id,
        subscription: subscription.id,
      });
      await stripe.invoices.create({
        customer: body.customer_id,
      });
    }

    // Retrieve the payment intent from the subscription's latest invoice (if available)
    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
    const paymentIntent = invoice.payment_intent
      ? await stripe.paymentIntents.retrieve(invoice.payment_intent)
      : null;

    return {
      error: false,
      message: "",
      stripe_plan: recurringPrice,
      one_time_initial_price: oneTimePrice,
      stripe_subscription: subscription,
      payment_intent: paymentIntent,
    };
  } catch (err) {
    console.log("Error in creating subscription: --------", err);
    return { error: true, message: err.message };
  }
};

// ************************************{FUNCTION FOR RECURRING BASIC SUBSCRIPTION}**************************************
async function CREATE_RECURRING_BASIC_SUBSCRIPTION_ON_STRIPE(
  body,
  stripe_secret_key
) {
  // Validate body with Joi
  let { error, message } = validateRecurringBasic(body);
  if (error) {
    return { error: true, message: message, response: null };
  }

  try {
    const stripe = require("stripe")(stripe_secret_key);

    if (body.discount > 0) {
      if (body.discount.type == "percentage") {
        console.log("enter into discount percentage case");
        let discount_amount = (body.discount / 100) * body.unit_amount;
        body.unit_amount = (body.unit_amount - discount_amount).toFixed(1);
        body.unit_amount = parseFloat(body.unit_amount);
      } else {
        console.log("enter into fixed percentage case");
        body.unit_amount = (body.unit_amount - body.discount).toFixed(1);
        body.unit_amount = parseFloat(body.unit_amount);
      }
    }
    if (body.tax > 0) {
      tax = body.unit_amount * (body.tax / 100);
      body.unit_amount = tax + body.unit_amount;
    }
    let interval_count = 1;
    if (body.interval_time == "custom") {
      body.interval_time = "day";
      interval_count = body.custom_days;
    }
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
    console.log(body.unit_amount, "body.unit_amountbody.unit_amount");
    console.log(
      Math.round(body.unit_amount * 100),
      "body.unit_amountbody.unit_amount"
    );

    // Step 2: Create price/plan based on the product id
    const price = await new Promise((resolve, reject) => {
      stripe.plans.create(
        {
          amount: Math.round(body.unit_amount * 100),
          currency: body.currency,
          interval: body.interval_time,
          product: product.id,
          interval_count: interval_count,
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

    // Step 4: Retrieve the payment intent from the subscription's latest invoice
    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
    const paymentIntent = invoice.payment_intent
      ? await stripe.paymentIntents.retrieve(invoice.payment_intent)
      : null;

    return {
      error: false,
      message:
        "Product, plan, subscription, and payment intent retrieved successfully",
      stripe_plan: price,
      stripe_subscription: subscription,
      payment_intent: paymentIntent,
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
  // Validate body with Joi
  let { error, message } = validateRecurringFixed(body);
  if (error) {
    return { error: true, message: message, response: null };
  }

  if (body.discount > 0) {
    if (body.discount.type == "percentage") {
      console.log("enter into discount percentage case");
      let discount_amount = (body.discount / 100) * body.unit_amount;
      body.unit_amount = (body.unit_amount - discount_amount).toFixed(1);
      body.unit_amount = parseFloat(body.unit_amount);
    } else {
      console.log("enter into fixed percentage case");
      body.unit_amount = (body.unit_amount - body.discount).toFixed(1);
      body.unit_amount = parseFloat(body.unit_amount);
    }
  }
  if (body.tax > 0) {
    tax = body.unit_amount * (body.tax / 100);
    body.unit_amount = tax + body.unit_amount;
  }

  let unit_amount = body.unit_amount / body.interval_count;

  try {
    const stripe = require("stripe")(stripe_secret_key);

    let interval_count = 1;
    if (body.interval_time == "custom") {
      body.interval_time = "day";
      interval_count = body.custom_days;
    }

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
            interval_count: interval_count,
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
    let subscriptionData = {
      customer: body.customer_id,
      payment_behavior: "allow_incomplete",
      items: [{ plan: price.id }], // Use the price ID from the created price
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

    // Step 4: Retrieve the payment intent from the subscription's latest invoice
    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
    const paymentIntent = invoice.payment_intent
      ? await stripe.paymentIntents.retrieve(invoice.payment_intent)
      : null;

    return {
      error: false,
      message:
        "Product, price, subscription, and payment intent retrieved successfully",
      stripe_plan: price,
      stripe_subscription: subscription,
      payment_intent: paymentIntent,
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

    if (body.discount > 0) {
      if (body.discount.type == "percentage") {
        console.log("enter into discount percentage case");
        let discount_amount = (body.discount / 100) * body.amount;
        body.amount = (body.amount - discount_amount).toFixed(2);
        body.amount = parseFloat(body.amount);
      } else {
        console.log("enter into fixed percentage case");
        body.amount = (body.amount - body.discount).toFixed(2);
        body.amount = parseFloat(body.amount);
      }
    }
    if (body.tax > 0) {
      tax = parseFloat(body.amount.toFixed(1)) * (body.tax / 100);
      body.amount = tax + parseFloat(body.amount.toFixed(1));
    }
    console.log("Amount after discount: ---------", body.amount);
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
    // console.log(price_amount, "price_amount");
    console.log(body.amount, "body.amount");
    console.log(Math.round(body.amount * 100) / 100, "value in package----");
    let price_amount = Math.round(Math.abs(body.amount * 100));
    price_amount = parseFloat(price_amount.toFixed(2));
    console.log(price_amount, "price_amount");
    const payment = await new Promise((resolve, reject) => {
      stripe.paymentIntents.create(
        {
          amount: price_amount,
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
  // Validate body with Joi
  let { error, message } = validateAddWebhook(body);
  if (error) {
    return { error: true, message: message, response: null };
  }

  try {
    const stripe = require("stripe")(stripe_secret_key);

    // Fetch all existing webhooks
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });

    // Filter out webhooks with the same URL
    const duplicateWebhooks = webhooks.data.filter(webhook => webhook.url === body.webhook_url);

    // Delete all duplicate webhooks
    for (const webhook of duplicateWebhooks) {
      await stripe.webhookEndpoints.del(webhook.id);
    }

    // Create a new webhook
    const newWebhook = await stripe.webhookEndpoints.create({
      url: body.webhook_url,
      enabled_events: body.enabled_events,
    });

    return { error: false, message: "Webhook updated successfully", response: newWebhook };
  } catch (err) {
    return { error: true, message: err.message, response: null };
  }
};

//************************{CANCEL SUBSCRIPTION ON STRIPE}*************************
const CANCEL_SUBSCRIPTION_IMMEDIATELY = async (
  subscription_id,
  stripe_secret_key
) => {
  //validate body with Joi
  let { error, message } = validateCancelSubscription(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  try {
    let stripe = require("stripe")(stripe_secret_key);
    const subscription = new Promise((resolve, reject) => {
      stripe.subscriptions.del(
        subscription_id,
        // { invoice_now: true, prorate: true },
        function (err, subscription) {
          if (err) {
            console.log("Error: ", err);
            reject("ERROR.");
          } else {
            resolve(subscription);
          }
        }
      );
    });
    return { error: false, message: "", subscription: subscription };
  } catch (err) {
    return { error: true, message: err.message, response: null };
  }
};

// **********************{CANCEL SUBSCRIPTION AT PERIOD END}**********************
const CANCEL_SUBSCRIPTION_AT_PERIOD_END = async (subscription_id, stripe) => {
  try {
    const subscription = await stripe.subscriptions.update(subscription_id, {
      cancel_at_period_end: true,
    });
    return { error: false, message: "", subscription: subscription };
  } catch (error) {
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
  CANCEL_SUBSCRIPTION_IMMEDIATELY,
};
