# SQL schema for Tawasal (Supabase / Postgres)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid,
  email text NOT NULL,
  username text UNIQUE,
  tawasal_id text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  pin_hash text,
  last_seen timestamptz,
  online boolean DEFAULT false,
  privacy_last_seen text DEFAULT 'everyone',
  privacy_profile_pic text DEFAULT 'everyone',
  privacy_status text DEFAULT 'everyone',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_tawasal_id ON profiles(tawasal_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- OTPs table for email verification
CREATE TABLE IF NOT EXISTS otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  attempts integer DEFAULT 0,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX idx_otps_email ON otps(email);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group boolean DEFAULT false,
  title text,
  avatar_url text,
  last_message text,
  last_activity timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  message_type text DEFAULT 'text',
  content text,
  content_encrypted boolean DEFAULT false,
  media_url text,
  media_meta jsonb,
  reply_to uuid REFERENCES messages(id) ON DELETE SET NULL,
  edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Message reads
CREATE TABLE IF NOT EXISTS message_reads (
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- Devices
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  device_name text,
  platform text,
  push_token text,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Statuses
CREATE TABLE IF NOT EXISTS statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text,
  media_url text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Calls
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid REFERENCES profiles(id),
  receiver_id uuid REFERENCES profiles(id),
  conversation_id uuid REFERENCES conversations(id),
  call_type text,
  started_at timestamptz,
  ended_at timestamptz,
  metadata jsonb
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id),
  reported_id uuid REFERENCES profiles(id),
  reason text,
  details text,
  created_at timestamptz DEFAULT now()
);
