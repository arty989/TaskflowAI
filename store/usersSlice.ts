import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UsersState, Notification } from '../types';
import { api } from '../services/supabaseBackend';

const initialState: UsersState = {
  users: [],
  notifications: [],
  status: 'idle',
};

export const searchUsers = createAsyncThunk('users/search', async (query: string) => {
  return await api.users.search(query);
});

export const fetchUsersByIds = createAsyncThunk('users/fetchByIds', async (ids: string[]) => {
  return await api.users.getByIds(ids);
});

export const fetchNotifications = createAsyncThunk('users/notifications', async (userId: string) => {
  return await api.notifications.getMy(userId);
});

export const sendInvite = createAsyncThunk('users/sendInvite', async ({from, to, boardId}: {from: string, to: string, boardId: string}) => {
  await api.notifications.sendInvite(from, to, boardId);
});

export const markNotificationRead = createAsyncThunk('users/markRead', async (id: string) => {
  await api.notifications.markRead(id);
  return id;
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(searchUsers.fulfilled, (state, action) => {
      // Merge results avoiding duplicates
      action.payload.forEach(u => {
        if (!state.users.find(existing => existing.id === u.id)) {
          state.users.push(u);
        }
      });
    });
    builder.addCase(fetchUsersByIds.fulfilled, (state, action) => {
      // Merge results avoiding duplicates
      action.payload.forEach(u => {
        if (!state.users.find(existing => existing.id === u.id)) {
          state.users.push(u);
        }
      });
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.notifications = action.payload;
    });
    builder.addCase(markNotificationRead.fulfilled, (state, action) => {
      const notif = state.notifications.find(n => n.id === action.payload);
      if (notif) notif.read = true;
    });
  }
});

export default usersSlice.reducer;