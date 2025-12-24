
export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  password?: string; // Stored for mock auth validation
  telegram?: string;
  avatarUrl?: string;
  blockedUserIds: string[];
}

export type PermissionType = 'can_view' | 'can_edit_task' | 'can_move_task' | 'can_delete_task' | 'can_manage_users' | 'can_manage_columns' | 'can_manage_types';

export interface BoardMember {
  userId: string;
  permissions: PermissionType[];
  role: 'owner' | 'member';
}

export interface TaskType {
  id: string;
  label: string;
  color: string;
}

export interface Task {
  id: string;
  columnId: string;
  title: string;
  description: string;
  assigneeIds: string[];
  typeId: string; // References TaskType
  createdAt: string;
  history: string[]; 
}

export interface Column {
  id: string;
  title: string;
  order: number;
  isEntryLocked?: boolean;
  isExitLocked?: boolean;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  ownerId: string;
  members: BoardMember[];
  pendingInvites?: string[]; // Array of User IDs who have been invited but haven't accepted
  columns: Column[];
  tasks: Task[];
  taskTypes: TaskType[];
  inviteCode?: string;
}

export interface Notification {
  id: string;
  type: 'invite';
  fromUserId: string;
  fromUsername?: string;
  toUserId: string;
  boardId: string;
  boardTitle?: string;
  read: boolean;
  timestamp: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

export interface RootState {
  auth: AuthState;
  boards: BoardsState;
  users: UsersState;
  ui: UiState;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  theme: 'light' | 'dark';
  isAuthenticated: boolean;
}

export interface BoardsState {
  items: Board[];
  currentBoardId: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

export interface UsersState {
  users: User[];
  notifications: Notification[];
  status: 'idle' | 'loading';
}

export interface UiState {
  toasts: ToastMessage[];
}