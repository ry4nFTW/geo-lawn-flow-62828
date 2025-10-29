# Acceptance Test Matrix

## Core User Flows

### 1. Manager Dispatch Flow
```
Test ID: AT-001
Flow: Job Creation → Crew Assignment → Route Optimization

┌─────────────────────────────────────────────────────────┐
│ GIVEN: Manager logged in with active crews available   │
│ WHEN:  Creating new job for existing customer          │
│ THEN:  Auto-population suggestions appear              │
│        AND confidence scores display correctly         │
│        AND job can be assigned to optimal crew         │
└─────────────────────────────────────────────────────────┘

Steps:
1. Login as manager (role: manager)
2. Navigate to job creation form
3. Select customer "Smith Property"
4. Verify auto-suggestions appear within 2 seconds:
   ✓ Price suggestion with ≥30% confidence
   ✓ Duration estimate with ≥30% confidence  
   ✓ Crew recommendation with ≥30% confidence
5. Override price from $95 to $120
6. Assign to Crew A (Mike, Sarah)
7. Set scheduled date to tomorrow
8. Submit job creation
9. Verify job appears in dispatch board
10. Verify route optimization updates automatically

Expected Results:
- Job created with ID generated
- Auto-population confidence scores accurate
- Manual override recorded in audit log
- Route recalculated with new job included
- Crew A route efficiency remains ≥85%
```

### 2. Crew Check-in Flow
```
Test ID: AT-002
Flow: Geofence Validation → Timer Start → Photo Capture

┌─────────────────────────────────────────────────────────┐
│ GIVEN: Crew member at job location with mobile device  │
│ WHEN:  Attempting check-in within geofence radius      │
│ THEN:  Check-in succeeds and timer starts              │
│        AND location is recorded accurately             │
└─────────────────────────────────────────────────────────┘

Setup:
- Mock GPS location: 40.7128° N, 74.0060° W
- Job location: 40.7129° N, 74.0061° W (within 50m)
- Crew member: Mike (crew role)

Steps:
1. Login as crew member Mike
2. Navigate to active job "Wilson Garden"
3. Tap "CHECK IN TO JOB" button
4. Verify geofence validation:
   ✓ GPS coordinates captured
   ✓ Distance calculated (≤50m required)
   ✓ Geofence status shows "✅ Within range"
5. Complete check-in
6. Verify timer starts automatically
7. Capture "BEFORE" photo
8. Verify photo metadata:
   ✓ Timestamp recorded
   ✓ GPS coordinates embedded
   ✓ Checksum generated
   ✓ Offline queue if no network

Expected Results:
- Check-in timestamp recorded in database
- Visit record created with crew_id and job_id
- Timer displays and increments
- Photo stored locally with metadata
- Sync queue populated if offline
```

### 3. Offline Photo Capture Flow
```
Test ID: AT-003
Flow: Network Disconnection → Photo Capture → Auto-sync on Reconnection

┌─────────────────────────────────────────────────────────┐
│ GIVEN: Crew member checked in to job with no network   │
│ WHEN:  Capturing before/after photos offline           │
│ THEN:  Photos stored locally and sync when online      │
└─────────────────────────────────────────────────────────┘

Setup:
- Simulate network disconnection
- Active visit in progress
- Camera permissions granted

Steps:
1. Disconnect network (airplane mode)
2. Navigate to photo capture screen
3. Verify offline indicator shows
4. Capture "BEFORE" photo:
   ✓ Photo saves to local IndexedDB
   ✓ Thumbnail generates immediately
   ✓ Sync indicator shows "pending"
5. Capture "PROGRESS" photo
6. Capture "AFTER" photo
7. Add visit notes: "Completed edging around flower beds"
8. Complete job and check out
9. Reconnect network
10. Verify automatic sync triggers:
    ✓ Photos upload to cloud storage
    ✓ Visit record updates in database
    ✓ Sync indicators clear
    ✓ Photos accessible to manager/accountant

Expected Results:
- All photos stored with correct metadata
- Offline operations queued successfully  
- Sync completes without data loss
- Photos linked to visit record
- Checksums validate integrity
```

