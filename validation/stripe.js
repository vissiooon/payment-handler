const Joi = require("joi");

const validateCustomerBody = (body) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    source: Joi.string().required(),
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: false,
      message: error.details[0].message,
    };
  }
};

const validateInstallment = (body) => {
  const schema = Joi.object({
    product_name: Joi.string().required(),
    description: Joi.string().required(),
    unit_amount: Joi.number().required(),
    one_time_amount: Joi.number().required(),
    currency: Joi.string().required(),
    interval: Joi.number().required(),
    interval_count: Joi.number().required(),
    customer_id: Joi.string().required(),
    metadata: Joi.object().required(),
    card_id: Joi.string().required(),
    trial_period_days: Joi.number().allow(null, ""),
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: false,
      message: error.details[0].message,
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
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: false,
      message: error.details[0].message,
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
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: false,
      message: error.details[0].message,
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
      error: false,
      message: error.details[0].message,
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
      error: false,
      message: error.details[0].message,
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
  });
  const { error } = schema.validate(body);
  if (error) {
    return {
      error: false,
      message: error.details[0].message,
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
      error: false,
      message: error.details[0].message,
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
};
