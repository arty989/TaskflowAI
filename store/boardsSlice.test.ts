import boardsReducer, {
  setCurrentBoard,
  fetchBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  addTaskAsync,
  deleteTaskAsync,
  addColumnAsync,
  deleteColumnAsync,
} from './boardsSlice';
import { BoardsState, Board } from '../types';

// Mock the API
jest.mock('../services/supabaseBackend', () => ({
  api: {
    boards: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getById: jest.fn(),
      reorder: jest.fn(),
    },
    notifications: {
      sendInvite: jest.fn(),
      removeInvite: jest.fn(),
    },
  },
}));

describe('boardsSlice', () => {
  const initialState: BoardsState = {
    items: [],
    currentBoardId: null,
    status: 'idle',
    error: null,
  };

  const mockBoard: Board = {
    id: 'board-1',
    title: 'Test Board',
    description: 'Test Description',
    coverUrl: '',
    ownerId: 'user-1',
    inviteCode: 'invite-123',
    columns: [
      { id: 'col-1', title: 'To Do', order: 0, isEntryLocked: false, isExitLocked: false },
      { id: 'col-2', title: 'In Progress', order: 1, isEntryLocked: false, isExitLocked: false },
      { id: 'col-3', title: 'Done', order: 2, isEntryLocked: false, isExitLocked: false },
    ],
    tasks: [],
    taskTypes: [
      { id: 'type-1', label: 'Feature', color: '#3b82f6' },
      { id: 'type-2', label: 'Bug', color: '#ef4444' },
    ],
    members: [{ userId: 'user-1', role: 'owner', permissions: ['can_view'] }],
    pendingInvites: [],
  };

  describe('reducers', () => {
    it('should return the initial state', () => {
      expect(boardsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setCurrentBoard', () => {
      const state = boardsReducer(initialState, setCurrentBoard('board-1'));
      expect(state.currentBoardId).toBe('board-1');
    });

    it('should handle setCurrentBoard with null', () => {
      const stateWithBoard = { ...initialState, currentBoardId: 'board-1' };
      const state = boardsReducer(stateWithBoard, setCurrentBoard(null));
      expect(state.currentBoardId).toBeNull();
    });
  });

  describe('extraReducers', () => {
    it('should handle fetchBoards.pending', () => {
      const action = { type: fetchBoards.pending.type };
      const state = boardsReducer(initialState, action);
      expect(state.status).toBe('loading');
    });

    it('should handle fetchBoards.fulfilled', () => {
      const action = { type: fetchBoards.fulfilled.type, payload: [mockBoard] };
      const state = boardsReducer(initialState, action);
      expect(state.status).toBe('succeeded');
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('board-1');
    });

    it('should handle createBoard.fulfilled', () => {
      const action = { type: createBoard.fulfilled.type, payload: mockBoard };
      const state = boardsReducer(initialState, action);
      expect(state.items).toHaveLength(1);
      expect(state.items[0].title).toBe('Test Board');
    });

    it('should handle updateBoard.fulfilled', () => {
      const stateWithBoard = { ...initialState, items: [mockBoard] };
      const updatedBoard = { ...mockBoard, title: 'Updated Title' };
      const action = { type: updateBoard.fulfilled.type, payload: updatedBoard };
      const state = boardsReducer(stateWithBoard, action);
      expect(state.items[0].title).toBe('Updated Title');
    });

    it('should handle deleteBoard.fulfilled', () => {
      const stateWithBoard = { ...initialState, items: [mockBoard] };
      const action = { type: deleteBoard.fulfilled.type, payload: 'board-1' };
      const state = boardsReducer(stateWithBoard, action);
      expect(state.items).toHaveLength(0);
    });

    it('should handle addTaskAsync.fulfilled', () => {
      const stateWithBoard = { ...initialState, items: [mockBoard] };
      const newTask = { id: 'task-1', columnId: 'col-1', title: 'New Task', description: '', assigneeIds: [], typeId: 'type-1', createdAt: '', history: [] };
      const action = { type: addTaskAsync.fulfilled.type, payload: { boardId: 'board-1', task: newTask } };
      const state = boardsReducer(stateWithBoard, action);
      expect(state.items[0].tasks).toHaveLength(1);
    });

    it('should handle deleteTaskAsync.fulfilled', () => {
      const boardWithTask = {
        ...mockBoard,
        tasks: [{ id: 'task-1', columnId: 'col-1', title: 'Task', description: '', assigneeIds: [], typeId: 'type-1', createdAt: '', history: [] }],
      };
      const stateWithBoard = { ...initialState, items: [boardWithTask] };
      const action = { type: deleteTaskAsync.fulfilled.type, payload: { boardId: 'board-1', taskId: 'task-1' } };
      const state = boardsReducer(stateWithBoard, action);
      expect(state.items[0].tasks).toHaveLength(0);
    });

    it('should handle addColumnAsync.fulfilled', () => {
      const stateWithBoard = { ...initialState, items: [mockBoard] };
      const newColumn = { id: 'col-4', title: 'New Column', order: 3, isEntryLocked: false, isExitLocked: false };
      const action = { type: addColumnAsync.fulfilled.type, payload: { boardId: 'board-1', column: newColumn } };
      const state = boardsReducer(stateWithBoard, action);
      expect(state.items[0].columns).toHaveLength(4);
    });

    it('should handle deleteColumnAsync.fulfilled', () => {
      const stateWithBoard = { ...initialState, items: [mockBoard] };
      const action = { type: deleteColumnAsync.fulfilled.type, payload: { boardId: 'board-1', columnId: 'col-3' } };
      const state = boardsReducer(stateWithBoard, action);
      expect(state.items[0].columns).toHaveLength(2);
    });
  });
});
