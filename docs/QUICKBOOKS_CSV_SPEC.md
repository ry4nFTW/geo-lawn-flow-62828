# QuickBooks Journal Entry CSV Specification

## CSV Headers & Format

### Standard Daily Journal Entry Format

```csv
Date,Account,Debit,Credit,Description,Class,Customer,Memo
```

### Example Daily Export (October 15, 2024)

```csv
Date,Account,Debit,Credit,Description,Class,Customer,Memo
2024-10-15,Revenue - Lawn Care,,1245.00,Daily Revenue Summary,Landscape Operations,,8 jobs completed
2024-10-15,Processing Fees,38.75,,Payment processor fees,Operating Expenses,,PayPal: $25.50 Stripe: $13.25
2024-10-15,Sales Tax Payable,,99.60,Sales tax collected,Tax Liabilities,,8% on taxable services
2024-10-15,Vehicle Expenses,45.00,,Fuel costs,Operating Expenses,,Crew vehicle fuel
2024-10-15,Cash - Operating,1161.65,,Net daily receipts,Assets,,Gross minus fees and tax
```

### Per-Job Detail Format (Optional Enhancement)

```csv
Date,Account,Debit,Credit,Description,Class,Customer,Memo,JobRef
2024-10-15,Revenue - Lawn Care,,125.00,Lawn maintenance service,Landscape Operations,Smith Property,Weekly service - 2hr duration,JOB-2024-001
2024-10-15,Processing Fees,3.88,,PayPal processing fee,Operating Expenses,Smith Property,3.1% of $125.00,JOB-2024-001
2024-10-15,Sales Tax Payable,,10.00,Sales tax on lawn service,Tax Liabilities,Smith Property,8% sales tax,JOB-2024-001
2024-10-15,Cash - Operating,111.12,,Net job receipt,Assets,Smith Property,Payment received via PayPal,JOB-2024-001
```

## Account Mapping Configuration

### Revenue Accounts
```json
{
  "lawn_care": "Revenue - Lawn Care",
  "landscaping": "Revenue - Landscaping", 
  "seasonal": "Revenue - Seasonal Services",
  "maintenance": "Revenue - Property Maintenance"
}
```

### Expense Accounts
```json
{
  "processing_fees": "Processing Fees",
  "fuel_costs": "Vehicle Expenses",
  "equipment_rental": "Equipment Rental",
  "supplies": "Materials & Supplies"
}
```

### Payment Processor Fee Rates
```json
{
  "paypal": 0.031,
  "stripe": 0.029,
  "cash_app": 0.025,
  "check": 0.00,
  "cash": 0.00
}
```

## Sample Export Files

### File: `journal_entry_20241015.csv`
```csv
Date,Account,Debit,Credit,Description,Class,Customer,Memo
2024-10-15,Revenue - Lawn Care,,1245.00,Daily Revenue Summary,Landscape Operations,,8 jobs completed
2024-10-15,Processing Fees,38.75,,Payment processor fees,Operating Expenses,,Breakdown: PayPal $25.50 Stripe $13.25
2024-10-15,Sales Tax Payable,,99.60,Sales tax collected,Tax Liabilities,,8% on $1245.00
2024-10-15,Vehicle Expenses,45.00,,Fuel costs for crews,Operating Expenses,,Gas receipts: Crew A $25 Crew B $20
2024-10-15,Cash - Operating,1161.65,,Net daily receipts,Assets,,Deposited to operating account
```

### File: `journal_entry_weekly_20241014_20241020.csv`
```csv
Date,Account,Debit,Credit,Description,Class,Customer,Memo
2024-10-20,Revenue - Lawn Care,,8967.50,Weekly Revenue Summary,Landscape Operations,,Week of Oct 14-20: 58 jobs
2024-10-20,Processing Fees,278.59,,Weekly processor fees,Operating Expenses,,PayPal: $185.25 Stripe: $93.34
2024-10-20,Sales Tax Payable,,717.40,Weekly sales tax,Tax Liabilities,,8% on $8967.50
2024-10-20,Vehicle Expenses,285.00,,Weekly fuel costs,Operating Expenses,,5 days of operations
2024-10-20,Equipment Rental,150.00,,Weekly equipment rental,Operating Expenses,,Aerator rental: 3 days
2024-10-20,Cash - Operating,8536.51,,Weekly net receipts,Assets,,Transferred to operating account
```

## QuickBooks Online Import Instructions

### Step 1: Prepare CSV File
1. Download CSV from Landscape App export function
2. Verify date format is YYYY-MM-DD
3. Ensure all amounts are positive (debits/credits handled by columns)
4. Check account names match your QuickBooks Chart of Accounts

### Step 2: Import Process
1. In QuickBooks Online: **Accounting** → **Chart of Accounts**
2. Click **New** → **Import** → **Journal Entries**
3. Select downloaded CSV file
4. Map columns:
   - Date → Date
   - Account → Account
   - Debit → Debit
   - Credit → Credit
   - Description → Description
   - Memo → Memo

### Step 3: Account Verification
Ensure these accounts exist in your Chart of Accounts:
- **Assets**: Cash - Operating
- **Revenue**: Revenue - Lawn Care, Revenue - Landscaping
- **Expenses**: Processing Fees, Vehicle Expenses, Equipment Rental
- **Liabilities**: Sales Tax Payable

### Step 4: Review & Import
1. Preview journal entries
2. Verify debits equal credits for each date
3. Check account mappings
4. Complete import

## Automated Export Configuration

### Daily Export Schedule
```json
{
  "frequency": "daily",
  "time": "23:30",
  "timezone": "America/New_York",
  "format": "summary",
  "email_recipients": ["accountant@company.com"],
  "include_attachments": ["receipts", "photos"]
}
```

### Weekly Export Schedule  
```json
{
  "frequency": "weekly", 
  "day": "sunday",
  "time": "20:00",
  "format": "detailed_with_jobs",
  "reconciliation_report": true,
  "expense_breakdown": true
}
```

## Data Validation Rules

### Pre-Export Checks
- ✅ All jobs have associated payments
- ✅ Tax calculations are correct
- ✅ Payment processor fees match actual charges
- ✅ No duplicate transactions
- ✅ All amounts balance (debits = credits)

### Error Handling
- **Missing Data**: Flag incomplete jobs for manual review
- **Tax Discrepancies**: Highlight tax calculation errors
- **Processor Mismatches**: Alert on fee calculation differences
- **Balance Issues**: Prevent export if debits ≠ credits

## Sample Integration Code

### CSV Generation Logic
```typescript
interface JournalEntry {
  date: string;
  account: string;
  debit?: number;
  credit?: number;
  description: string;
  class?: string;
  customer?: string;
  memo?: string;
}

function generateDailyJournalCSV(date: string): string {
  const entries: JournalEntry[] = [
    // Revenue entry
    {
      date,
      account: 'Revenue - Lawn Care',
      credit: dailyRevenue,
      description: 'Daily Revenue Summary',
      class: 'Landscape Operations',
      memo: `${jobCount} jobs completed`
    },
    // Fee entries...
  ];
  
  return convertToCSV(entries);
}
```