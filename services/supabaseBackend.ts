import { Board, BoardMember, Column, Notification, Task, TaskType, User } from '../types';
import { supabase } from './supabaseClient';

type DbBoard = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  owner_id: string;
  invite_code: string | null;
};

type DbProfile = {
  id: string;
  username: string;
  display_name: string;
  email: string;
  telegram: string | null;
  avatar_url: string | null;
};

type DbBoardMember = {
  board_id: string;
  user_id: string;
  role: 'owner' | 'member';
  permissions: string[];
};

type DbColumn = {
  id: string;
  board_id: string;
  title: string;
  "order": number;
  is_entry_locked: boolean;
  is_exit_locked: boolean;
};

type DbTaskType = {
  id: string;
  board_id: string;
  label: string;
  color: string;
  "order": number;
};

type DbTask = {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string;
  assignee_ids: string[];
  type_id: string;
  created_at: string;
  history: string[];
};

type DbInvite = {
  board_id: string;
  user_id: string;
};

type DbNotification = {
  id: string;
  type: 'invite';
  from_user_id: string;
  to_user_id: string;
  board_id: string;
  board_title: string | null;
  read: boolean;
  created_at: string;
};

const mapProfileToUser = (profile: DbProfile): User => ({
  id: profile.id,
  username: profile.username,
  displayName: profile.display_name,
  email: profile.email,
  telegram: profile.telegram ?? undefined,
  avatarUrl: profile.avatar_url ?? undefined,
  blockedUserIds: [],
});

const mapBoard = (input: {
  board: DbBoard;
  columns: DbColumn[];
  tasks: DbTask[];
  taskTypes: DbTaskType[];
  members: DbBoardMember[];
  pendingInvites: DbInvite[];
}): Board => {
  const columns: Column[] = [...input.columns]
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      id: c.id,
      title: c.title,
      order: c.order,
      isEntryLocked: c.is_entry_locked,
      isExitLocked: c.is_exit_locked,
    }));

  const taskTypes: TaskType[] = [...input.taskTypes]
    .sort((a, b) => a.order - b.order)
    .map((t) => ({ id: t.id, label: t.label, color: t.color }));

  const tasks: Task[] = input.tasks.map((t) => ({
    id: t.id,
    columnId: t.column_id,
    title: t.title,
    description: t.description,
    assigneeIds: t.assignee_ids,
    typeId: t.type_id,
    createdAt: t.created_at,
    history: t.history,
  }));

  const members: BoardMember[] = input.members.map((m) => ({
    userId: m.user_id,
    role: m.role,
    permissions: m.permissions as any,
  }));

  return {
    id: input.board.id,
    title: input.board.title,
    description: input.board.description ?? '',
    coverUrl: input.board.cover_url ?? '',
    ownerId: input.board.owner_id,
    inviteCode: input.board.invite_code ?? undefined,
    columns,
    tasks,
    taskTypes,
    members,
    pendingInvites: input.pendingInvites.map((i) => i.user_id),
  };
};

