import React, { useState } from 'react';
import { Task, User, TaskType } from '../types';
import { Button, Input, Modal, Avatar } from './Common';
import { improveTaskDescription, analyzeTaskWithThinking } from '../services/geminiService';

interface TaskModalProps {
  task?: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  onDelete?: () => void;
  users: User[];
  taskTypes: TaskType[];
  canEdit: boolean;
  canDelete: boolean;
}

export const TaskModal = ({ task, isOpen, onClose, onSave, onDelete, users, taskTypes, canEdit, canDelete }: TaskModalProps) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task?.assigneeIds || []);
  const [typeId, setTypeId] = useState(task?.typeId || taskTypes[0]?.id || '');
  
  const [aiLoading, setAiLoading] = useState(false);
  const [thinkingLoading, setThinkingLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTitle(task?.title || '');
      setDescription(task?.description || '');
      setAssigneeIds(task?.assigneeIds || []);
      setTypeId(task?.typeId || taskTypes[0]?.id || '');
      setAiSuggestion(null);
    }
  }, [isOpen, task, taskTypes]);

  const handleAiImprove = async (tone: 'professional' | 'concise' | 'creative') => {
    if (!description) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const improved = await improveTaskDescription(description, tone);
      setAiSuggestion(improved);
    } catch (e) {
      alert('Failed to generate AI suggestion');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeepThink = async () => {
    if (!description && !title) return;
    setThinkingLoading(true);
    setAiSuggestion(null);
    try {
      const analysis = await analyzeTaskWithThinking(title, description);
      setAiSuggestion(analysis);
    } catch (e) {
      alert('Failed to perform deep analysis');
    } finally {
      setThinkingLoading(false);
    }
  };

  const handleSave = () => {
    if (!title || !typeId) return;
    onSave({ title, description, assigneeIds, typeId });
    onClose();
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      if (onDelete) onDelete();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'New Task'}>
        <div className="space-y-5">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} disabled={!canEdit} placeholder="What needs to be done?" className="font-semibold text-lg" />
          </div>

          {/* Description with AI */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <div className="relative group">
              <textarea
                className="w-full px-4 py-3 bg-gray-50 dark:bg-darkSurface/50 border border-gray-200 dark:border-gray-700 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-primary h-48 text-sm leading-relaxed transition-colors resize-none"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={!canEdit}
                placeholder="Add more details about this task..."
              />
              {canEdit && (
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   {/* Standard AI Improve */}
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="!py-1 !px-2 text-xs flex items-center gap-1 shadow-sm bg-white dark:bg-darkSurface"
                    onClick={() => handleAiImprove('professional')}
                    disabled={aiLoading || thinkingLoading || !description}
                  >
                    <span className="material-icons-round text-sm text-secondary">{aiLoading ? 'hourglass_empty' : 'auto_awesome'}</span>
                    Reword
                  </Button>

                  {/* Gemini 3.0 Thinking Mode */}
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="!py-1 !px-2 text-xs flex items-center gap-1 shadow-sm"
                    onClick={handleDeepThink}
                    disabled={aiLoading || thinkingLoading || (!description && !title)}
                  >
                    <span className="material-icons-round text-sm text-white">{thinkingLoading ? 'psychology' : 'psychology_alt'}</span>
                    Deep Analysis
                  </Button>
                </div>
              )}
            </div>
            
            {aiSuggestion && (
              <div className="mt-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1">
                    <span className="material-icons-round text-sm">smart_toy</span> Gemini Result
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setDescription(description + '\n\n' + aiSuggestion)} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded">Append</button>
                    <button onClick={() => setDescription(aiSuggestion)} className="text-xs font-bold text-green-600 hover:text-green-700 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">Replace</button>
                    <button onClick={() => setAiSuggestion(null)} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
                  </div>
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                  {aiSuggestion}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Task Types Selector */}
            <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-1">
                  {taskTypes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => canEdit && setTypeId(t.id)}
                      disabled={!canEdit}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left group ${
                        typeId === t.id 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full shadow-sm ring-2 ring-white dark:ring-darkSurface transition-transform ${typeId === t.id ? 'scale-125' : ''}`} style={{ backgroundColor: t.color }}></span>
                      <span className={`text-sm font-medium ${typeId === t.id ? 'text-primary' : 'text-gray-600 dark:text-gray-300'}`}>{t.label}</span>
                      {typeId === t.id && <span className="material-icons-round text-primary ml-auto text-sm">check</span>}
                    </button>
                  ))}
                </div>
            </div>

            {/* Assignees */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assignees</label>
                <div className="flex flex-wrap gap-2">
                  {users.map(u => {
                    const isSelected = assigneeIds.includes(u.id);
                    return (
                      <button 
                        key={u.id} 
                        onClick={() => canEdit && setAssigneeIds(prev => isSelected ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                        disabled={!canEdit}
                        className={`relative rounded-full transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-darkSurface' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                        title={u.displayName}
                      >
                        <Avatar name={u.displayName} url={u.avatarUrl} size="md" />
                        {isSelected && <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center border-2 border-white dark:border-darkSurface"><span className="material-icons-round text-[10px]">check</span></div>}
                      </button>
                    );
                  })}
                </div>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-700 mt-4">
            {canDelete && task ? (
               <Button variant="danger" onClick={handleDelete} className="px-4">Delete Task</Button>
            ) : <div />}
            
            <div className="flex gap-3">
               <Button variant="ghost" onClick={onClose}>Cancel</Button>
               {canEdit && <Button onClick={handleSave} className="px-6 shadow-lg shadow-primary/20">Save Task</Button>}
            </div>
          </div>
        </div>
    </Modal>
  );
};