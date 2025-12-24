
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchBoards, updateBoard, addTaskAsync, updateTaskAsync, moveTaskAsync, deleteTaskAsync, addColumnAsync, deleteColumnAsync, updateColumnLocksAsync, sendBoardInvite, revokeBoardInvite } from '../store/boardsSlice';
import { searchUsers } from '../store/usersSlice';
import { addToast } from '../store/uiSlice';
import { Task, Column, BoardMember, TaskType } from '../types';
import { Button, Input, Modal, Avatar } from '../components/Common';
import { TaskModal } from '../components/TaskModal';
import { TypeEditorModal } from '../components/TypeManager';
import { useLanguage } from '../i18n';

export const BoardView = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { items: boards } = useSelector((state: RootState) => state.boards);
  const { user } = useSelector((state: RootState) => state.auth);
  const { users } = useSelector((state: RootState) => state.users);

  const board = boards.find(b => b.id === boardId);
  const currentUserMember = board?.members.find(m => m.userId === user?.id);
  const { t } = useLanguage();
  
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  
  const [isManageModalOpen, setManageModalOpen] = useState(false);
  
  // Type Management State
  const [isTypeEditorOpen, setTypeEditorOpen] = useState(false);
  const [editingType, setEditingType] = useState<TaskType | null>(null);
  
  const [inviteSearch, setInviteSearch] = useState('');
  const [foundUsers, setFoundUsers] = useState(users);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // Drag State for Types
  const [draggedTypeIndex, setDraggedTypeIndex] = useState<number | null>(null);

  useEffect(() => {
    if (boardId && user) {
      dispatch(fetchBoards(user.id));
    }
  }, [boardId, user?.id]);

  useEffect(() => {
    if(inviteSearch) {
       dispatch(searchUsers(inviteSearch)).then((res: any) => setFoundUsers(res.payload));
    } else {
       setFoundUsers([]);
    }
  }, [inviteSearch]);

  if (!board || !currentUserMember) return <div className="h-full flex items-center justify-center text-gray-500">{t.board.boardNotFound}</div>;

  const hasPermission = (perm: string) => 
    currentUserMember.role === 'owner' || currentUserMember.permissions.includes(perm as any);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    const sourceCol = board.columns.find(c => c.id === task.columnId);
    if (sourceCol?.isExitLocked) {
       e.preventDefault();
       dispatch(addToast({ type: 'error', message: 'Column exit is locked. Unlock to move tasks.' }));
       return;
    }
    e.dataTransfer.setData('taskId', task.id);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const destCol = board.columns.find(c => c.id === columnId);
    if (destCol?.isEntryLocked) {
        dispatch(addToast({ type: 'error', message: 'Column entry is locked.' }));
        return;
    }

    if (taskId && hasPermission('can_move_task')) {
      dispatch(moveTaskAsync({ boardId: board.id, taskId, newColumnId: columnId }));
    }
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      const updated = { ...editingTask, ...taskData, history: [...editingTask.history, `Edited by ${user?.username} at ${new Date().toLocaleTimeString()}`] };
      dispatch(updateTaskAsync({ boardId: board.id, task: updated }));
      dispatch(addToast({ type: 'success', message: t.board.taskUpdated }));
    } else if (activeColumnId) {
      const newTask = {
        columnId: activeColumnId,
        title: taskData.title || 'New Task',
        description: taskData.description || '',
        assigneeIds: taskData.assigneeIds || [],
        typeId: taskData.typeId || board.taskTypes[0].id,
        history: [`Created by ${user?.username}`]
      };
      dispatch(addTaskAsync({ boardId: board.id, task: newTask }));
      dispatch(addToast({ type: 'success', message: t.board.taskCreated }));
    }
  };

  const handleDeleteTask = () => {
     if(editingTask) {
        dispatch(deleteTaskAsync({ boardId: board.id, taskId: editingTask.id }));
        dispatch(addToast({ type: 'info', message: t.board.taskDeleted }));
     }
  };

  const updateMemberPermissions = (memberId: string, perms: any) => {
    const updatedMembers = board.members.map(m => m.userId === memberId ? { ...m, permissions: perms } : m);
    dispatch(updateBoard({ ...board, members: updatedMembers }));
    dispatch(addToast({ type: 'success', message: 'Permissions updated.' }));
  };

  const handleAddColumn = () => {
    if(newColumnTitle) {
      dispatch(addColumnAsync({ boardId: board.id, title: newColumnTitle }))
        .unwrap()
        .catch((e: any) => dispatch(addToast({ type: 'error', message: e.message || 'Failed to add column' })));
      setNewColumnTitle('');
      dispatch(addToast({ type: 'success', message: t.board.columnAdded }));
    }
  };

  const handleTypeSave = (type: TaskType) => {
     const exists = board.taskTypes.find(t => t.id === type.id);
     let newTypes;
     if (exists) {
        newTypes = board.taskTypes.map(t => t.id === type.id ? type : t);
     } else {
        newTypes = [...board.taskTypes, type];
     }
     dispatch(updateBoard({ ...board, taskTypes: newTypes }));
     dispatch(addToast({ type: 'success', message: 'Category saved.' }));
  };

  const handleTypeDelete = (id: string) => {
     const newTypes = board.taskTypes.filter(t => t.id !== id);
     const fallbackTypeId = newTypes.length > 0 ? newTypes[0].id : 'undefined';

     const newTasks = board.tasks.map(t => {
        if (t.typeId === id) {
           return { ...t, typeId: fallbackTypeId };
        }
        return t;
     });

     dispatch(updateBoard({ ...board, taskTypes: newTypes, tasks: newTasks }));
     dispatch(addToast({ type: 'info', message: 'Category deleted and tasks reassigned.' }));
  };

  const openTypeEditor = (type: TaskType | null) => {
     if (!hasPermission('can_manage_types')) return;
     setEditingType(type);
     setTypeEditorOpen(true);
  };

  const handleTypeDragStart = (index: number) => {
    setDraggedTypeIndex(index);
  };

  const handleTypeDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleTypeDrop = (index: number) => {
    if (draggedTypeIndex === null || draggedTypeIndex === index) return;
    const newTypes = [...board.taskTypes];
    const [removed] = newTypes.splice(draggedTypeIndex, 1);
    newTypes.splice(index, 0, removed);
    setDraggedTypeIndex(null);
    dispatch(updateBoard({ ...board, taskTypes: newTypes }));
    dispatch(addToast({ type: 'success', message: 'Categories reordered.' }));
  };

  // Invitation Logic
  const handleInviteUser = (targetUserId: string) => {
    if (!user) return;
    dispatch(sendBoardInvite({ boardId: board.id, fromUserId: user.id, toUserId: targetUserId }))
      .unwrap()
      .then(() => dispatch(addToast({ type: 'success', message: 'Invitation sent!' })))
      .catch((e: any) => dispatch(addToast({ type: 'error', message: e.message })));
  };

  const handleRevokeInvite = (targetUserId: string) => {
    dispatch(revokeBoardInvite({ boardId: board.id, userId: targetUserId }))
      .unwrap()
      .then(() => dispatch(addToast({ type: 'info', message: 'Invitation revoked.' })))
      .catch((e: any) => dispatch(addToast({ type: 'error', message: e.message })));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-dark relative">
      {/* Board Header */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-darkSurface flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm z-20">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
             <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{board.title}</h1>
          </div>
          <div className="flex items-center gap-4 mt-2 overflow-x-auto no-scrollbar max-w-[80vw]">
             <div className="flex -space-x-2 shrink-0">
                {board.members.map(m => {
                  const u = users.find(usr => usr.id === m.userId);
                  return u ? <Avatar key={u.id} name={u.displayName} url={u.avatarUrl} size="sm" /> : null;
                })}
             </div>
             <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 shrink-0"></div>
             
             {/* Interactive Task Types */}
             <div className="flex items-center gap-2 shrink-0">
                {board.taskTypes?.map((t, index) => (
                  <div
                    key={t.id}
                    draggable={hasPermission('can_manage_types')}
                    onDragStart={() => handleTypeDragStart(index)}
                    onDragOver={handleTypeDragOver}
                    onDrop={() => handleTypeDrop(index)}
                    className="relative group"
                  >
                    <button 
                      onClick={() => openTypeEditor(t)}
                      disabled={!hasPermission('can_manage_types')}
                      className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 transition-all ${hasPermission('can_manage_types') ? 'hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                    >
                       <span className="w-2 h-2 rounded-full ring-1 ring-black/10 dark:ring-white/10" style={{ backgroundColor: t.color }}></span>
                       <span className="text-gray-600 dark:text-gray-400">{t.label}</span>
                    </button>
                  </div>
                ))}
                
                {hasPermission('can_manage_types') && (
                  <button 
                    onClick={() => openTypeEditor(null)}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all hover:scale-110 active:scale-95"
                    title="Add Category"
                  >
                    <span className="material-icons-round text-sm font-bold">add</span>
                  </button>
                )}
             </div>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
           {hasPermission('can_manage_users') && (
             <Button variant="secondary" onClick={() => setManageModalOpen(true)} className="flex-1 sm:flex-none justify-center !py-1.5 text-sm">
               <span className="material-icons-round text-sm mr-1">settings</span> Manage
             </Button>
           )}
           <Button variant="primary" onClick={() => {
              const code = board.inviteCode || 'error';
              const link = `${window.location.origin}/join/${code}`;
              navigator.clipboard.writeText(link);
              dispatch(addToast({ type: 'info', message: 'Invite code copied to clipboard!' }));
           }} className="flex-1 sm:flex-none justify-center !py-1.5 text-sm">
             <span className="material-icons-round text-sm mr-1">link</span> Invite Link
           </Button>
        </div>
      </div>

      {/* Kanban Canvas */}
      <div className="flex-1 relative overflow-x-auto overflow-y-hidden bg-gray-100/50 dark:bg-dark">
        <div className="absolute inset-0 flex px-4 pb-4 pt-4 gap-4 md:gap-6 w-max">
          {board.columns?.map((col, index) => (
            <div 
              key={col.id}
              className={`w-[85vw] sm:w-80 h-full flex flex-col shrink-0 rounded-xl border shadow-sm overflow-hidden transition-colors ${
                  col.isEntryLocked ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-gray-100 dark:bg-darkSurface/50 border-gray-200 dark:border-gray-700/50'
              }`}
              onDragOver={e => {
                  if (!col.isEntryLocked) e.preventDefault();
              }}
              onDrop={e => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="shrink-0 p-3 flex justify-between items-start border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-100/80 dark:bg-darkSurface/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                   <h3 className="font-bold text-gray-700 dark:text-gray-200">{col.title}</h3>
                   <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-bold">
                      {board.tasks.filter(t => t.columnId === col.id).length}
                   </span>
                </div>
                
                <div className="flex gap-1">
                   {/* Lock Controls */}
                   {hasPermission('can_manage_columns') ? (
                     <div className="flex gap-1">
                         <button 
                            onClick={() => dispatch(updateColumnLocksAsync({ boardId: board.id, columnId: col.id, isEntryLocked: !col.isEntryLocked, isExitLocked: col.isExitLocked }))} 
                            className={`rounded p-1 transition-all ${col.isEntryLocked ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 font-bold' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`} 
                            title={col.isEntryLocked ? "Entry Locked" : "Lock Entry"}
                         >
                           <span className="material-icons-round text-lg">move_to_inbox</span>
                         </button>
                         <button 
                            onClick={() => dispatch(updateColumnLocksAsync({ boardId: board.id, columnId: col.id, isEntryLocked: col.isEntryLocked, isExitLocked: !col.isExitLocked }))} 
                            className={`rounded p-1 transition-all ${col.isExitLocked ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 font-bold' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`} 
                            title={col.isExitLocked ? "Exit Locked" : "Lock Exit"}
                         >
                           <span className="material-icons-round text-lg">outbox</span>
                         </button>
                         <button onClick={() => {
                            if (!board.tasks.some(t => t.columnId === col.id)) {
                               dispatch(deleteColumnAsync({ boardId: board.id, columnId: col.id }))
                                 .unwrap()
                                 .catch((e: any) => dispatch(addToast({ type: 'error', message: e.message || 'Failed to delete column' })));
                            } else {
                               dispatch(addToast({ type: 'error', message: 'Cannot delete column with tasks.' }));
                            }
                         }} className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 text-gray-400 rounded p-1 ml-1">
                           <span className="material-icons-round text-lg">delete</span>
                         </button>
                     </div>
                   ) : (
                     <div className="flex gap-1">
                        {col.isEntryLocked && <span className="material-icons-round text-lg text-red-500" title="Entry Locked">move_to_inbox</span>}
                        {col.isExitLocked && <span className="material-icons-round text-lg text-red-500" title="Exit Locked">outbox</span>}
                     </div>
                   )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar relative">
                {board.tasks.filter(t => t.columnId === col.id).map(task => {
                  const type = board.taskTypes?.find(tt => tt.id === task.typeId) || board.taskTypes?.[0];
                  const color = type?.color || '#9ca3af'; 
                  const label = type?.label || 'Task';
                  
                  return (
                    <div
                      key={task.id}
                      draggable={hasPermission('can_move_task') && !col.isExitLocked}
                      onDragStart={e => handleDragStart(e, task)}
                      onClick={() => { setEditingTask(task); setTaskModalOpen(true); }}
                      className={`group relative bg-white dark:bg-darkSurface p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all select-none
                        ${(hasPermission('can_move_task') && !col.isExitLocked) ? 'cursor-grab active:cursor-grabbing hover:shadow-md hover:translate-y-[-1px]' : 'cursor-default opacity-90'}
                      `}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg" style={{ backgroundColor: color }}></div>
                      <div className="pl-3">
                        <div className="flex items-center justify-between mb-1.5">
                           <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 bg-opacity-20" style={{ backgroundColor: `${color}20` }}>
                             {label}
                           </span>
                           {col.isExitLocked && <span className="material-icons-round text-[10px] text-red-400">lock</span>}
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug mb-2">{task.title}</h4>
                        {task.assigneeIds.length > 0 && (
                          <div className="flex justify-end -space-x-1.5">
                            {task.assigneeIds.map(uid => {
                               const u = users.find(usr => usr.id === uid);
                               return u ? <Avatar key={uid} name={u.displayName} url={u.avatarUrl} size="sm" /> : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {index === 0 && hasPermission('can_edit_task') && !col.isEntryLocked && (
                <div className="shrink-0 p-3 bg-gray-50 dark:bg-darkSurface/30 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => { setEditingTask(undefined); setActiveColumnId(col.id); setTaskModalOpen(true); }}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-dashed border-primary/30 hover:border-primary font-bold"
                  >
                    <span className="material-icons-round text-xl">add</span>
                    <span className="text-sm">Add New Task</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {hasPermission('can_manage_columns') && (
            <div className="w-[85vw] sm:w-80 h-full shrink-0 flex flex-col">
               <div className="bg-gray-200/50 dark:bg-darkSurface/20 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col gap-3">
                 <span className="font-bold text-gray-500 text-sm">Add New Section</span>
                 <Input 
                   value={newColumnTitle} 
                   onChange={e => setNewColumnTitle(e.target.value)} 
                   placeholder="Section Title (e.g., Review)" 
                   className="text-sm"
                 />
                 <Button onClick={handleAddColumn} disabled={!newColumnTitle} className="w-full justify-center">
                    Create Column
                 </Button>
               </div>
            </div>
          )}
        </div>
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={editingTask}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        users={users} 
        taskTypes={board.taskTypes || []}
        canEdit={hasPermission('can_edit_task')}
        canDelete={hasPermission('can_delete_task')}
      />

      <TypeEditorModal 
         isOpen={isTypeEditorOpen}
         onClose={() => setTypeEditorOpen(false)}
         typeToEdit={editingType}
         onSave={handleTypeSave}
         onDelete={handleTypeDelete}
         canDelete={(board.taskTypes?.length || 0) > 1}
      />

      <Modal isOpen={isManageModalOpen} onClose={() => setManageModalOpen(false)} title="Board Members">
         <div className="space-y-6">
            <div>
              <h4 className="font-bold mb-2 text-sm text-gray-500 uppercase tracking-wide">Invite User</h4>
              <Input value={inviteSearch} onChange={e => setInviteSearch(e.target.value)} placeholder="Search users by name..." />
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                 {foundUsers.map(u => {
                   const isMember = board.members.some(m => m.userId === u.id);
                   const isPending = board.pendingInvites?.includes(u.id);

                   return (
                     <div key={u.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-dark/30 rounded border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm">
                          <Avatar name={u.displayName} url={u.avatarUrl} size="sm" />
                          <div>
                            <div className="font-bold">{u.displayName}</div>
                            <div className="text-xs text-gray-500">@{u.username}</div>
                          </div>
                        </div>
                        {isMember ? (
                           <span className="text-xs font-bold text-gray-400 px-3">Member</span>
                        ) : isPending ? (
                           <span className="text-xs font-bold text-orange-500 px-3">Pending</span>
                        ) : (
                           <Button size="sm" onClick={() => handleInviteUser(u.id)}>Invite</Button>
                        )}
                     </div>
                   );
                 })}
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
               <h4 className="font-bold mb-2 text-sm text-gray-500 uppercase tracking-wide">Pending Invitations</h4>
               {(!board.pendingInvites || board.pendingInvites.length === 0) ? (
                  <p className="text-sm text-gray-400 italic">No pending invitations.</p>
               ) : (
                  <div className="space-y-2">
                    {board.pendingInvites.map(pendingId => {
                       const u = users.find(usr => usr.id === pendingId);
                       if (!u) return null;
                       return (
                          <div key={pendingId} className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg">
                             <div className="flex items-center gap-2">
                                <Avatar name={u.displayName} url={u.avatarUrl} size="sm" />
                                <span className="text-sm font-medium">{u.displayName} <span className="text-xs text-gray-400">(@{u.username})</span></span>
                             </div>
                             <Button size="sm" variant="ghost" onClick={() => handleRevokeInvite(pendingId)} className="text-red-500 hover:text-red-700 hover:bg-red-50">Revoke</Button>
                          </div>
                       );
                    })}
                  </div>
               )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <h4 className="font-bold mb-2 text-sm text-gray-500 uppercase tracking-wide">Members & Permissions</h4>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                 {board.members.map(m => {
                    const u = users.find(usr => usr.id === m.userId);
                    if (!u) return null;
                    const isOwner = m.role === 'owner';
                    return (
                      <div key={m.userId} className="bg-gray-50 dark:bg-dark/30 border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-sm">{u.displayName} <span className="text-gray-500 font-normal">{isOwner ? '(Owner)' : ''}</span></span>
                           {!isOwner && <button className="text-red-500 text-xs hover:underline" onClick={() => {
                              dispatch(updateBoard({ ...board, members: board.members.filter(mem => mem.userId !== m.userId) }));
                           }}>Remove</button>}
                        </div>
                        {!isOwner && (
                           <div className="grid grid-cols-2 gap-2">
                              {['can_edit_task', 'can_move_task', 'can_delete_task', 'can_manage_users', 'can_manage_columns', 'can_manage_types'].map(perm => (
                                 <label key={perm} className="flex items-center gap-1.5 cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <input 
                                      type="checkbox" 
                                      className="rounded text-primary focus:ring-primary"
                                      checked={m.permissions.includes(perm as any)}
                                      onChange={e => {
                                         const newPerms = e.target.checked 
                                            ? [...m.permissions, perm] 
                                            : m.permissions.filter(p => p !== perm);
                                         updateMemberPermissions(m.userId, newPerms);
                                      }}
                                    />
                                    <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{perm.replace('can_', '').replace(/_/g, ' ')}</span>
                                 </label>
                              ))}
                           </div>
                        )}
                      </div>
                    );
                 })}
              </div>
            </div>
         </div>
      </Modal>
    </div>
  );
};