const randomInviteCode = () => {
  return `invite-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
};

const ensureUuid = (id: string) => {
  // Best-effort validation. If it doesn't look like UUID, let DB generate one by omitting it.
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRe.test(id);
};

const requireOk = <T>(res: { data: T | null; error: any }, fallbackMsg: string): T => {
  if (res.error) throw new Error(res.error.message || fallbackMsg);
  if (res.data === null) throw new Error(fallbackMsg);
  return res.data;
};

const getMyUser = async (): Promise<User> => {
  const authRes = await supabase.auth.getUser();
  const authUser = authRes.data.user;
  if (!authUser) throw new Error('Not authenticated');

  const profileRes = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  const profile = requireOk(profileRes, 'Profile not found');
  return mapProfileToUser(profile as DbProfile);
};

export const api = {
  auth: {
    login: async (email: string, password?: string): Promise<User> => {
      if (!password) throw new Error('Password is required');
      const signInRes = await supabase.auth.signInWithPassword({ email, password });
      if (signInRes.error) throw new Error(signInRes.error.message);
      return await getMyUser();
    },

    register: async (userData: Omit<User, 'id' | 'blockedUserIds'>): Promise<User> => {
      if (!userData.password) throw new Error('Password is required');

      const signUpRes = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });
      if (signUpRes.error) throw new Error(signUpRes.error.message);

      const authUser = signUpRes.data.user;
      if (!authUser) throw new Error('Registration failed');

      // Use upsert WITHOUT ignoreDuplicates to ensure we update the profile with latest form data
      // even if the user/profile record already existed.
      const profileInsert = await supabase.from('profiles').upsert({
        id: authUser.id,
        username: userData.username,
        display_name: userData.displayName,
        email: userData.email,
        telegram: userData.telegram ?? null,
        avatar_url: userData.avatarUrl ?? null,
      }, { onConflict: 'id' });

      if (profileInsert.error) throw new Error(profileInsert.error.message);

      // If signUp didn't return a session (e.g. user exists), try to sign in
      if (!signUpRes.data.session) {
        const signInRes = await supabase.auth.signInWithPassword({
           email: userData.email,
           password: userData.password
        });
        if (signInRes.error) {
           // If sign in fails (e.g. wrong password for existing account), throw that error
           throw new Error(signInRes.error.message);
        }
      }

      // Ensure session exists (depends on Supabase auth settings)
      return await getMyUser();
    },

    updateProfile: async (userId: string, updates: Partial<User>): Promise<User> => {
      const payload: Partial<DbProfile> = {};
      if (typeof updates.username === 'string') payload.username = updates.username;
      if (typeof updates.displayName === 'string') payload.display_name = updates.displayName;
      if (typeof updates.email === 'string') payload.email = updates.email;
      if (typeof updates.telegram === 'string') payload.telegram = updates.telegram;
      if (typeof updates.avatarUrl === 'string') payload.avatar_url = updates.avatarUrl;

      const res = await supabase.from('profiles').update(payload).eq('id', userId).select('*').single();
      const updated = requireOk(res, 'Failed to update profile');
      return mapProfileToUser(updated as DbProfile);
    },

    logout: async (): Promise<void> => {
      const res = await supabase.auth.signOut();
      if (res.error) throw new Error(res.error.message);
    },

    restoreSession: async (): Promise<User | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      try {
        return await getMyUser();
      } catch {
        return null;
      }
    },
  },

  boards: {
    list: async (userId: string): Promise<Board[]> => {
      // 1) Find boards where current user is a member
      const membersRes = await supabase
        .from('board_members')
        .select('board_id')
        .eq('user_id', userId);

      const memberRows = requireOk(membersRes, 'Failed to load boards') as Array<{ board_id: string }>;
      const boardIds = memberRows.map((r) => r.board_id);
      if (boardIds.length === 0) return [];

      // 2) Load boards and related entities
      const boardsRes = await supabase.from('boards').select('*').in('id', boardIds);
      const boards = requireOk(boardsRes, 'Failed to load boards') as DbBoard[];

      const [colsRes, tasksRes, typesRes, allMembersRes, invitesRes] = await Promise.all([
        supabase.from('columns').select('*').in('board_id', boardIds),
        supabase.from('tasks').select('*').in('board_id', boardIds),
        supabase.from('task_types').select('*').in('board_id', boardIds),
        supabase.from('board_members').select('*').in('board_id', boardIds),
        supabase.from('board_invites').select('*').in('board_id', boardIds),
      ]);

      const columns = requireOk(colsRes, 'Failed to load columns') as DbColumn[];
      const tasks = requireOk(tasksRes, 'Failed to load tasks') as DbTask[];
      const taskTypes = requireOk(typesRes, 'Failed to load task types') as DbTaskType[];
      const allMembers = requireOk(allMembersRes, 'Failed to load members') as DbBoardMember[];
      const invites = requireOk(invitesRes, 'Failed to load invites') as DbInvite[];

      return boards.map((b) =>
        mapBoard({
          board: b,
          columns: columns.filter((c) => c.board_id === b.id),
          tasks: tasks.filter((t) => t.board_id === b.id),
          taskTypes: taskTypes.filter((t) => t.board_id === b.id),
          members: allMembers.filter((m) => m.board_id === b.id),
          pendingInvites: invites.filter((i) => i.board_id === b.id),
        }),
      );
    },

    getById: async (boardId: string): Promise<Board | null> => {
      const boardRes = await supabase.from('boards').select('*').eq('id', boardId).maybeSingle();
      if (boardRes.error) throw new Error(boardRes.error.message);
      if (!boardRes.data) return null;

      const [colsRes, tasksRes, typesRes, membersRes, invitesRes] = await Promise.all([
        supabase.from('columns').select('*').eq('board_id', boardId),
        supabase.from('tasks').select('*').eq('board_id', boardId),
        supabase.from('task_types').select('*').eq('board_id', boardId),
        supabase.from('board_members').select('*').eq('board_id', boardId),
        supabase.from('board_invites').select('*').eq('board_id', boardId),
      ]);

      const columns = requireOk(colsRes, 'Failed to load columns') as DbColumn[];
      const tasks = requireOk(tasksRes, 'Failed to load tasks') as DbTask[];
      const taskTypes = requireOk(typesRes, 'Failed to load task types') as DbTaskType[];
      const members = requireOk(membersRes, 'Failed to load members') as DbBoardMember[];
      const invites = requireOk(invitesRes, 'Failed to load invites') as DbInvite[];

      return mapBoard({
        board: boardRes.data as DbBoard,
        columns,
        tasks,
        taskTypes,
        members,
        pendingInvites: invites,
      });
    },

    create: async (title: string, ownerId: string): Promise<Board> => {
      const inviteCode = randomInviteCode();

      const boardInsert = await supabase
        .from('boards')
        .insert({
          title,
          owner_id: ownerId,
          description: '',
          cover_url: '',
          invite_code: inviteCode,
        })
        .select('*')
        .single();

      if (boardInsert.error) {
        throw new Error(`Failed to create board: ${boardInsert.error.message}`);
      }

      const board = boardInsert.data as DbBoard;

      // owner membership - CRITICAL: This must succeed
      const memberInsert = await supabase.from('board_members').insert({
        board_id: board.id,
        user_id: ownerId,
        role: 'owner',
        permissions: ['can_view', 'can_edit_task', 'can_move_task', 'can_delete_task', 'can_manage_users', 'can_manage_columns', 'can_manage_types'],
      });
      
      if (memberInsert.error) {
        await supabase.from('boards').delete().eq('id', board.id);
        throw new Error(`Failed to add owner to board: ${memberInsert.error.message}`);
      }

      // default columns
      const columnsToInsert: Omit<DbColumn, 'id'>[] = [
        { board_id: board.id, title: 'To Do', order: 0, is_entry_locked: false, is_exit_locked: false },
        { board_id: board.id, title: 'In Progress', order: 1, is_entry_locked: false, is_exit_locked: false },
        { board_id: board.id, title: 'Done', order: 2, is_entry_locked: false, is_exit_locked: false },
      ];
      const colsRes = await supabase.from('columns').insert(columnsToInsert).select('*');
      if (colsRes.error) {
        throw new Error(`Failed to create columns: ${colsRes.error.message}`);
      }
      const columns = colsRes.data as DbColumn[];

      // default task types
      const typesToInsert: Omit<DbTaskType, 'id'>[] = [
        { board_id: board.id, label: 'Feature', color: '#3b82f6', order: 0 },
        { board_id: board.id, label: 'Bug', color: '#ef4444', order: 1 },
        { board_id: board.id, label: 'Improvement', color: '#10b981', order: 2 },
      ];
      const typesRes = await supabase.from('task_types').insert(typesToInsert).select('*');
      if (typesRes.error) {
        throw new Error(`Failed to create task types: ${typesRes.error.message}`);
      }
      const taskTypes = typesRes.data as DbTaskType[];

      const membersRes = await supabase.from('board_members').select('*').eq('board_id', board.id);
      const members = requireOk(membersRes, 'Failed to load members') as DbBoardMember[];

      return mapBoard({
        board,
        columns,
        tasks: [],
        taskTypes,
        members,
        pendingInvites: [],
      });
    },

    update: async (board: Board): Promise<Board> => {
      // Full board sync for compatibility with existing reducers/UI.

      const boardUpdateRes = await supabase
        .from('boards')
        .update({
          title: board.title,
          description: board.description ?? '',
          cover_url: board.coverUrl ?? '',
          invite_code: board.inviteCode ?? null,
        })
        .eq('id', board.id)
        .select('*')
        .single();

      const updatedBoard = requireOk(boardUpdateRes, 'Failed to update board') as DbBoard;

      // --- Columns ---
      const existingColumnsRes = await supabase.from('columns').select('id').eq('board_id', board.id);
      const existingColumnIds = (requireOk(existingColumnsRes, 'Failed to load columns') as Array<{ id: string }>).map((r) => r.id);

      const columnsPayload = board.columns.map((c) => {
        const base = {
          board_id: board.id,
          title: c.title,
          order: c.order,
          is_entry_locked: !!c.isEntryLocked,
          is_exit_locked: !!c.isExitLocked,
        };
        if (ensureUuid(c.id)) return { id: c.id, ...base };
        return base;
      });

      if (columnsPayload.length > 0) {
        const up = await supabase.from('columns').upsert(columnsPayload, { onConflict: 'id' });
        if (up.error) throw new Error(up.error.message);
      }

      const incomingColumnIds = board.columns.filter((c) => ensureUuid(c.id)).map((c) => c.id);
      const toDeleteColumnIds = existingColumnIds.filter((id) => !incomingColumnIds.includes(id));
      if (toDeleteColumnIds.length > 0) {
        const del = await supabase.from('columns').delete().in('id', toDeleteColumnIds);
        if (del.error) throw new Error(del.error.message);
      }

      // --- Task Types ---
      const existingTypesRes = await supabase.from('task_types').select('id').eq('board_id', board.id);
      const existingTypeIds = (requireOk(existingTypesRes, 'Failed to load task types') as Array<{ id: string }>).map((r) => r.id);

      const typesPayload = board.taskTypes.map((t, idx) => {
        const base = { board_id: board.id, label: t.label, color: t.color, order: idx };
        if (ensureUuid(t.id)) return { id: t.id, ...base };
        return base;
      });

      if (typesPayload.length > 0) {
        const up = await supabase.from('task_types').upsert(typesPayload, { onConflict: 'id' });
        if (up.error) throw new Error(up.error.message);
      }

      const incomingTypeIds = board.taskTypes.filter((t) => ensureUuid(t.id)).map((t) => t.id);
      const toDeleteTypeIds = existingTypeIds.filter((id) => !incomingTypeIds.includes(id));
      if (toDeleteTypeIds.length > 0) {
        const del = await supabase.from('task_types').delete().in('id', toDeleteTypeIds);
        if (del.error) throw new Error(del.error.message);
      }

      // --- Tasks ---
      const existingTasksRes = await supabase.from('tasks').select('id').eq('board_id', board.id);
      const existingTaskIds = (requireOk(existingTasksRes, 'Failed to load tasks') as Array<{ id: string }>).map((r) => r.id);

      const tasksPayload = board.tasks.map((t) => {
        const base = {
          board_id: board.id,
          column_id: t.columnId,
          title: t.title,
          description: t.description ?? '',
          assignee_ids: t.assigneeIds ?? [],
          type_id: t.typeId,
          created_at: t.createdAt,
          history: t.history ?? [],
        };
        if (ensureUuid(t.id)) return { id: t.id, ...base };
        return base;
      });

      if (tasksPayload.length > 0) {
        const up = await supabase.from('tasks').upsert(tasksPayload, { onConflict: 'id' });
        if (up.error) throw new Error(up.error.message);
      }

      const incomingTaskIds = board.tasks.filter((t) => ensureUuid(t.id)).map((t) => t.id);
      const toDeleteTaskIds = existingTaskIds.filter((id) => !incomingTaskIds.includes(id));
      if (toDeleteTaskIds.length > 0) {
        const del = await supabase.from('tasks').delete().in('id', toDeleteTaskIds);
        if (del.error) throw new Error(del.error.message);
      }

      // --- Members ---
      const existingMembersRes = await supabase.from('board_members').select('user_id').eq('board_id', board.id);
      const existingMemberUserIds = (requireOk(existingMembersRes, 'Failed to load members') as Array<{ user_id: string }>).map((r) => r.user_id);

      const membersPayload = board.members.map((m) => ({
        board_id: board.id,
        user_id: m.userId,
        role: m.role,
        permissions: m.permissions as any,
      }));

      if (membersPayload.length > 0) {
        const up = await supabase.from('board_members').upsert(membersPayload, { onConflict: 'board_id,user_id' });
        if (up.error) throw new Error(up.error.message);
      }

      const incomingMemberUserIds = board.members.map((m) => m.userId);
      const toDeleteMemberUserIds = existingMemberUserIds.filter((id) => !incomingMemberUserIds.includes(id));
      if (toDeleteMemberUserIds.length > 0) {
        const del = await supabase.from('board_members').delete().eq('board_id', board.id).in('user_id', toDeleteMemberUserIds);
        if (del.error) throw new Error(del.error.message);
      }

      // --- Invites ---
      const existingInvitesRes = await supabase.from('board_invites').select('user_id').eq('board_id', board.id);
      const existingInviteUserIds = (requireOk(existingInvitesRes, 'Failed to load invites') as Array<{ user_id: string }>).map((r) => r.user_id);

      const pending = board.pendingInvites ?? [];
      const invitesToInsert = pending
        .filter((uid) => !existingInviteUserIds.includes(uid))
        .map((uid) => ({ board_id: board.id, user_id: uid }));

      if (invitesToInsert.length > 0) {
        const ins = await supabase.from('board_invites').insert(invitesToInsert);
        if (ins.error) throw new Error(ins.error.message);
      }

      const invitesToDelete = existingInviteUserIds.filter((uid) => !pending.includes(uid));
      if (invitesToDelete.length > 0) {
        const del = await supabase.from('board_invites').delete().eq('board_id', board.id).in('user_id', invitesToDelete);
        if (del.error) throw new Error(del.error.message);
      }

      // Read back full board state
      const full = await api.boards.getById(updatedBoard.id);
      if (!full) throw new Error('Board not found after update');
      return full;
    },

    delete: async (boardId: string): Promise<void> => {
      const res = await supabase.from('boards').delete().eq('id', boardId);
      if (res.error) throw new Error(res.error.message);
    },

    reorder: async (_boardIds: string[]): Promise<void> => {
      // Reorder is UI-only in current data model.
      return;
    },

    getByInviteCode: async (inviteCode: string): Promise<{ id: string; title: string; ownerName: string } | null> => {
      const res = await supabase
        .from('boards')
        .select('id, title, owner_id')
        .eq('invite_code', inviteCode)
        .maybeSingle();
      
      if (res.error || !res.data) return null;
      
      const ownerRes = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', res.data.owner_id)
        .maybeSingle();
      
      return {
        id: res.data.id,
        title: res.data.title,
        ownerName: ownerRes.data?.display_name || 'Unknown'
      };
    },

    joinByInviteCode: async (inviteCode: string): Promise<string> => {
      const { data, error } = await supabase.rpc('join_board_by_invite', { invite_code: inviteCode });
      if (error) throw new Error(error.message);
      if (!data) throw new Error('Invite not found or already used');
      return data as string;
    },
  },

  // Direct CRUD for tasks - much faster than updating entire board
  tasks: {
    create: async (boardId: string, task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
      const res = await supabase.from('tasks').insert({
        board_id: boardId,
        column_id: task.columnId,
        title: task.title,
        description: task.description ?? '',
        assignee_ids: task.assigneeIds ?? [],
        type_id: task.typeId,
        history: task.history ?? [],
      }).select('*').single();
      
      if (res.error) throw new Error(res.error.message);
      const t = res.data as DbTask;
      return {
        id: t.id,
        columnId: t.column_id,
        title: t.title,
        description: t.description,
        assigneeIds: t.assignee_ids,
        typeId: t.type_id,
        createdAt: t.created_at,
        history: t.history,
      };
    },

    update: async (task: Task): Promise<Task> => {
      const res = await supabase.from('tasks').update({
        column_id: task.columnId,
        title: task.title,
        description: task.description ?? '',
        assignee_ids: task.assigneeIds ?? [],
        type_id: task.typeId,
        history: task.history ?? [],
      }).eq('id', task.id).select('*').single();
      
      if (res.error) throw new Error(res.error.message);
      const t = res.data as DbTask;
      return {
        id: t.id,
        columnId: t.column_id,
        title: t.title,
        description: t.description,
        assigneeIds: t.assignee_ids,
        typeId: t.type_id,
        createdAt: t.created_at,
        history: t.history,
      };
    },

    delete: async (taskId: string): Promise<void> => {
      const res = await supabase.from('tasks').delete().eq('id', taskId);
      if (res.error) throw new Error(res.error.message);
    },

    move: async (taskId: string, newColumnId: string): Promise<void> => {
      const res = await supabase.from('tasks').update({ column_id: newColumnId }).eq('id', taskId);
      if (res.error) throw new Error(res.error.message);
    },
  },

  // Direct CRUD for columns
  columns: {
    create: async (boardId: string, title: string, order: number): Promise<Column> => {
      const res = await supabase.from('columns').insert({
        board_id: boardId,
        title,
        order,
        is_entry_locked: false,
        is_exit_locked: false,
      }).select('*').single();
      
      if (res.error) throw new Error(res.error.message);
      const c = res.data as DbColumn;
      return {
        id: c.id,
        title: c.title,
        order: c.order,
        isEntryLocked: c.is_entry_locked,
        isExitLocked: c.is_exit_locked,
      };
    },

    update: async (columnId: string, updates: Partial<Column>): Promise<void> => {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.order !== undefined) payload.order = updates.order;
      if (updates.isEntryLocked !== undefined) payload.is_entry_locked = updates.isEntryLocked;
      if (updates.isExitLocked !== undefined) payload.is_exit_locked = updates.isExitLocked;
      
      const res = await supabase.from('columns').update(payload).eq('id', columnId);
      if (res.error) throw new Error(res.error.message);
    },

    delete: async (columnId: string): Promise<void> => {
      const res = await supabase.from('columns').delete().eq('id', columnId);
      if (res.error) throw new Error(res.error.message);
    },
  },

  // Direct CRUD for task types
  taskTypes: {
    create: async (boardId: string, label: string, color: string, order: number): Promise<TaskType> => {
      const res = await supabase.from('task_types').insert({
        board_id: boardId,
        label,
        color,
        order,
      }).select('*').single();
      
      if (res.error) throw new Error(res.error.message);
      const t = res.data as DbTaskType;
      return { id: t.id, label: t.label, color: t.color };
    },

    update: async (typeId: string, updates: Partial<TaskType>): Promise<void> => {
      const payload: any = {};
      if (updates.label !== undefined) payload.label = updates.label;
      if (updates.color !== undefined) payload.color = updates.color;
      
      const res = await supabase.from('task_types').update(payload).eq('id', typeId);
      if (res.error) throw new Error(res.error.message);
    },

    delete: async (typeId: string): Promise<void> => {
      const res = await supabase.from('task_types').delete().eq('id', typeId);
      if (res.error) throw new Error(res.error.message);
    },

    reorder: async (boardId: string, typeIds: string[]): Promise<void> => {
      const updates = typeIds.map((id, index) => 
        supabase.from('task_types').update({ order: index }).eq('id', id)
      );
      await Promise.all(updates);
    },
  },

  users: {
    search: async (query: string): Promise<User[]> => {
      if (!query) return [];
      const q = query.trim();
      if (!q) return [];

      const res = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(20);

      const rows = requireOk(res, 'Failed to search users') as DbProfile[];
      return rows.map(mapProfileToUser);
    },
  },

  notifications: {
    sendInvite: async (fromUserId: string, toUserId: string, boardId: string) => {
      // Create notification (invite record is handled by board sync via boards.update)
      const boardRes = await supabase.from('boards').select('title').eq('id', boardId).maybeSingle();
      if (boardRes.error) throw new Error(boardRes.error.message);

      const notifRes = await supabase.from('notifications').insert({
        type: 'invite',
        from_user_id: fromUserId,
        to_user_id: toUserId,
        board_id: boardId,
        board_title: boardRes.data?.title ?? null,
        read: false,
      });
      if (notifRes.error) throw new Error(notifRes.error.message);
    },

    getMy: async (userId: string): Promise<Notification[]> => {
      const res = await supabase
        .from('notifications')
        .select('*, profiles:from_user_id(username, display_name)')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      const rows = requireOk(res, 'Failed to load notifications') as Array<DbNotification & { profiles: { username: string; display_name: string } | null }>;
      return rows.map((n) => ({
        id: n.id,
        type: n.type,
        fromUserId: n.from_user_id,
        fromUsername: n.profiles?.display_name || n.profiles?.username || 'Unknown',
        toUserId: n.to_user_id,
        boardId: n.board_id,
        boardTitle: n.board_title ?? undefined,
        read: n.read,
        timestamp: new Date(n.created_at).getTime(),
      }));
    },

    markRead: async (notifId: string) => {
      const res = await supabase.from('notifications').update({ read: true }).eq('id', notifId);
      if (res.error) throw new Error(res.error.message);
    },

    removeInvite: async (boardId: string, userId: string) => {
      // delete invites
      const invRes = await supabase.from('board_invites').delete().eq('board_id', boardId).eq('user_id', userId);
      if (invRes.error) throw new Error(invRes.error.message);

      // delete notification
      const notifRes = await supabase
        .from('notifications')
        .delete()
        .eq('type', 'invite')
        .eq('board_id', boardId)
        .eq('to_user_id', userId);

      if (notifRes.error) throw new Error(notifRes.error.message);
    },
  },
};
