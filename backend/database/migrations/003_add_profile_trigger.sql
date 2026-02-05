-- ============================================================
-- Migration 003: Auto-create profile on user signup
-- Created: 2026-02-04
-- Description: Trigger to automatically create profile when user signs up
-- ============================================================

-- Function to create profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, content)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''), '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
