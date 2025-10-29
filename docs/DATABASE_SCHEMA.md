# Database Schema (PostgreSQL + PostGIS)

## Entity Relationship Diagram

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Customers  │────│    Jobs      │────│   Visits    │
│             │    │              │    │             │
│ id (uuid)   │    │ id (uuid)    │    │ id (uuid)   │
│ name        │    │ customer_id  │    │ job_id      │
│ email       │    │ address      │    │ crew_id     │
│ phone       │    │ location     │    │ check_in    │
│ address     │◄───│ (geometry)   │    │ check_out   │
│ location    │    │ recurrence   │    │ actual_start│
│ (geometry)  │    │ status       │    │ actual_end  │
│ preferences │    │ created_at   │    │ photos[]    │
└─────────────┘    └──────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ ChatMessages│    │   Crews      │────│ CrewMembers │
│             │    │              │    │             │
│ id (uuid)   │    │ id (uuid)    │    │ id (uuid)   │
│ customer_id │    │ name         │    │ crew_id     │
│ sender_type │    │ members[]    │    │ user_id     │
│ message     │    │ current_route│    │ role        │
│ media_url   │    │ status       │    │ active      │
│ timestamp   │    │ created_at   │    │ joined_at   │
└─────────────┘    └──────────────┘    └─────────────┘
                           │                   │
                           │                   │
                   ┌──────────────┐    ┌─────────────┐
                   │   Invoices   │    │  LineItems  │
                   │              │────│             │
                   │ id (uuid)    │    │ id (uuid)   │
                   │ job_id       │    │ invoice_id  │
                   │ amount       │    │ description │
                   │ tax_amount   │    │ quantity    │
                   │ status       │    │ unit_price  │
                   │ due_date     │    │ total       │
                   │ created_at   │    │ created_at  │
                   └──────────────┘    └─────────────┘
                           │
                           │
                   ┌──────────────┐
                   │   Payments   │
                   │              │
                   │ id (uuid)    │
                   │ invoice_id   │
                   │ amount       │
                   │ processor    │
                   │ processor_id │
                   │ status       │
                   │ created_at   │
                   └──────────────┘
```

## Core Tables SQL DDL

```sql
-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create custom types
CREATE TYPE job_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE recurrence_type AS ENUM ('none', 'weekly', 'biweekly', 'monthly');
CREATE TYPE crew_role AS ENUM ('lead', 'member', 'trainee');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE chat_sender AS ENUM ('customer', 'crew', 'manager');

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT NOT NULL,
    location GEOMETRY(POINT, 4326), -- WGS84 coordinates
    preferences JSONB DEFAULT '{}',
    geofence_radius INTEGER DEFAULT 50, -- meters
    chat_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    location GEOMETRY(POINT, 4326),
    estimated_duration INTEGER, -- minutes
    suggested_price DECIMAL(10,2),
    actual_price DECIMAL(10,2),
    recurrence recurrence_type DEFAULT 'none',
    recurrence_day INTEGER, -- 0-6 for day of week
    status job_status DEFAULT 'scheduled',
    scheduled_date DATE,
    auto_populated_confidence INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crews table
CREATE TABLE crews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    current_location GEOMETRY(POINT, 4326),
    status TEXT DEFAULT 'available',
    route JSONB DEFAULT '[]', -- Array of job IDs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crew members table (links users to crews)
CREATE TABLE crew_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id UUID REFERENCES crews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role crew_role DEFAULT 'member',
    active BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(crew_id, user_id)
);

-- Visits table (actual job executions)
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    crew_id UUID REFERENCES crews(id),
    check_in_location GEOMETRY(POINT, 4326),
    check_out_location GEOMETRY(POINT, 4326),
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    notes TEXT,
    weather_conditions TEXT,
    photos TEXT[], -- Array of storage URLs
    geofence_verified BOOLEAN DEFAULT false,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media files table
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'before', 'after', 'progress'
    file_size INTEGER,
    checksum TEXT,
    captured_at TIMESTAMPTZ NOT NULL,
    location GEOMETRY(POINT, 4326),
    uploaded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),
    sender_id UUID REFERENCES auth.users(id),
    sender_type chat_sender NOT NULL,
    message TEXT,
    media_url TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'draft',
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Line items for invoices
CREATE TABLE line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    processor TEXT NOT NULL, -- 'paypal', 'stripe', 'cash_app', 'check'
    processor_transaction_id TEXT,
    status payment_status DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily journal entries for QuickBooks export
CREATE TABLE daily_journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL,
    gross_revenue DECIMAL(10,2) DEFAULT 0,
    processing_fees DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    gas_costs DECIMAL(10,2) DEFAULT 0,
    job_count INTEGER DEFAULT 0,
    exported_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entry_date)
);

-- Auto-population cache for ML predictions
CREATE TABLE auto_populations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    job_type TEXT,
    suggested_price DECIMAL(10,2),
    estimated_duration INTEGER,
    confidence_score INTEGER, -- 0-100
    factors JSONB, -- What influenced the prediction
    applied BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs for all changes
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exports tracking
CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_type TEXT NOT NULL, -- 'journal_entry', 'invoice_batch'
    date_range_start DATE,
    date_range_end DATE,
    file_path TEXT,
    record_count INTEGER,
    exported_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_location ON jobs USING GIST(location);
CREATE INDEX idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX idx_visits_job_id ON visits(job_id);
CREATE INDEX idx_visits_crew_id ON visits(crew_id);
CREATE INDEX idx_visits_check_in_time ON visits(check_in_time);
CREATE INDEX idx_customers_location ON customers USING GIST(location);
CREATE INDEX idx_media_visit_id ON media(visit_id);
CREATE INDEX idx_chat_messages_customer_id ON chat_messages(customer_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);