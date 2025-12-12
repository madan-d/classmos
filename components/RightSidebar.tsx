
import React, { useState, useRef, useEffect } from 'react';
import { Flame, Heart, Zap, ChevronDown, Shield, Users } from 'lucide-react';
import { User, Course } from '../types';
import CourseDropdown from './CourseDropdown';
import { db } from '../services/db';

interface RightSidebarProps {
  user: User | null;
  courses: Course[];
  onSelectCourse: (id: string) => void;
  onAddCourse: () => void;
  onViewLeaderboard: () => void;
  onLeaveCourse: (courseId: string) => void;
}

const StatItem = ({ icon: Icon, value, color }: { icon: React.ElementType, value: string | number, color: string }) => (
  <div className="flex items-center space-x-2 cursor-pointer hover:bg-duo-border/50 p-2 rounded-lg transition-colors">
    <Icon className={color} size={24} fill="currentColor" strokeWidth={0} />
    <span className={`font-bold ${color}`}>{value}</span>
  </div>
);

const RightSidebar: React.FC<RightSidebarProps> = ({ user, courses, onSelectCourse, onAddCourse, onViewLeaderboard, onLeaveCourse }) => {
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeCourse = courses.find(c => c.active);

  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowCourseDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

  useEffect(() => {
      const fetchRank = async () => {
          if (user && !isTeacher) {
              const leaderboard = await db.users.getLeaderboard();
              const userIndex = leaderboard.findIndex(u => u.id === user.id);
              setRank(userIndex !== -1 ? userIndex + 1 : null);
          }
      };
      fetchRank();
  }, [user, isTeacher]);

  if (!user) return null;

  // Daily Goal Constant
  const DAILY_XP_GOAL = 50;
  const dailyProgress = Math.min(100, ((user.dailyXp || 0) / DAILY_XP_GOAL) * 100);

  return (
    <div className="hidden xl:flex flex-col w-96 h-screen p-6 fixed right-0 top-0 overflow-y-auto gap-6 border-l-2 border-duo-border bg-duo-bg z-20">
      {/* Top Stats Bar & Course Selector */}
      <div className="flex items-center justify-between gap-4">
        
        {/* Course Selector (Replaces Avatar) */}
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                className="flex items-center space-x-2 cursor-pointer hover:bg-duo-border/50 p-2 rounded-xl transition-colors group"
            >
                <div className="w-10 h-8 bg-duo-border rounded-lg border-2 border-duo-border flex items-center justify-center text-xl shadow-sm relative overflow-hidden">
                    {activeCourse?.flag || '🏳️'}
                </div>
                <ChevronDown size={16} className={`text-duo-muted group-hover:text-duo-text transition-transform duration-200 ${showCourseDropdown ? 'rotate-180' : ''}`} strokeWidth={3} />
            </button>

            {showCourseDropdown && (
                <CourseDropdown 
                    courses={courses}
                    onSelectCourse={onSelectCourse}
                    onAddCourse={onAddCourse}
                    onClose={() => setShowCourseDropdown(false)}
                    onLeaveCourse={onLeaveCourse}
                    className="top-full mt-2 left-0 w-72"
                />
            )}
        </div>

        {/* Student Stats - Hidden for Teachers */}
        {!isTeacher && (
            <>
                <StatItem icon={Flame} value={user.streak || 0} color="text-orange-500" />
                <div className="flex items-center space-x-2 cursor-pointer hover:bg-duo-border/50 p-2 rounded-lg transition-colors">
                    <span className="text-blue-400 text-xl">💎</span>
                    <span className="font-bold text-blue-400">{user.gems || 0}</span>
                </div>
                <StatItem icon={Heart} value={user.hearts || 5} color="text-red-500" />
            </>
        )}
        
        {/* Teacher "Stats" Placeholder */}
        {isTeacher && (
             <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/5 border border-white/10">
                 <Users size={18} className="text-duo-muted" />
                 <span className="text-xs font-bold text-duo-muted uppercase tracking-widest">Teacher Mode</span>
             </div>
        )}
      </div>

      {/* Student: Ranking Indicator */}
      {!isTeacher && (
        <div className="rounded-2xl border-2 border-duo-border p-4 bg-duo-card/50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-duo-text">Leaderboard</h3>
                <span 
                    onClick={onViewLeaderboard}
                    className="text-duo-blue font-bold text-sm hover:text-duo-blueHover cursor-pointer uppercase tracking-widest"
                >
                    View Leaderboard
                </span>
            </div>
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center border-2 border-red-700 shadow-sm rotate-3">
                    <Shield size={28} className="text-red-900" fill="currentColor" />
                </div>
                <div>
                    <p className="font-extrabold text-duo-text">You're ranked #{rank || '-'}</p>
                    <p className="text-duo-muted text-sm font-medium leading-tight mt-1">
                        You've earned {user.xp || 0} XP this week so far
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Student: Daily Quests */}
      {!isTeacher && (
        <div className="rounded-2xl border-2 border-duo-border p-4">
            <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-duo-text">Daily Quests</h3>
            <span className="text-duo-blue font-bold text-sm hover:text-duo-blueHover cursor-pointer uppercase">View All</span>
            </div>
            <div className="flex items-center space-x-4">
                <Zap className="text-duo-yellow" size={32} fill="currentColor" />
                <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-sm font-bold">
                        <span>Earn {DAILY_XP_GOAL} XP</span>
                    </div>
                    <div className="w-full bg-duo-border rounded-full h-4">
                        <div className="bg-duo-yellow h-4 rounded-full transition-all duration-500" style={{width: `${dailyProgress}%`}}></div>
                    </div>
                </div>
                <div className="text-2xl">{dailyProgress >= 100 ? '✅' : '🎁'}</div>
            </div>
        </div>
      )}
      
      {/* Footer Links */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-duo-muted font-bold px-2 text-center justify-center">
        <a href="#" className="hover:text-duo-text">ABOUT</a>
        {/* <a href="#" className="hover:text-duo-text">BLOG</a>
        <a href="#" className="hover:text-duo-text">STORE</a>
        <a href="#" className="hover:text-duo-text">EFFICACY</a>
        <a href="#" className="hover:text-duo-text">CAREERS</a>
        <a href="#" className="hover:text-duo-text">INVESTORS</a>
        <a href="#" className="hover:text-duo-text">TERMS</a>
        <a href="#" className="hover:text-duo-text">PRIVACY</a> */}
      </div>
    </div>
  );
};

export default RightSidebar;
