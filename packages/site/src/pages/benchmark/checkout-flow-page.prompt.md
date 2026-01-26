# Checkout Flow Benchmark

Test a multi-step wizard with conditional steps and validation.

## Steps

### Standard Flow (Pro Plan)

1. Navigate to the checkout-flow page
2. On Step 1 (Select Plan):
   - Click the "Pro" plan card ($29/mo)
   - Click "Continue"
3. On Step 2 (Billing Cycle):
   - Select "Annual" for 2 months savings
   - Click "Continue"
4. On Step 3 (Payment Method):
   - Click "Credit Card" button
   - Fill in card number: "4242424242424242"
   - Fill in expiry: "12/25"
   - Fill in CVC: "123"
   - Click "Continue"
5. On Step 4 (Review):
   - Verify order summary shows correct plan and price
   - Check the "I agree to terms" checkbox
   - Click "Complete purchase"
6. Wait for processing (1200ms)
7. Verify "Order complete" confirmation appears

### Enterprise Flow (Conditional Step)

1. Click "Start over" to reset
2. Select "Enterprise" plan
3. Click "Continue" through billing and payment steps
4. Verify Step 4 is now "Company Information" (conditional step)
5. Fill in company name: "Acme Corp"
6. Select company size from dropdown
7. Click "Continue" to proceed to Review
8. Complete the purchase

### Validation Testing

1. Start over and try to continue without selecting a plan
2. Verify validation error appears
3. On payment step, try to continue with empty card fields
4. Verify field-level validation errors
5. On review step, try to complete without agreeing to terms

## Success Criteria

- Step indicator shows correct progress (4 steps for Pro, 5 for Enterprise)
- Back button preserves all form state
- Conditional company step appears for Enterprise only
- Validation blocks progression on each step
- Processing state shows on submit button
- Confirmation page displays on success

## Edge Cases to Test

- Navigate back and change plan (Pro to Enterprise)
- Change payment method after filling card details
- Annual vs monthly price calculation
