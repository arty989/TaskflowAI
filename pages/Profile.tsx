
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { updateUserProfile, logoutUser, toggleTheme } from '../store/authSlice';
import { addToast } from '../store/uiSlice';
import { Button, Input, Avatar } from '../components/Common';
import { useLanguage } from '../i18n';

interface ProfileProps {
  onClose?: () => void;
}

export const Profile = ({ onClose }: ProfileProps) => {
  const { user, theme } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    email: user?.email || '',
    telegram: user?.telegram || '',
    newPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    try {
       await dispatch(updateUserProfile({ id: user.id, data: formData })).unwrap();
       dispatch(addToast({ type: 'success', message: t.profile.changesSaved }));
    } catch (e: any) {
       dispatch(addToast({ type: 'error', message: 'Update failed: ' + e.message }));
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
           <div className="flex items-center gap-4">
             {onClose && (
                <button onClick={onClose} className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  <span className="material-icons-round">arrow_back</span>
                </button>
             )}
             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.profile.title}</h1>
           </div>

           <div className="flex items-center gap-3">
              {onClose && (
                <Button variant="secondary" onClick={onClose} className="hidden md:flex items-center">
                   <span className="material-icons-round mr-1 text-base">close</span> {t.common.close}
                </Button>
              )}
              <div className="text-xs text-gray-400 font-mono">v1.2.0</div>
           </div>
        </div>
        
        {/* User Card */}
        <div className="bg-white dark:bg-darkSurface p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/5 dark:to-secondary/5"></div>
           
           <div className="shrink-0 relative mt-4">
              <div className="p-1 bg-white dark:bg-darkSurface rounded-full">
                 <Avatar name={formData.displayName} url={user?.avatarUrl} size="lg" />
              </div>
           </div>
           
           <div className="flex-1 text-center md:text-left relative mt-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{formData.displayName}</h2>
              <p className="text-gray-500 font-medium">@{formData.username}</p>
              
              {user?.telegram && (
                 <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                    <a href={`https://t.me/${user.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-medium hover:underline flex items-center gap-1">
                       <span className="material-icons-round text-xs">send</span>
                       {user.telegram}
                    </a>
                 </div>
              )}
           </div>
           
           <div className="flex flex-col gap-3 w-full md:w-48 relative mt-4">
             <Button variant="secondary" onClick={() => dispatch(toggleTheme())} className="w-full justify-center">
                <span className="material-icons-round mr-2 text-lg">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                {t.profile.darkMode}
             </Button>
             <Button variant="danger" onClick={() => dispatch(logoutUser())} className="w-full justify-center">
               <span className="material-icons-round mr-2 text-lg">logout</span>
               {t.auth.logout}
            </Button>
           </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white dark:bg-darkSurface p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
           <h3 className="text-xl font-bold border-b border-gray-100 dark:border-gray-700 pb-4 mb-6 flex items-center gap-2">
             <span className="material-icons-round text-gray-400">manage_accounts</span>
             {t.profile.editProfile}
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-medium mb-1 dark:text-gray-400">{t.profile.displayName}</label>
                 <Input name="displayName" value={formData.displayName} onChange={handleChange} />
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1 dark:text-gray-400">{t.profile.username}</label>
                 <Input name="username" value={formData.username} onChange={handleChange} />
              </div>
              
              <div>
                 <label className="block text-sm font-medium mb-1 dark:text-gray-400">{t.profile.email}</label>
                 <Input name="email" type="email" value={formData.email} onChange={handleChange} />
              </div>
              
              <div>
                 <label className="block text-sm font-medium mb-1 dark:text-gray-400">{t.profile.newPassword}</label>
                 <Input 
                    name="newPassword" 
                    type="password"
                    value={formData.newPassword} 
                    onChange={handleChange}
                    placeholder={t.profile.newPasswordPlaceholder}
                 />
              </div>
              
              <div className="md:col-span-2">
                 <label className="block text-sm font-medium mb-1 dark:text-gray-400">{t.profile.telegram}</label>
                 <Input name="telegram" value={formData.telegram} onChange={handleChange} placeholder="@username" />
              </div>
           </div>
           
           <div className="pt-6 flex justify-between items-center border-t border-gray-100 dark:border-gray-700 mt-2">
              <span className="text-xs text-gray-400">{t.profile.changesNote}</span>
              <Button onClick={handleSave} size="lg" className="px-8 shadow-lg shadow-primary/20">{t.profile.saveChanges}</Button>
           </div>
        </div>
      </div>
    </div>
  );
};
