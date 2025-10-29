-- Fix RLS security issues by enabling RLS on PostGIS tables
ALTER TABLE public.geometry_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geography_columns ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Create policies for PostGIS tables (read-only access for authenticated users)
CREATE POLICY "Allow read access to geometry_columns" ON public.geometry_columns FOR SELECT USING (true);
CREATE POLICY "Allow read access to geography_columns" ON public.geography_columns FOR SELECT USING (true);
CREATE POLICY "Allow read access to spatial_ref_sys" ON public.spatial_ref_sys FOR SELECT USING (true);