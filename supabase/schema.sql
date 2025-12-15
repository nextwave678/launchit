-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROJECTS TABLE
create table projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  niche text not null,
  budget integer,
  geography text,
  business_type text check (business_type in ('service', 'saas', 'info_product', 'creator_tool')),
  goal_mrr integer,
  risk_tolerance text check (risk_tolerance in ('low', 'medium', 'high')),
  status text check (status in ('researching', 'building', 'launched', 'iterating', 'paused')) default 'researching',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RESEARCH REPORTS TABLE
create table research_reports (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  pain_points jsonb,
  competitors jsonb,
  search_demand jsonb,
  social_sentiment text,
  opportunity_score integer check (opportunity_score >= 0 and opportunity_score <= 100),
  recommended_offers jsonb,
  raw_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PRODUCT SPECS TABLE
create table product_specs (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  hero_offer text,
  tagline text,
  pain_solution_map jsonb,
  pricing jsonb,
  features jsonb,
  differentiation text,
  cta_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LANDING PAGES TABLE
create table landing_pages (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  url text,
  html_content text,
  theme jsonb,
  is_active boolean default true,
  view_count integer default 0,
  conversion_rate decimal,
  deployed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CAMPAIGNS TABLE
create table campaigns (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  type text check (type in ('reddit', 'tiktok', 'twitter', 'meta', 'email', 'paid_ad')),
  content text,
  platform text,
  status text check (status in ('draft', 'scheduled', 'posted', 'completed')) default 'draft',
  clicks integer default 0,
  conversions integer default 0,
  cost decimal default 0,
  posted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LEADS TABLE
create table leads (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text,
  email text,
  phone text,
  source text,
  status text check (status in ('new', 'qualified', 'contacted', 'converted', 'lost')) default 'new',
  conversation_history jsonb,
  quality_score integer check (quality_score >= 0 and quality_score <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ANALYTICS EVENTS TABLE
create table analytics_events (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  event_type text not null,
  metadata jsonb,
  session_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
alter table projects enable row level security;
alter table research_reports enable row level security;
alter table product_specs enable row level security;
alter table landing_pages enable row level security;
alter table campaigns enable row level security;
alter table leads enable row level security;
alter table analytics_events enable row level security;

-- PROJECTS POLICIES
create policy "Users can view their own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on projects for delete
  using (auth.uid() = user_id);

-- Helper function to check project ownership for related tables
-- This avoids repeated joins in policies, though simple joins are also fine.
-- For simplicity in this MVP, we'll do direct checks against the project's user_id via a join.

-- RESEARCH REPORTS POLICIES
create policy "Users can view reports for their projects"
  on research_reports for select
  using (exists (select 1 from projects where projects.id = research_reports.project_id and projects.user_id = auth.uid()));

create policy "Users can insert reports for their projects"
  on research_reports for insert
  with check (exists (select 1 from projects where projects.id = research_reports.project_id and projects.user_id = auth.uid()));

-- PRODUCT SPECS POLICIES
create policy "Users can view specs for their projects"
  on product_specs for select
  using (exists (select 1 from projects where projects.id = product_specs.project_id and projects.user_id = auth.uid()));

create policy "Users can insert specs for their projects"
  on product_specs for insert
  with check (exists (select 1 from projects where projects.id = product_specs.project_id and projects.user_id = auth.uid()));

-- LANDING PAGES POLICIES
create policy "Users can view pages for their projects"
  on landing_pages for select
  using (exists (select 1 from projects where projects.id = landing_pages.project_id and projects.user_id = auth.uid()));

create policy "Users can insert pages for their projects"
  on landing_pages for insert
  with check (exists (select 1 from projects where projects.id = landing_pages.project_id and projects.user_id = auth.uid()));
  
-- Public access for landing pages (for visitors to view them)?
-- If the landing page is served via this app, we might need a public policy.
-- For now, assuming the builder app only needs authenticated access. 
-- The deployed page will likely be static HTML or handled via a public route that bypasses RLS or uses a service key.

-- CAMPAIGNS POLICIES
create policy "Users can view campaigns for their projects"
  on campaigns for select
  using (exists (select 1 from projects where projects.id = campaigns.project_id and projects.user_id = auth.uid()));

create policy "Users can insert campaigns for their projects"
  on campaigns for insert
  with check (exists (select 1 from projects where projects.id = campaigns.project_id and projects.user_id = auth.uid()));

-- LEADS POLICIES
create policy "Users can view leads for their projects"
  on leads for select
  using (exists (select 1 from projects where projects.id = leads.project_id and projects.user_id = auth.uid()));

-- Allow public insertion of leads (for forms)?
-- Usually forms will submit via an API route that uses a service key or an open RLS policy.
-- We'll keep it restricted to users for now, assuming API route handles ingestion.

-- ANALYTICS POLICIES
create policy "Users can view analytics for their projects"
  on analytics_events for select
  using (exists (select 1 from projects where projects.id = analytics_events.project_id and projects.user_id = auth.uid()));


