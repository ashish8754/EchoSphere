import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Post {
  id: string;
  author_id: string;
  content: string;
  media_urls?: string[];
  boost_enabled: boolean;
  ai_suggestions?: string[];
  semantic_score?: number;
  emotion_tags?: string[];
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string;
    profile_picture_url?: string;
  };
}

interface FeedState {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  lastPostId?: string;
  mode: 'authentic' | 'boost';
}

const initialState: FeedState = {
  posts: [],
  isLoading: false,
  isRefreshing: false,
  hasMore: true,
  mode: 'authentic',
};

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setPosts: (state, action: PayloadAction<Post[]>) => {
      state.posts = action.payload;
    },
    addPosts: (state, action: PayloadAction<Post[]>) => {
      state.posts = [...state.posts, ...action.payload];
    },
    addPost: (state, action: PayloadAction<Post>) => {
      state.posts = [action.payload, ...state.posts];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.isRefreshing = action.payload;
    },
    setHasMore: (state, action: PayloadAction<boolean>) => {
      state.hasMore = action.payload;
    },
    setLastPostId: (state, action: PayloadAction<string | undefined>) => {
      state.lastPostId = action.payload;
    },
    setMode: (state, action: PayloadAction<'authentic' | 'boost'>) => {
      state.mode = action.payload;
    },
    clearFeed: (state) => {
      state.posts = [];
      state.hasMore = true;
      state.lastPostId = undefined;
    },
  },
});

export const {
  setPosts,
  addPosts,
  addPost,
  setLoading,
  setRefreshing,
  setHasMore,
  setLastPostId,
  setMode,
  clearFeed,
} = feedSlice.actions;

export default feedSlice.reducer;