import { api } from './supabaseBackend';
import { supabase } from './supabaseClient';

// Mock supabase client
jest.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('supabaseBackend API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('auth', () => {
    describe('login', () => {
      it('should login successfully with email and password', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' };
        const mockProfile = {
          id: 'user-123',
          username: 'testuser',
          display_name: 'Test User',
          email: 'test@example.com',
          telegram: null,
          avatar_url: null,
        };

        mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
          data: { user: mockUser, session: {} },
          error: null,
        });

        mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        });
        mockSupabase.from = mockFrom;

        const result = await api.auth.login('test@example.com', 'password123');

        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(result.id).toBe('user-123');
        expect(result.email).toBe('test@example.com');
      });

      it('should throw error when password is missing', async () => {
        await expect(api.auth.login('test@example.com')).rejects.toThrow('Password is required');
      });

      it('should throw error on invalid credentials', async () => {
        mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        });

        await expect(api.auth.login('test@example.com', 'wrongpass')).rejects.toThrow('Invalid login credentials');
      });
    });

    describe('register', () => {
      it('should register a new user successfully', async () => {
        const mockUser = { id: 'new-user-123', email: 'new@example.com' };
        const mockProfile = {
          id: 'new-user-123',
          username: 'newuser',
          display_name: 'New User',
          email: 'new@example.com',
          telegram: '@newuser',
          avatar_url: null,
        };

        mockSupabase.auth.signUp = jest.fn().mockResolvedValue({
          data: { user: mockUser, session: {} },
          error: null,
        });

        mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        const mockFrom = jest.fn().mockImplementation((table) => {
          if (table === 'profiles') {
            return {
              upsert: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
                }),
              }),
            };
          }
          return {};
        });
        mockSupabase.from = mockFrom;

        const result = await api.auth.register({
          email: 'new@example.com',
          password: 'password123',
          username: 'newuser',
          displayName: 'New User',
          telegram: '@newuser',
        });

        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123',
        });
        expect(result.username).toBe('newuser');
      });

      it('should throw error when password is missing', async () => {
        await expect(
          api.auth.register({
            email: 'test@example.com',
            username: 'test',
            displayName: 'Test',
          })
        ).rejects.toThrow('Password is required');
      });
    });

    describe('logout', () => {
      it('should logout successfully', async () => {
        mockSupabase.auth.signOut = jest.fn().mockResolvedValue({ error: null });

        await expect(api.auth.logout()).resolves.toBeUndefined();
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('boards', () => {
    const mockBoard = {
      id: 'board-123',
      title: 'Test Board',
      description: '',
      cover_url: '',
      owner_id: 'user-123',
      invite_code: 'invite-abc123',
    };

    describe('create', () => {
      it('should create a board with default columns and task types', async () => {
        const mockColumns = [
          { id: 'col-1', board_id: 'board-123', title: 'To Do', order: 0, is_entry_locked: false, is_exit_locked: false },
          { id: 'col-2', board_id: 'board-123', title: 'In Progress', order: 1, is_entry_locked: false, is_exit_locked: false },
          { id: 'col-3', board_id: 'board-123', title: 'Done', order: 2, is_entry_locked: false, is_exit_locked: false },
        ];

        const mockTaskTypes = [
          { id: 'type-1', board_id: 'board-123', label: 'Feature', color: '#3b82f6', order: 0 },
          { id: 'type-2', board_id: 'board-123', label: 'Bug', color: '#ef4444', order: 1 },
          { id: 'type-3', board_id: 'board-123', label: 'Improvement', color: '#10b981', order: 2 },
        ];

        const mockMembers = [
          { board_id: 'board-123', user_id: 'user-123', role: 'owner', permissions: ['can_view'] },
        ];

        const mockFrom = jest.fn().mockImplementation((table) => {
          const chainable = {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: table === 'boards' ? mockBoard : null,
                  error: null,
                }),
              }),
              then: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: table === 'board_members' ? mockMembers : [],
                error: null,
              }),
            }),
          };

          if (table === 'boards') {
            chainable.insert = jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockBoard, error: null }),
              }),
            });
          } else if (table === 'board_members') {
            chainable.insert = jest.fn().mockResolvedValue({ data: null, error: null });
            chainable.select = jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: mockMembers, error: null }),
            });
          } else if (table === 'columns') {
            chainable.insert = jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({ data: mockColumns, error: null }),
            });
          } else if (table === 'task_types') {
            chainable.insert = jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({ data: mockTaskTypes, error: null }),
            });
          }

          return chainable;
        });
        mockSupabase.from = mockFrom;

        const result = await api.boards.create('Test Board', 'user-123');

        expect(result.title).toBe('Test Board');
        expect(result.columns).toHaveLength(3);
        expect(result.taskTypes).toHaveLength(3);
        expect(result.members).toHaveLength(1);
        expect(result.members[0].role).toBe('owner');
      });
    });

    describe('list', () => {
      it('should return empty array when user has no boards', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        });
        mockSupabase.from = mockFrom;

        const result = await api.boards.list('user-123');

        expect(result).toEqual([]);
      });
    });

    describe('delete', () => {
      it('should delete a board', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });
        mockSupabase.from = mockFrom;

        await expect(api.boards.delete('board-123')).resolves.toBeUndefined();
      });
    });
  });

  describe('users', () => {
    describe('search', () => {
      it('should return empty array for empty query', async () => {
        const result = await api.users.search('');
        expect(result).toEqual([]);
      });

      it('should search users by username or display name', async () => {
        const mockProfiles = [
          { id: 'user-1', username: 'john', display_name: 'John Doe', email: 'john@example.com', telegram: null, avatar_url: null },
          { id: 'user-2', username: 'johnny', display_name: 'Johnny', email: 'johnny@example.com', telegram: null, avatar_url: null },
        ];

        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockProfiles, error: null }),
            }),
          }),
        });
        mockSupabase.from = mockFrom;

        const result = await api.users.search('john');

        expect(result).toHaveLength(2);
        expect(result[0].username).toBe('john');
      });
    });
  });

  describe('notifications', () => {
    describe('getMy', () => {
      it('should get user notifications', async () => {
        const mockNotifications = [
          {
            id: 'notif-1',
            type: 'invite',
            from_user_id: 'user-1',
            to_user_id: 'user-2',
            board_id: 'board-1',
            board_title: 'Test Board',
            read: false,
            created_at: '2024-01-01T00:00:00Z',
          },
        ];

        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: mockNotifications, error: null }),
              }),
            }),
          }),
        });
        mockSupabase.from = mockFrom;

        const result = await api.notifications.getMy('user-2');

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('invite');
        expect(result[0].read).toBe(false);
      });
    });

    describe('markRead', () => {
      it('should mark notification as read', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });
        mockSupabase.from = mockFrom;

        await expect(api.notifications.markRead('notif-1')).resolves.toBeUndefined();
      });
    });
  });
});
