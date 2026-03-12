CREATE OR REPLACE FUNCTION get_kid_activity_stats(
    p_kid_profile_id UUID,
    p_timezone_name TEXT
) RETURNS json AS $$
DECLARE
    v_total INT;
    v_week_count INT;
    v_streak INT := 0;
    v_last_created_at TIMESTAMPTZ;
    v_expected_date DATE;
    v_current_date DATE;
    rec RECORD;
BEGIN
    -- 1. Get total count
    SELECT COUNT(*) INTO v_total
    FROM activities
    WHERE kid_profile_id = p_kid_profile_id;

    -- 2. Get week count (last 7 days based on current time)
    SELECT COUNT(*) INTO v_week_count
    FROM activities
    WHERE kid_profile_id = p_kid_profile_id
      AND created_at >= NOW() - INTERVAL '7 days';

    -- 3. Get last_created_at
    SELECT created_at INTO v_last_created_at
    FROM activities
    WHERE kid_profile_id = p_kid_profile_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- 4. Calculate streak
    FOR rec IN 
        SELECT DISTINCT DATE(created_at AT TIME ZONE p_timezone_name) AS activity_date
        FROM activities
        WHERE kid_profile_id = p_kid_profile_id
        ORDER BY activity_date DESC
    LOOP
        IF v_expected_date IS NULL THEN
            -- First row. Check if it's today or yesterday in the given timezone.
            v_current_date := DATE(NOW() AT TIME ZONE p_timezone_name);
            IF rec.activity_date = v_current_date OR rec.activity_date = (v_current_date - INTERVAL '1 day') THEN
                v_streak := 1;
                v_expected_date := rec.activity_date - INTERVAL '1 day';
            ELSE
                -- First activity is older than yesterday. Streak is 0.
                EXIT;
            END IF;
        ELSE
            -- Check if it matches expected date
            IF rec.activity_date = v_expected_date THEN
                v_streak := v_streak + 1;
                v_expected_date := v_expected_date - INTERVAL '1 day';
            ELSE
                -- Streak broken
                EXIT;
            END IF;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'total', COALESCE(v_total, 0),
        'weekCount', COALESCE(v_week_count, 0),
        'streak', v_streak,
        'lastCreatedAt', v_last_created_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
