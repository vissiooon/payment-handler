# Payment Handler - NPM Package

## Overview
The `Payment Handler` package provides a unified interface to manage all Stripe and PayPal payment methods efficiently. This package simplifies the process of handling payments by offering a range of functions for different payment scenarios.

---

## Installation
```sh
npm install payment-handler
```

---

## Usage

### Import the Package
```javascript
const PaymentHandler = require('payment-handler');
```

---

## Stripe Functions

### 1. `CREATE_INSTALLMENT_SUBSRIPTION_ON_STRIPE`
**Description:** Creates an installment-based subscription on Stripe.
**Required Fields:**
- product_name
- description
- unit_amount
- initial_amount
- currency
- interval_time
- interval_count
- customer_id
- metadata
- trial_period_days
- discount_type
- discount
- tax
- custom_days

### 2. `CREATE_ONE_TIME_PAYMENT_ON_STRIPE`
**Description:** Processes a one-time payment on Stripe.
**Required Fields:**
- product_name
- description
- amount
- currency
- customer_id
- metadata
- return_url
- discount_type
- discount
- tax

### 3. `CREATE_CUSTOMER_ON_STRIPE`
**Description:** Creates a new customer on Stripe.
**Required Fields:**
- email
- source

### 4. `RETRIVE_USER_DEFAULT_CARD_FROM_STRIPE`
**Description:** Retrieves the default card associated with a Stripe customer.
**Required Fields:**
- customer_id

### 5. `RETRIEVE_INVOICE_FROM_STRIPE`
**Description:** Retrieves an invoice from Stripe.
**Required Fields:**
- invoice_id

### 6. `RETRIEVE_PAYMENT_INTENT_FROM_STRIPE`
**Description:** Retrieves details of a payment intent.
**Required Fields:**
- payment_intent_id

### 7. `CREATE_RECURRING_BASIC_SUBSCRIPTION_ON_STRIPE`
**Description:** Creates a recurring basic subscription on Stripe.
**Required Fields:**
- product_name
- description
- unit_amount
- currency
- interval_time
- interval_count
- customer_id
- metadata
- trial_period_days
- discount_type
- discount
- tax
- custom_days

### 8. `CREATE_RECURRING_FIXED_SUBSCRIPTION_ON_STRIPE`
**Description:** Creates a fixed recurring subscription on Stripe.
**Required Fields:**
- product_name
- description
- unit_amount
- currency
- interval_time
- interval_count
- customer_id
- metadata
- trial_period_days
- discount_type
- discount
- tax
- custom_days

### 9. `ADD_WEBHOOK_URL_ON_STRIPE`
**Description:** Adds a webhook URL to Stripe for event notifications.
**Required Fields:**
- enabled_events
- webhook_url

---

## PayPal Functions

### 1. `configurePaypal`
**Description:** Configures PayPal settings.
**Required Fields:**
- mode
- client_id
- client_secret

### 2. `createPaymentPlanOneTime`
**Description:** Creates a one-time payment plan on PayPal.
**Required Fields:**
- amount
- currency
- discount_type
- discount
- tax
- return_url

### 3. `createPaymentPlanRecurring`
**Description:** Creates a recurring payment plan on PayPal.
**Required Fields:**
- amount
- currency
- frequency
- plan_name
- trial_period_days
- return_url
- discount_type
- discount
- tax
- custom_days

### 4. `createPaymentFixedRecurring`
**Description:** Creates a fixed recurring payment plan on PayPal.
**Required Fields:**
- amount
- currency
- frequency
- plan_name
- trial_period_days
- cycles
- return_url
- discount_type
- discount
- tax
- custom_days

### 5. `createPaymentInstallments`
**Description:** Creates an installment-based payment plan on PayPal.
**Required Fields:**
- amount
- initial_amount
- currency
- frequency
- plan_name
- trial_period_days
- cycles
- return_url
- discount_type
- discount
- tax
- custom_days
- interval_count

### 6. `executePayment`
**Description:** Executes a PayPal payment after user approval.
**Required Fields:**
- payment_id
- payer_id

### 7. `billingAgreementExecute`
**Description:** Executes a billing agreement on PayPal.
**Required Fields:**
- token

### 8. `updateWebhookUrl`
**Description:** Updates the webhook URL for PayPal event notifications.
**Required Fields:**
- environment
- client_id
- client_secret
- webhook_url
- event_types

---

## Example Usage

### Stripe One-Time Payment
```javascript
const PaymentHandler = require('payment-handler');

const stripeSecretKey="*******************************"
const paymentData = {
  product_name: "Product 1",
  description: "A great product",
  amount: 100,
  currency: "USD",
  customer_id: "cus_123456",
  metadata: {},
  return_url: "https://your-site.com/success",
  discount_type: "percentage",
  discount: 10,
  tax: 5,
};

PaymentHandler.CREATE_ONE_TIME_PAYMENT_ON_STRIPE(paymentData,stripeSecretKey)
  .then(response => console.log(response))
  .catch(error => console.error(error));
```

### PayPal One-Time Payment
```javascript
const PaymentHandler = require('payment-handler');

const paypalSecretKey="*******************************"
const paymentData = {
  amount: 100,
  currency: "USD",
  discount_type: "fixed",
  discount: 5,
  tax: 3,
  return_url: "https://your-site.com/success",
};

PaymentHandler.createPaymentPlanOneTime(paymentData,paypalSecretKey)
  .then(response => console.log(response))
  .catch(error => console.error(error));
```

---


