# Payment Handler - NPM Package Documentation

## Overview
Payment Handler is an NPM package designed to streamline Stripe payment operations. This package integrates multiple Stripe payment methods, allowing developers to manage one-time payments, recurring subscriptions, customer creation, invoices, and webhooks within a single module.

## Installation
```sh
npm install payment-handler
```

## Usage
Import the package and use the provided functions to interact with Stripe.

```javascript
const PaymentHandler = require('payment-handler');

// Example: Creating a one-time payment
const paymentData = {
  product_name: "Sample Product",
  description: "One-time purchase",
  amount: 1000,
  currency: "USD",
  customer_id: "cus_123456789",
  metadata: {},
  return_url: "https://yourwebsite.com/return",
  discount_type: "percentage",
  discount: 10,
  tax: 5
};

PaymentHandler.CREATE_ONE_TIME_PAYMENT_ON_STRIPE(paymentData)
  .then(response => console.log(response))
  .catch(error => console.error(error));
```

## Available Functions
The following functions are available in the package:

### 1. `CREATE_INSTALLMENT_SUBSRIPTION_ON_STRIPE(body)`
Creates an installment-based subscription for a customer.

#### Required Fields:
- `product_name` (string, required)
- `description` (string, required)
- `unit_amount` (number, required)
- `initial_amount` (number, required)
- `currency` (string, required)
- `interval_time` (string, required)
- `interval_count` (number, required)
- `customer_id` (string, required)
- `metadata` (object, required)
- `trial_period_days` (number, optional)
- `discount_type` (string, optional)
- `discount` (number, optional)
- `tax` (number, optional)
- `custom_days` (string, optional)

### 2. `CREATE_ONE_TIME_PAYMENT_ON_STRIPE(body)`
Processes a single-payment transaction for a product or service.

#### Required Fields:
- `product_name` (string, required)
- `description` (string, required)
- `amount` (number, required)
- `currency` (string, required)
- `customer_id` (string, required)
- `metadata` (object, optional)
- `return_url` (string, required)
- `discount_type` (string, optional)
- `discount` (number, optional)
- `tax` (number, optional)

### 3. `CREATE_CUSTOMER_ON_STRIPE(body)`
Creates a new customer in Stripe.

#### Required Fields:
- `email` (string, required)
- `source` (string, required)

### 4. `RETRIVE_USER_DEFAULT_CARD_FROM_STRIPE(body)`
Retrieves the default card associated with a customer.

#### Required Fields:
- `customer_id` (string, required)

### 5. `RETRIEVE_INVOICE_FROM_STRIPE(body)`
Fetches an invoice by its ID.

#### Required Fields:
- `invoice_id` (string, required)

### 6. `RETRIEVE_PAYMENT_INTENT_FROM_STRIPE(body)`
Retrieves details of a payment intent.

#### Required Fields:
- `payment_intent_id` (string, required)

### 7. `CREATE_RECURRING_BASIC_SUBSCRIPTION_ON_STRIPE(body)`
Creates a simple recurring subscription.

#### Required Fields:
- `product_name` (string, required)
- `description` (string, required)
- `unit_amount` (number, required)
- `currency` (string, required)
- `interval_time` (string, required)
- `interval_count` (number, required)
- `customer_id` (string, required)
- `metadata` (object, optional)
- `trial_period_days` (number, optional)
- `discount_type` (string, optional)
- `discount` (number, optional)
- `tax` (number, optional)
- `custom_days` (string, optional)

### 8. `CREATE_RECURRING_FIXED_SUBSCRIPTION_ON_STRIPE(body)`
Creates a fixed recurring subscription plan.

#### Required Fields:
- `product_name` (string, required)
- `description` (string, required)
- `unit_amount` (number, required)
- `currency` (string, required)
- `interval_time` (string, required)
- `interval_count` (number, required)
- `customer_id` (string, required)
- `metadata` (object, optional)
- `trial_period_days` (number, optional)
- `discount_type` (string, optional)
- `discount` (number, optional)
- `tax` (number, optional)
- `custom_days` (string, optional)

### 9. `ADD_WEBHOOK_URL_ON_STRIPE(body)`
Registers a webhook URL for receiving Stripe event notifications.

#### Required Fields:
- `enabled_events` (array, required)
- `webhook_url` (string, required)


