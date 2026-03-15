-- Function to decrement AI credits atomically
CREATE OR REPLACE FUNCTION decrement_ai_credits(p_user_id UUID, amount INT)
RETURNS INT AS $$
DECLARE
    current_credits INT;
BEGIN
    -- Update credits atomically
    UPDATE ai_credits
    SET credits = credits - amount,
        last_updated = now()
    WHERE user_id = p_user_id AND credits >= amount
    RETURNING credits INTO current_credits;

    -- Return the updated credits (or NULL if they didn't have enough credits)
    RETURN current_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
