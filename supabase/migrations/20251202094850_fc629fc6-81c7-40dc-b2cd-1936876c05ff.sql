-- Create RLS policies for unlockables
CREATE POLICY "Users can view their own unlockables"
ON public.unlockables
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unlockables"
ON public.unlockables
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for ai_credits
CREATE POLICY "Users can view their own AI credits"
ON public.ai_credits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI credits"
ON public.ai_credits
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI credits"
ON public.ai_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for achievements
CREATE POLICY "Users can view their own achievements"
ON public.achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for AI credits profile
CREATE TRIGGER on_auth_user_created_ai_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_ai_credits_profile();