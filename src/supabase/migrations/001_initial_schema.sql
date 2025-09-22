-- Samudra Ledger Database Schema
-- Carbon Credit Verification Platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    ecosystem_type TEXT NOT NULL CHECK (ecosystem_type IN ('mangrove', 'saltmarsh', 'seagrass', 'coastal_wetland')),
    area DECIMAL NOT NULL,
    coordinates TEXT,
    community_partners TEXT,
    expected_carbon_capture DECIMAL,
    manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    manager_name TEXT,
    manager_email TEXT,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'mrv_submitted', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    on_chain_tx_hash TEXT
);

-- MRV Data table
CREATE TABLE IF NOT EXISTS mrv_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    satellite_data TEXT,
    community_reports TEXT,
    sensor_readings TEXT,
    iot_data TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending_ml_processing' CHECK (status IN ('pending_ml_processing', 'pending_verification', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_notes TEXT,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    ml_carbon_estimate DECIMAL,
    ml_biomass_health_score DECIMAL,
    ml_evidence_cid TEXT,
    on_chain_tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uploaded Files table
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mrv_data_id UUID NOT NULL REFERENCES mrv_data(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('photo', 'iot_data', 'document')),
    upload_path TEXT NOT NULL,
    signed_url TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carbon Credits table
CREATE TABLE IF NOT EXISTS carbon_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mrv_data_id UUID NOT NULL REFERENCES mrv_data(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    total_amount DECIMAL NOT NULL,
    available_amount DECIMAL NOT NULL,
    price_per_credit DECIMAL DEFAULT 25.00,
    health_score DECIMAL,
    evidence_cid TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold_out')),
    on_chain_tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Purchases table
CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_id UUID NOT NULL REFERENCES carbon_credits(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    price_per_credit DECIMAL NOT NULL,
    total_price DECIMAL NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'card',
    payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    on_chain_tx_hash TEXT
);

-- Credit Retirements table
CREATE TABLE IF NOT EXISTS credit_retirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES credit_purchases(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    reason TEXT NOT NULL,
    retired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    on_chain_tx_hash TEXT,
    certificate_url TEXT
);

-- ML Verifications table
CREATE TABLE IF NOT EXISTS ml_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    mrv_data_id UUID NOT NULL REFERENCES mrv_data(id) ON DELETE CASCADE,
    ml_score DECIMAL NOT NULL,
    confidence DECIMAL NOT NULL,
    risk_factors TEXT[], -- Array of risk factors
    recommendation TEXT NOT NULL,
    verifier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Watchlists table
CREATE TABLE IF NOT EXISTS user_watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credit_id UUID NOT NULL REFERENCES carbon_credits(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, credit_id)
);

-- Public Stats table (for caching aggregated statistics)
CREATE TABLE IF NOT EXISTS public_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_credits_issued DECIMAL DEFAULT 0,
    total_credits_retired DECIMAL DEFAULT 0,
    total_projects INTEGER DEFAULT 0,
    total_active_users INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Profiles table (extends auth.users with additional metadata)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('project_manager', 'nccr_verifier', 'buyer')),
    organization TEXT,
    nccr_id TEXT, -- For NCCR verifiers
    email_domain_verified BOOLEAN DEFAULT FALSE,
    credit_balance DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_mrv_data_project_id ON mrv_data(project_id);
CREATE INDEX IF NOT EXISTS idx_mrv_data_status ON mrv_data(status);
CREATE INDEX IF NOT EXISTS idx_mrv_data_manager_id ON mrv_data(manager_id);
CREATE INDEX IF NOT EXISTS idx_carbon_credits_project_id ON carbon_credits(project_id);
CREATE INDEX IF NOT EXISTS idx_carbon_credits_status ON carbon_credits(status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_buyer_id ON credit_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_credit_retirements_buyer_id ON credit_retirements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_user_id ON user_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_mrv_data_id ON uploaded_files(mrv_data_id);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE mrv_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_retirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Public stats is readable by everyone
ALTER TABLE public_stats ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Project managers can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = manager_id);

