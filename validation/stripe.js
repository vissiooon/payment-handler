const Joi = require("joi");

const validateCustomerBody = (body) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    source: Joi.string().required(),
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

const validateInstallment = (body) => {
  const schema = Joi.object({
    product_name: Joi.string().required(),
    description: Joi.string().required(),
    unit_amount: Joi.number().required(),
    initial_amount: Joi.number().required(),
    currency: Joi.string().required(),
    interval_time: Joi.string().required(),
    interval_count: Joi.number().required(),
    customer_id: Joi.string().required(),
    metadata: Joi.object().required(),
    trial_period_days: Joi.number().allow(null, ""),
    discount_type: Joi.string().allow("percentage", "fixed", "", null),
    discount: Joi.number().allow("", null),
    tax: Joi.number().allow("", null),
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

const validateRecurringBasic = (body) => {
  const schema = Joi.object({
    product_name: Joi.string().required(),
    description: Joi.string().required(),
    unit_amount: Joi.number().required(),
    currency: Joi.string().required(),
    interval_time: Joi.string().required(),
    interval_count: Joi.number().required(),
    customer_id: Joi.string().required(),
    metadata: Joi.object().allow(null, ""),
    trial_period_days: Joi.number().allow(null, ""),
    discount_type: Joi.string().allow("percentage", "fixed", "", null),
    discount: Joi.number().allow("", null),
    tax: Joi.number().allow("", null),
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

const validateRecurringFixed = (body) => {
  const schema = Joi.object({
    product_name: Joi.string().required(),
    description: Joi.string().required(),
    unit_amount: Joi.number().required(),
    currency: Joi.string().required(),
    interval_time: Joi.string().required(),
    interval_count: Joi.number().required(),
    customer_id: Joi.string().required(),
    metadata: Joi.object().allow(null, ""),
    trial_period_days: Joi.number().allow(null, ""),
    discount_type: Joi.string().allow("percentage", "fixed", "", null),
    discount: Joi.number().allow("", null),
    tax: Joi.number().allow("", null),
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

const validateRetrieveInvoice = (body) => {
  const schema = Joi.object({
    invoice_id: Joi.string().required(),
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

const validateRetrievePaymentIntent = (body) => {
  const schema = Joi.object({
    payment_intent_id: Joi.string().required(),
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

const validateOneTimePayment = (body) => {
  const schema = Joi.object({
    product_name: Joi.string().required(),
    description: Joi.string().required(),
    amount: Joi.number().required(),
    currency: Joi.string().required(),
    customer_id: Joi.string().required(),
    metadata: Joi.object().allow(null, ""),
    return_url: Joi.string().required(),
    discount_type: Joi.string().allow("percentage", "fixed", "", null),
    discount: Joi.number().allow("", null),
    tax: Joi.number().allow("", null),
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

const validateRetrieveCustomerCard = (body) => {
  const schema = Joi.object({
    customer_id: Joi.string().required(),
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

const validateAddWebhook = (body) => {
  const schema = Joi.object({
    enabled_events: Joi.string().required(),
    webhook_url: Joi.string().required(),
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
const validateCancelSubscription = (body) => {
  const schema = Joi.object({
    subscription_id: Joi.string().required(),
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
};
