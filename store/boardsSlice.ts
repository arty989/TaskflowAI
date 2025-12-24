
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Board, BoardsState, Task, Column, BoardMember, TaskType } from '../types';
import { api } from '../services/supabaseBackend';

const initialState: BoardsState = {
  items: [],
  currentBoardId: null,
  status: 'idle',
  error: null,
};

export const fetchBoards = createAsyncThunk('boards/fetchAll', async (userId: string) => {
  return await api.boards.list(userId);
});

export const createBoard = createAsyncThunk('boards/create', async ({title, ownerId}: {title: string, ownerId: string}) => {
  return await api.boards.create(title, ownerId);
});

export const updateBoard = createAsyncThunk('boards/update', async (board: Board) => {
  return await api.boards.update(board);
});

export const deleteBoard = createAsyncThunk('boards/delete', async (boardId: string) => {
  await api.boards.delete(boardId);
  return boardId;
});

export const reorderBoards = createAsyncThunk('boards/reorder', async (boardIds: string[]) => {
  await api.boards.reorder(boardIds);
  return boardIds;
});

// --- Invitation & Member Management ---

export const sendBoardInvite = createAsyncThunk('boards/invite', async ({boardId, fromUserId, toUserId}: {boardId: string, fromUserId: string, toUserId: string}) => {
  const board = await api.boards.getById(boardId);
  if (!board) throw new Error('Board not found');

  // Check if already member
  if (board.members.find(m => m.userId === toUserId)) {
    throw new Error('User is already a member');
  }
  // Check if already invited
  if (board.pendingInvites?.includes(toUserId)) {
    throw new Error('Invitation already sent');
  }

  const updatedBoard = {
    ...board,
    pendingInvites: [...(board.pendingInvites || []), toUserId]
  };

  await api.boards.update(updatedBoard);
  await api.notifications.sendInvite(fromUserId, toUserId, boardId);
  
  return updatedBoard;
});

// --- Tasks / Columns / Locks (async, Supabase-backed) ---

export const addTaskAsync = createAsyncThunk('boards/task/add', async ({ boardId, task }: { boardId: string; task: Omit<Task, 'id' | 'createdAt'> }) => {
  const createdTask = await api.tasks.create(boardId, task);
  return { boardId, task: createdTask };
});

export const updateTaskAsync = createAsyncThunk('boards/task/update', async ({ boardId, task }: { boardId: string; task: Task }) => {
  const updatedTask = await api.tasks.update(task);
  return { boardId, task: updatedTask };
});

export const moveTaskAsync = createAsyncThunk('boards/task/move', async ({ boardId, taskId, newColumnId }: { boardId: string; taskId: string; newColumnId: string }) => {
  await api.tasks.move(taskId, newColumnId);
  return { boardId, taskId, newColumnId };
});

export const deleteTaskAsync = createAsyncThunk('boards/task/delete', async ({ boardId, taskId }: { boardId: string; taskId: string }) => {
  await api.tasks.delete(taskId);
  return { boardId, taskId };
});

export const addColumnAsync = createAsyncThunk('boards/column/add', async ({ boardId, title }: { boardId: string; title: string }, { getState }) => {
  const state = getState() as any;
  const board: Board | undefined = state.boards.items.find((b: Board) => b.id === boardId);
  if (!board) throw new Error('Board not found');
  const newCol = await api.columns.create(boardId, title, board.columns.length);
  return { boardId, column: newCol };
});

export const deleteColumnAsync = createAsyncThunk('boards/column/delete', async ({ boardId, columnId }: { boardId: string; columnId: string }, { getState }) => {
  const state = getState() as any;
  const board: Board | undefined = state.boards.items.find((b: Board) => b.id === boardId);
  if (!board) throw new Error('Board not found');
  const hasTasks = board.tasks.some(t => t.columnId === columnId);
  if (hasTasks) throw new Error('Cannot delete column with tasks');
  await api.columns.delete(columnId);
  return { boardId, columnId };
});

export const updateColumnLocksAsync = createAsyncThunk(
  'boards/column/locks',
  async ({ boardId, columnId, isEntryLocked, isExitLocked }: { boardId: string; columnId: string; isEntryLocked: boolean; isExitLocked: boolean }) => {
    await api.columns.update(columnId, { isEntryLocked, isExitLocked });
    return { boardId, columnId, isEntryLocked, isExitLocked };
  },
);

export const revokeBoardInvite = createAsyncThunk('boards/revokeInvite', async ({boardId, userId}: {boardId: string, userId: string}) => {
  const board = await api.boards.getById(boardId);
  if (!board) throw new Error('Board not found');

  const updatedBoard = {
    ...board,
    pendingInvites: (board.pendingInvites || []).filter(id => id !== userId)
  };

  await api.boards.update(updatedBoard);
  await api.notifications.removeInvite(boardId, userId);

  return updatedBoard;
});

