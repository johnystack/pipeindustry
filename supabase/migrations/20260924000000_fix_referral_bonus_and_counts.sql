-- Migration: Fix Referral Bonus and Referral Counting Logic
-- Ensures referral bonus and referral counts ONLY count referred users who have invested and are already approved.

-- 1. Ensure commission_paid column exists on investments
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT FALSE;

-- 2. Synchronize has_invested flag on all existing profiles
UPDATE public.profiles p
SET has_invested = EXISTS (
    SELECT 1 FROM public.investments i 
    WHERE i.user_id = p.id AND i.status IN ('active', 'completed')
);

-- 3. Replace handle_referral_bonus function
CREATE OR REPLACE FUNCTION public.handle_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_active_referrals_count INTEGER;
    v_bonus_percent NUMERIC := 0;
    v_bonus_amount NUMERIC := 0;
    v_investor_name TEXT;
BEGIN
    -- Only process when an investment becomes 'active'
    IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR
       (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'active') THEN

        -- Check if bonus was already paid for this investment
        IF NEW.commission_paid = true THEN
            RETURN NEW;
        END IF;

        -- Ensure investor's profile has has_invested set to true
        UPDATE public.profiles 
        SET has_invested = true 
        WHERE id = NEW.user_id;

        -- Find the referrer
        SELECT referred_by INTO v_referrer_id 
        FROM public.profiles 
        WHERE id = NEW.user_id;

        -- If there is a referrer
        IF v_referrer_id IS NOT NULL THEN
            
            -- Count ONLY distinct referred users who have at least one approved (active or completed) investment
            -- Non-investors and pending unapproved investments are strictly excluded
            SELECT COUNT(DISTINCT user_id) INTO v_active_referrals_count 
            FROM public.investments 
            WHERE status IN ('active', 'completed') 
              AND user_id IN (
                  SELECT id FROM public.profiles WHERE referred_by = v_referrer_id
              );

            -- Determine bonus percentage based on tiers:
            -- 2 active referrals -> 5%
            -- 3-5 active referrals -> 10%
            -- 6-8 active referrals -> 15%
            -- 9+ active referrals -> 20%
            IF v_active_referrals_count = 2 THEN
                v_bonus_percent := 5;
            ELSIF v_active_referrals_count >= 3 AND v_active_referrals_count <= 5 THEN
                v_bonus_percent := 10;
            ELSIF v_active_referrals_count >= 6 AND v_active_referrals_count <= 8 THEN
                v_bonus_percent := 15;
            ELSIF v_active_referrals_count >= 9 THEN
                v_bonus_percent := 20;
            ELSE
                v_bonus_percent := 0;
            END IF;

            -- If eligible for bonus
            IF v_bonus_percent > 0 AND NEW.amount > 0 THEN
                v_bonus_amount := (NEW.amount * v_bonus_percent) / 100;

                -- Get investor name for description
                SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), username, 'Referral') 
                INTO v_investor_name 
                FROM public.profiles WHERE id = NEW.user_id;

                -- Insert transaction record for the referrer
                INSERT INTO public.transactions (
                    user_id, 
                    type, 
                    amount, 
                    status, 
                    description, 
                    reference,
                    referred_user_id
                ) VALUES (
                    v_referrer_id,
                    'referral',
                    v_bonus_amount,
                    'completed',
                    v_bonus_percent || '% Commission from ' || v_investor_name || '''s trade',
                    'REF-' || NEW.id || '-' || extract(epoch from now())::text,
                    NEW.user_id
                );

                -- Update referrer's referral_earnings
                UPDATE public.profiles 
                SET referral_earnings = COALESCE(referral_earnings, 0) + v_bonus_amount
                WHERE id = v_referrer_id;

                -- Mark this investment as commission_paid to prevent duplicate processing
                UPDATE public.investments 
                SET commission_paid = true 
                WHERE id = NEW.id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Reattach trigger on public.investments
DROP TRIGGER IF EXISTS on_investment_activated_referral ON public.investments;
CREATE TRIGGER on_investment_activated_referral
    AFTER INSERT OR UPDATE ON public.investments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_referral_bonus();

-- 5. Update get_referral_data function to strictly count approved invested referrals
CREATE OR REPLACE FUNCTION public.get_referral_data(p_user_id uuid)
RETURNS json AS $$
DECLARE
    v_active_count INTEGER;
    v_total_signups INTEGER;
    v_current_tier TEXT;
    v_next_tier_req INTEGER;
    v_current_percent INTEGER;
BEGIN
    -- Count strictly referred users who have at least one approved investment ('active' or 'completed')
    SELECT COUNT(DISTINCT user_id) INTO v_active_count 
    FROM public.investments 
    WHERE status IN ('active', 'completed')
      AND user_id IN (SELECT id FROM public.profiles WHERE referred_by = p_user_id);

    -- Count total registered signups under this user
    SELECT COUNT(*) INTO v_total_signups 
    FROM public.profiles 
    WHERE referred_by = p_user_id;

    -- Determine tier based strictly on approved active investors
    IF v_active_count < 2 THEN
        v_current_tier := 'Level 0';
        v_next_tier_req := 2;
        v_current_percent := 0;
    ELSIF v_active_count = 2 THEN
        v_current_tier := 'Level 1';
        v_next_tier_req := 3;
        v_current_percent := 5;
    ELSIF v_active_count >= 3 AND v_active_count <= 5 THEN
        v_current_tier := 'Level 2';
        v_next_tier_req := 6;
        v_current_percent := 10;
    ELSIF v_active_count >= 6 AND v_active_count <= 8 THEN
        v_current_tier := 'Level 3';
        v_next_tier_req := 9;
        v_current_percent := 15;
    ELSE
        v_current_tier := 'Level 4 (Elite)';
        v_next_tier_req := 0; -- Max reached
        v_current_percent := 20;
    END IF;

    RETURN json_build_object(
        'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE id = p_user_id),
        'referral_stats', json_build_object(
            'total_referrals', v_active_count,
            'active_referrals', v_active_count,
            'total_signups', v_total_signups,
            'pending_referrals', GREATEST(0, v_total_signups - v_active_count),
            'total_earned', COALESCE((SELECT sum(amount) FROM public.transactions WHERE user_id = p_user_id AND type = 'referral' AND status = 'completed'), 0),
            'currentLevel', v_current_tier,
            'currentPercent', v_current_percent,
            'nextTierReq', v_next_tier_req
        ),
        'recent_referrals', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', u.id,
                'name', COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.username, 'User'),
                'joinDate', u.created_at,
                'status', CASE 
                    WHEN EXISTS (SELECT 1 FROM public.investments WHERE user_id = u.id AND status IN ('active', 'completed')) THEN 'Active'
                    WHEN EXISTS (SELECT 1 FROM public.investments WHERE user_id = u.id AND status = 'pending') THEN 'Pending Approval'
                    ELSE 'Not Invested'
                END,
                'has_invested', EXISTS (SELECT 1 FROM public.investments WHERE user_id = u.id AND status IN ('active', 'completed')),
                'invested', COALESCE((SELECT sum(amount) FROM public.investments WHERE user_id = u.id AND status IN ('active', 'completed')), 0),
                'commission', COALESCE((SELECT sum(amount) FROM public.transactions WHERE user_id = p_user_id AND type = 'referral' AND referred_user_id = u.id), 0)
            ) ORDER BY u.created_at DESC), '[]'::json) FROM public.profiles u WHERE referred_by = p_user_id
        ),
        'commission_earnings', (
            SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json) FROM public.transactions t 
            WHERE user_id = p_user_id AND type = 'referral'
        )
    );
END;
$$ LANGUAGE plpgsql;
