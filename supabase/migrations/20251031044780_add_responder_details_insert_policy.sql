-- Allow responders to insert their own responder_details row
CREATE POLICY IF NOT EXISTS "Responders can insert their own details"
  ON public.responder_details FOR INSERT
  WITH CHECK (auth.uid() = id);