### 4. Invoice Generation & Payment Flow
```
Test ID: AT-004
Flow: Job Completion → Invoice Creation → Payment Processing → Journal Entry

┌─────────────────────────────────────────────────────────┐
│ GIVEN: Completed job with photos and actual duration   │
│ WHEN:  Generating invoice and processing payment        │
│ THEN:  Journal entry data updates correctly             │
└─────────────────────────────────────────────────────────┘

Setup:
- Job "Smith Lawn Care" completed
- Actual duration: 2h 15m (vs estimated 2h)
- Actual price: $120 (vs suggested $95)
- 3 photos attached (before/after/progress)

Steps:
1. Navigate to completed job
2. Generate invoice:
   ✓ Line items populate automatically
   ✓ Tax calculation (8% = $9.60)
   ✓ Total amount: $129.60
3. Send invoice to customer
4. Process payment via PayPal ($129.60)
5. Verify payment record:
   ✓ Processor: "paypal"
   ✓ Processing fee: $4.01 (3.1%)
   ✓ Net amount: $125.59
6. Check daily journal entry updates:
   ✓ Revenue: +$120.00
   ✓ Tax payable: +$9.60
   ✓ Processing fees: +$4.01
   ✓ Cash/PayPal: +$125.59

Expected Results:
- Invoice generated with correct calculations
- Payment processed and recorded
- Journal entry balances (debits = credits)
- Photos accessible from invoice view
- Audit trail complete for all changes
```

### 5. Customer Portal Flow
```
Test ID: AT-005
Flow: Service Request → Payment → Chat Communication

┌─────────────────────────────────────────────────────────┐
│ GIVEN: Customer needs lawn care service                 │
│ WHEN:  Placing order through customer portal            │
│ THEN:  Job created and payment processed successfully   │
└─────────────────────────────────────────────────────────┘

Setup:
- Customer account: "Johnson Residence"
- Service address: 789 Pine Street
- Existing payment method on file

Steps:
1. Login to customer portal
2. Click "New Service Request"
3. Select service type: "Lawn Care Package"
4. Verify address auto-populates from profile
5. Choose preferred date (next Tuesday)
6. Review price estimate: $85-$120
7. Add special instructions: "Please avoid sprinkler heads"
8. Submit service request
9. Process payment immediately:
   ✓ Select saved payment method
   ✓ Authorize $102.50 (estimated + tax)
10. Send "need to know" message about gate code
11. Verify job appears in manager dispatch board
12. Check auto-population uses customer history

Expected Results:
- Job created with customer preferences
- Payment authorized (not charged until completion)
- Manager notified of new request
- Chat message delivered to crew
- Service request confirmation email sent
```

## Data Quality & Consistency Tests

### 6. Average Duration Calculation
```
Test ID: AT-006
Purpose: Verify duration averages calculate correctly

Test Data:
Customer: "Smith Property"
Historical visits:
- Visit 1: 2h 15m (scheduled: 2h, actual: 2h 15m)
- Visit 2: 1h 45m (scheduled: 2h, actual: 1h 45m) 
- Visit 3: 2h 30m (scheduled: 2h, actual: 2h 30m)

Expected Calculations:
- Average actual duration: 2h 10m
- Variance from scheduled: +8.3%
- Next job suggestion: 2h 10m with 75% confidence

Verification Steps:
1. Query visit history for Smith Property
2. Calculate average: (135 + 105 + 150) / 3 = 130 minutes
3. Verify auto-population shows 2h 10m ± 15min
4. Confirm confidence score ≥70% (based on 3+ data points)
```

### 7. Geofence Accuracy Test
```
Test ID: AT-007
Purpose: Validate geofence calculations are accurate

Test Scenarios:
Scenario A - Valid Check-in:
- Job location: 40.7580° N, 73.9855° W
- Crew location: 40.7582° N, 73.9853° W  
- Distance: ~27 meters (within 50m radius)
- Expected: ✅ Check-in allowed

Scenario B - Invalid Check-in:
- Job location: 40.7580° N, 73.9855° W
- Crew location: 40.7590° N, 73.9840° W
- Distance: ~134 meters (outside 50m radius)  
- Expected: ❌ Check-in blocked with error message

Scenario C - Boundary Check:
- Job location: 40.7580° N, 73.9855° W
- Crew location: 40.7585° N, 73.9850° W
- Distance: ~49.8 meters (just within radius)
- Expected: ✅ Check-in allowed (with warning)

Verification:
- GPS coordinates accurate to ±3 meters
- Distance calculation uses Haversine formula
- Buffer zone accounts for GPS accuracy
```

