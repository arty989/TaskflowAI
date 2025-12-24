
import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { fetchBoards, createBoard, deleteBoard, updateBoard, reorderBoards } from '../store/boardsSlice';
import { addToast } from '../store/uiSlice';
import { Button, Input, Modal } from '../components/Common';
import { Board } from '../types';
import { useLanguage } from '../i18n';

export const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: boards } = useSelector((state: RootState) => state.boards);
  const { t } = useLanguage();
  
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Delete State
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);

  // Edit Board State
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', coverUrl: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DnD State
  const [draggedBoardId, setDraggedBoardId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchBoards(user.id));
    }
  }, [user]);

  const handleCreate = async () => {
    if (!newTitle || !user) return;
    try {
      await dispatch(createBoard({ title: newTitle, ownerId: user.id })).unwrap();
      dispatch(addToast({ type: 'success', message: 'Board created successfully!' }));
      setCreateOpen(false);
      setNewTitle('');
    } catch (e: any) {
      dispatch(addToast({ type: 'error', message: 'Failed to create board.' }));
    }
  };

  const confirmDelete = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    setBoardToDelete(boardId);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (boardToDelete) {
      try {
        await dispatch(deleteBoard(boardToDelete)).unwrap();
        dispatch(addToast({ type: 'success', message: 'Board deleted.' }));
      } catch (e) {
        dispatch(addToast({ type: 'error', message: 'Failed to delete board.' }));
      }
      setDeleteModalOpen(false);
      setBoardToDelete(null);
    }
  };

  // Edit Handlers
  const openEditModal = (e: React.MouseEvent, board: Board) => {
    e.stopPropagation();
    setEditingBoard(board);
    setEditForm({ 
        title: board.title, 
        description: board.description || '', 
        coverUrl: board.coverUrl || '' 
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingBoard) return;
    try {
      await dispatch(updateBoard({ 
          ...editingBoard, 
          title: editForm.title, 
          description: editForm.description, 
          coverUrl: editForm.coverUrl 
      })).unwrap();
      dispatch(addToast({ type: 'success', message: 'Board updated!' }));
      setEditModalOpen(false);
      setEditingBoard(null);
    } catch (e) {
      dispatch(addToast({ type: 'error', message: 'Update failed.' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: Max size 800KB
    if (file.size > 800 * 1024) {
      dispatch(addToast({ type: 'error', message: "File size exceeds 800KB." }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(prev => ({ ...prev, coverUrl: reader.result as string }));
    };
    reader.onerror = () => {
        dispatch(addToast({ type: 'error', message: 'Failed to read file.' }));
    };
    reader.readAsDataURL(file);
  };

  // DnD Handlers
  const handleDragStart = (e: React.DragEvent, boardId: string) => {
    setDraggedBoardId(boardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetBoardId: string) => {
    e.preventDefault();
    if (!draggedBoardId || draggedBoardId === targetBoardId) return;

    const currentIndex = boards.findIndex(b => b.id === draggedBoardId);
    const targetIndex = boards.findIndex(b => b.id === targetBoardId);

    if (currentIndex === -1 || targetIndex === -1) return;

    const newBoards = [...boards];
    const [moved] = newBoards.splice(currentIndex, 1);
    newBoards.splice(targetIndex, 0, moved);

    const newOrderIds = newBoards.map(b => b.id);
    
    try {
        await dispatch(reorderBoards(newOrderIds)).unwrap();
    } catch(e) {
        dispatch(addToast({ type: 'error', message: 'Reorder failed.' }));
    }
    setDraggedBoardId(null);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.dashboard.title}</h1>
             <p className="text-gray-500 dark:text-gray-400 mt-1">{t.dashboard.createFirstBoard}</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto justify-center flex items-center">
            <span className="material-icons-round mr-2">add</span>
            {t.dashboard.newBoard}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map(board => (
            <div 
              key={board.id}
              draggable
              onDragStart={(e) => handleDragStart(e, board.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, board.id)}
              onClick={() => navigate(`/board/${board.id}`)}
              className="group bg-white dark:bg-darkSurface rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border border-gray-200 dark:border-gray-700 relative overflow-hidden h-56 flex flex-col justify-between"
            >
              {/* Cover Image Background if present */}
              {board.coverUrl ? (
                <>
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105 duration-700" 
                    style={{ backgroundImage: `url(${board.coverUrl})` }} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </>
              ) : (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-secondary opacity-70 group-hover:opacity-100 transition-opacity" />
              )}

              <div className="relative z-10 p-6 flex justify-between items-start">
                  <div className={`${board.coverUrl ? 'text-white' : ''}`}></div>
                  {board.ownerId === user?.id && (
                     <button 
                       onClick={(e) => openEditModal(e, board)}
                       className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${board.coverUrl ? 'bg-black/30 text-white hover:bg-white/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}
                       title="Edit Board Appearance"
                     >
                       <span className="material-icons-round text-sm">edit</span>
                     </button>
                   )}
              </div>

              <div className="relative z-10 p-6 pt-0">
                <h3 className={`text-xl font-bold mb-1 truncate pr-8 ${board.coverUrl ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{board.title}</h3>
                {board.description && <p className={`text-xs line-clamp-2 mb-2 ${board.coverUrl ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>{board.description}</p>}
                <p className={`text-xs ${board.coverUrl ? 'text-gray-400' : 'text-gray-400'}`}>Created by {board.ownerId === user?.id ? 'You' : 'Others'}</p>
                
                <div className="flex justify-between items-end mt-4">
                   <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${board.coverUrl ? 'text-gray-200 bg-white/10 backdrop-blur-sm' : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark'}`}>
                      <span className="material-icons-round text-base">dashboard</span>
                      <span>{board.tasks.length} tasks</span>
                   </div>
                   
                   {board.ownerId === user?.id && (
                     <button 
                       onClick={(e) => confirmDelete(e, board.id)}
                       className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${board.coverUrl ? 'text-white/70 hover:bg-red-500/20 hover:text-red-400' : 'hover:bg-red-50 hover:text-red-500 text-gray-300'}`}
                       title="Delete Board"
                     >
                       <span className="material-icons-round text-lg">delete</span>
                     </button>
                   )}
                </div>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setCreateOpen(true)}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all h-56 group"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-white group-hover:shadow-md flex items-center justify-center mb-3 transition-all">
               <span className="material-icons-round text-2xl group-hover:scale-110 transition-transform">add</span>
            </div>
            <span className="font-medium">{t.dashboard.createBoard}</span>
          </button>
        </div>
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} title={t.dashboard.newBoard}>
        <div className="space-y-4">
          <Input 
            value={newTitle} 
            onChange={e => setNewTitle(e.target.value)} 
            placeholder="e.g., Marketing Q4 Campaign"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
             <Button variant="ghost" onClick={() => setCreateOpen(false)}>{t.common.cancel}</Button>
             <Button onClick={handleCreate}>{t.dashboard.createBoard}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title={t.dashboard.deleteBoard}>
         <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
               {t.dashboard.confirmDelete} {t.dashboard.deleteWarning}
            </p>
            <div className="flex justify-end gap-2 pt-2">
               <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>{t.common.cancel}</Button>
               <Button variant="danger" onClick={handleExecuteDelete}>{t.common.delete}</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title={t.dashboard.editBoard}>
         <div className="space-y-4">
            <div>
               <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t.dashboard.boardTitle}</label>
               <Input 
                  value={editForm.title} 
                  onChange={e => setEditForm({...editForm, title: e.target.value})} 
                  placeholder="Board Title"
               />
            </div>
            <div>
               <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t.dashboard.boardDescription}</label>
               <Input 
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})} 
                  placeholder="Short description..."
               />
            </div>
            
            {/* File Upload Section */}
            <div>
               <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cover Image</label>
               
               <div className="mt-2">
                 {editForm.coverUrl ? (
                   <div className="relative rounded-xl overflow-hidden group border border-gray-200 dark:border-gray-700 h-40 w-full">
                     <img src={editForm.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>Change</Button>
                       <Button size="sm" variant="danger" onClick={() => setEditForm(prev => ({ ...prev, coverUrl: '' }))}>Remove</Button>
                     </div>
                   </div>
                 ) : (
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="h-24 w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-gray-500"
                   >
                     <span className="material-icons-round mb-1">add_photo_alternate</span>
                     <span className="text-xs font-medium">Click to upload photo</span>
                     <span className="text-[10px] text-gray-400 mt-1">Max size: 800KB</span>
                   </div>
                 )}
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleImageUpload} 
                   accept="image/*" 
                   className="hidden" 
                 />
               </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
               <Button variant="ghost" onClick={() => setEditModalOpen(false)}>{t.common.cancel}</Button>
               <Button onClick={handleSaveEdit}>{t.common.save}</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};
