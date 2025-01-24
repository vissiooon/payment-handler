const paypal = require("paypal-rest-sdk");

const {
  validateConfigurePaypal,
  validateOneTimePaymentPlan,
  validateRecurringPaymentPlan,
  validateFixedRecurringPayment,
  validateInstallmentsPayment,
  validateExecutePayment,
  validateBillingAgreementExecute,
  validateUpdateWebhookUrl,
} = require("../validation/paypal");
const axios = require("axios");

const configurePaypal = async (body, paypal) => {
  //validate the body with joi
  let { error, message } = validateConfigurePaypal(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  try {
    paypal.configure({
      mode: body.mode ?? "sandbox", // 'sandbox' or 'live'
      client_id: body.client_id,
      client_secret: body.client_secret,
    });
    return { error: false, message: "", response: paypal };
  } catch (error) {
    return { error: true, message: error.message, response: null };
  }
};

const createPaymentPlanOneTime = (body, paypal) => {
  //validate the body with joi
  let { error, message } = validateOneTimePaymentPlan(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  body.currency = body.currency.toUpperCase();
  if (body.discount > 0) {
    if (body.discount.type == "percentage") {
      console.log("enter into discount percentage case");
      let discount_amount = (body.discount / 100) * body.amount;
      body.amount = (body.amount - discount_amount).toFixed(1);
      body.amount = parseFloat(body.amount);
    } else {
      console.log("enter into fixed percentage case");
      body.amount = (body.amount - body.discount).toFixed(1);
      body.amount = parseFloat(body.amount);
    }
  }
  if (body.tax > 0) {
    tax = body.amount * (body.tax / 100);
    body.amount = tax + body.amount;
  }
  return new Promise((resolve) => {
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: body.return_url,
        cancel_url: body.return_url,
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: "item",
                sku: "item",
                price: body.amount,
                currency: body.currency,
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: body.currency,
            total: body.amount,
            details: {
              subtotal: body.amount,
              tax: "0.00", // Include tax if applicable
              shipping: "0.00", // Include shipping if applicable
            },
          },
          description: "This is the payment description.",
        },
      ],
    };

    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        console.error("Error in PayPal payment creation:", error);
        resolve({
          error: true,
          message: error.response
            ? error.response.details
            : "Could not make payment",
          response: null,
        });
      } else {
        console.log("Payment created successfully:", payment);
        let link = "";
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel == "approval_url") {
            link = payment.links[i];
          }
        }
        resolve({ error: false, message: "", response: { payment, link } });
      }
    });
  });
};

