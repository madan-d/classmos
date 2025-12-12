
import React, { useState, useRef, useEffect } from 'react';
import { Home, Shield, User as UserIcon, MoreHorizontal, LogOut } from 'lucide-react';
import { User } from '../types';

const NavItem = ({ icon: Icon, label, active = false, onClick }: { icon: React.ElementType, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-4 p-3 rounded-xl cursor-pointer transition-colors duration-200 border-2 border-transparent hover:bg-duo-border ${active ? 'bg-duo-border border-duo-blue/30 text-duo-blue' : 'text-duo-muted hover:text-duo-text'}`}
  >
    <Icon size={26} strokeWidth={2.5} className={active ? 'text-duo-blue' : ''} />
    <span className={`text-sm font-bold tracking-widest uppercase ${active ? 'text-duo-blue' : ''}`}>{label}</span>
  </button>
);

interface LeftSidebarProps {
    user: User | null;
    onLogout: () => void;
    onLearnClick: () => void;
    onProfileClick: () => void;
    onLeaderboardClick: () => void;
    currentView: string;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ user, onLogout, onLearnClick, onProfileClick, onLeaderboardClick, currentView }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="hidden lg:flex flex-col w-64 h-screen border-r-2 border-duo-border p-4 fixed left-0 top-0 bg-duo-bg z-10">
      <div className="mb-8 px-4">
        <h1 className="text-duo-green text-3xl font-extrabold tracking-tighter">classmos</h1>
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto px-2 custom-scrollbar">
        <NavItem 
            icon={Home} 
            label={isTeacher ? "Dashboard" : "Learn"} 
            active={currentView === 'learn' || currentView === 'course-analytics' || (isTeacher && currentView === 'manage-course')} 
            onClick={onLearnClick} 
        />
        
        {/* Hide Leaderboards for Teachers */}
        {!isTeacher && (
            <NavItem 
                icon={Shield} 
                label="Leaderboards" 
                active={currentView === 'leaderboard'} 
                onClick={onLeaderboardClick}
            />
        )}

        <NavItem 
            icon={UserIcon} 
            label="Profile" 
            active={currentView === 'profile'} 
            onClick={onProfileClick}
        />
        
        <div className="relative" ref={moreMenuRef}>
            <NavItem 
                icon={MoreHorizontal} 
                label="More" 
                active={showMoreMenu}
                onClick={() => setShowMoreMenu(!showMoreMenu)}
            />
            {showMoreMenu && (
                <div className="absolute left-0 top-full mt-2 w-full bg-duo-card border-2 border-duo-border rounded-2xl p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                        onClick={onLogout}
                        className="w-full p-3 pl-4 text-left font-bold text-duo-text hover:bg-duo-border/50 rounded-xl transition-colors uppercase tracking-widest text-sm flex items-center gap-3"
                    >
                        <LogOut size={20} className="text-duo-muted" />
                        Log Out
                    </button>
                </div>
            )}
        </div>
      </nav>
    </div>
  );
};

export default LeftSidebar;
