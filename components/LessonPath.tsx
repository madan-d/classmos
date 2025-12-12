
import React, { useMemo, useEffect, useRef } from 'react';
import { Star, Book, Check, Lock, Trophy } from 'lucide-react';
import { Lesson } from '../types';

interface LessonPathProps {
  lessons: Lesson[];
  onLessonClick: (lesson: Lesson) => void;
  onSectionChange: (unitId: number, sectionTitle: string, sectionDescription: string) => void;
  hasNextUnit: boolean;
  isUnitComplete: boolean;
  onNextUnit: () => void;
  userAvatarUrl?: string;
  userName?: string;
}

interface LessonNodeProps {
  lesson: Lesson;
  onClick: () => void;
  userAvatarUrl?: string;
  userName?: string;
}

const CircularProgress = ({ progress, size = 80, strokeWidth = 8, children, color = "#1cb0f6" }: { progress: number; size?: number; strokeWidth?: number; children?: React.ReactNode, color?: string }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress * circumference);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* Background Circle */}
            <svg className="absolute top-0 left-0 transform -rotate-90" width={size} height={size}>
                <circle
                    stroke="#37464f"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress Circle */}
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className="transition-all duration-500 ease-out"
                />
            </svg>
            <div className="z-10 relative">
                {children}
            </div>
        </div>
    );
};