const createPaymentPlanRecurring = async (body, paypal) => {
  //validate the body with joi
  let { error, message } = validateRecurringPaymentPlan(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  let link = "";
  body.currency = body.currency.toUpperCase();
  if (body.discount > 0) {
    if (body.discount.type == "percentage") {
      console.log("enter into discount percentage case");
      let discount_amount = (body.discount / 100) * body.amount;
      body.amount = (body.amount - discount_amount).toFixed(1);
      body.amount = parseFloat(body.amount);
    } else {
      console.log("enter into fixed percentage case");
      body.amount = (body.amount - body.discount).toFixed(1);
      body.amount = parseFloat(body.amount);
    }
  }
  if (body.tax > 0) {
    tax = body.amount * (body.tax / 100);
    body.amount = tax + body.amount;
  }

  let custom_days = 1;
  if (body.frequency == "custom") {
    body.frequency = "DAY";
    custom_days = body.custom_days;
  }
  return new Promise(async (resolve) => {
    try {
      console.log(
        new Date(Date.now() + 60000).toISOString(),
        "date in recurring case"
      );
      let UppercaseFrequency = body.frequency.toUpperCase();

      let payment_def = [
        {
          name: "Regular Payments",
          type: "REGULAR",
          frequency: UppercaseFrequency,
          frequency_interval: String(custom_days),
          cycles: "0",
          amount: {
            currency: body.currency,
            value: body.amount,
          },
        },
      ];
      // in case of trial period
      if (body.trial_period_days > 0) {
        payment_def.unshift({
          // Use unshift to place the trial period first
          name: "Trial Period",
          type: "TRIAL",
          frequency: "DAY",
          frequency_interval: "1",
          cycles: body.trial_period_days.toString(), // Convert trial period days to string
          amount: {
            currency: body.currency,
            value: "0.00", // Free trial
          },
        });
      }
      // Define the payment plan
      const create_payment_json = {
        name: body.plan_name,
        description: "Monthly subscription",
        type: "INFINITE",
        payment_definitions: payment_def,
        merchant_preferences: {
          setup_fee: {
            currency: body.currency,
            value: "0.00",
          },
          cancel_url: body.return_url,
          return_url: body.return_url,
          max_fail_attempts: "1",
          auto_bill_amount: "YES",
          initial_fail_amount_action: "CONTINUE",
        },
      };

      // Create the payment plan
      const payment = await new Promise((resolve, reject) => {
        paypal.billingPlan.create(create_payment_json, (error, payment) => {
          if (error) {
            reject(
              error.response ? error.response.details : "Could not make payment"
            );
          } else {
            resolve(payment);
          }
        });
      });

      // Activate the payment plan
      const billing_plan_update_attributes = [
        {
          op: "replace",
          path: "/",
          value: {
            state: "ACTIVE",
          },
        },
      ];

      await new Promise((resolve, reject) => {
        paypal.billingPlan.update(
          payment.id,
          billing_plan_update_attributes,
          (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          }
        );
      });

      // Define the billing agreement
      const billing_agreement_attributes = {
        name: "Recurring Agreement Name",
        description: "Recurring Agreement Description",
        start_date: new Date(Date.now() + 60000).toISOString(), // Start date of the agreement
        plan: {
          id: payment.id,
        },
        payer: {
          payment_method: "paypal",
        },
      };

      // Create the billing agreement
      const billingAgreement = await new Promise((resolve, reject) => {
        paypal.billingAgreement.create(
          billing_agreement_attributes,
          (error, billingAgreement) => {
            if (error) {
              reject(
                error.response
                  ? error.response.details
                  : "Could not create billing agreement"
              );
            } else {
              resolve(billingAgreement);
            }
          }
        );
      });
      for (let i = 0; i < billingAgreement.links.length; i++) {
        if (billingAgreement.links[i].rel == "approval_url") {
          link = billingAgreement.links[i];
        }
      }
      // Resolve the billing agreement
      resolve({
        error: false,
        message: "",
        response: { billingAgreement, link },
      });
    } catch (error) {
      resolve({ error: true, message: error.message, response: null });
    }
  });
};

const createPaymentFixedRecurring = async (body, paypal) => {
  //validate the body with joi
  let { error, message } = validateFixedRecurringPayment(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  let link = "";
  body.currency = body.currency.toUpperCase();
  if (body.discount > 0) {
    if (body.discount.type == "percentage") {
      console.log("enter into discount percentage case");
      let discount_amount = (body.discount / 100) * body.amount;
      body.amount = (body.amount - discount_amount).toFixed(1);
      body.amount = parseFloat(body.amount);
    } else {
      console.log("enter into fixed percentage case");
      body.amount = (body.amount - body.discount).toFixed(1);
      body.amount = parseFloat(body.amount);
    }
  }
  if (body.tax > 0) {
    tax = body.amount * (body.tax / 100);
    body.amount = tax + body.amount;
  }
  if (body.cycles > 0) {
    body.amount = body.amount / body.cycles;
  }

  let custom_days = 1;
  if (body.frequency == "custom") {
    body.frequency = "DAY";
    custom_days = body.custom_days;
  }

  return new Promise(async (resolve) => {
    try {
      console.log(
        new Date(Date.now() + 60000).toISOString(),
        "date in recurring fixed case"
      );
      let UppercaseFrequency = body.frequency.toUpperCase();
      let payment_def = [
        {
          name: "Regular Payments",
          type: "REGULAR",
          frequency: UppercaseFrequency,
          frequency_interval: String(custom_days),
          cycles: body.cycles,
          amount: {
            currency: body.currency,
            value: body.amount,
          },
        },
      ];
      console.log(payment_def, "payment_def");
      // in case of trial period
      if (body.trial_period_days > 0) {
        payment_def.unshift({
          // Use unshift to place the trial period first
          name: "Trial Period",
          type: "TRIAL",
          frequency: "DAY",
          frequency_interval: "1",
          cycles: body.trial_period_days.toString(), // Convert trial period days to string
          amount: {
            currency: body.currency,
            value: "0.00", // Free trial
          },
        });
      }

      const create_payment_json = {
        name: body.plan_name,
        description: "Monthly subscription plan description",
        type: "FIXED",
        payment_definitions: payment_def,
        merchant_preferences: {
          setup_fee: {
            currency: body.currency,
            value: "0.00",
          },
          cancel_url: body.return_url,
          return_url: body.return_url,
          max_fail_attempts: "1",
          auto_bill_amount: "YES",
          initial_fail_amount_action: "CONTINUE",
        },
      };
      console.log(create_payment_json, "create_payment_json");
      const payment = await new Promise((resolve, reject) => {
        paypal.billingPlan.create(create_payment_json, (error, payment) => {
          if (error) {
            console.log(error, "error in package creation ----");
            reject(
              error.response ? error.response.details : "Could not make payment"
            );
          } else {
            resolve(payment);
          }
        });
      });

      const billing_plan_update_attributes = [
        {
          op: "replace",
          path: "/",
          value: {
            state: "ACTIVE", // Activate the billing plan
          },
        },
      ];

      await new Promise((resolve, reject) => {
        paypal.billingPlan.update(
          payment.id,
          billing_plan_update_attributes,
          (error) => {
            if (error) {
              console.log(error, "error in package creation ---");
              reject(error);
            } else {
              resolve();
            }
          }
        );
      });
      const billing_agreement_attributes = {
        name: "Recurring Agreement Name",
        description: "Recurring Agreement Description",
        start_date: new Date(Date.now() + 60000).toISOString(), // Start date of the agreement (1 minute in the future)
        plan: {
          id: payment.id,
        },
        payer: {
          payment_method: "paypal",
        },
      };

      const billingAgreement = await new Promise((resolve, reject) => {
        paypal.billingAgreement.create(
          billing_agreement_attributes,
          (error, billingAgreement) => {
            if (error) {
              console.log(error, "error in package creation --");
              reject(
                error.response
                  ? error.response.details
                  : "Could not create billing agreement"
              );
            } else {
              resolve(billingAgreement);
            }
          }
        );
      });
      for (let i = 0; i < billingAgreement.links.length; i++) {
        if (billingAgreement.links[i].rel == "approval_url") {
          link = billingAgreement.links[i];
        }
      }
      resolve({
        error: false,
        message: "",
        response: { billingAgreement, link },
      });
    } catch (error) {
      console.log(error, "error in package creation");
      resolve({ error: true, message: error.message, response: null });
    }
  });
};

const createPaymentInstallments = async (body, paypal) => {
  //validate the body with joi
  let { error, message } = validateInstallmentsPayment(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  let link = "";
  body.currency = body.currency.toUpperCase();
  if (body.discount > 0) {
    const amount = body.discount;
    let discountPercentage = 0;

    if (body.discount_type === "percentage") {
      discountPercentage = amount;
    } else {
      discountPercentage = (amount / body.amount) * 100;
    }

    console.log(`Discount Percentage: ${discountPercentage.toFixed(2)}%`);

    // Apply discount based on calculated percentage
    let discountedInitial =
      body.initial_amount * (1 - discountPercentage / 100);
    let discountedInstallmentTotal =
      (body.amount - body.initial_amount) * (1 - discountPercentage / 100);

    console.log(discountedInitial.toFixed(2), "Discounted initial amount");
    console.log(
      discountedInstallmentTotal.toFixed(2),
      "Discounted installment total"
    );

    // Adjust interval count for no trial
    // if (body.trial_period_days < 1) {
    //   body.interval_count -= 1;
    // }

    body.amount = discountedInstallmentTotal / body.interval_count;
    console.log(body.amount.toFixed(2), "Installment amount per interval");
    body.initial_amount = discountedInitial.toFixed(2);
    // if (body.trial_period_days < 1) {
    //   body.initial_amount = parseFloat(body.initial_amount, 10) - body.amount;
    // }
  }
  console.log(body.initial_amount, "body.initial_amount before tax");
  console.log(body.amount, "body.amount before tax");
  // calculating discount
  let tax = 0,
    payment;
  if (body.tax > 0) {
    tax = body.amount * (body.tax / 100);
    body.amount = tax + body.amount;
    body.amount = body.amount.toFixed(2);
    tax = body.initial_amount * (body.tax / 100);
    body.initial_amount = tax + body.initial_amount;
    body.initial_amount = body.initial_amount.toFixed(2);
  }
  if (body.cycles > 0) {
    body.amount = body.amount / body.cycles;
  }

  let custom_days = 1;
  if (body.frequency == "custom") {
    body.frequency = "DAY";
    custom_days = body.custom_days;
  }

  return new Promise(async (resolve) => {
    try {
      const UppercaseFrequency = body.frequency.toUpperCase();
      const payment_definitions = [];

      // Conditionally add a TRIAL phase if trial_period_days > 0
      if (body.trial_period_days > 0) {
        payment_definitions.push({
          name: body.plan_name + " Trial Period",
          type: "TRIAL",
          frequency: "DAY",
          frequency_interval: "1",
          cycles: body.trial_period_days.toString(), // Number of days for trial
          amount: {
            currency: body.currency,
            value: "0.00", // No charge during the trial period
          },
        });
      }

      // Add the REGULAR phase for the initial payment
      payment_definitions.push({
        name:
          body.plan_name +
          (body.trial_period_days > 0
            ? " Initial Charge"
            : " Regular Payments"),
        type: "REGULAR",
        frequency: UppercaseFrequency,
        frequency_interval: String(custom_days), // Number of days for each billing cycle
        cycles: body.cycles.toString(), // Number of regular payments
        amount: {
          currency: body.currency,
          value: body.amount, // Regular payment amount
        },
      });

      const create_payment_json = {
        name: body.plan_name,
        description:
          body.trial_period_days > 0
            ? "Subscription plan with trial, initial, and recurring payments"
            : "Plan with initial payment and recurring payments",
        type: "FIXED",
        payment_definitions: payment_definitions,
        merchant_preferences: {
          setup_fee: {
            currency: body.currency,
            value: body.initial_amount, // Charge the setup fee immediately
          },
          cancel_url: body.return_url,
          return_url: body.return_url,
          max_fail_attempts: "1",
          auto_bill_amount: "YES",
          initial_fail_amount_action: "CONTINUE",
        },
      };

      // Create the payment plan
      const payment = await new Promise((resolve, reject) => {
        paypal.billingPlan.create(create_payment_json, (error, payment) => {
          if (error) {
            reject(
              error.response
                ? error.response.details
                : "Could not create payment plan"
            );
          } else {
            resolve(payment);
          }
        });
      });

      // Activate the payment plan
      const billing_plan_update_attributes = [
        {
          op: "replace",
          path: "/",
          value: {
            state: "ACTIVE", // Activate the billing plan
          },
        },
      ];

      await new Promise((resolve, reject) => {
        paypal.billingPlan.update(
          payment.id,
          billing_plan_update_attributes,
          (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          }
        );
      });

      // Calculate the start date for recurring payments (1 day after the initial payment)
      const now = new Date();
      const oneDayInMillis = 24 * 60 * 60 * 1000;
      const startDate = new Date(now.getTime() + oneDayInMillis).toISOString();

      // Create the billing agreement
      const billing_agreement_attributes = {
        name: body.plan_name + " Agreement",
        description:
          body.trial_period_days > 0
            ? "Agreement for trial and recurring payments"
            : "Agreement with initial payment and recurring payments",
        start_date: startDate, // Start the recurring payments 1 day after the initial payment
        plan: {
          id: payment.id,
        },
        payer: {
          payment_method: "paypal",
        },
      };

      const billingAgreement = await new Promise((resolve, reject) => {
        paypal.billingAgreement.create(
          billing_agreement_attributes,
          (error, billingAgreement) => {
            if (error) {
              reject(
                error.response
                  ? error.response.details
                  : "Could not create billing agreement"
              );
            } else {
              resolve(billingAgreement);
            }
          }
        );
      });
      for (let i = 0; i < billingAgreement.links.length; i++) {
        if (billingAgreement.links[i].rel == "approval_url") {
          link = billingAgreement.links[i];
        }
      }
      resolve({
        error: false,
        message: "",
        response: { billingAgreement, link },
      }); // Return the billing agreement
    } catch (error) {
      resolve({ error: true, message: error.message, response: null });
    }
  });
};

// Execute the payment
let executePayment = async (body, paypal) => {
  //validate the body with joi
  let { error, message } = validateExecutePayment(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  try {
    let execute_payment_json = {
      payer_id: body.payer_id,
    };
    const payment = await new Promise((resolve, reject) => {
      paypal.payment.execute(
        body.payment_id,
        execute_payment_json,
        (error, payment) => {
          if (error) {
            console.log(
              error,
              "error in one-time PayPal payment.............."
            );
            reject(error);
          } else {
            resolve(payment);
          }
        }
      );
    });
    return { error: false, message: "", response: payment };
  } catch (error) {
    return { error: true, message: error.message, response: null };
  }
};

let billingAgreementExecute = async (body, paypal) => {
  //validate the body with joi
  let { error, message } = validateBillingAgreementExecute(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  try {
    const billing_agreement_execute_res = await new Promise(
      (resolve, reject) => {
        paypal.billingAgreement.execute(
          body.token,
          (error, billing_agreement_execute_res) => {
            if (error) {
              console.log(
                error,
                "error in executing recurring payment........"
              );
              reject(error);
            } else {
              if (body.trial_period_days > 0) {
                // Handle trial period logic here if needed
              }
              resolve(billing_agreement_execute_res);
            }
          }
        );
      }
    );
    return {
      error: false,
      message: "",
      response: billing_agreement_execute_res,
    };
  } catch (error) {
    return { error: true, message: error.message, response: null };
  }
};
const updateWebhookUrl = async (body) => {
  //validate the body with joi
  let { error, message } = validateUpdateWebhookUrl(body);
  if (error) {
    return { error: true, message: message, response: null };
  }
  try {
    console.log(body, "------------------------WebhookUrl");
    const apiUrl =
      body.environment === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";
    // Get PayPal Access Token
    const tokenResponse = await axios({
      url: `${apiUrl}/v1/oauth2/token`,
      method: "post",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: { username: body.client_id, password: body.client_secret },
      data: "grant_type=client_credentials",
    });
    const accessToken = tokenResponse.data.access_token;

    // Check if webhook URL already exists
    const webhooksResponse = await axios({
      url: `${apiUrl}/v1/notifications/webhooks`,
      method: "get",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const webhookExists = webhooksResponse.data.webhooks.some(
      (webhook) => webhook.url === body.webhook_url
    );

    if (webhookExists) {
      console.log(`Webhook URL "${body.webhook_url}" already exists.`);
    } else {
      // Create the webhook if it doesn't exist
      const createResponse = await axios({
        url: `${apiUrl}/v1/notifications/webhooks`,
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        data: {
          url: body.webhook_url,
          event_types: body.event_types,
        },
      });
      console.log("Webhook created successfully:", createResponse.data);
    }
    return { error: false, message: "Webhook created successfully" };
  } catch (error) {
    console.log("Error:", error.response ? error.response.data : error.message);
    return {
      error: true,
      message: error.response ? error.response.data : error.message,
    };
  }
};
module.exports = {
  configurePaypal,
  createPaymentPlanOneTime,
  createPaymentPlanRecurring,
  createPaymentFixedRecurring,
  createPaymentInstallments,
  executePayment,
  billingAgreementExecute,
  updateWebhookUrl
};
