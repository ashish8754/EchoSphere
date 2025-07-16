-- EchoSphere Database Schema
-- This file contains the SQL schema for the EchoSphere application

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  profile_picture_url VARCHAR(500),
  boost_mode_enabled BOOLEAN DEFAULT FALSE,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circles table
CREATE TABLE IF NOT EXISTS public.circles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circle members table
CREATE TABLE IF NOT EXISTS public.circle_members (
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (circle_id, user_id)
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  boost_enabled BOOLEAN DEFAULT FALSE,
  ai_suggestions TEXT[],
  semantic_score DECIMAL(3,2),
  emotion_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post circles junction table
CREATE TABLE IF NOT EXISTS public.post_circles (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, circle_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_circles_owner ON public.circles(owner_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_comment_id);

-- Row Level Security Policies

-- Users can read their own profile and profiles of users in their circles
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Circles policies
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view circles they own or are members of" ON public.circles
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    id IN (SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create circles" ON public.circles
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Circle owners can update their circles" ON public.circles
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Circle owners can delete their circles" ON public.circles
  FOR DELETE USING (owner_id = auth.uid());

-- Circle members policies
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view circle memberships for circles they're in" ON public.circle_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    circle_id IN (SELECT id FROM public.circles WHERE owner_id = auth.uid()) OR
    circle_id IN (SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid())
  );

-- Posts policies
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view posts in their circles" ON public.posts
  FOR SELECT USING (
    author_id = auth.uid() OR
    id IN (
      SELECT pc.post_id 
      FROM public.post_circles pc
      JOIN public.circle_members cm ON pc.circle_id = cm.circle_id
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (author_id = auth.uid());

-- Comments policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on posts they can see" ON public.comments
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM public.posts WHERE 
      author_id = auth.uid() OR
      id IN (
        SELECT pc.post_id 
        FROM public.post_circles pc
        JOIN public.circle_members cm ON pc.circle_id = cm.circle_id
        WHERE cm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments on posts they can see" ON public.comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    post_id IN (
      SELECT id FROM public.posts WHERE 
      author_id = auth.uid() OR
      id IN (
        SELECT pc.post_id 
        FROM public.post_circles pc
        JOIN public.circle_members cm ON pc.circle_id = cm.circle_id
        WHERE cm.user_id = auth.uid()
      )
    )
  );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();