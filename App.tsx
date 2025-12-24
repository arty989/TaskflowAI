
import React, { useEffect, useState } from 'react';
import { Routes, Route, MemoryRouter, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store';
import { fetchNotifications } from './store/usersSlice';
import { addToast } from './store/uiSlice';
import { restoreSession } from './store/authSlice';
import { Login, Register } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { BoardView } from './pages/BoardView';
import { Profile } from './pages/Profile';
import { Avatar, Button } from './components/Common';
import { ToastContainer } from './components/Toast';
import { joinBoard, declineBoardInvite, fetchBoards } from './store/boardsSlice';
import { supabase } from './services/supabaseClient';
import { useLanguage, LanguageSwitcher } from './i18n';

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications } = useSelector((state: RootState) => state.users);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (user) {
      const interval = setInterval(() => dispatch(fetchNotifications(user.id)), 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close profile and notifications on route change
  useEffect(() => {
    setIsProfileOpen(false);
    setShowNotifs(false);
  }, [location.pathname]);

  const handleInviteAction = async (notif: any, accept: boolean) => {
    if (accept) {
      await dispatch(joinBoard({ boardId: notif.boardId, userId: user!.id }));
      dispatch(addToast({ type: 'success', message: t.notifications.joinedBoard }));
    } else {
      await dispatch(declineBoardInvite({ boardId: notif.boardId, userId: user!.id }));
      dispatch(addToast({ type: 'info', message: t.notifications.inviteDeclined }));
    }
    // Refresh notifications immediately to reflect removal
    dispatch(fetchNotifications(user!.id));
  };

  const handleProfileClick = () => {
    // Toggle overlay mode
    setIsProfileOpen(prev => !prev);
  };

  const handleLogoClick = () => {
    // Ensure profile is closed when navigating home
    setIsProfileOpen(false);
    navigate('/');
  };

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-dark text-gray-900 dark:text-gray-100 flex flex-col overflow-hidden">
      <header className="h-16 shrink-0 bg-white/90 dark:bg-darkSurface/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 flex justify-between items-center px-6 z-30 shadow-sm relative">
         <div className="flex items-center cursor-pointer group" onClick={handleLogoClick}>
            <svg className="w-8 h-8 mr-3 shrink-0 group-hover:scale-110 transition-transform drop-shadow-sm" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="24" height="24" rx="6" className="fill-primary" fill="url(#paint0_linear)" />
              <rect x="10" y="10" width="4" height="12" rx="1" fill="white" fillOpacity="0.4" />
              <rect x="16" y="10" width="4" height="8" rx="1" fill="white" fillOpacity="0.7" />
              <rect x="22" y="16" width="4" height="6" rx="1" fill="white" fillOpacity="0.9" />
              <defs>
                <linearGradient id="paint0_linear" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1"/>
                  <stop offset="1" stopColor="#ec4899"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">TaskFlow</span>
         </div>

         <div className="flex items-center gap-4">
           <LanguageSwitcher />
           <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className={`relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${showNotifs ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                 <span className="material-icons-round text-gray-600 dark:text-gray-300 text-xl">notifications</span>
                 {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-darkSurface"></span>}
              </button>
              
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-darkSurface rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden ring-1 ring-black ring-opacity-5">
                   <div className="p-3 border-b border-gray-100 dark:border-gray-700 font-bold text-sm bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                     <span>{t.notifications.title}</span>
                     {unreadCount > 0 && <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount} {t.notifications.new}</span>}
                   </div>
                   <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 && <div className="p-6 text-center text-sm text-gray-500">{t.notifications.noNotifications}</div>}
                      {notifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-gray-100 dark:border-gray-700 ${!n.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                           <p className="text-sm mb-2 text-gray-700 dark:text-gray-300 leading-snug">
                             <span className="font-bold text-primary">@{n.fromUsername || 'User'}</span> {t.notifications.invitedYou} <span className="font-bold">{n.boardTitle}</span>
                           </p>
                           {n.type === 'invite' && (
                             <div className="flex gap-2 mt-2">
                                <Button size="sm" className="!py-1 !px-2 text-xs flex-1" onClick={() => handleInviteAction(n, true)}>{t.notifications.accept}</Button>
                                <Button size="sm" variant="secondary" className="!py-1 !px-2 text-xs flex-1" onClick={() => handleInviteAction(n, false)}>{t.notifications.decline}</Button>
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </div>
           
           <button 
             onClick={handleProfileClick} 
             className={`flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 pl-3 pr-1 py-1 rounded-full border border-transparent transition-all group ${isProfileOpen ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600' : 'hover:border-gray-200 dark:border-gray-600'}`}
           >
              <div className="text-right hidden sm:block">
                 <div className="text-base font-bold text-gray-900 dark:text-white leading-none mb-0.5">{user?.displayName}</div>
                 <div className="text-[11px] text-gray-500 uppercase tracking-wide group-hover:text-primary transition-colors">@{user?.username}</div>
              </div>
              <Avatar name={user?.displayName || 'U'} url={user?.avatarUrl} size="md" />
           </button>
         </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col">
         {/* Underlying Main Content (Dashboard/BoardView) */}
         {/* We use invisibility instead of conditional rendering to preserve state (like scroll position, inputs) of the underlying view */}
         <div className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${isProfileOpen ? 'invisible opacity-0' : 'visible opacity-100'}`}>
            {children}
         </div>

         {/* Profile Overlay */}
         {isProfileOpen && (
            <div className="absolute inset-0 z-40 bg-gray-50 dark:bg-dark animate-in slide-in-from-right duration-200 flex flex-col">
               <Profile onClose={() => setIsProfileOpen(false)} />
            </div>
         )}
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  return <Layout>{children}</Layout>;
};

const JoinByInvite = () => {
  const { inviteCode } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { t } = useLanguage();
  
  const [boardInfo, setBoardInfo] = useState<{ id: string; title: string; ownerName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBoardInfo = async () => {
      if (!inviteCode) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('boards')
          .select('id, title, owner_id')
          .eq('invite_code', inviteCode)
          .maybeSingle();
        
        if (!data) {
          setError('Invite not found or expired');
          setLoading(false);
          return;
        }
        
        const ownerRes = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', data.owner_id)
          .maybeSingle();
        
        setBoardInfo({
          id: data.id,
          title: data.title,
          ownerName: ownerRes.data?.display_name || 'Unknown'
        });
      } catch (e: any) {
        setError(e.message || 'Failed to load invite');
      } finally {
        setLoading(false);
      }
    };
    
    loadBoardInfo();
  }, [inviteCode]);

  const handleAccept = async () => {
    if (!inviteCode || !user || !boardInfo) return;
    setJoining(true);
    
    try {
      const { data, error } = await supabase.rpc('join_board_by_invite', { invite_code: inviteCode });
      if (error) throw new Error(error.message);
      if (!data) throw new Error('Failed to join board');
      
      await dispatch(fetchBoards(user.id));
      dispatch(addToast({ type: 'success', message: t.notifications.joinedBoard }));
      navigate(`/board/${boardInfo.id}`);
    } catch (e: any) {
      dispatch(addToast({ type: 'error', message: e.message || 'Failed to join board' }));
      setJoining(false);
    }
  };

  const handleDecline = () => {
    dispatch(addToast({ type: 'info', message: t.notifications.inviteDeclined }));
    navigate('/');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500">{t.common.loading}</span>
        </div>
      </div>
    );
  }

  if (error || !boardInfo) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white dark:bg-darkSurface p-8 rounded-2xl shadow-xl max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <span className="material-icons-round text-red-500 text-3xl">error_outline</span>
          </div>
          <h2 className="text-xl font-bold mb-2 dark:text-white">{error || 'Invite not found'}</h2>
          <p className="text-gray-500 mb-6">The invite link may be expired or invalid.</p>
          <Button onClick={() => navigate('/')}>{t.board.backToDashboard}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="bg-white dark:bg-darkSurface p-8 rounded-2xl shadow-xl max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
          <span className="material-icons-round text-white text-4xl">group_add</span>
        </div>
        
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Board Invitation</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">You've been invited to join a board</p>
        
        <div className="bg-gray-50 dark:bg-dark rounded-xl p-4 mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{boardInfo.title}</h3>
          <p className="text-sm text-gray-500">by {boardInfo.ownerName}</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={handleDecline} 
            className="flex-1 justify-center"
            disabled={joining}
          >
            {t.notifications.decline}
          </Button>
          <Button 
            onClick={handleAccept} 
            className="flex-1 justify-center"
            disabled={joining}
          >
            {joining ? t.common.joining : t.notifications.accept}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await dispatch(restoreSession());
      setIsLoading(false);
    };
    init();
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <MemoryRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/board/:boardId" element={<ProtectedRoute><BoardView /></ProtectedRoute>} />
        <Route path="/join/:inviteCode" element={<ProtectedRoute><JoinByInvite /></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>
  );
};
