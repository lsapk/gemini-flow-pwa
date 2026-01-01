-- Add DELETE policy for ai_requests so users can manage their own data
CREATE POLICY "Users can delete their own AI requests"
ON ai_requests FOR DELETE
TO authenticated
USING (auth.uid() = user_id);