### 8. QuickBooks Export Validation
```
Test ID: AT-008
Purpose: Verify journal entry CSV format matches QuickBooks requirements

Test Period: October 15, 2024
Jobs Completed: 8
Total Revenue: $1,245.00
Processing Fees: $38.75
Tax Collected: $99.60
Gas Expenses: $45.00

Expected CSV Output:
```csv
Date,Account,Debit,Credit,Description,Class,Customer,Memo
2024-10-15,Revenue - Lawn Care,,1245.00,Daily Revenue Summary,Landscape Operations,,8 jobs completed
2024-10-15,Processing Fees,38.75,,Payment processor fees,Operating Expenses,,PayPal: $25.50 Stripe: $13.25
2024-10-15,Sales Tax Payable,,99.60,Sales tax collected,Tax Liabilities,,8% on taxable services
2024-10-15,Vehicle Expenses,45.00,,Fuel costs,Operating Expenses,,Crew vehicle fuel
2024-10-15,Cash - Operating,1161.65,,Net daily receipts,Assets,,Gross minus fees and tax
```

Validation Checks:
✓ CSV headers match QuickBooks import format
✓ Debits = Credits (1245.00 + 38.75 + 45.00 = 1328.75)
✓ Credits = 1245.00 + 99.60 = 1344.60 (❌ Balance error!)
✓ Date format: YYYY-MM-DD
✓ Account names exist in Chart of Accounts
✓ All amounts positive (no negative values)

Note: Balance error indicates calculation bug in net receipts
Expected fix: Cash - Operating should be 1106.65 (1245 - 38.75 - 99.60)
```

## Integration & Performance Tests

### 9. Route Optimization Performance
```
Test ID: AT-009
Purpose: Validate route optimization completes within acceptable time

Test Scenario:
- 3 active crews
- 24 scheduled jobs across service area
- Geographic spread: 15-mile radius
- Optimization algorithm: Nearest Neighbor + 2-Opt

Performance Requirements:
- Initial route calculation: ≤30 seconds
- Real-time re-optimization: ≤10 seconds  
- Route efficiency: ≥85% vs optimal
- Memory usage: ≤100MB for calculation

Test Steps:
1. Load 24 jobs with realistic addresses
2. Trigger route optimization for all crews
3. Measure calculation time and memory usage
4. Verify route quality:
   ✓ No crew assigned >9 jobs (workload balance)
   ✓ Travel time minimized per crew
   ✓ Time windows respected
   ✓ No geographic clusters split between crews

Success Criteria:
- Routes generated within 30 seconds
- Total travel time <4 hours across all crews
- No time window violations
- Workload variance <20% between crews
```

### 10. Offline Sync Stress Test
```
Test ID: AT-010  
Purpose: Verify offline sync handles large queues reliably

Test Setup:
- Disconnect network for 4 hours
- Simulate heavy usage:
  - 50 check-ins/check-outs
  - 150 photos captured (300MB total)
  - 25 job updates
  - 30 chat messages

Sync Queue Contents:
- 125 database operations
- 150 file uploads  
- 30 real-time message deliveries

Test Execution:
1. Accumulate operations offline over 4 hours
2. Verify local storage limits not exceeded
3. Reconnect to network
4. Monitor sync process:
   ✓ Operations process in correct order
   ✓ No data corruption or loss
   ✓ Conflict resolution handles duplicates
   ✓ Progress indicators update correctly
   ✓ Sync completes within 15 minutes

Success Criteria:
- 100% data integrity maintained
- No operation failures or timeouts
- Conflicts resolved automatically
- Real-time updates resume normally
- Battery usage remains reasonable
```

## Security & Compliance Tests

### 11. Role-Based Access Control
```
Test ID: AT-011
Purpose: Verify RBAC prevents unauthorized access

Test Matrix:
                    │ Crew │ Manager │ Accountant │ Customer
─────────────────────┼──────┼─────────┼────────────┼──────────
View own jobs       │  ✓   │    ✓    │     ❌     │    ✓
View all jobs       │  ❌   │    ✓    │     ❌     │    ❌
Create jobs         │  ❌   │    ✓    │     ❌     │    ✓*
Edit job pricing    │  ❌   │    ✓    │     ❌     │    ❌
View financial data │  ❌   │    ✓    │     ✓     │    ❌**
Export reports      │  ❌   │    ✓    │     ✓     │    ❌
Access admin panel  │  ❌   │    ✓    │     ❌     │    ❌

* Customers can only create service requests
** Customers can only see their own invoices/payments

Test Cases:
1. Login as crew member, attempt to access /admin/reports
   Expected: 403 Forbidden redirect to dashboard
2. Login as customer, try to view other customer's jobs
   Expected: Empty results (RLS policy blocks access)
3. Login as accountant, attempt to create new jobs
   Expected: UI elements hidden, API returns 401
```

