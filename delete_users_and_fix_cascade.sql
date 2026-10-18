-- ==============================================================================
-- FIX FOREIGN KEY CASCADE CONSTRAINTS & SAFELY DELETE TARGET USERS
-- ==============================================================================
-- Run this entire script in your Supabase SQL Editor.
-- Target users to delete:
--   1. davidcharles112255@gmail.com
--   2. izuchuwkuezemagu@gmail.com
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: CLEAN UP ALL EXISTING ORPHAN REFERENCES FIRST
-- ------------------------------------------------------------------------------
-- If an old user was deleted in the past, existing rows might have broken
-- referred_by IDs. We clear those broken links so foreign keys can be safely added.
UPDATE public.profiles
SET referred_by = NULL
WHERE referred_by IS NOT NULL
  AND referred_by NOT IN (SELECT id FROM public.profiles);

UPDATE public.transactions
SET referred_user_id = NULL
WHERE referred_user_id IS NOT NULL
  AND referred_user_id NOT IN (SELECT id FROM auth.users);

-- ------------------------------------------------------------------------------
-- STEP 2: SAFELY PURGE THE TWO TARGET USERS ACROSS ALL TABLES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_user_ids UUID[];
BEGIN
    -- Gather all matching IDs from auth.users and profiles
    SELECT ARRAY_AGG(id) INTO v_user_ids
    FROM (
        SELECT id FROM auth.users WHERE LOWER(email) IN ('davidcharles112255@gmail.com', 'izuchuwkuezemagu@gmail.com')
        UNION
        SELECT id FROM public.profiles WHERE LOWER(email) IN ('davidcharles112255@gmail.com', 'izuchuwkuezemagu@gmail.com')
    ) u;

    IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
        -- 1. Unlink any users referred by them
        UPDATE public.profiles 
        SET referred_by = NULL 
        WHERE referred_by = ANY(v_user_ids);

        -- 2. Unlink any commission transactions where they were the referred user
        UPDATE public.transactions 
        SET referred_user_id = NULL 
        WHERE referred_user_id = ANY(v_user_ids);

        -- 3. Delete user financial transactions
        DELETE FROM public.transactions WHERE user_id = ANY(v_user_ids);

        -- 4. Delete user investments
        DELETE FROM public.investments WHERE user_id = ANY(v_user_ids);

        -- 5. Delete user notifications & reads
        DELETE FROM public.notification_reads WHERE user_id = ANY(v_user_ids);
        DELETE FROM public.notifications WHERE user_id = ANY(v_user_ids);

        -- 6. Delete user vendor plans
        DELETE FROM public.vendor_plans WHERE vendor_id = ANY(v_user_ids);

        -- 7. Delete profiles
        DELETE FROM public.profiles WHERE id = ANY(v_user_ids);

        -- 8. Delete auth.users (cascades sessions, identities, tokens)
        DELETE FROM auth.users WHERE id = ANY(v_user_ids);
    END IF;

    -- Safety fallback: direct delete by email
    DELETE FROM public.profiles WHERE LOWER(email) IN ('davidcharles112255@gmail.com', 'izuchuwkuezemagu@gmail.com');
    DELETE FROM auth.users WHERE LOWER(email) IN ('davidcharles112255@gmail.com', 'izuchuwkuezemagu@gmail.com');
END $$;

-- ------------------------------------------------------------------------------
-- STEP 3: CLEAN UP ANY LINGERING ORPHANS AFTER PURGE
-- ------------------------------------------------------------------------------
UPDATE public.profiles
SET referred_by = NULL
WHERE referred_by IS NOT NULL
  AND referred_by NOT IN (SELECT id FROM public.profiles);

UPDATE public.transactions
SET referred_user_id = NULL
WHERE referred_user_id IS NOT NULL
  AND referred_user_id NOT IN (SELECT id FROM auth.users);

-- ------------------------------------------------------------------------------
-- STEP 4: ESTABLISH ON DELETE CASCADE / SET NULL CONSTRAINTS
-- ------------------------------------------------------------------------------
-- Now that all orphan links are cleared, the constraints will attach smoothly.
DO $$
BEGIN
    -- 1. profiles.referred_by (ON DELETE SET NULL)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_referred_by_fkey' AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_referred_by_fkey;
    END IF;
    ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_referred_by_fkey 
        FOREIGN KEY (referred_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

    -- 2. transactions.referred_user_id (ON DELETE SET NULL)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_referred_user_id_fkey' AND table_name = 'transactions'
    ) THEN
        ALTER TABLE public.transactions DROP CONSTRAINT transactions_referred_user_id_fkey;
    END IF;

    BEGIN
        ALTER TABLE public.transactions 
            ADD CONSTRAINT transactions_referred_user_id_fkey 
            FOREIGN KEY (referred_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN OTHERS THEN
        BEGIN
            ALTER TABLE public.transactions 
                ADD CONSTRAINT transactions_referred_user_id_fkey 
                FOREIGN KEY (referred_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END;

    -- 3. transactions.user_id (ON DELETE CASCADE)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_user_id_fkey' AND table_name = 'transactions'
    ) THEN
        ALTER TABLE public.transactions DROP CONSTRAINT transactions_user_id_fkey;
    END IF;
    ALTER TABLE public.transactions 
        ADD CONSTRAINT transactions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- 4. investments.user_id (ON DELETE CASCADE)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'investments_user_id_fkey' AND table_name = 'investments'
    ) THEN
        ALTER TABLE public.investments DROP CONSTRAINT investments_user_id_fkey;
    END IF;
    ALTER TABLE public.investments 
        ADD CONSTRAINT investments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- 5. vendor_plans.vendor_id (ON DELETE CASCADE)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vendor_plans_vendor_id_fkey' AND table_name = 'vendor_plans'
    ) THEN
        ALTER TABLE public.vendor_plans DROP CONSTRAINT vendor_plans_vendor_id_fkey;
    END IF;
    ALTER TABLE public.vendor_plans 
        ADD CONSTRAINT vendor_plans_vendor_id_fkey 
        FOREIGN KEY (vendor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- 6. notifications and notification_reads (ON DELETE CASCADE)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_user_id_fkey' AND table_name = 'notifications'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_user_id_fkey;
    END IF;
    ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notification_reads_user_id_fkey' AND table_name = 'notification_reads'
    ) THEN
        ALTER TABLE public.notification_reads DROP CONSTRAINT notification_reads_user_id_fkey;
    END IF;
    ALTER TABLE public.notification_reads 
        ADD CONSTRAINT notification_reads_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

END $$;

-- ------------------------------------------------------------------------------
-- STEP 5: CLEAN UP ANY LINGERING OTP CODES
-- ------------------------------------------------------------------------------
DELETE FROM public.signup_otps WHERE LOWER(email) IN ('davidcharles112255@gmail.com', 'izuchuwkuezemagu@gmail.com');
DELETE FROM public.password_reset_otps WHERE LOWER(email) IN ('davidcharles112255@gmail.com', 'izuchuwkuezemagu@gmail.com');

-- ------------------------------------------------------------------------------
-- STEP 6: RELOAD SCHEMA CACHE
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- Verification output: Should return 0 rows
SELECT id, email, created_at 
FROM auth.users 
WHERE LOWER(email) IN ('davidcharles112255@gmail.com', 'izuchuwkuezemagu@gmail.com');
