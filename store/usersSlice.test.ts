import usersReducer, {
  searchUsers,
  fetchUsersByIds,
  fetchNotifications,
  markNotificationRead,
} from './usersSlice';
import { UsersState, User, Notification } from '../types';

// Mock the API
jest.mock('../services/supabaseBackend', () => ({
  api: {
    users: {
      search: jest.fn(),
      getByIds: jest.fn(),
    },
    notifications: {
      getMy: jest.fn(),
      sendInvite: jest.fn(),
      markRead: jest.fn(),
    },
  },
}));

describe('usersSlice', () => {
  const initialState: UsersState = {
    users: [],
    notifications: [],
    status: 'idle',
  };

  const mockUser: User = {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    blockedUserIds: [],
  };

  const mockNotification: Notification = {
    id: 'notif-1',
    type: 'invite',
    fromUserId: 'user-2',
    fromUsername: 'Inviter',
    toUserId: 'user-1',
    boardId: 'board-1',
    boardTitle: 'Test Board',
    read: false,
    timestamp: Date.now(),
  };

  describe('reducers', () => {
    it('should return the initial state', () => {
      expect(usersReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('extraReducers', () => {
    it('should handle searchUsers.fulfilled and merge users without duplicates', () => {
      const action = { type: searchUsers.fulfilled.type, payload: [mockUser] };
      const state = usersReducer(initialState, action);
      expect(state.users).toHaveLength(1);
      expect(state.users[0].username).toBe('testuser');

      // Add same user again - should not duplicate
      const state2 = usersReducer(state, action);
      expect(state2.users).toHaveLength(1);
    });

    it('should handle searchUsers.fulfilled and add new users', () => {
      const stateWithUser = { ...initialState, users: [mockUser] };
      const newUser = { ...mockUser, id: 'user-2', username: 'newuser' };
      const action = { type: searchUsers.fulfilled.type, payload: [newUser] };
      const state = usersReducer(stateWithUser, action);
      expect(state.users).toHaveLength(2);
    });

    it('should handle fetchUsersByIds.fulfilled and merge users', () => {
      const action = { type: fetchUsersByIds.fulfilled.type, payload: [mockUser] };
      const state = usersReducer(initialState, action);
      expect(state.users).toHaveLength(1);
      expect(state.users[0].id).toBe('user-1');
    });

    it('should handle fetchNotifications.fulfilled', () => {
      const action = { type: fetchNotifications.fulfilled.type, payload: [mockNotification] };
      const state = usersReducer(initialState, action);
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('invite');
      expect(state.notifications[0].read).toBe(false);
    });

    it('should handle fetchNotifications.fulfilled and replace existing notifications', () => {
      const stateWithNotif = { ...initialState, notifications: [mockNotification] };
      const newNotif = { ...mockNotification, id: 'notif-2', boardTitle: 'New Board' };
      const action = { type: fetchNotifications.fulfilled.type, payload: [newNotif] };
      const state = usersReducer(stateWithNotif, action);
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].id).toBe('notif-2');
    });

    it('should handle markNotificationRead.fulfilled', () => {
      const stateWithNotif = { ...initialState, notifications: [mockNotification] };
      const action = { type: markNotificationRead.fulfilled.type, payload: 'notif-1' };
      const state = usersReducer(stateWithNotif, action);
      expect(state.notifications[0].read).toBe(true);
    });

    it('should not fail when marking non-existent notification as read', () => {
      const stateWithNotif = { ...initialState, notifications: [mockNotification] };
      const action = { type: markNotificationRead.fulfilled.type, payload: 'non-existent' };
      const state = usersReducer(stateWithNotif, action);
      expect(state.notifications[0].read).toBe(false);
    });
  });
});
