# Checkout Flow Benchmark

Test a multi-step wizard with conditional steps and validation.

## Steps

### Standard Flow (Pro Plan)

1. Navigate to `http://localhost:4244/benchmark/checkout-flow`.
2. Step 1 (Select Plan): choose the "Pro" plan and click "Continue".
3. Step 2 (Billing Cycle): select "Annual" and click "Continue".
4. Step 3 (Payment Method): select "Credit Card".
5. Fill card fields with:
   - Card number: `4242424242424242`
   - Expiry: `12/25`
   - CVC: `123`
6. Click "Continue".
7. Step 4 (Review): check "I agree to terms" and click "Complete purchase".
8. Confirm the "Order complete" confirmation appears.

### Enterprise Flow (Conditional Step)

10. Click "Start over".
11. Step 1: select "Enterprise" and click "Continue".
12. Step 2: select "Monthly" and click "Continue".
13. Step 3: select "Invoice".
14. Fill the invoice email with `billing@example.com` and PO number with `PO-7781`.
15. Click "Continue".
16. Step 4 (Company Information):
    - Company name: `Acme Corp`
    - Company size: `51-200 employees`
17. Click "Continue" to reach Review.
18. Check "I agree to terms" and click "Complete purchase".
19. Confirm the "Order complete" confirmation appears.

### Validation

20. Click "Start over".
21. Click "Continue" without selecting a plan and confirm the validation message appears.
22. Select "Starter" and click "Continue".
23. On the billing step, click "Continue" without selecting a billing cycle and confirm the validation message appears.
24. Select "Annual" and click "Continue".
25. On payment step, select "Credit Card" and click "Continue" with empty fields, then confirm field errors appear.