### 12. Data Audit Trail Validation
```
Test ID: AT-012
Purpose: Ensure all changes are audited correctly

Auditable Actions:
- Job price modifications
- Crew assignments changes  
- Payment processing
- Photo uploads/deletions
- Customer data updates

Test Scenario - Price Override:
1. Manager changes job price from $95 to $120
2. Verify audit log captures:
   ✓ user_id: manager's UUID
   ✓ table_name: "jobs"
   ✓ record_id: job UUID
   ✓ action: "UPDATE"
   ✓ old_values: {"actual_price": 95.00}
   ✓ new_values: {"actual_price": 120.00}
   ✓ timestamp: accurate to the second
   ✓ ip_address: manager's IP
   ✓ user_agent: browser info

Compliance Requirements:
- Audit logs immutable (no UPDATE/DELETE allowed)
- Retention period: 7 years minimum  
- Personally identifiable information encrypted
- Audit trail export capability for investigations
```

## Error Handling & Recovery Tests

### 13. Network Interruption Recovery
```
Test ID: AT-013
Purpose: Verify graceful handling of network interruptions

Test Scenarios:

Scenario A - Mid-Upload Interruption:
1. Start photo upload (large file: 5MB)
2. Disconnect network at 60% completion
3. Reconnect after 2 minutes
4. Verify resumable upload continues from 60%

Scenario B - Payment Processing Failure:
1. Customer submits payment for invoice
2. Simulate payment processor timeout
3. Verify payment marked as "pending"
4. Retry mechanism processes payment automatically
5. Customer receives confirmation once completed

Scenario C - Real-time Sync Failure:
1. Manager assigns job to crew
2. Crew device offline during assignment
3. Crew comes online 30 minutes later
4. Verify job assignment syncs automatically
5. Crew sees updated schedule immediately

Success Criteria:
- No data loss during interruptions
- Operations resume automatically
- User receives appropriate status updates
- Retry mechanisms respect backoff intervals
- Manual retry options available when needed
```

### 14. Data Validation & Error Prevention
```
Test ID: AT-014
Purpose: Ensure data integrity through validation

Input Validation Tests:

GPS Coordinates:
- Valid: 40.7580, -73.9855 ✓
- Invalid: 91.0000, -181.0000 ❌ (out of range)
- Missing: null, undefined ❌ (required field)

Price Values:
- Valid: 95.00, 120.50 ✓  
- Invalid: -50.00 ❌ (negative)
- Invalid: 10000.00 ❌ (exceeds max)
- Invalid: "ninety-five" ❌ (non-numeric)

Duration Values:
- Valid: 120 (minutes) ✓
- Invalid: -30 ❌ (negative duration)
- Invalid: 1440 ❌ (exceeds daily max)

Business Logic Validation:
- Check-out time must be after check-in time
- Job scheduled date cannot be in the past
- Crew cannot be assigned to overlapping jobs
- Payment amount cannot exceed invoice total
- Customer can only access own data

Error Response Format:
{
  "error": true,
  "message": "Validation failed",
  "details": [
    {
      "field": "actual_price",
      "code": "INVALID_RANGE",
      "message": "Price must be between $10.00 and $500.00"
    }
  ]
}
```

## Final Integration Test

### 15. End-to-End Complete Workflow
```
Test ID: AT-015
Purpose: Complete business workflow from start to finish

Workflow: New Customer → Service → Payment → Export

Timeline: Single day simulation

08:00 - Customer Registration
- New customer "Garcia Estate" registers
- Provides service address and preferences  
- Account created with customer role

09:00 - Service Request  
- Customer places lawn care order
- Auto-population suggests $110 (no history = regional average)
- Manager reviews and approves job
- Crew A assigned via route optimization

10:30 - Job Execution
- Crew arrives at Garcia Estate
- Check-in within geofence (GPS verified)
- Captures before photos (3 images)
- Works for 2h 15m (timer tracking)
- Captures after photos (2 images)
- Checks out with completion notes

12:45 - Invoice & Payment
- Invoice auto-generated: $110 + $8.80 tax = $118.80
- Customer pays via Apple Pay immediately
- Payment processed: $115.32 net (after 2.9% fee)

13:00 - Customer Communication
- Automated SMS sent with completion confirmation
- Customer responds with 5-star rating
- Photos attached to completion notification

23:30 - Daily Export (Automated)
- QuickBooks CSV generated for October 15
- Includes Garcia Estate job in daily totals
- Email sent to accountant with export file

Validation Points:
✓ New customer onboarding complete
✓ Auto-population works with regional data
✓ Geofence enforced accurately  
✓ Photos captured and synced properly
✓ Payment processed correctly
✓ Journal entry balances perfectly
✓ Customer satisfaction recorded
✓ Audit trail complete for all actions

Success Criteria:
- Zero manual intervention required
- All data flows automatically
- Financial records accurate to the penny
- Customer receives timely communication
- Crew productivity metrics updated
- Export file ready for QuickBooks import

This test validates the complete system integration and business value delivery.
```