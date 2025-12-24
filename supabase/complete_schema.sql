-- Complete Database Schema for TaskFlow AI
-- Run this ONCE in Supabase SQL Editor to create all tables and policies

-- ============================================
-- 1. CREATE TABLES (if not exist)
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  telegram TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Board members table
CREATE TABLE IF NOT EXISTS board_members (
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  permissions TEXT[] DEFAULT ARRAY['can_view'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

-- Columns table
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_entry_locked BOOLEAN DEFAULT FALSE,
  is_exit_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task types table
CREATE TABLE IF NOT EXISTS task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assignee_ids UUID[] DEFAULT ARRAY[]::UUID[],
  type_id UUID NOT NULL REFERENCES task_types(id),
  history TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Board invites table
CREATE TABLE IF NOT EXISTS board_invites (
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('invite')),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  board_title TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. DROP ALL EXISTING POLICIES
-- ============================================

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "boards_select" ON boards;
DROP POLICY IF EXISTS "boards_insert" ON boards;
DROP POLICY IF EXISTS "boards_update" ON boards;
DROP POLICY IF EXISTS "boards_delete" ON boards;
DROP POLICY IF EXISTS "board_members_select" ON board_members;
DROP POLICY IF EXISTS "board_members_insert" ON board_members;
DROP POLICY IF EXISTS "board_members_update" ON board_members;
DROP POLICY IF EXISTS "board_members_delete" ON board_members;
DROP POLICY IF EXISTS "columns_all" ON columns;
DROP POLICY IF EXISTS "tasks_all" ON tasks;
DROP POLICY IF EXISTS "task_types_all" ON task_types;
DROP POLICY IF EXISTS "board_invites_all" ON board_invites;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;

-- ============================================
-- 3. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Profiles: Public read, own write
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Boards: Owner + members can see, owner can modify
CREATE POLICY "boards_select" ON boards FOR SELECT USING (
  owner_id = auth.uid() OR
  EXISTS (SELECT 1 FROM board_members WHERE board_id = boards.id AND user_id = auth.uid())
);
CREATE POLICY "boards_insert" ON boards FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "boards_update" ON boards FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "boards_delete" ON boards FOR DELETE USING (owner_id = auth.uid());

-- Board Members: Members can view, owner can manage
CREATE POLICY "board_members_select" ON board_members FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM board_members bm WHERE bm.board_id = board_members.board_id AND bm.user_id = auth.uid())
);
CREATE POLICY "board_members_insert" ON board_members FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM boards WHERE id = board_id AND owner_id = auth.uid())
);
CREATE POLICY "board_members_update" ON board_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM boards WHERE id = board_id AND owner_id = auth.uid())
);
CREATE POLICY "board_members_delete" ON board_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM boards WHERE id = board_id AND owner_id = auth.uid())
);

-- Columns: All members can manage
CREATE POLICY "columns_all" ON columns FOR ALL USING (
  EXISTS (SELECT 1 FROM board_members WHERE board_id = columns.board_id AND user_id = auth.uid())
);

-- Tasks: All members can manage
CREATE POLICY "tasks_all" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM board_members WHERE board_id = tasks.board_id AND user_id = auth.uid())
);

-- Task Types: All members can manage
CREATE POLICY "task_types_all" ON task_types FOR ALL USING (
  EXISTS (SELECT 1 FROM board_members WHERE board_id = task_types.board_id AND user_id = auth.uid())
);

-- Board Invites: Members can manage
CREATE POLICY "board_invites_all" ON board_invites FOR ALL USING (
  EXISTS (SELECT 1 FROM board_members WHERE board_id = board_invites.board_id AND user_id = auth.uid())
);

-- Notifications: Own notifications only
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (to_user_id = auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (to_user_id = auth.uid());
CREATE POLICY "notifications_delete" ON notifications FOR DELETE USING (to_user_id = auth.uid());

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_board_members_user_id ON board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_board_members_board_id ON board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_task_types_board_id ON task_types(board_id);
CREATE INDEX IF NOT EXISTS idx_notifications_to_user_id ON notifications(to_user_id);
