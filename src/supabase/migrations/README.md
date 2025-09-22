# Samudra Ledger Database Migration

This directory contains the database migration scripts for the Samudra Ledger carbon credit verification platform.

## Setup Instructions

1. **Connect to Supabase**: Make sure you have connected your Supabase project using the Figma Make Supabase connect tool.

2. **Run the migration**: Execute the SQL migration script in your Supabase SQL Editor:
   - Go to your Supabase Dashboard
   - Navigate to the SQL Editor
   - Copy and paste the content of `001_initial_schema.sql`
   - Click "Run" to execute the migration

3. **Verify setup**: After running the migration, you should see the following tables in your Supabase Database:
   - `projects`
   - `mrv_data`
   - `uploaded_files`
   - `carbon_credits`
   - `credit_purchases`
   - `credit_retirements`
   - `ml_verifications`
   - `user_watchlists`
   - `user_profiles`
   - `public_stats`

## Database Structure

### Tables Overview

- **projects**: Stores blue carbon project information
- **mrv_data**: Stores MRV (Monitoring, Reporting, Verification) submission data
- **uploaded_files**: Stores metadata for files uploaded during MRV submission
- **carbon_credits**: Stores issued carbon credits from approved projects
- **credit_purchases**: Tracks purchases of carbon credits by buyers
- **credit_retirements**: Records retired carbon credits
- **ml_verifications**: Stores ML model verification results
- **user_watchlists**: User-specific watchlists for carbon credits
- **user_profiles**: Extended user profile information
- **public_stats**: Cached public statistics

### Key Features

- **Row Level Security (RLS)**: All tables have appropriate RLS policies
- **Automatic triggers**: Updates timestamps and public statistics automatically
- **User profiles**: Automatically created when users sign up
- **Indexes**: Optimized for performance with appropriate indexes
- **Foreign key constraints**: Ensures data integrity

### Migration Benefits

This migration moves the platform from a KV store approach to a proper PostgreSQL database, providing:

1. **Better data integrity** with foreign key constraints
2. **Improved performance** with proper indexing
3. **Advanced querying capabilities** for analytics
4. **Automatic data aggregation** with triggers
5. **Row-level security** for secure multi-tenant access
6. **ACID compliance** for reliable transactions

## Project Manager Benefits

After this migration, project managers will be able to:

- See the total number of credits generated from their approved projects
- Track the status of their MRV submissions
- View detailed credit information including available amounts
- Access historical data for their projects

The new endpoint `/make-server-a82c4acb/projects/manager-with-credits` provides enhanced project information including credit generation data.