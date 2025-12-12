
import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { db } from '../services/db';
import { Shield, Medal, Trophy, Lock, Users } from 'lucide-react';

interface LeaderboardScreenProps {
  currentUser: User;
  courseId?: string;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ currentUser, courseId }) => {
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If teacher, don't fetch
    if (currentUser.role === 'teacher') {
        setLoading(false);
        return;
    }

    const fetchLeaderboard = async () => {
      // Pass courseId to get specific leaderboard
      const data = await db.users.getLeaderboard(courseId);
      setLeaderboard(data);
      setLoading(false);
    };
    fetchLeaderboard();
  }, [currentUser, courseId]);

  if (currentUser.role === 'teacher') {
      return (
          <div className="min-h-screen bg-duo-bg text-white pb-20 lg:ml-64 xl:mr-96 flex items-center justify-center p-6">
              <div className="text-center max-w-md bg-duo-card border-2 border-duo-border rounded-3xl p-8">
                  <div className="w-16 h-16 bg-duo-border rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock size={32} className="text-duo-muted" />
                  </div>
                  <h1 className="text-2xl font-extrabold mb-2">Restricted Access</h1>
                  <p className="text-duo-muted font-bold">Leaderboards are only available for student accounts.</p>
              </div>
          </div>
      );
  }

  if (loading) {
     return (
        <div className="min-h-screen bg-duo-bg flex items-center justify-center lg:ml-64 xl:mr-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-duo-yellow"></div>
        </div>
     );
  }

  // Helper to get display XP for a user
  const getDisplayXP = (user: User) => {
      if (courseId && user.courseXp) {
          return user.courseXp[courseId] || 0;
      }
      return user.xp || 0;
  };

  return (
    <div className="min-h-screen bg-duo-bg text-white pb-20 lg:ml-64 xl:mr-96 pt-8 px-4">
        <div className="max-w-2xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-24 h-24 bg-duo-card border-2 border-duo-border rounded-2xl mx-auto mb-4 flex items-center justify-center rotate-3 shadow-xl">
                    <Shield size={48} className="text-duo-blue drop-shadow-md" fill="currentColor" />
                </div>
                <h1 className="text-3xl font-extrabold text-white mb-2">
                    {courseId ? 'Class Leaderboard' : 'Global Leaderboard'}
                </h1>
                <p className="text-duo-muted font-bold">Ranking by XP</p>
            </div>

            {/* List */}
            <div className="bg-duo-card border-2 border-duo-border rounded-2xl overflow-hidden shadow-2xl">
                {leaderboard.length > 0 ? (
                    <>
                    {leaderboard.map((user, index) => {
                        const rank = index + 1;
                        const isCurrentUser = user.id === currentUser.id;
                        const displayXP = getDisplayXP(user);
                        
                        let rankIcon = null;
                        
                        if (rank === 1) {
                            rankIcon = <div className="w-8"><Medal size={32} className="text-yellow-400" fill="currentColor" /></div>;
                        } else if (rank === 2) {
                            rankIcon = <div className="w-8"><Medal size={32} className="text-gray-300" fill="currentColor" /></div>;
                        } else if (rank === 3) {
                            rankIcon = <div className="w-8"><Medal size={32} className="text-orange-400" fill="currentColor" /></div>;
                        } else {
                            rankIcon = <span className={`font-bold text-lg w-8 text-center ${rank <= 10 ? 'text-duo-green' : 'text-duo-muted'}`}>{rank}</span>;
                        }

                        return (
                            <div 
                                key={user.id}
                                className={`flex items-center p-4 border-b-2 border-duo-border last:border-0 hover:bg-duo-border/30 transition-colors ${isCurrentUser ? 'bg-duo-border/30 border-l-4 border-l-duo-blue' : ''}`}
                            >
                                <div className="flex items-center gap-6 flex-1">
                                    {rankIcon}
                                    
                                    <div className="relative">
                                         <div className="w-12 h-12 rounded-full border-2 border-duo-border bg-duo-bg overflow-hidden">
                                             {user.avatarUrl ? (
                                                 <img 
                                                    src={user.avatarUrl} 
                                                    alt={user.name}
                                                    className="w-full h-full object-cover"
                                                 />
                                             ) : (
                                                 <div className="w-full h-full bg-duo-blue flex items-center justify-center text-white font-extrabold uppercase text-lg">
                                                     {user.name.charAt(0)}
                                                 </div>
                                             )}
                                         </div>
                                         {rank === 1 && (
                                             <div className="absolute -top-2 -right-2 bg-duo-green rounded-full p-1 border-2 border-duo-bg" title="Online">
                                                 <div className="w-2 h-2 bg-white rounded-full"></div>
                                             </div>
                                         )}
                                    </div>
                                    
                                    <span className={`font-extrabold text-lg truncate ${isCurrentUser ? 'text-duo-blue' : 'text-white'}`}>
                                        {user.name}
                                    </span>
                                </div>
                                
                                <div className="font-bold text-duo-muted flex flex-col items-end">
                                    <span className="text-white">{displayXP} XP</span>
                                    {rank <= 3 && <span className="text-xs uppercase tracking-widest text-duo-yellow">Winner</span>}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Bottom Message */}
                    <div className="p-4 text-center border-t-2 border-duo-border bg-duo-bg/50">
                        <p className="text-duo-muted text-sm font-bold uppercase tracking-widest">Keep learning to rise up!</p>
                    </div>
                    </>
                ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-duo-border/50 rounded-full flex items-center justify-center mb-2">
                             <Users size={40} className="text-duo-muted" />
                        </div>
                        <h3 className="text-xl font-extrabold text-white">No active students yet</h3>
                        <p className="text-duo-muted font-bold">Be the first to join a class and earn XP!</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default LeaderboardScreen;
