
-- Function to calculate and award referral bonus based on tiers
CREATE OR REPLACE FUNCTION public.handle_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_active_referrals_count INTEGER;
    v_bonus_percent NUMERIC;
    v_bonus_amount NUMERIC;
    v_investor_name TEXT;
BEGIN
    -- Only process when an investment moves to 'active' status
    IF (OLD.status = 'pending' OR OLD.status = 'awaiting_proof') AND NEW.status = 'active' THEN
        
        -- Find the referrer
        SELECT referred_by INTO v_referrer_id 
        FROM public.profiles 
        WHERE id = NEW.user_id;

        -- If there is a referrer
        IF v_referrer_id IS NOT NULL THEN
            
            -- Set has_invested to true for the investor
            UPDATE public.profiles SET has_invested = true WHERE id = NEW.user_id;

            -- Count active referrals of the referrer (those who have invested)
            SELECT COUNT(*) INTO v_active_referrals_count 
            FROM public.profiles 
            WHERE referred_by = v_referrer_id AND has_invested = true;

            -- Determine bonus percentage based on tiers
            -- Count = 2 -> 5%
            -- Count = 3-5 -> 10%
            -- Count = 6-8 -> 15%
            -- Count = 9+ -> 20%
            -- (Assuming 0-1 = 0% as per "user who has referred only 2 people")
            
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
            IF v_bonus_percent > 0 THEN
                v_bonus_amount := (NEW.amount * v_bonus_percent) / 100;

                -- Get investor name for description
                SELECT COALESCE(first_name || ' ' || last_name, username, 'Referral') INTO v_investor_name 
                FROM public.profiles WHERE id = NEW.user_id;

                -- Insert transaction for the referrer
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
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the bonus function
DROP TRIGGER IF EXISTS on_investment_activated_referral ON public.investments;
CREATE TRIGGER on_investment_activated_referral
    AFTER UPDATE ON public.investments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_referral_bonus();

-- Update get_referral_data to include tier info
CREATE OR REPLACE FUNCTION public.get_referral_data(p_user_id uuid)
RETURNS json AS $$
DECLARE
    v_active_count INTEGER;
    v_current_tier TEXT;
    v_next_tier_req INTEGER;
    v_current_percent INTEGER;
BEGIN
    -- Get active referral count
    SELECT COUNT(*) INTO v_active_count 
    FROM public.profiles 
    WHERE referred_by = p_user_id AND has_invested = true;

    -- Determine tier
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
        'profile', (SELECT row_to_json(p) FROM profiles p WHERE id = p_user_id),
        'referral_stats', (
            SELECT json_build_object(
                'total_referrals', count(*) filter (where referred_by = p_user_id),
                'active_referrals', v_active_count,
                'total_earned', COALESCE((select sum(amount) from transactions where user_id = p_user_id and type = 'referral' and status = 'completed'), 0),
                'currentLevel', v_current_tier,
                'currentPercent', v_current_percent,
                'nextTierReq', v_next_tier_req
            ) FROM profiles
        ),
        'recent_referrals', (
            SELECT json_agg(json_build_object(
                'id', u.id,
                'name', COALESCE(u.first_name || ' ' || u.last_name, u.username, 'User'),
                'joinDate', u.created_at,
                'status', CASE WHEN u.has_invested THEN 'Active' ELSE 'Pending' END,
                'invested', COALESCE((SELECT sum(amount) FROM investments WHERE user_id = u.id AND status IN ('active', 'completed')), 0),
                'commission', COALESCE((SELECT sum(amount) FROM transactions WHERE user_id = p_user_id AND type = 'referral' AND referred_user_id = u.id), 0)
            )) FROM profiles u WHERE referred_by = p_user_id
        ),
        'commission_earnings', (
            SELECT json_agg(row_to_json(t) ORDER BY t.created_at DESC) FROM transactions t 
            WHERE user_id = p_user_id AND type = 'referral'
        )
    );
END;
$$ LANGUAGE plpgsql;