export const declineBoardInvite = createAsyncThunk('boards/declineInvite', async ({boardId, userId}: {boardId: string, userId: string}) => {
  const board = await api.boards.getById(boardId);
  // Even if board is null (deleted), we try to clean up notification
  await api.notifications.removeInvite(boardId, userId);
  
  if (board) {
    const updatedBoard = {
      ...board,
      pendingInvites: (board.pendingInvites || []).filter(id => id !== userId)
    };
    await api.boards.update(updatedBoard);
    return updatedBoard;
  }
  return null;
});

export const joinBoard = createAsyncThunk('boards/join', async ({boardId, userId}: {boardId: string, userId: string}) => {
  const board = await api.boards.getById(boardId);
  if (!board) throw new Error('Board not found');
  
  // If already member, just return
  if (board.members.find(m => m.userId === userId)) return board;

  const newMember: BoardMember = {
    userId,
    role: 'member',
    permissions: ['can_view'] // Default permissions
  };
  
  // Remove from pendingInvites and add to members
  const updatedBoard = { 
    ...board, 
    members: [...board.members, newMember],
    pendingInvites: (board.pendingInvites || []).filter(id => id !== userId)
  };
  
  await api.boards.update(updatedBoard);
  await api.notifications.removeInvite(boardId, userId); // Clean up notification

  return updatedBoard;
});

export const leaveBoard = createAsyncThunk('boards/leave', async ({boardId, userId}: {boardId: string, userId: string}) => {
  const board = await api.boards.getById(boardId);
  if (!board) throw new Error('Board not found');
  
  const member = board.members.find(m => m.userId === userId);
  if (!member) throw new Error('Not a member');
  if (member.role === 'owner') throw new Error('Owner cannot leave board');
  
  const updatedBoard = {
    ...board,
    members: board.members.filter(m => m.userId !== userId)
  };
  
  await api.boards.update(updatedBoard);
  return { boardId, userId };
});

const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    setCurrentBoard(state, action: PayloadAction<string | null>) {
      state.currentBoardId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoards.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateBoard.fulfilled, (state, action) => {
        const idx = state.items.findIndex(b => b.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.items = state.items.filter(b => b.id !== action.payload);
      })
      .addCase(joinBoard.fulfilled, (state, action) => {
         const idx = state.items.findIndex(b => b.id === action.payload.id);
         if (idx !== -1) state.items[idx] = action.payload;
         else state.items.push(action.payload);
      })
      .addCase(reorderBoards.fulfilled, (state, action) => {
         const orderMap = new Map<string, number>(action.payload.map((id, index) => [id, index]));
         state.items.sort((a, b) => {
             const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : Infinity;
             const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : Infinity;
             return indexA - indexB;
         });
      })
      .addCase(sendBoardInvite.fulfilled, (state, action) => {
         const idx = state.items.findIndex(b => b.id === action.payload.id);
         if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(revokeBoardInvite.fulfilled, (state, action) => {
         const idx = state.items.findIndex(b => b.id === action.payload.id);
         if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(addTaskAsync.fulfilled, (state, action) => {
        const { boardId, task } = action.payload;
        const board = state.items.find(b => b.id === boardId);
        if (board) board.tasks.push(task);
      })
      .addCase(updateTaskAsync.fulfilled, (state, action) => {
        const { boardId, task } = action.payload;
        const board = state.items.find(b => b.id === boardId);
        if (board) {
          const idx = board.tasks.findIndex(t => t.id === task.id);
          if (idx !== -1) board.tasks[idx] = task;
        }
      })
      .addCase(moveTaskAsync.fulfilled, (state, action) => {
        const { boardId, taskId, newColumnId } = action.payload;
        const board = state.items.find(b => b.id === boardId);
        if (board) {
          const task = board.tasks.find(t => t.id === taskId);
          if (task) task.columnId = newColumnId;
        }
      })
      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        const { boardId, taskId } = action.payload;
        const board = state.items.find(b => b.id === boardId);
        if (board) board.tasks = board.tasks.filter(t => t.id !== taskId);
      })
      .addCase(addColumnAsync.fulfilled, (state, action) => {
        const { boardId, column } = action.payload;
        const board = state.items.find(b => b.id === boardId);
        if (board) board.columns.push(column);
      })
      .addCase(deleteColumnAsync.fulfilled, (state, action) => {
        const { boardId, columnId } = action.payload;
        const board = state.items.find(b => b.id === boardId);
        if (board) board.columns = board.columns.filter(c => c.id !== columnId);
      })
      .addCase(updateColumnLocksAsync.fulfilled, (state, action) => {
        const { boardId, columnId, isEntryLocked, isExitLocked } = action.payload;
        const board = state.items.find(b => b.id === boardId);
        if (board) {
          const col = board.columns.find(c => c.id === columnId);
          if (col) {
            col.isEntryLocked = isEntryLocked;
            col.isExitLocked = isExitLocked;
          }
        }
      })
      .addCase(leaveBoard.fulfilled, (state, action) => {
        const { boardId } = action.payload;
        state.items = state.items.filter(b => b.id !== boardId);
      });
  }
});

export const { setCurrentBoard } = boardsSlice.actions;
export default boardsSlice.reducer;
