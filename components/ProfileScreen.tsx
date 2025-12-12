
import React, { useState, useRef, useEffect } from 'react';
import { User, Course, Lesson } from '../types';
import { Flame, Zap, Award, Edit2, Target, Brain, TrendingUp, X, Upload, Loader2, Users, LogOut, AlertTriangle } from 'lucide-react';
import { db } from '../services/db';

interface ProfileScreenProps {
  user: User;
  courses: Course[];
  onBack: () => void;
  onLeaveCourse: (courseId: string) => void;
}

const StatCard = ({ icon: Icon, value, label, color, subLabel }: { icon: any, value: string | number, label: string, color: string, subLabel?: string }) => (
    <div className="bg-duo-card border-2 border-duo-border rounded-2xl p-4 flex items-center space-x-4">
        <Icon className={`${color}`} size={32} />
        <div>
            <h3 className="font-extrabold text-xl text-duo-text">{value}</h3>
            <p className="text-duo-muted text-xs font-bold uppercase tracking-widest">{label}</p>
            {subLabel && <p className="text-duo-muted text-xs mt-1">{subLabel}</p>}
        </div>
    </div>
);

const AchievementCard = ({ title, description, level, maxLevel, progress, maxProgress, icon, color }: any) => {
    const percentage = Math.min(100, (progress / maxProgress) * 100);
    
    // Map string color to tailwind class
    const colorMap: Record<string, string> = {
        gold: 'bg-yellow-500',
        green: 'bg-green-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
        red: 'bg-red-500'
    };
    const badgeColor = colorMap[color] || 'bg-duo-yellow';

    return (
        <div className="bg-duo-card border-2 border-duo-border rounded-2xl p-4 flex items-start space-x-4">
            <div className={`w-20 h-20 ${badgeColor} rounded-xl flex items-center justify-center text-4xl shadow-inner shrink-0 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10 transform rotate-45 translate-y-10"></div>
                {icon}
                <div className="absolute bottom-1 right-1 text-xs font-black text-black/40">Lvl {level}</div>
            </div>
            <div className="flex-1 space-y-2">
                <h3 className="font-extrabold text-lg text-duo-text">{title}</h3>
                <p className="text-duo-muted text-sm font-medium">{description}</p>
                
                <div className="w-full bg-duo-border rounded-full h-4 mt-2">
                    <div 
                        className={`${badgeColor} h-4 rounded-full transition-all duration-500`} 
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs font-bold text-duo-muted">
                    <span>{progress} / {maxProgress}</span>
                    <span>Level {level}/{maxLevel}</span>
                </div>
            </div>
        </div>
    );
};

// Simple SVG Line Chart for Elo
const EloGraph = ({ history }: { history: number[] }) => {
    if (!history || history.length < 2) {
        return (
            <div className="h-40 flex items-center justify-center text-duo-muted font-bold bg-duo-bg rounded-xl border-2 border-duo-border border-dashed">
                Not enough data for graph
            </div>
        );
    }

    const maxVal = Math.max(...history, 1000); // Default min max to keep scale reasonable
    const minVal = Math.min(...history, 600);
    
    // Add padding to graph
    const paddingY = (maxVal - minVal) * 0.1;
    const graphMax = Math.ceil((maxVal + paddingY) / 50) * 50;
    const graphMin = Math.floor((minVal - paddingY) / 50) * 50;
    const range = graphMax - graphMin || 100;

    // Viewbox
    const width = 300;
    const height = 150;
    const paddingLeft = 40;
    const paddingBottom = 20;
    
    // Helper to map values to coordinates
    const getX = (index: number) => paddingLeft + (index / (history.length - 1)) * (width - paddingLeft);
    const getY = (value: number) => height - paddingBottom - ((value - graphMin) / range) * (height - paddingBottom);

    const points = history.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');
    
    // Area points for gradient fill
    const areaPoints = `${getX(0)},${height - paddingBottom} ${points} ${getX(history.length - 1)},${height - paddingBottom}`;

    // Y Axis Ticks
    const ticks = 4;
    const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
        const val = graphMin + (range / ticks) * i;
        return { val: Math.round(val), y: getY(val) };
    });

    return (
        <div className="w-full relative select-none">
             <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                {/* Grid & Y Labels */}
                {yTicks.map(({val, y}) => (
                    <g key={val}>
                        <line x1={paddingLeft} y1={y} x2={width} y2={y} stroke="#37464f" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
                        <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[10px] fill-duo-muted font-bold" style={{ fontFamily: 'Nunito' }}>{val}</text>
                    </g>
                ))}
                
                {/* Axes Lines */}
                <line x1={paddingLeft} y1={0} x2={paddingLeft} y2={height - paddingBottom} stroke="#52656d" strokeWidth="2" />
                <line x1={paddingLeft} y1={height - paddingBottom} x2={width} y2={height - paddingBottom} stroke="#52656d" strokeWidth="2" />

                {/* Data Path */}
                <path d={`M${points}`} fill="none" stroke="#ffc800" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Gradient Area */}
                <path d={`M${areaPoints} Z`} fill="url(#elo-gradient-profile)" opacity="0.2" />

                <defs>
                    <linearGradient id="elo-gradient-profile" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#ffc800" />
                        <stop offset="100%" stopColor="#ffc800" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
            
            {/* X Labels */}
            <div className="flex justify-between text-xs text-duo-muted font-bold mt-2 pl-[40px]">
                <span>Lesson 1</span>
                <span>Current ({history[history.length-1]})</span>
            </div>
        </div>
    );
};

const CourseDetailModal = ({ user, course, onClose }: { user: User, course: Course, onClose: () => void }) => {
    const [loading, setLoading] = useState(true);
    const [mastery, setMastery] = useState(0);
    const [strengths, setStrengths] = useState<string[]>([]);
    const [weaknesses, setWeaknesses] = useState<string[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const lessons = await db.progress.get(user.id, course.id);
                if (lessons && lessons.length > 0) {
                    const completed = lessons.filter(l => l.status === 'completed');
                    const current = lessons.filter(l => l.status === 'current');
                    const locked = lessons.filter(l => l.status === 'locked');
                    
                    const m = Math.round((completed.length / lessons.length) * 100);
                    setMastery(m);

                    // Strengths: Use the granular concepts stored in lessons, falling back to section titles
                    const allConcepts = completed.flatMap(l => l.concepts && l.concepts.length > 0 ? l.concepts : [l.sectionTitle || l.topic]);
                    // Get unique top concepts
                    const s = Array.from(new Set(allConcepts)).slice(0, 8);
                    setStrengths(s);

                    // Focus Areas: Check if current lessons have concepts (from failed attempts) or use section titles
                    let w = current.flatMap(l => l.concepts && l.concepts.length > 0 ? l.concepts : [l.sectionTitle || l.topic]);
                    
                    // Remove duplicates
                    w = Array.from(new Set(w));

                    if (w.length < 3) {
                         // Fill with locked lesson titles if we don't have enough current focus areas
                        const lockedTitles = Array.from(new Set(locked.map(l => l.sectionTitle || l.topic)));
                        w = [...w, ...lockedTitles.slice(0, 3 - w.length)];
                    }
                    setWeaknesses(w.slice(0, 5));
                } else {
                    setMastery(0);
                    setStrengths([]);
                    setWeaknesses(["Getting Started"]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [course, user.id]);

    if (loading) {
        return (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-duo-bg border-2 border-duo-border rounded-3xl p-8 flex flex-col items-center shadow-2xl">
                    <Loader2 className="animate-spin text-duo-green mb-4" size={40} />
                    <p className="text-white font-bold animate-pulse">Analyzing progress...</p>
                </div>
             </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-duo-bg border-2 border-duo-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6 bg-duo-card border-b-2 border-duo-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">{course.flag}</span>
                        <div>
                             <h2 className="text-xl font-extrabold text-white">{course.title}</h2>
                             <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${mastery === 100 ? 'text-duo-yellow bg-duo-yellow/10' : 'text-duo-green bg-duo-green/10'}`}>
                                {mastery === 100 ? 'Course Mastered' : 'In Progress'}
                             </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-duo-border rounded-full transition-colors text-duo-muted">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Strengths */}
                    <div>
                        <h3 className="text-duo-blue font-extrabold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                             <TrendingUp size={16} /> Strengths
                        </h3>
                        {strengths.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {strengths.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-duo-blue/10 text-duo-blue border border-duo-blue/30 rounded-lg text-xs font-bold animate-in zoom-in duration-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-duo-muted text-sm italic font-medium">Complete more lessons to unlock strengths.</p>
                        )}
                    </div>

                    {/* Weaknesses / Focus */}
                    <div>
                        <h3 className="text-duo-red font-extrabold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                             <Target size={16} /> Focus Areas
                        </h3>
                        {weaknesses.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {weaknesses.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-duo-red/10 text-duo-red border border-duo-red/30 rounded-lg text-xs font-bold animate-in zoom-in duration-300 delay-75">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-duo-muted text-sm italic font-medium">No specific focus areas yet.</p>
                        )}
                    </div>
                    
                    {/* Mastery Bar */}
                    <div className="pt-4 border-t-2 border-duo-border">
                         <div className="flex justify-between items-center text-sm font-bold text-duo-muted mb-2">
                             <span>Course Mastery</span>
                             <span>{mastery}%</span>
                         </div>
                         <div className="h-5 w-full bg-duo-border rounded-full overflow-hidden relative shadow-inner">
                             <div 
                                className="h-full bg-duo-yellow transition-all duration-1000 ease-out flex items-center justify-end pr-1" 
                                style={{ width: `${Math.max(5, mastery)}%` }}
                             >
                                 <div className="h-2 w-2 bg-white/40 rounded-full animate-pulse"></div>
                             </div>
                         </div>
                         <p className="text-[10px] text-duo-muted mt-2 font-bold uppercase tracking-widest text-center">
                            Based on lesson completion & quiz results
                         </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, courses, onBack, onLeaveCourse }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [courseToLeave, setCourseToLeave] = useState<Course | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isTeacher = user.role === 'teacher';

  useEffect(() => {
      if (isTeacher) {
          const fetchCounts = async () => {
              const counts: Record<string, number> = {};
              await Promise.all(courses.map(async (course) => {
                  try {
                      const students = await db.users.getStudentsByCourse(course.id);
                      counts[course.id] = students.length;
                  } catch (e) {
                      console.error(`Failed to fetch students for course ${course.id}`, e);
                      counts[course.id] = 0;
                  }
              }));
              setStudentCounts(counts);
          };
          fetchCounts();
      }
  }, [isTeacher, courses]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) { // 2MB limit for base64
          alert("Image too large. Please select an image under 2MB.");
          return;
      }

      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64Data = reader.result as string;
          try {
              await db.users.updateStats(user.id, { avatarUrl: base64Data });
              setUploading(false);
              setIsEditingAvatar(false);
          } catch (err) {
              console.error("Failed to upload avatar", err);
              alert("Failed to save avatar.");
              setUploading(false);
          }
      };
      reader.readAsDataURL(file);
  };

  const initialAvatar = (
      <div className="w-full h-full bg-duo-blue flex items-center justify-center text-white text-6xl font-black uppercase">
          {user.name.charAt(0)}
      </div>
  );

  return (
    <div className="min-h-screen bg-duo-bg text-white pb-20 lg:ml-64 xl:mr-96">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-b from-duo-blue to-duo-bg/0 opacity-50 relative"></div>
        
        <div className="max-w-4xl mx-auto px-6 -mt-20 relative">
            
            {/* Header Info */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10">
                <div className="flex items-end gap-6">
                     <div className="relative group cursor-pointer" onClick={() => setIsEditingAvatar(true)}>
                        <div className="w-32 h-32 rounded-full border-4 border-duo-bg bg-duo-card shadow-xl overflow-hidden">
                            {user.avatarUrl ? (
                                <img 
                                    src={user.avatarUrl} 
                                    className="w-full h-full object-cover"
                                    alt="Avatar"
                                />
                            ) : initialAvatar}
                        </div>
                         <div className="absolute bottom-1 right-1 bg-duo-blue w-8 h-8 rounded-full border-4 border-duo-bg flex items-center justify-center group-hover:scale-110 transition-transform">
                             <Edit2 size={12} className="text-white" />
                         </div>
                     </div>
                     <div className="mb-2">
                         <h1 className="text-3xl font-extrabold text-white">{user.name}</h1>
                         <div className="flex items-center gap-4 text-duo-muted font-bold text-sm mt-1">
                            <span>{user.name.toLowerCase().replace(/\s/g, '')}</span>
                            <span>•</span>
                            <span className="uppercase tracking-widest">{user.role}</span>
                         </div>
                     </div>
                </div>
            </div>

            <div className={`grid grid-cols-1 ${!isTeacher ? 'lg:grid-cols-2' : ''} gap-8`}>
                
                {/* Left Column - Student Only */}
                {!isTeacher && (
                <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-extrabold mb-4">Statistics</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard icon={Flame} value={user.streak || 0} label="Day Streak" color="text-orange-500" />
                                <StatCard icon={Zap} value={user.xp || 0} label="Total XP" color="text-yellow-400" />
                                <StatCard icon={Award} value={user.topFinishes || 0} label="Top 3 Finishes" color="text-yellow-500" />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-extrabold mb-4">Progress Analysis</h2>
                            <div className="bg-duo-card border-2 border-duo-border rounded-2xl p-6 space-y-6">
                                
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-duo-muted font-bold text-xs uppercase tracking-widest">
                                            <Target size={16} /> Accuracy
                                        </div>
                                        <div className="text-2xl font-extrabold text-duo-green">{user.totalAccuracy || 0}%</div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <div className="flex items-center gap-2 justify-end text-duo-muted font-bold text-xs uppercase tracking-widest">
                                            <Brain size={16} /> Retention
                                        </div>
                                        <div className="text-2xl font-extrabold text-duo-blue">{user.retentionRate || 0}%</div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t-2 border-duo-border">
                                    <h3 className="text-duo-muted font-bold text-xs uppercase tracking-widest mb-4">Skill Rating (ELO)</h3>
                                    <EloGraph history={user.eloHistory || []} />
                                </div>

                            </div>
                        </div>
                </div>
                )}

                {/* Right Column */}
                <div className="space-y-8">
                    
                     {/* Achievements - Student Only */}
                    {!isTeacher && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-extrabold">Achievements</h2>
                                <span className="text-duo-blue font-bold text-sm uppercase cursor-pointer hover:text-duo-blueHover">View All</span>
                            </div>
                            <div className="space-y-4">
                                {user.achievements?.filter(ach => ach.title !== 'Scholar').map(ach => (
                                    <AchievementCard key={ach.id} {...ach} />
                                )) || <p className="text-duo-muted font-bold">No achievements yet.</p>}
                            </div>
                        </div>
                    )}

                     {/* Enrolled Courses Details (Everyone) */}
                    <div>
                        <h2 className="text-xl font-extrabold mb-4">My Courses</h2>
                        <div className="space-y-3">
                            {courses.map(course => (
                                <div 
                                    key={course.id} 
                                    onClick={() => !isTeacher && setSelectedCourse(course)}
                                    className={`bg-duo-card border-2 border-duo-border rounded-2xl p-4 flex items-center justify-between transition-colors group ${!isTeacher ? 'cursor-pointer hover:bg-duo-border/30' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl">{course.flag}</span>
                                        <div>
                                            <h3 className={`font-extrabold text-duo-text transition-colors ${!isTeacher ? 'group-hover:text-duo-blue' : ''}`}>{course.title}</h3>
                                            {isTeacher ? (
                                                <p className="text-duo-muted text-xs font-bold flex items-center gap-1">
                                                    <Users size={12} />
                                                    {studentCounts[course.id] !== undefined ? `${studentCounts[course.id]} Students` : 'Loading...'}
                                                </p>
                                            ) : (
                                                <p className="text-duo-muted text-xs font-bold">Click to view analysis</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full border-2 border-duo-border flex items-center justify-center text-duo-muted ${!isTeacher ? 'group-hover:border-duo-blue group-hover:text-duo-blue' : ''}`}>
                                            {isTeacher ? <Users size={16} /> : <TrendingUp size={16} />}
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setCourseToLeave(course);
                                            }}
                                            className="text-duo-muted hover:text-duo-red transition-colors p-2 rounded-lg hover:bg-duo-border/80 z-10 relative"
                                            title="Leave Course"
                                        >
                                            <LogOut size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {courses.length === 0 && (
                                <div className="p-4 border-2 border-dashed border-duo-border rounded-2xl text-center text-duo-muted font-bold">
                                    No active courses found.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>

        {selectedCourse && <CourseDetailModal user={user} course={selectedCourse} onClose={() => setSelectedCourse(null)} />}

        {/* Upload Avatar Modal */}
        {isEditingAvatar && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-duo-bg border-2 border-duo-border rounded-3xl w-full max-w-lg shadow-2xl flex flex-col">
                    <div className="p-6 border-b-2 border-duo-border flex justify-between items-center bg-duo-card rounded-t-3xl">
                        <h2 className="text-xl font-extrabold text-white">Change Profile Picture</h2>
                        <button onClick={() => setIsEditingAvatar(false)} className="p-1 hover:bg-duo-border rounded-lg text-duo-muted">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-10 flex flex-col items-center gap-8">
                         <div className="w-40 h-40 rounded-full border-4 border-duo-border overflow-hidden bg-duo-card relative group">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} className="w-full h-full object-cover opacity-50" alt="Current" />
                            ) : (
                                <div className="w-full h-full bg-duo-blue flex items-center justify-center text-white text-6xl font-black uppercase opacity-50">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Upload size={40} className="text-white" />
                            </div>
                         </div>
                         
                         <div className="w-full">
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*" 
                                className="hidden"
                                onChange={handleFileUpload} 
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full py-4 bg-duo-blue hover:bg-duo-blueHover text-white font-extrabold rounded-2xl border-b-4 border-blue-600 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest flex items-center justify-center gap-3"
                            >
                                {uploading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                                {uploading ? 'Uploading...' : 'Upload from Computer'}
                            </button>
                            <p className="text-center text-duo-muted text-xs font-bold mt-3 uppercase tracking-wider">Max size 2MB</p>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* Leave Course Confirmation Modal */}
        {courseToLeave && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
                <div className="bg-duo-bg border-2 border-duo-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6 relative overflow-hidden">
                    <div className="flex flex-col items-center text-center gap-4 relative z-10">
                        <div className="w-20 h-20 bg-duo-red/10 rounded-full flex items-center justify-center border-2 border-duo-red/20 mb-2">
                            <AlertTriangle size={40} className="text-duo-red" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-white">Leave Course?</h2>
                        <p className="text-duo-muted font-bold text-sm leading-relaxed">
                            Are you sure you want to leave <span className="text-white font-extrabold">{courseToLeave.title}</span>?
                            <br/><br/>
                            This action cannot be undone and all your progress for this course will be permanently lost.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                onLeaveCourse(courseToLeave.id);
                                setCourseToLeave(null);
                            }}
                            className="w-full py-3 bg-duo-red hover:bg-red-600 text-white font-extrabold rounded-xl border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-sm"
                        >
                            Yes, Leave Course
                        </button>
                        <button
                            onClick={() => setCourseToLeave(null)}
                            className="w-full py-3 font-extrabold text-duo-blue hover:bg-duo-border/30 rounded-xl transition-colors uppercase tracking-widest text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ProfileScreen;