CREATE POLICY "Project managers can create projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Project managers can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = manager_id);

-- NCCR verifiers can view all projects
CREATE POLICY "NCCR verifiers can view all projects" ON projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'nccr_verifier'
        )
    );

-- Buyers can view approved projects
CREATE POLICY "Buyers can view approved projects" ON projects
    FOR SELECT USING (
        status = 'approved' AND 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'buyer'
        )
    );

-- Public can view approved projects
CREATE POLICY "Public can view approved projects" ON projects
    FOR SELECT USING (status = 'approved');

-- MRV Data policies
CREATE POLICY "Project managers can manage their MRV data" ON mrv_data
    FOR ALL USING (auth.uid() = manager_id);

CREATE POLICY "NCCR verifiers can view all MRV data" ON mrv_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'nccr_verifier'
        )
    );

CREATE POLICY "NCCR verifiers can update MRV verification" ON mrv_data
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'nccr_verifier'
        )
    );

-- Uploaded Files policies
CREATE POLICY "Users can view files for their MRV data" ON uploaded_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mrv_data 
            WHERE id = uploaded_files.mrv_data_id AND manager_id = auth.uid()
        )
    );

CREATE POLICY "NCCR verifiers can view all uploaded files" ON uploaded_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'nccr_verifier'
        )
    );

-- Carbon Credits policies
CREATE POLICY "Everyone can view available carbon credits" ON carbon_credits
    FOR SELECT USING (status = 'available');

-- Credit Purchases policies
CREATE POLICY "Buyers can view their own purchases" ON credit_purchases
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create purchases" ON credit_purchases
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Credit Retirements policies
CREATE POLICY "Buyers can view their own retirements" ON credit_retirements
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create retirements" ON credit_retirements
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- ML Verifications policies
CREATE POLICY "NCCR verifiers can manage ML verifications" ON ml_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'nccr_verifier'
        )
    );

-- User Watchlists policies
CREATE POLICY "Users can manage their own watchlists" ON user_watchlists
    FOR ALL USING (auth.uid() = user_id);

-- User Profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Public Stats policies
CREATE POLICY "Everyone can view public stats" ON public_stats
    FOR SELECT USING (true);

-- Only service role can update public stats
CREATE POLICY "Service role can manage public stats" ON public_stats
    FOR ALL USING (auth.role() = 'service_role');

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mrv_data_updated_at BEFORE UPDATE ON mrv_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carbon_credits_updated_at BEFORE UPDATE ON carbon_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize public stats
INSERT INTO public_stats (total_credits_issued, total_credits_retired, total_projects, total_active_users)
VALUES (0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, role, organization)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
        NEW.raw_user_meta_data->>'organization'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update public stats automatically
CREATE OR REPLACE FUNCTION update_public_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the single row in public_stats
    UPDATE public_stats SET
        total_credits_issued = (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM carbon_credits
        ),
        total_credits_retired = (
            SELECT COALESCE(SUM(amount), 0)
            FROM credit_retirements
        ),
        total_projects = (
            SELECT COUNT(*)
            FROM projects
        ),
        total_active_users = (
            SELECT COUNT(DISTINCT buyer_id)
            FROM credit_purchases
        ),
        last_updated = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to update public stats
CREATE TRIGGER update_stats_on_carbon_credits_change
    AFTER INSERT OR UPDATE OR DELETE ON carbon_credits
    FOR EACH STATEMENT EXECUTE FUNCTION update_public_stats();

CREATE TRIGGER update_stats_on_retirements_change
    AFTER INSERT OR UPDATE OR DELETE ON credit_retirements
    FOR EACH STATEMENT EXECUTE FUNCTION update_public_stats();

CREATE TRIGGER update_stats_on_projects_change
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH STATEMENT EXECUTE FUNCTION update_public_stats();

CREATE TRIGGER update_stats_on_purchases_change
    AFTER INSERT OR UPDATE OR DELETE ON credit_purchases
    FOR EACH STATEMENT EXECUTE FUNCTION update_public_stats();