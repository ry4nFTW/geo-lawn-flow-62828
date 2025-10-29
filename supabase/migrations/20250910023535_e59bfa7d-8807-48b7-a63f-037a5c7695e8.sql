-- Create profile for existing user who signed up before the trigger
INSERT INTO public.profiles (user_id, display_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'ogryan2020@gmail.com'),
  'Big Yah',
  'manager'
)
ON CONFLICT (user_id) DO NOTHING;