const DifficultyBadge = ({ difficulty }: { difficulty: 'Easy' | 'Medium' | 'Hard' }) => {
    let bgColor = 'bg-duo-green';
    let text = 'E';
    
    if (difficulty === 'Medium') {
        bgColor = 'bg-orange-500';
        text = 'M';
    } else if (difficulty === 'Hard') {
        bgColor = 'bg-red-500';
        text = 'H';
    }

    return (
        <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-duo-bg ${bgColor} flex items-center justify-center shadow-md z-20`}>
            <span className="text-white font-extrabold text-xs">{text}</span>
        </div>
    );
};

const LessonNode: React.FC<LessonNodeProps> = ({ lesson, onClick, userAvatarUrl, userName }) => {
  const isCompleted = lesson.status === 'completed';
  const isCurrent = lesson.status === 'current';
  const isLocked = lesson.status === 'locked';

  // Calculate Progress (0 to 1)
  const progressRatio = lesson.totalLevels > 0 ? lesson.levelsCompleted / lesson.totalLevels : 0;
  
  // Progress Color based on difficulty (optional enhancement)
  let progressColor = '#1cb0f6'; // Default Blue
  if (lesson.difficulty === 'Medium') progressColor = '#f97316'; // Orange
  if (lesson.difficulty === 'Hard') progressColor = '#ef4444'; // Red
  if (isCompleted) progressColor = '#ffc800'; // Gold

  // Base positioning classes
  let positionClass = 'mx-auto'; // center
  if (lesson.position === 'left') positionClass = 'mr-auto ml-16 md:ml-32';
  if (lesson.position === 'right') positionClass = 'ml-auto mr-16 md:mr-32';
  
  return (
    <div className={`relative w-full flex justify-center py-4 ${positionClass}`}>
       <div className="relative group">
          {/* Tooltip */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white text-duo-card px-3 py-2 rounded-xl font-bold text-sm shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none w-max max-w-[200px] text-center whitespace-normal leading-tight">
            <div className="text-duo-blue uppercase tracking-widest text-xs mb-1">{lesson.difficulty}</div>
            {lesson.topic}
            <div className="text-duo-muted text-xs mt-1">
                Level {lesson.levelsCompleted}/{lesson.totalLevels}
            </div>
            <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
          </div>

          <div onClick={() => !isLocked && onClick()} className={`transition-transform active:scale-95 ${!isLocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
            {isCurrent && lesson.type !== 'chest' ? (
                 <CircularProgress progress={progressRatio} size={84} strokeWidth={8} color={progressColor}>
                     <div className={`w-16 h-16 rounded-full flex items-center justify-center border-b-4 bg-duo-green border-[#46a302] relative`}>
                        {lesson.type === 'book' ? <Book size={32} className="text-white fill-current" /> : 
                         lesson.type === 'trophy' ? <Trophy size={32} className="text-white fill-current" /> :
                         <Star size={32} className="text-white fill-current" />}
                     </div>
                 </CircularProgress>
            ) : (
                // Standard Button (Completed or Locked)
                <div className={`
                    w-20 h-20 rounded-full flex items-center justify-center border-b-8 transition-all active:border-b-0 active:translate-y-2 relative
                    ${isCompleted ? 'bg-duo-gold border-[#bfa300]' : ''}
                    ${isLocked ? 'bg-duo-border border-[#37464f]' : ''}
                    ${isCurrent && lesson.type === 'chest' ? 'bg-duo-gold border-[#bfa300]' : ''} 
                `}>
                    {isCompleted && lesson.type !== 'chest' && <Check size={40} className="text-[#8f7a00]" strokeWidth={4} />}
                    {isCompleted && lesson.type === 'chest' && <span className="text-3xl">🔓</span>}
                    
                    {isLocked && lesson.type === 'chest' && <span className="text-3xl grayscale opacity-50">🎁</span>}
                    {isLocked && lesson.type !== 'chest' && <Lock size={32} className="text-[#52656d]" />}

                    {/* Chest that is current */}
                    {isCurrent && lesson.type === 'chest' && <span className="text-3xl animate-bounce">🎁</span>}
                    
                    {/* Icon for non-completed locked/current items */}
                    {(!isCompleted && !isLocked && lesson.type !== 'chest') && (
                         lesson.type === 'book' ? <Book size={32} className="text-white" /> : 
                         lesson.type === 'trophy' ? <Trophy size={32} className="text-white" /> :
                         <Star size={32} className="text-white" />
                    )}
                </div>
            )}
            
            {/* Visual Difficulty Badge for ALL non-locked lessons */}
            {!isLocked && lesson.type !== 'chest' && (
                <DifficultyBadge difficulty={lesson.difficulty} />
            )}

          </div>
          
          {/* "Current" Character Decorator */}
          {isCurrent && (
             <div className="absolute -left-20 top-0 hidden md:block animate-bounce duration-[2000ms]">
                <div className="w-20 h-20 rounded-full border-4 border-duo-border shadow-lg bg-duo-card overflow-hidden flex items-center justify-center">
                    {userAvatarUrl ? (
                         <img 
                            src={userAvatarUrl} 
                            alt="Mascot" 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="w-full h-full bg-duo-blue flex items-center justify-center text-white font-extrabold uppercase text-3xl">
                            {(userName || 'U').charAt(0)}
                        </div>
                    )}
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

interface LessonGroup {
    key: string;
    unitId: number;
    sectionTitle: string;
    sectionDescription: string;
    lessons: Lesson[];
}

const LessonPath: React.FC<LessonPathProps> = ({ lessons, onLessonClick, onSectionChange, hasNextUnit, isUnitComplete, onNextUnit, userAvatarUrl, userName }) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Group lessons by Unit+Section
  const groupedLessons = useMemo(() => {
    const groups: LessonGroup[] = [];
    let currentGroup: LessonGroup | null = null;

    lessons.forEach(lesson => {
        // Handle undefined sectionTitle (fallback)
        const secTitle = lesson.sectionTitle || 'General';
        
        if (!currentGroup || currentGroup.unitId !== lesson.unitId || currentGroup.sectionTitle !== secTitle) {
            currentGroup = {
                key: `${lesson.unitId}-${secTitle}`,
                unitId: lesson.unitId,
                sectionTitle: secTitle,
                sectionDescription: lesson.sectionDescription || '',
                lessons: []
            };
            groups.push(currentGroup);
        }
        currentGroup.lessons.push(lesson);
    });
    return groups;
  }, [lessons]);

  // Set up Intersection Observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    // Track all currently intersecting sections
    const intersectingMap = new Map<string, IntersectionObserverEntry>();

    observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const key = entry.target.getAttribute('data-section-title') || '';
            if (entry.isIntersecting) {
                intersectingMap.set(key, entry);
            } else {
                intersectingMap.delete(key);
            }
        });

        // Find the "best" active section (closest to top)
        let bestEntry: IntersectionObserverEntry | null = null;
        let minTop = Infinity;

        intersectingMap.forEach((entry) => {
             const top = entry.boundingClientRect.top;
             // Prioritize elements closer to the top of viewport (active area)
             if (top < minTop) {
                 minTop = top;
                 bestEntry = entry;
             }
        });

        if (bestEntry) {
            const entry = bestEntry as IntersectionObserverEntry;
            const unitId = parseInt(entry.target.getAttribute('data-unit-id') || '1');
            const sectionTitle = entry.target.getAttribute('data-section-title') || '';
            const sectionDescription = entry.target.getAttribute('data-section-description') || '';
            onSectionChange(unitId, sectionTitle, sectionDescription);
        }

    }, {
        root: null,
        // Active area: Start 120px from top (below header), end 20% from bottom. 
        // This ensures the top-most visible element is usually the "active" one.
        rootMargin: '-120px 0px -20% 0px',
        threshold: [0, 0.1] 
    });

    sectionRefs.current.forEach((el) => {
        if (el) observerRef.current?.observe(el);
    });

    return () => {
        observerRef.current?.disconnect();
    };
  }, [groupedLessons, onSectionChange]);

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto pb-20 space-y-8 relative">
      {groupedLessons.map((group, index) => (
        <div 
            key={group.key}
            ref={(el) => {
                if (el) sectionRefs.current.set(group.key, el);
                else sectionRefs.current.delete(group.key);
            }}
            data-unit-id={group.unitId}
            data-section-title={group.sectionTitle}
            data-section-description={group.sectionDescription}
            className="flex flex-col space-y-4 pt-4"
        >
            {/* Visual Separation between sections */}
            <div className="w-full flex items-center justify-center py-8 relative px-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t-2 border-duo-border opacity-30"></div>
                </div>
                <div className="relative bg-duo-bg px-4">
                     <span className="inline-block border-2 border-dashed border-duo-muted/50 rounded-xl px-6 py-2 text-duo-muted font-bold text-sm tracking-widest uppercase">
                        {group.sectionTitle}
                     </span>
                </div>
            </div>
            
            {group.lessons.map((lesson) => (
                <LessonNode 
                    key={lesson.id} 
                    lesson={lesson} 
                    onClick={() => onLessonClick(lesson)} 
                    userAvatarUrl={userAvatarUrl}
                    userName={userName}
                />
            ))}
        </div>
      ))}
      
      {/* Footer / Navigation */}
      <div className="flex justify-center mt-12 pb-10">
        {hasNextUnit ? (
             <div className="flex flex-col items-center gap-4 w-full px-8">
                 <button
                    onClick={onNextUnit}
                    disabled={!isUnitComplete}
                    className={`w-full py-4 rounded-2xl border-b-4 font-extrabold text-lg uppercase tracking-widest transition-all ${
                        isUnitComplete 
                        ? 'bg-duo-green hover:bg-duo-greenHover text-white border-green-700 active:border-b-0 active:translate-y-1'
                        : 'bg-duo-border text-duo-muted border-gray-600 cursor-not-allowed opacity-50'
                    }`}
                 >
                    {isUnitComplete ? 'Continue to Next Unit' : 'Complete Unit to Continue'}
                 </button>
                 {!isUnitComplete && (
                     <div className="text-duo-muted text-sm font-bold flex items-center gap-2">
                        <Lock size={16} /> Finish all lessons to unlock the next unit
                     </div>
                 )}
             </div>
        ) : (
            <div className="flex flex-col items-center gap-4 text-center">
                 <div className="w-24 h-24 bg-duo-yellow rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-yellow-600">
                    🏆
                 </div>
                 <h3 className="text-2xl font-extrabold text-duo-yellow">Course Complete!</h3>
                 <p className="text-duo-muted font-bold">You've mastered all available units.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LessonPath;
