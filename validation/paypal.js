const Joi = require("joi");

const validateConfigurePaypal = (body) => {
  const schema = Joi.object({
    mode: Joi.string().required(),
    client_id: Joi.string().required(),
    client_secret: Joi.string().required(),
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: true,
      message: error.details[0].message,
    };
  } else {
    return {
      error: false,
      message: "Validated",
    };
  }
};

const validateOneTimePaymentPlan = (body) => {
  const schema = Joi.object({
    amount: Joi.number().required(),
    currency: Joi.string().required(),
    discount_type: Joi.string().allow("percentage", "fixed", "", null),
    discount: Joi.number().allow("", null),
    tax: Joi.number().allow("", null),
    return_url: Joi.string().required(),
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: true,
      message: error.details[0].message,
    };
  } else {
    return {
      error: false,
      message: "Validated",
    };
  }
};
const validateUpdateWebhookUrl = async (body) => {
  const schema = Joi.object({
    environment: Joi.string().required(),
    client_id: Joi.string().required(),
    client_secret: Joi.string().required(),
    webhook_url: Joi.string().required(),
    event_types: Joi.array().required(),
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: true,
      message: error.details[0].message,
    };
  } else {
    return {
      error: false,
      message: "Validated",
    };
  }
};

const validateRecurringPaymentPlan = (body) => {
  const schema = Joi.object({
    amount: Joi.number().required(),
    currency: Joi.string().required(),
    frequency: Joi.string().required(),
    plan_name: Joi.string().required(),
    trial_period_days: Joi.number().required(),
    return_url: Joi.string().required(),
    discount_type: Joi.string().allow("percentage", "fixed", "", null),
    discount: Joi.number().allow("", null),
    tax: Joi.number().allow("", null),
    custom_days: Joi.number().allow("", null),
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: true,
      message: error.details[0].message,
    };
  } else {
    return {
      error: false,
      message: "Validated",
    };
  }
};
const validateFixedRecurringPayment = (body) => {
  const schema = Joi.object({
    amount: Joi.number().required(),
    currency: Joi.string().required(),
    frequency: Joi.string().required(),
    plan_name: Joi.string().required(),
    trial_period_days: Joi.number().required(),
    cycles: Joi.number().required(),
    return_url: Joi.string().required(),
    discount_type: Joi.string().allow("percentage", "fixed", "", null),
    discount: Joi.number().allow("", null),
    tax: Joi.number().allow("", null),
    custom_days: Joi.number().allow("", null),
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: true,
      message: error.details[0].message,
    };
  } else {
    return {
      error: false,
      message: "Validated",
    };
  }
};
const validateInstallmentsPayment = (body) => {
  const schema = Joi.object({
    amount: Joi.number().required(),
    initial_amount: Joi.number().required(),
    currency: Joi.string().required(),
    frequency: Joi.string().required(),
    plan_name: Joi.string().required(),
    trial_period_days: Joi.number().required(),
    cycles: Joi.number().required(),
    return_url: Joi.string().required(),
    discount_type: Joi.string().allow("percentage", "fixed", "", null),
    discount: Joi.number().allow("", null),
    tax: Joi.number().allow("", null),
    custom_days: Joi.number().allow("", null),
    interval_count: Joi.number().allow("", null),
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: true,
      message: error.details[0].message,
    };
  } else {
    return {
      error: false,
      message: "Validated",
    };
  }
};
const validateExecutePayment = (body) => {
  const schema = Joi.object({
    payment_id: Joi.string().required(),
    payer_id: Joi.string().required(),
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: true,
      message: error.details[0].message,
    };
  } else {
    return {
      error: false,
      message: "Validated",
    };
  }
};

const validateBillingAgreementExecute = (body) => {
  const schema = Joi.object({
    token: Joi.string().required(),
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: true,
      message: error.details[0].message,
    };
  } else {
    return {
      error: false,
      message: "Validated",
    };
  }
};
module.exports = {
  validateConfigurePaypal,
  validateOneTimePaymentPlan,
  validateRecurringPaymentPlan,
  validateFixedRecurringPayment,
  validateInstallmentsPayment,
  validateExecutePayment,
  validateBillingAgreementExecute,
  validateUpdateWebhookUrl
};
