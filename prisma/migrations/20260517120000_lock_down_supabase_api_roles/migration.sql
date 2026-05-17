-- The app accesses Postgres server-side through Prisma. Lock down Supabase's
-- generated Data API roles so public/private app data is not exposed by grants.

ALTER TABLE public."Car" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Image" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Contact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BlockedDate" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public."Car",
  public."Image",
  public."Contact",
  public."Appointment",
  public."BlockedDate"
FROM anon, authenticated, service_role;

-- Keep future Prisma-created tables/functions from being automatically exposed
-- through Supabase API roles. If you intentionally add a Supabase client/API
-- endpoint later, grant the minimum privileges and add explicit RLS policies.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES
  FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES
  FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS
  FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS
  FROM public;
