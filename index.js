const {
  CREATE_INSTALLMENT_SUBSRIPTION_ON_STRIPE,
  CREATE_ONE_TIME_PAYMENT_ON_STRIPE,
  CREATE_CUSTOMER_ON_STRIPE,
  RETRIVE_USER_DEFAULT_CARD_FROM_STRIPE,
  RETRIEVE_INVOICE_FROM_STRIPE,
  RETRIEVE_PAYMENT_INTENT_FROM_STRIPE,
  CREATE_RECURRING_BASIC_SUBSCRIPTION_ON_STRIPE,
  CREATE_RECURRING_FIXED_SUBSCRIPTION_ON_STRIPE,
  CANCEL_SUBSCRIPTION_IMMEDIATELY,
  ADD_WEBHOOK_URL_ON_STRIPE
} = require("./src/stripe");
const {
  configurePaypal,
  createPaymentPlanOneTime,
  createPaymentPlanRecurring,
  createPaymentFixedRecurring,
  createPaymentInstallments,
  executePayment,
  billingAgreementExecute,
} = require("./src/paypal");

module.exports = {
  CREATE_INSTALLMENT_SUBSRIPTION_ON_STRIPE,
  CREATE_ONE_TIME_PAYMENT_ON_STRIPE,
  CREATE_CUSTOMER_ON_STRIPE,
  RETRIVE_USER_DEFAULT_CARD_FROM_STRIPE,
  RETRIEVE_INVOICE_FROM_STRIPE,
  RETRIEVE_PAYMENT_INTENT_FROM_STRIPE,
  CREATE_RECURRING_BASIC_SUBSCRIPTION_ON_STRIPE,
  CREATE_RECURRING_FIXED_SUBSCRIPTION_ON_STRIPE,
  CANCEL_SUBSCRIPTION_IMMEDIATELY,
  ADD_WEBHOOK_URL_ON_STRIPE,
  configurePaypal,
  createPaymentPlanOneTime,
  createPaymentPlanRecurring,
  createPaymentFixedRecurring,
  createPaymentInstallments,
  executePayment,
  billingAgreementExecute,
};
