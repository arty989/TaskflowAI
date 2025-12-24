import reducer, { loginUser, registerUser, logoutUser } from './authSlice';
import type { User } from '../types';

describe('authSlice reducer', () => {
  const user: User = {
    id: '00000000-0000-4000-8000-000000000000',
    username: 'demo',
    displayName: 'Demo',
    email: 'demo@example.com',
    blockedUserIds: [],
  };

  it('loginUser.fulfilled sets user and auth flags', () => {
    const state = reducer(undefined, loginUser.fulfilled(user, 'req', { email: user.email, password: 'x' }));
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.id).toBe(user.id);
    expect(state.token).toBeTruthy();
  });

  it('registerUser.fulfilled sets user and auth flags', () => {
    const state = reducer(undefined, registerUser.fulfilled(user, 'req', { ...user, password: 'x' } as any));
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe(user.email);
  });

  it('logoutUser.fulfilled clears auth state', () => {
    const s1 = reducer(undefined, loginUser.fulfilled(user, 'req', { email: user.email, password: 'x' }));
    const s2 = reducer(s1, logoutUser.fulfilled(undefined, 'req'));
    expect(s2.isAuthenticated).toBe(false);
    expect(s2.user).toBeNull();
  });
});
