
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginUser, registerUser } from '../store/authSlice';
import { addToast } from '../store/uiSlice';
import { Button, Input, PasswordInput } from '../components/Common';
import { AppDispatch } from '../store';
import { useNavigate } from 'react-router-dom';
import { useLanguage, LanguageSwitcher } from '../i18n';

// Internal Safe Navigate Helper
const useSafeNavigate = () => {
  const navigate = useNavigate();
  return (path: string) => navigate(path);
};

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useSafeNavigate();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
       dispatch(addToast({ type: 'error', message: t.auth.fillAllFields }));
       return;
    }
    setLoading(true);
    try {
      await dispatch(loginUser({ email: email.trim(), password })).unwrap();
      dispatch(addToast({ type: 'success', message: t.auth.welcomeBack }));
      navigate('/');
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message || t.auth.loginFailed }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="bg-white dark:bg-darkSurface p-8 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-300">
        <h2 className="text-3xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{t.auth.title}</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">{t.auth.tagline}</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t.auth.email}</label>
            <Input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="demo@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t.auth.password}</label>
            <PasswordInput 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••" 
            />
          </div>
          <Button type="submit" className="w-full justify-center" disabled={loading}>
             {loading ? t.auth.signingIn : t.auth.login}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-500">
          {t.auth.noAccount}
          <button type="button" onClick={() => navigate('/register')} className="ml-1 text-primary hover:underline font-bold">{t.auth.register}</button>
        </div>
      </div>
    </div>
  );
};

export const Register = () => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', username: '', displayName: '', telegram: '' });
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useSafeNavigate();
  const { t } = useLanguage();

  // Simplified password validation - just minimum length for development
  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) return t.auth.passwordMinLength;
    return "";
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validate Password
    const error = validatePassword(formData.password);
    if (error) {
        setPasswordError(error);
        dispatch(addToast({ type: 'error', message: error }));
        return;
    }
    setPasswordError('');

    // 2. Check password confirmation
    if (formData.password !== formData.confirmPassword) {
        setConfirmError(t.auth.passwordsNoMatch);
        dispatch(addToast({ type: 'error', message: t.auth.passwordsNoMatch }));
        return;
    }
    setConfirmError('');

    setLoading(true);
    try {
      await dispatch(registerUser({
         email: formData.email.trim(),
         username: formData.username.trim(),
         displayName: formData.displayName.trim(),
         telegram: formData.telegram.trim(),
         password: formData.password
      })).unwrap();
      
      dispatch(addToast({ type: 'success', message: t.auth.accountCreated }));
      navigate('/');
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: t.auth.registrationFailed + ': ' + (err.message || 'Unknown error') }));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="bg-white dark:bg-darkSurface p-8 rounded-2xl shadow-xl w-full max-w-md my-4 animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">{t.auth.createAccount}</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
             <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t.auth.fullName}</label>
             <Input 
                placeholder="John Doe" 
                value={formData.displayName} 
                onChange={e => setFormData({...formData, displayName: e.target.value})} 
                required 
             />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t.auth.username}</label>
             <Input 
                placeholder="johndoe" 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})} 
                required 
             />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t.auth.email}</label>
             <Input 
                type="email" 
                placeholder="john@example.com" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required 
             />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t.auth.password}</label>
             <PasswordInput
                placeholder="••••••••••••" 
                value={formData.password} 
                onChange={e => {
                    setFormData({...formData, password: e.target.value});
                    if (passwordError) setPasswordError('');
                }} 
                required 
                className={passwordError ? "border-red-500 focus:ring-red-500" : ""}
             />
             {passwordError && (
                 <p className="text-xs text-red-500 mt-1 font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded">{passwordError}</p>
             )}
             <p className="text-[10px] text-gray-400 mt-1">
                Min 6 characters.
             </p>
          </div>
          <div>
             <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t.auth.confirmPassword}</label>
             <PasswordInput
                placeholder="••••••••••••" 
                value={formData.confirmPassword} 
                onChange={e => {
                    setFormData({...formData, confirmPassword: e.target.value});
                    if (confirmError) setConfirmError('');
                }} 
                required 
                className={confirmError ? "border-red-500 focus:ring-red-500" : ""}
             />
             {confirmError && (
                 <p className="text-xs text-red-500 mt-1 font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded">{confirmError}</p>
             )}
          </div>
          <div>
             <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t.auth.telegram}</label>
             <Input 
                placeholder="@username" 
                value={formData.telegram} 
                onChange={e => setFormData({...formData, telegram: e.target.value})} 
             />
          </div>
          <Button type="submit" className="w-full justify-center" disabled={loading}>
            {loading ? t.auth.creatingAccount : t.auth.createAccount}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-500">
          {t.auth.haveAccount}
          <button type="button" onClick={() => navigate('/login')} className="ml-1 text-primary hover:underline font-bold">{t.auth.login}</button>
        </div>
      </div>
    </div>
  );
};
