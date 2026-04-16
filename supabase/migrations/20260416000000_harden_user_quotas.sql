-- Harden public.users RLS to prevent users from inflating their own quotas
-- This trigger ensures that the authenticated role cannot modify sensitive columns.

-- 1. Create the protection function
CREATE OR REPLACE FUNCTION protect_user_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Only the admin/service_role can change generation_limit
    IF (current_setting('role') = 'authenticated') THEN
        IF NEW.generation_limit <> OLD.generation_limit THEN
            RAISE EXCEPTION 'You are not allowed to modify the generation_limit field.';
        END IF;
        
        -- You could also protect other fields here if needed (e.g. id, email)
        IF NEW.id <> OLD.id THEN
            RAISE EXCEPTION 'You are not allowed to modify the user id.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger
DROP TRIGGER IF EXISTS tr_protect_user_sensitive_fields ON public.users;
CREATE TRIGGER tr_protect_user_sensitive_fields
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION protect_user_sensitive_fields();

-- 3. Verify RLS policies (They are already set to owner-only, which is correct, 
-- but now the trigger blocks the specific column injection)
COMMENT ON TRIGGER tr_protect_user_sensitive_fields ON public.users IS 'Prevents non-admin users from self-inflating their generation limits.';
