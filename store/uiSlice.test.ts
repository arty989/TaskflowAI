import reducer, { addToast, removeToast } from './uiSlice';

describe('uiSlice reducer', () => {
  it('should add toast', () => {
    const state = reducer(undefined, addToast({ type: 'success', message: 'Hello' }));
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].type).toBe('success');
    expect(state.toasts[0].message).toBe('Hello');
    expect(state.toasts[0].id).toBeTruthy();
  });

  it('should remove toast by id', () => {
    const s1 = reducer(undefined, addToast({ type: 'info', message: 'A' }));
    const id = s1.toasts[0].id;
    const s2 = reducer(s1, removeToast(id));
    expect(s2.toasts).toHaveLength(0);
  });
});
