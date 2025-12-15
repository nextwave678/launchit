-- Backend MVP Migration
-- Adds indexes, new columns, and updated RLS policies

-- ============================================
-- SCHEMA ENHANCEMENTS
-- ============================================

-- Add new columns to landing_pages
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS meta_description text;

-- Add new columns to campaigns
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone,
ADD COLUMN IF NOT EXISTS approval_status text CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

-- Add notes column to leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS notes text;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_research_project_id ON research_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_specs_project_id ON product_specs(project_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_project_id ON landing_pages(project_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_project_status ON campaigns(project_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_project_status ON leads(project_id, status);
CREATE INDEX IF NOT EXISTS idx_analytics_project_created ON analytics_events(project_id, created_at);

-- ============================================
-- UPDATED RLS POLICIES
-- ============================================

-- RESEARCH REPORTS - Add update/delete policies
DROP POLICY IF EXISTS "Users can update reports for their projects" ON research_reports;
CREATE POLICY "Users can update reports for their projects"
  ON research_reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = research_reports.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete reports for their projects" ON research_reports;
CREATE POLICY "Users can delete reports for their projects"
  ON research_reports FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = research_reports.project_id AND projects.user_id = auth.uid()));

-- PRODUCT SPECS - Add update/delete policies
DROP POLICY IF EXISTS "Users can update specs for their projects" ON product_specs;
CREATE POLICY "Users can update specs for their projects"
  ON product_specs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = product_specs.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete specs for their projects" ON product_specs;
CREATE POLICY "Users can delete specs for their projects"
  ON product_specs FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = product_specs.project_id AND projects.user_id = auth.uid()));

-- LANDING PAGES - Add update/delete policies and public read
DROP POLICY IF EXISTS "Users can update pages for their projects" ON landing_pages;
CREATE POLICY "Users can update pages for their projects"
  ON landing_pages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = landing_pages.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete pages for their projects" ON landing_pages;
CREATE POLICY "Users can delete pages for their projects"
  ON landing_pages FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = landing_pages.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Public can view active landing pages" ON landing_pages;
CREATE POLICY "Public can view active landing pages"
  ON landing_pages FOR SELECT
  USING (is_active = true);

-- CAMPAIGNS - Add update/delete policies
DROP POLICY IF EXISTS "Users can update campaigns for their projects" ON campaigns;
CREATE POLICY "Users can update campaigns for their projects"
  ON campaigns FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = campaigns.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete campaigns for their projects" ON campaigns;
CREATE POLICY "Users can delete campaigns for their projects"
  ON campaigns FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = campaigns.project_id AND projects.user_id = auth.uid()));

-- LEADS - Add update/delete policies and public insert
DROP POLICY IF EXISTS "Users can update leads for their projects" ON leads;
CREATE POLICY "Users can update leads for their projects"
  ON leads FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = leads.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete leads for their projects" ON leads;
CREATE POLICY "Users can delete leads for their projects"
  ON leads FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = leads.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Public can insert leads" ON leads;
CREATE POLICY "Public can insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- ANALYTICS EVENTS - Add public insert policy
DROP POLICY IF EXISTS "Public can insert analytics events" ON analytics_events;
CREATE POLICY "Public can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);


