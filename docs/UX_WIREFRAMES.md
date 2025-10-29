# UX Wireframes & User Flows

## 1. Crew Check-in Screen

```
┌─────────────────────────────────────────────┐
│ ← Job: Residential Lawn Care               │
│   📍 123 Main St, Anytown                  │
├─────────────────────────────────────────────┤
│                                             │
│   🎯 GEOFENCE STATUS                       │
│   ✅ Within 50m of job site               │
│                                             │
│   📍 Current Location                      │
│   Latitude: 40.7128                        │
│   Longitude: -74.0060                      │
│                                             │
│   ⏰ Start Time: 9:15 AM                   │
│                                             │
│   [  CHECK IN TO JOB  ]                    │
│                                             │
│   Auto-populated fields:                    │
│   💰 Price: $85.00 (📊 85% confidence)   │
│   ⏱️  Duration: 2h 15m (📊 72% confidence)│
│                                             │
│   [ Edit ] [ Apply All ]                   │
│                                             │
├─────────────────────────────────────────────┤
│ Team: Mike, Sarah                           │
│ Weather: ☀️ 75°F, Clear                    │
└─────────────────────────────────────────────┘
```

**Flow**: GPS check → Geofence validation → Auto-populate display → Manual edits → Check-in confirmation

## 2. Visit Progress Screen

```
┌─────────────────────────────────────────────┐
│ ← Active Visit - Residential Lawn Care     │
│   📍 123 Main St • Started 9:17 AM         │
├─────────────────────────────────────────────┤
│                                             │
│   ⏰ TIMER: 1h 23m 14s                    │
│   [  PAUSE  ] [  COMPLETE JOB  ]          │
│                                             │
│   📸 PHOTO CAPTURE                         │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│   │ BEFORE  │ │ PROGRESS│ │ AFTER   │      │
│   │   📷    │ │    📷   │ │   📷    │      │
│   │ 3 photos│ │ 1 photo │ │ 0 photos│      │
│   └─────────┘ └─────────┘ └─────────┘      │
│                                             │
│   📝 NOTES                                 │
│   ┌─────────────────────────────────────┐  │
│   │ Extra edging around flower beds    │  │
│   │ Customer requested organic fert... │  │
│   └─────────────────────────────────────┘  │
│                                             │
│   💬 Customer Chat (2 unread)              │
│   [  VIEW MESSAGES  ]                      │
│                                             │
│   🔄 Last sync: 2 min ago                 │
│   📶 Offline (3 items pending sync)       │
│                                             │
└─────────────────────────────────────────────┘
```

**Flow**: Timer management → Photo capture → Notes → Real-time sync status

## 3. Manager Dispatch Board

```
┌─────────────────────────────────────────────┐
│ Dispatch Board - Tuesday, Oct 15           │
│ [Today] [Week] [Route Optimizer] [+New Job]│
├─────────────────────────────────────────────┤
│                                             │
│ 🚛 Crew A (Mike, Sarah)                    │
│ ┌─────────────────────────────────────────┐ │
│ │ 9:00 ✅ Johnson Lawn (1h 45m) DONE      │ │
│ │ 11:00 🔄 Smith Property (est. 2h) IN... │ │
│ │ 14:00 📅 Davis Yard (est. 1h 30m)      │ │
│ │ 16:00 📅 Wilson Garden (est. 45m)      │ │
│ └─────────────────────────────────────────┘ │
│ Route efficiency: 92% 🗺️ View Map          │
│                                             │
│ 🚛 Crew B (Tom, Alex)                      │
│ ┌─────────────────────────────────────────┐ │
│ │ 8:30 ✅ Martinez Lawn (2h) DONE         │ │
│ │ 11:30 🔄 Brown Estate (est. 3h) IN...   │ │
│ │ 15:30 ⚠️  Garcia Property (DELAYED)     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ 📊 TODAY'S METRICS                          │
│ Revenue: $1,245 | Jobs: 8/12 | Avg: 1h45m │
│                                             │
│ ⚠️  ALERTS                                  │
│ • Crew B running 30min behind              │
│ • Weather alert: Rain at 3PM               │
│                                             │
└─────────────────────────────────────────────┘
```

**Flow**: Real-time crew status → Route optimization → Drag-and-drop rescheduling → Alert management

## 4. Photo Capture with Confidence Indicators

```
┌─────────────────────────────────────────────┐
│ 📸 Photo Capture - BEFORE                  │
│   Wilson Garden • 2:15 PM                  │
├─────────────────────────────────────────────┤
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │                                     │   │
│   │          📷 CAMERA VIEW            │   │
│   │                                     │   │
│   │         [Tap to capture]            │   │
│   │                                     │   │
│   │   🎯 Auto-focus: ✅ READY          │   │
│   │   📍 GPS: ✅ LOCKED                │   │
│   │   ☀️  Light: ⚠️  DIM               │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   📂 EXISTING PHOTOS (3)                   │
│   ┌───┐ ┌───┐ ┌───┐                        │
│   │[1]│ │[2]│ │[3]│ [+]                    │
│   └───┘ └───┘ └───┘                        │
│                                             │
│   ✅ Photos will sync automatically        │
│   🔄 2 photos pending upload               │
│                                             │
│   [ RETAKE ] [ SAVE & CONTINUE ]           │
│                                             │
└─────────────────────────────────────────────┘
```

