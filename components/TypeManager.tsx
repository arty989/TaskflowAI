import React, { useState, useEffect } from 'react';
import { TaskType } from '../types';
import { Button, Input, Modal } from './Common';

interface TypeEditorModalProps {
  typeToEdit: TaskType | null; // null means creating new
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: TaskType) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

export const TypeEditorModal = ({ typeToEdit, isOpen, onClose, onSave, onDelete, canDelete }: TypeEditorModalProps) => {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false); // Reset delete state when opening
      if (typeToEdit) {
        setLabel(typeToEdit.label);
        setColor(typeToEdit.color);
      } else {
        setLabel('New Category');
        setColor('#6366f1');
      }
    }
  }, [isOpen, typeToEdit]);

  const handleSave = () => {
    if (!label) return;
    const newType: TaskType = {
      id: typeToEdit ? typeToEdit.id : crypto.randomUUID(),
      label,
      color
    };
    onSave(newType);
    onClose();
  };

  const handleDeleteClick = () => {
      if (isDeleting && typeToEdit) {
          onDelete(typeToEdit.id);
          onClose();
      } else {
          setIsDeleting(true);
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={typeToEdit ? 'Edit Category' : 'New Category'}>
      <div className="space-y-6">
        <div>
           <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category Name</label>
           <Input 
             value={label} 
             onChange={e => setLabel(e.target.value)} 
             autoFocus
             placeholder="e.g. Feature, Bug, Marketing"
           />
        </div>

        <div>
           <label className="block text-sm font-medium mb-1 dark:text-gray-300">Color Identifier</label>
           <div className="flex gap-4 items-center bg-gray-50 dark:bg-darkSurface/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="relative w-12 h-12 shrink-0 transition-transform hover:scale-105">
                 <input 
                   type="color" 
                   value={color} 
                   onChange={e => setColor(e.target.value)}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                 <div className="w-full h-full rounded-full shadow-sm ring-2 ring-white dark:ring-gray-600" style={{ backgroundColor: color }}></div>
              </div>
              <div className="text-sm text-gray-500">
                Click the circle to pick a color for this category.
              </div>
           </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
           {typeToEdit && canDelete ? (
             <Button 
                variant="danger" 
                onClick={handleDeleteClick}
                onBlur={() => setIsDeleting(false)} // Cancel confirmation if clicked elsewhere
                className={isDeleting ? "bg-red-600 text-white hover:bg-red-700" : ""}
             >
                {isDeleting ? "Confirm Remove?" : "Delete"}
             </Button>
           ) : <div/>}
           
           <div className="flex gap-2">
             <Button variant="ghost" onClick={onClose}>Cancel</Button>
             <Button onClick={handleSave}>Save Category</Button>
           </div>
        </div>
      </div>
    </Modal>
  );
};