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

-- User profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'crew', -- 'crew', 'manager', 'accountant', 'customer'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- Enable Row Level Security on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_populations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Customers policies
CREATE POLICY "All authenticated users can view customers" ON customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify customers" ON customers FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('manager', 'accountant'))
);

-- Jobs policies
CREATE POLICY "All authenticated users can view jobs" ON jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify jobs" ON jobs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('manager', 'accountant'))
);

-- Crews policies
CREATE POLICY "All authenticated users can view crews" ON crews FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify crews" ON crews FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('manager', 'accountant'))
);

-- Crew members policies
CREATE POLICY "All authenticated users can view crew members" ON crew_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify crew members" ON crew_members FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('manager', 'accountant'))
);

-- Visits policies
CREATE POLICY "All authenticated users can view visits" ON visits FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Crew can create and update their visits" ON visits FOR ALL USING (
    EXISTS (SELECT 1 FROM crew_members cm WHERE cm.user_id = auth.uid() AND cm.crew_id = visits.crew_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('manager', 'accountant'))
);

-- Media policies
CREATE POLICY "All authenticated users can view media" ON media FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert media" ON media FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Chat messages policies
CREATE POLICY "Users can view relevant chat messages" ON chat_messages FOR SELECT USING (
    sender_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('manager', 'accountant'))
);
CREATE POLICY "Authenticated users can create chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Invoices policies
CREATE POLICY "All authenticated users can view invoices" ON invoices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify invoices" ON invoices FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('manager', 'accountant'))
);

-- Line items policies
CREATE POLICY "All authenticated users can view line items" ON line_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify line items" ON line_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('manager', 'accountant'))
);

-- Payments policies
CREATE POLICY "All authenticated users can view payments" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify payments" ON payments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('manager', 'accountant'))
);

-- Daily journal entries policies
CREATE POLICY "Accountants can access journal entries" ON daily_journal_entries FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'accountant')
);

-- Auto populations policies
CREATE POLICY "All authenticated users can view auto populations" ON auto_populations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can insert auto populations" ON auto_populations FOR INSERT WITH CHECK (true);

-- Audit logs policies
CREATE POLICY "Managers can view audit logs" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('manager', 'accountant'))
);

-- Exports policies
CREATE POLICY "Accountants can access exports" ON exports FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'accountant')
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

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crews_updated_at BEFORE UPDATE ON crews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'crew');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert some seed data
INSERT INTO customers (name, email, phone, address, location) VALUES
('Green Valley Estates HOA', 'contact@greenvalley.com', '555-0123', '1234 Main St, Springfield, IL 62701', ST_SetSRID(ST_MakePoint(-89.6501, 39.7817), 4326)),
('Riverside Community Center', 'maintenance@riverside.org', '555-0124', '5678 Oak Ave, Springfield, IL 62702', ST_SetSRID(ST_MakePoint(-89.6401, 39.7917), 4326)),
('Downtown Office Complex', 'facilities@downtownoffice.com', '555-0125', '9012 Business Blvd, Springfield, IL 62703', ST_SetSRID(ST_MakePoint(-89.6301, 39.8017), 4326));

INSERT INTO crews (name, status) VALUES
('Alpha Crew', 'available'),
('Beta Crew', 'available'),
('Gamma Crew', 'busy');

INSERT INTO jobs (customer_id, title, description, address, location, estimated_duration, suggested_price, status, scheduled_date) VALUES
((SELECT id FROM customers WHERE name = 'Green Valley Estates HOA'), 'Weekly Lawn Maintenance', 'Mow, edge, and trim common areas', '1234 Main St, Springfield, IL 62701', ST_SetSRID(ST_MakePoint(-89.6501, 39.7817), 4326), 120, 150.00, 'scheduled', CURRENT_DATE + INTERVAL '1 day'),
((SELECT id FROM customers WHERE name = 'Riverside Community Center'), 'Landscape Installation', 'Install new flower beds and irrigation', '5678 Oak Ave, Springfield, IL 62702', ST_SetSRID(ST_MakePoint(-89.6401, 39.7917), 4326), 240, 850.00, 'scheduled', CURRENT_DATE + INTERVAL '2 days'),
((SELECT id FROM customers WHERE name = 'Downtown Office Complex'), 'Seasonal Cleanup', 'Fall leaf removal and bed preparation', '9012 Business Blvd, Springfield, IL 62703', ST_SetSRID(ST_MakePoint(-89.6301, 39.8017), 4326), 180, 275.00, 'scheduled', CURRENT_DATE + INTERVAL '3 days');