**Flow**: Camera setup → Quality checks → Auto-tagging → Offline queue → Sync status

## 5. Customer Portal - Order Placement

```
┌─────────────────────────────────────────────┐
│ New Service Request                         │
│ 🏠 Wilson Garden Services                   │
├─────────────────────────────────────────────┤
│                                             │
│   📍 SERVICE ADDRESS                        │
│   ┌─────────────────────────────────────┐   │
│   │ 456 Oak Street, Anytown, ST 12345   │   │
│   └─────────────────────────────────────┘   │
│   [🗺️ View on Map]                         │
│                                             │
│   🌱 SERVICE TYPE                           │
│   ○ Lawn Mowing                            │
│   ● Lawn Care Package                      │
│   ○ Landscaping                            │
│   ○ Seasonal Cleanup                       │
│                                             │
│   📅 PREFERRED DATE                         │
│   [📅 Select Date] Next available: Oct 16  │
│                                             │
│   💰 ESTIMATED COST                         │
│   $85.00 - $120.00 (📊 Based on property) │
│                                             │
│   📝 SPECIAL INSTRUCTIONS                   │
│   ┌─────────────────────────────────────┐   │
│   │ Please use side gate. Avoid flower │   │
│   │ beds on east side of house.        │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   📞 CONTACT PREFERENCES                    │
│   ☑️ SMS updates  ☑️ Email  ☐ Phone       │
│                                             │
│   [  SUBMIT REQUEST  ]                     │
│                                             │
└─────────────────────────────────────────────┘
```

## 6. Accountant Export Dashboard

```
┌─────────────────────────────────────────────┐
│ QuickBooks Export Dashboard                 │
│ [Daily] [Weekly] [Monthly] [Custom Range]  │
├─────────────────────────────────────────────┤
│                                             │
│ 📊 EXPORT SUMMARY - October 2024           │
│ Total Revenue: $12,450.00                  │
│ Processing Fees: $387.50                   │
│ Tax Collected: $996.00                     │
│ Gas Expenses: $450.00                      │
│ Jobs Completed: 156                         │
│                                             │
│ 📈 JOURNAL ENTRY PREVIEW                    │
│ ┌─────────────────────────────────────────┐ │
│ │Date      | Account    | Debit  | Credit │ │
│ │10/15/24  | Revenue    |        | 1245.00│ │
│ │10/15/24  | Fees Exp   | 38.75  |        │ │
│ │10/15/24  | Tax Payable|        | 99.60  │ │
│ │10/15/24  | Gas Expense| 45.00  |        │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ⚙️  EXPORT OPTIONS                          │
│ ☑️ Include per-job line items              │
│ ☑️ Include payment processor breakdown     │
│ ☐ Include crew labor costs                │
│                                             │
│ 📂 RECENT EXPORTS                           │
│ • Oct 14, 2024 - Journal_Entry_10142024.csv│
│ • Oct 13, 2024 - Journal_Entry_10132024.csv│
│                                             │
│ [  GENERATE CSV  ] [  PREVIEW FULL  ]      │
│                                             │
└─────────────────────────────────────────────┘
```

## 7. Confidence Score & Auto-Population Interface

```
┌─────────────────────────────────────────────┐
│ Job Details - Smith Property                │
│ 🏠 Residential • 📅 Scheduled: Tomorrow    │
├─────────────────────────────────────────────┤
│                                             │
│ 🤖 AUTO-SUGGESTIONS                        │
│                                             │
│ 💰 Suggested Price: $95.00                 │
│    📊 Confidence: 87% ████████░░           │
│    Based on: Property size, past jobs,     │
│    seasonal pricing                         │
│    [✏️ Edit] [✅ Apply]                    │
│                                             │
│ ⏱️  Estimated Duration: 2h 30m             │
│    📊 Confidence: 72% ███████░░░           │
│    Based on: Similar properties, crew      │
│    performance, weather                     │
│    [✏️ Edit] [✅ Apply]                    │
│                                             │
│ 👥 Suggested Crew: Team A                  │
│    📊 Confidence: 91% █████████░           │
│    Based on: Availability, past            │
│    performance, location                    │
│    [✏️ Edit] [✅ Apply]                    │
│                                             │
│ ⚡ QUICK ACTIONS                            │
│ [✅ Apply All High Confidence (80%+)]     │
│ [📊 View Prediction Details]              │
│ [🔄 Refresh Suggestions]                   │
│                                             │
│ 📝 Manual overrides will be learned for   │
│    future predictions                       │
│                                             │
└─────────────────────────────────────────────┘
```

**Key UX Principles:**
- **Confidence Visualization**: Progress bars and percentages for ML predictions
- **One-tap Apply**: Easy acceptance of high-confidence suggestions  
- **Inline Editing**: Quick modifications without leaving context
- **Offline Indicators**: Clear sync status and pending operations
- **Geofence Feedback**: Real-time validation with visual cues
- **Progressive Enhancement**: Works offline, enhanced when online