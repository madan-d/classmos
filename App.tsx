
import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import LessonPath from './components/LessonPath';
import ExerciseModal from './components/ExerciseModal';
import AuthScreen from './components/AuthScreen';
import CourseDropdown from './components/CourseDropdown';
import AddCourseScreen from './components/AddCourseScreen';
import JoinClassroomScreen from './components/JoinClassroomScreen';
import UnitsOverviewScreen from './components/UnitsOverviewScreen';
import GuidebookModal from './components/GuidebookModal';
import ProfileScreen from './components/ProfileScreen'; 
import LeaderboardScreen from './components/LeaderboardScreen'; 
import UpgradeToTeacherScreen from './components/UpgradeToTeacherScreen';
import TeacherCourseEditor from './components/TeacherCourseEditor';
import CourseAnalyticsScreen from './components/CourseAnalyticsScreen';
import { Lesson, User, Course, CourseStructure } from './types';
import { BookText, ChevronDown, ArrowLeft, Check, AlertTriangle, Copy, RefreshCw, Terminal, CheckCircle, PlusCircle, School } from 'lucide-react';
import { db, INITIAL_LESSONS, INITIAL_COURSE_STRUCTURE } from './services/db';

const MOCK_COURSES: Course[] = [];

const REFILL_INTERVAL = 5 * 60 * 1000; // 5 minutes in ms
const MAX_HEARTS = 5;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeLessonDifficulty, setActiveLessonDifficulty] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  
  // View State
  const [currentView, setCurrentView] = useState<'learn' | 'add-course' | 'units-overview' | 'profile' | 'leaderboard' | 'manage-course' | 'course-analytics'>('learn');
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [managedCourseId, setManagedCourseId] = useState<string | null>(null);
  
  // Join State
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Current Course Data
  const [courseStructure, setCourseStructure] = useState<CourseStructure | null>(null);
  const [activeUnitId, setActiveUnitId] = useState<number>(1);

  // Guidebook State
  const [showGuidebook, setShowGuidebook] = useState(false);
  const [guidebookContent, setGuidebookContent] = useState<{title: string, description: string}>({ title: '', description: '' });

  // Section Dropdown State
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);

  // Header State (driven by scroll)
  const [headerInfo, setHeaderInfo] = useState({ topText: 'Unit 1', mainText: 'Loading...' });

  // Helper to safely navigate home based on role
  const navigateHome = useCallback(() => {
      if (user?.role === 'teacher') {
          setCurrentView('course-analytics');
      } else {
          setCurrentView('learn');
      }
      window.scrollTo(0, 0);
  }, [user]);

  // Enforce Role-Based View Restrictions
  useEffect(() => {
      if (loading || !user) return;

      if (user.role === 'teacher') {
          if (currentView === 'learn') {
              setCurrentView('course-analytics');
          }
      } else { // Student
          // Prevent students from accessing teacher-only views
          if (currentView === 'manage-course' || currentView === 'course-analytics') {
              setCurrentView('learn');
          }
      }
  }, [user, currentView, loading]);

  // Helper to generate linear lesson path from nested structure
  const generateLessonsFromStructure = useCallback((structure: CourseStructure, startId = 1, pathIndexOffset = 0): Lesson[] => {
      const newLessons: Lesson[] = [];
      let idCounter = startId;
      let pathIndex = pathIndexOffset;

      structure.units.forEach((unit, uIdx) => {
          // Calculate logical unit ID based on existing structure or just index
          const currentUnitId = uIdx + 1;

          unit.sections.forEach((section) => {
              // Changed from ["Core Concepts", "Practice", "Mastery"] to Parts to split content
              const steps = ["Part 1", "Part 2", "Part 3"];
              
              steps.forEach((stepName, stepIndex) => {
                  const isFirst = idCounter === startId;
                  
                  newLessons.push({
                      id: idCounter,
                      unitId: currentUnitId,
                      sectionTitle: section.title,
                      sectionDescription: section.description,
                      status: isFirst ? 'current' : 'locked',
                      type: stepIndex === 2 ? 'trophy' : 'star',
                      position: pathIndex % 2 === 0 ? 'center' : (pathIndex % 4 === 1 ? 'left' : 'right'),
                      topic: stepName, 
                      levelsCompleted: 0,
                      totalLevels: 3,
                      difficulty: 'Easy'
                  });

                  idCounter++;
                  pathIndex++;
              });
          });
          
          newLessons.push({
              id: idCounter++,
              unitId: currentUnitId,
              sectionTitle: "Unit Completion",
              sectionDescription: `Final Review for ${unit.title}`,
              status: 'locked',
              type: 'chest',
              position: 'center',
              topic: `Unit Complete: ${unit.title}`,
              levelsCompleted: 0,
              totalLevels: 1,
              difficulty: 'Easy'
          });
          pathIndex++;
      });
      
      return newLessons;
  }, []);

  // Firebase Auth Check
  useEffect(() => {
    let userUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous user listener if it exists
      if (userUnsubscribe) {
        userUnsubscribe();
        userUnsubscribe = null;
      }

      setDbError(false);
      
      if (firebaseUser) {
        try {
            // User is signed in, sync with local DB
            let appUser = await db.users.findById(firebaseUser.uid);
            
            if (!appUser) {
              // If no local record exists (first login, e.g. via Google), create one
              appUser = await db.users.create({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Learner',
                email: firebaseUser.email || '',
                role: 'student' // Default for social login
              });
            }
            
            // Subscribe for role updates
            userUnsubscribe = db.users.subscribe(appUser.id, (updatedUser) => {
                 if(updatedUser) setUser(updatedUser);
            });
            
            setUser(appUser);
            await loadUserCourses(appUser.id);
            
            // Redirect teachers immediately on login
            if (appUser.role === 'teacher') {
                setCurrentView('course-analytics');
            } else {
                // Ensure students don't land on teacher pages if persisted state exists
                setCurrentView((prev) => (prev === 'manage-course' || prev === 'course-analytics') ? 'learn' : prev);
            }

        } catch (error: any) {
            console.error("Initialization Error:", error);
            if (error.code === 'permission-denied') {
                setDbError(true);
            }
        }
      } else {
        // User is signed out
        setUser(null);
        setLessons([]);
      }
      setLoading(false);
    });

    return () => {
        unsubscribe();
        if (userUnsubscribe) {
            userUnsubscribe();
        }
    };
  }, []);

  // Heart Regeneration Logic (Student Only)
  useEffect(() => {
      if (!user || user.role !== 'student') return;

      const checkHearts = async () => {
          // Safely access properties that exist for students
          const currentHearts = user.hearts ?? 5;
          const lastRefill = user.lastHeartRefill ?? Date.now();
          
          if (currentHearts < MAX_HEARTS) {
              const now = Date.now();
              const elapsed = now - lastRefill;
              
              if (elapsed >= REFILL_INTERVAL) {
                  const heartsRecovered = Math.floor(elapsed / REFILL_INTERVAL);
                  const newHearts = Math.min(MAX_HEARTS, currentHearts + heartsRecovered);
                  
                  // Only update if hearts actually changed
                  if (newHearts > currentHearts) {
                      const timeLeft = elapsed % REFILL_INTERVAL;
                      const newLastRefill = now - timeLeft; // Reset timer for remainder
                      
                      try {
                          const updatedUser = await db.users.updateStats(user.id, {
                              hearts: newHearts,
                              lastHeartRefill: newLastRefill
                          });
                          setUser(updatedUser);
                      } catch (e: any) {
                          if (e.code === 'permission-denied') setDbError(true);
                      }
                  }
              }
          }
      };

      const interval = setInterval(checkHearts, 10000); // Check every 10s
      checkHearts(); // Check on mount
      
      return () => clearInterval(interval);
  }, [user]);

  const loadProgress = async (userId: string, courseId: string) => {
      try {
          // Fetch progress specific to this course
          const data = await db.progress.get(userId, courseId);
          
          if (data && data.length > 0) {
              setLessons(data);
              // Determine Active Unit based on progress
              const firstActiveLesson = data.find(l => l.status === 'current');
              if (firstActiveLesson) {
                  setActiveUnitId(firstActiveLesson.unitId);
              } else {
                   const lastUnitId = data.length > 0 ? data[data.length-1].unitId : 1;
                   setActiveUnitId(lastUnitId);
              }
              return true; // Progress found
          }
          return false; // No progress found
      } catch (e: any) {
          if (e.code === 'permission-denied') setDbError(true);
          return false;
      }
  };

  const loadUserCourses = async (userId: string) => {
      try {
          const enrolled = await db.users.getEnrolledCourses(userId);
          
          if (enrolled.length > 0) {
              setCourses(enrolled);
              
              // Load active structure
              const active = enrolled.find(c => c.active);
              if (active) {
                  const struct = await db.courses.getStructure(active.id);
                  const finalStruct = struct || INITIAL_COURSE_STRUCTURE;
                  setCourseStructure(finalStruct);
                  
                  // Load lessons for this specific course
                  const foundProgress = await loadProgress(userId, active.id);
                  
                  if (!foundProgress) {
                      // If no progress is found, generate fresh lessons
                      const generated = generateLessonsFromStructure(finalStruct);
                      setLessons(generated);
                      // Don't save yet, let user start first or save on first interaction? 
                      // Actually better to save immediately so state is consistent.
                      // But maybe only if structure is valid.
                      if (generated.length > 0) {
                          await db.progress.save(userId, generated, active.id);
                      }
                  }
              }
          } else {
             // No enrolled courses, ensure state is empty
             setCourses([]);
             setLessons([]);
             setCourseStructure(null);
          }
      } catch (e) {
          console.error("Failed to load user courses", e);
      }
  };

  const handleLogout = async () => {
      try {
        await signOut(auth);
        setUser(null);
        setLessons([]);
        setCurrentView('learn'); // Reset view on logout
      } catch (error) {
        console.error("Error signing out: ", error);
      }
  };

  const handleLeaveCourse = async (courseId: string) => {
      if (!user) return;
      // NOTE: Removed native window.confirm to rely on custom UI in components (ProfileScreen, etc)
      
      let previousCourses: Course[] = [];
      
      // Use Functional Update to ensure we are modifying latest state
      setCourses(currentCourses => {
          previousCourses = currentCourses; // Snapshot
          const remainingCourses = currentCourses.filter(c => c.id !== courseId);
          
          // If we are leaving the active course
          const wasActive = currentCourses.find(c => c.id === courseId)?.active;
          
          if (remainingCourses.length > 0 && wasActive) {
              remainingCourses[0] = { ...remainingCourses[0], active: true };
              
              // Trigger reload for new active course
              const newActiveId = remainingCourses[0].id;
              db.courses.getStructure(newActiveId).then(async (struct) => {
                  const safeStruct = struct || INITIAL_COURSE_STRUCTURE;
                  setCourseStructure(safeStruct);
                  
                  const progress = await db.progress.get(user.id, newActiveId);
                  if (progress && progress.length > 0) {
                      setLessons(progress);
                      const firstActive = progress.find(l => l.status === 'current');
                      setActiveUnitId(firstActive ? firstActive.unitId : 1);
                  } else {
                      const generated = generateLessonsFromStructure(safeStruct);
                      setLessons(generated);
                      setActiveUnitId(1);
                      if (generated.length > 0) {
                          await db.progress.save(user.id, generated, newActiveId);
                      }
                  }
              });
          } else if (remainingCourses.length === 0) {
              setLessons([]);
              setCourseStructure(null);
          }
          
          return remainingCourses;
      });

      try {
          // Perform DB Operation
          await db.users.leaveCourse(user.id, courseId);
      } catch (e) {
          console.error("Failed to leave course", e);
          alert("Failed to leave course. Changes reverted.");
          // Rollback UI
          setCourses(previousCourses);
          // Re-fetch data if needed to ensure consistency
          loadUserCourses(user.id);
      }
  };

  const handleLessonClick = (lesson: Lesson) => {
    // Only students check hearts
    if (user && user.role === 'student') {
        const hearts = user.hearts ?? 0;
        if (hearts <= 0 && lesson.status !== 'completed') {
            alert("You have no hearts left! Wait for them to recharge or practice completed lessons.");
            return;
        }
    }

    let difficulty = lesson.difficulty;
    if (lesson.status === 'completed') {
        difficulty = 'Hard'; // Practice mode
    }
    
    setActiveLessonDifficulty(difficulty);
    setActiveLesson(lesson);
  };

  const handleLoseHeart = async () => {
      if (!user || user.role !== 'student') return;
      
      const currentHearts = user.hearts ?? 5;
      const newHearts = Math.max(0, currentHearts - 1);
      
      // If we dropped below max, and we weren't already tracking time, set timestamp
      const updateData: Partial<User> = { hearts: newHearts };
      if (currentHearts === MAX_HEARTS) {
          updateData.lastHeartRefill = Date.now();
      }

      try {
          const updatedUser = await db.users.updateStats(user.id, updateData);
          setUser(updatedUser);
      } catch (e: any) {
          if (e.code === 'permission-denied') setDbError(true);
      }
  };

  const handleLessonComplete = async (xpEarned: number, heartsRecovered: boolean, score: number, totalQuestions: number, coveredConcepts: string[]) => {
    if (activeLesson && user) {
        let isFinished = false;
        
        // PASS/FAIL CHECK
        const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
        const isPassed = percentage >= 70;
        
        // If failed and NOT practice mode, minimal XP and no progress
        const isPractice = activeLesson.status === 'completed';
        const effectiveXp = (isPassed || isPractice) ? xpEarned : Math.floor(xpEarned / 4); // Reduced XP for failure

        // --- METRICS CALCULATION (STUDENT ONLY) ---
        let studentUpdates: Partial<User> = {};
        
        if (user.role === 'student') {
             // 1. Accuracy
             const sessionAccuracy = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
             const currentAccuracy = user.totalAccuracy || 100;
             const newTotalAccuracy = Math.round((currentAccuracy * 0.9) + (sessionAccuracy * 0.1));

             // 2. Retention (Adjust based on pass/fail)
             let retentionChange = 0;
             if (sessionAccuracy >= 90) retentionChange = 2;
             else if (sessionAccuracy >= 70) retentionChange = 1;
             else if (sessionAccuracy < 50) retentionChange = -2;

             let newRetentionRate = (user.retentionRate || 100) + retentionChange;
             newRetentionRate = Math.min(365, Math.max(0, newRetentionRate));
             
             // 3. Elo Rating
             let lessonDifficultyRating = 800;
             if (activeLesson.difficulty === 'Medium') lessonDifficultyRating = 1200;
             if (activeLesson.difficulty === 'Hard') lessonDifficultyRating = 1600;

             const kFactor = 32;
             const actualScore = totalQuestions > 0 ? score / totalQuestions : 0;
             const currentElo = user.elo || 800;
             const expectedScore = 1 / (1 + Math.pow(10, (lessonDifficultyRating - currentElo) / 400));
             
             const eloChange = Math.round(kFactor * (actualScore - expectedScore));
             const newElo = Math.max(0, currentElo + eloChange);
             const newEloHistory = [...(user.eloHistory || [800]), newElo];

             // 4. Daily XP and Streak Logic (Only update streaks on Pass)
             const today = new Date();
             const lastActive = new Date(user.lastActiveDate || 0);

             today.setHours(0,0,0,0);
             lastActive.setHours(0,0,0,0);

             const diffTime = Math.abs(today.getTime() - lastActive.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

             let newStreak = user.streak || 1;
             let dailyXp = user.dailyXp || 0;

             if (isPassed || isPractice) {
                 if (diffDays === 0) {
                     dailyXp += effectiveXp;
                 } else if (diffDays === 1) {
                     newStreak += 1;
                     dailyXp = effectiveXp;
                 } else {
                     if (user.lastActiveDate) { 
                          newStreak = 1;
                     }
                     dailyXp = effectiveXp;
                 }
             } else {
                 // Failed: Just add XP, don't touch streak logic unless it's just to add XP
                 dailyXp += effectiveXp;
             }
             
             // 5. Achievements Updates
             const newTotalXp = (user.xp || 0) + effectiveXp;
             const updatedAchievements = (user.achievements || []).map(ach => {
                let newAch = { ...ach };
                
                if (ach.title === 'Sage') {
                    newAch.progress = newTotalXp;
                    // Level Up Logic
                    while (newAch.progress >= newAch.maxProgress && newAch.level < newAch.maxLevel) {
                         newAch.level += 1;
                         newAch.maxProgress *= 2; 
                         newAch.description = `Earn ${newAch.maxProgress} XP`;
                    }
                } 
                else if (ach.title === 'Wildfire') {
                    newAch.progress = newStreak;
                    if (newAch.progress >= newAch.maxProgress && newAch.level < newAch.maxLevel) {
                        newAch.level += 1;
                        newAch.maxProgress += 7; // Add a week
                        newAch.description = `Reach a ${newAch.maxProgress} day streak`;
                    }
                }
                
                return newAch;
             });

             // Hearts and Gems
             let newHearts = user.hearts ?? 5;
             if (heartsRecovered && newHearts < MAX_HEARTS) {
                 newHearts += 1;
             }
             
             // Prepare Course-Specific XP Update
             const activeCourse = courses.find(c => c.active);
             const currentCourseId = activeCourse?.id;
             let newCourseXpMap = { ...(user.courseXp || {}) };
             if (currentCourseId) {
                 newCourseXpMap[currentCourseId] = (newCourseXpMap[currentCourseId] || 0) + effectiveXp;
             }

             studentUpdates = {
                 xp: newTotalXp,
                 gems: (user.gems || 0) + 5,
                 hearts: newHearts,
                 totalAccuracy: newTotalAccuracy,
                 retentionRate: newRetentionRate,
                 elo: newElo,
                 eloHistory: newEloHistory,
                 courseXp: newCourseXpMap,
                 streak: newStreak,
                 dailyXp: dailyXp,
                 lastActiveDate: Date.now(),
                 achievements: updatedAchievements
             };
        }

        // Update Progress
        // Update lesson status AND covered concepts
        const newLessons = lessons.map(l => {
            if (l.id === activeLesson.id) {
                // Save concepts regardless of pass/fail so we know what topics were attempted
                const updatedLesson = { ...l, concepts: coveredConcepts };

                if (l.status === 'completed') return updatedLesson;

                // Only progress if passed
                if (isPassed) {
                    const newLevelsCompleted = l.levelsCompleted + 1;
                    let newDifficulty = l.difficulty;
                    if (newLevelsCompleted === 1) newDifficulty = 'Medium';
                    if (newLevelsCompleted >= 2) newDifficulty = 'Hard';

                    if (newLevelsCompleted >= l.totalLevels) {
                        isFinished = true;
                        return { ...updatedLesson, levelsCompleted: newLevelsCompleted, difficulty: newDifficulty, status: 'completed' as const };
                    }
                    return { ...updatedLesson, levelsCompleted: newLevelsCompleted, difficulty: newDifficulty };
                } 
                
                // If failed, return with updated concepts but same status
                return updatedLesson; 
            }
            return l;
        });

        // Unlock next lesson only if finished AND passed
        if (isFinished && isPassed) {
            const currentIndex = newLessons.findIndex(l => l.id === activeLesson.id);
            if (currentIndex !== -1 && currentIndex + 1 < newLessons.length) {
                if (newLessons[currentIndex + 1].status === 'locked') {
                    newLessons[currentIndex + 1] = { ...newLessons[currentIndex + 1], status: 'current' };
                }
            }
        }

        setLessons(newLessons);
        setActiveLesson(null);

        try {
            // Save using active course ID
            const activeCourseId = courses.find(c => c.active)?.id || 'main';
            await db.progress.save(user.id, newLessons, activeCourseId);
            
            // Update User Stats if Student
            if (user.role === 'student') {
                const updatedUser = await db.users.updateStats(user.id, studentUpdates);
                setUser(updatedUser);
            }
        } catch (e: any) {
            if (e.code === 'permission-denied') setDbError(true);
        }
    }
  };

  // Scroll Handler from LessonPath
  const handleSectionView = useCallback((unitId: number, sectionTitle: string, sectionDescription: string) => {
      let unitTitle = `Unit ${unitId}`;
      let mainText = sectionTitle;

      if (courseStructure && courseStructure.units[unitId - 1]) {
          const u = courseStructure.units[unitId - 1];
          unitTitle = u.title;
          
          if (!mainText) {
              mainText = u.description;
          }
      }
      
      setHeaderInfo({ topText: unitTitle, mainText: mainText });
      
      // Update guidebook data
      setGuidebookContent({ title: mainText, description: sectionDescription });
  }, [courseStructure]);

  // Section Navigation Scroll
  const handleSectionScroll = (sectionTitle: string) => {
      setShowSectionDropdown(false);
      // Safer selector logic: find the element by attribute matching rather than constructing a selector string, 
      // which avoids issues with special characters in titles.
      const element = Array.from(document.querySelectorAll(`[data-unit-id="${activeUnitId}"]`))
          .find(el => el.getAttribute('data-section-title') === sectionTitle);
      
      if (element) {
          const headerOffset = 180; 
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;

          window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
          });
      }
  };

  // Join Classroom Logic
  const handleJoinClassroom = async (code: string) => {
      if (!user) return;
      setIsJoining(true);
      setJoinError('');
      
      try {
          // Find course by code
          const course = await db.courses.findByCode(code);
          if (course) {
               // Enroll user
               await db.users.enrollCourse(user.id, course);
               
               // Update local state
               setCourses(prev => {
                   const existing = prev.find(c => c.id === course.id);
                   const deactivated = prev.map(c => ({ ...c, active: false }));
                   
                   // If existing, activate it, otherwise append new one as active
                   if (existing) {
                       return deactivated.map(c => c.id === course.id ? { ...c, active: true } : c);
                   } else {
                       return [...deactivated, { ...course, active: true }];
                   }
               });

               // Load structure
               const struct = await db.courses.getStructure(course.id);
               const finalStruct = struct || INITIAL_COURSE_STRUCTURE;
               setCourseStructure(finalStruct);
               
               // Try load progress, else generate fresh
               const hasProgress = await loadProgress(user.id, course.id);
               
               if (!hasProgress) {
                   // Generate fresh lessons for the joined course
                   const newLessons = generateLessonsFromStructure(finalStruct);
                   setLessons(newLessons);
                   
                   // Save the new lessons as current progress
                   await db.progress.save(user.id, newLessons, course.id);
               }
               
               setIsJoining(false);
               
               // Redirect based on role
               if (user.role === 'teacher') {
                   setCurrentView('course-analytics');
               } else {
                   setCurrentView('learn');
               }
               
               alert(`Successfully joined ${course.title}!`);
          } else {
              setJoinError('Invalid class code. Please check and try again.');
              setIsJoining(false);
          }
      } catch (e) {
          console.error(e);
          setJoinError('Error joining class. Please try again.');
          setIsJoining(false);
      }
  };

  // Course Management
  const handleCourseGenerated = async (structure: CourseStructure, targetCourseId: string) => {
    try {
        let baseLessons: Lesson[] = [];
        let startId = 1;
        let isAppend = false;
        let finalCourseId = targetCourseId;
        // Generate a 6-digit code for new courses
        const courseCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        if (targetCourseId !== 'new') {
            const target = courses.find(c => c.id === targetCourseId);
            if (target) {
                // If appending, we must load the EXISTING progress for that course first
                const existingProgress = await db.progress.get(user!.id, target.id);
                baseLessons = existingProgress || INITIAL_LESSONS;

                const maxId = baseLessons.reduce((max, l) => Math.max(max, l.id), 0);
                startId = maxId + 1;
                isAppend = true;
                
                setCourses(prev => prev.map(c => ({
                    ...c, 
                    active: c.id === targetCourseId
                })));
            }
        } else {
            finalCourseId = Date.now().toString();
        }

        // Use helper to generate new lessons
        const generatedLessons = generateLessonsFromStructure(structure, startId, isAppend && baseLessons.length > 0 ? Math.floor(baseLessons.length / 4) : 0);
        const newLessons = [...baseLessons, ...generatedLessons];

        setLessons(newLessons);
        
        // Save using finalCourseId
        if(user) await db.progress.save(user.id, newLessons, finalCourseId);
        
        if (targetCourseId === 'new') {
            const newCourse: Course = {
                id: finalCourseId,
                title: structure.courseTitle || 'New Course',
                flag: '🎓',
                active: true,
                code: courseCode
            };
            setCourses(prev => prev.map(c => ({...c, active: false})).concat(newCourse));
            setCourseStructure(structure);
            // Pass metadata including code
            await db.courses.saveStructure(finalCourseId, structure, { code: courseCode });
            
            if (user) await db.users.enrollCourse(user.id, newCourse);

            setActiveUnitId(1);
            
            // Redirect to Course Editor instead of Learn view
            setManagedCourseId(finalCourseId);
            setCurrentView('manage-course');
        } else {
            if (courseStructure) {
                const mergedStructure = {
                    ...courseStructure,
                    units: [...courseStructure.units, ...structure.units]
                };
                setCourseStructure(mergedStructure);
                await db.courses.saveStructure(finalCourseId, mergedStructure);
                // Also redirect to editor if updating
                setManagedCourseId(finalCourseId);
                setCurrentView('manage-course');
            }
        }
    } catch (e: any) {
        if (e.code === 'permission-denied') setDbError(true);
        console.error(e);
    }
  };

  const handleUnitSelect = (unitId: number) => {
      setActiveUnitId(unitId);
      if (user?.role === 'teacher') {
          // Teachers edit instead of play, redirect to editor or stay in analytics loop
          const active = courses.find(c => c.active);
          if (active) {
            setManagedCourseId(active.id);
            setCurrentView('manage-course');
          } else {
             setCurrentView('course-analytics'); 
          }
      } else {
          setCurrentView('learn');
      }
  };

  // Filter lessons for current unit
  const visibleLessons = lessons.filter(l => l.unitId === activeUnitId);
  const isCurrentUnitComplete = visibleLessons.length > 0 && visibleLessons.every(l => l.status === 'completed');
  
  // Check if there is a next unit
  const hasNextUnit = courseStructure ? activeUnitId < courseStructure.units.length : false;
  
  // Get sections for current unit (for dropdown)
  const currentUnitSections = courseStructure?.units[activeUnitId - 1]?.sections || [];

  if (dbError) {
      return (
          <div className="min-h-screen bg-duo-bg flex flex-col items-center justify-center p-8 text-white">
              <div className="max-w-2xl w-full bg-duo-card border-2 border-duo-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  {/* Decorative background blur */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-duo-red/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                      <div className="w-16 h-16 bg-duo-red/20 rounded-2xl flex items-center justify-center border-2 border-duo-red">
                          <AlertTriangle size={32} className="text-duo-red" />
                      </div>
                      <div>
                          <h1 className="text-3xl font-extrabold text-white">Database Setup Required</h1>
                          <p className="text-duo-red font-bold">Missing Permissions</p>
                      </div>
                  </div>

                  <p className="text-duo-muted font-bold text-lg mb-6 leading-relaxed">
                      The app cannot access the database because your Firebase project is missing security rules. 
                      Please add the following rules to your project to enable access.
                  </p>
                  
                  <div className="bg-[#0f171a] rounded-xl border-2 border-duo-border mb-6 relative group">
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      match /progress/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /courses/{courseDoc=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
  }
}`);
                                    alert("Copied to clipboard!");
                                }}
                                className="bg-duo-border hover:bg-white/20 text-white p-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                <Copy size={14} /> Copy
                            </button>
                      </div>
                      <div className="p-4 border-b border-duo-border flex items-center gap-2 text-duo-muted text-xs font-bold uppercase tracking-widest">
                          <Terminal size={14} /> firestore.rules
                      </div>
                      <div className="p-6 overflow-x-auto">
                          <pre className="font-mono text-sm text-duo-blue leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      match /progress/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /courses/{courseDoc=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    match /courses/{courseId} {
      allow read: if request.auth != null;
      // Only Teachers can create or update courses
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
  }
}`}
                          </pre>
                      </div>
                  </div>

                  <div className="bg-duo-blue/10 border border-duo-blue/30 rounded-xl p-4 mb-8 flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-duo-blue flex items-center justify-center shrink-0 font-bold text-white">1</div>
                        <p className="text-sm font-bold text-duo-blue pt-1">
                             Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline hover:text-white">Firebase Console</a> {'>'} Build {'>'} Firestore Database {'>'} Rules tab, paste the code above, and click Publish.
                        </p>
                  </div>

                  <button 
                      onClick={() => window.location.reload()}
                      className="w-full py-4 bg-duo-green hover:bg-duo-greenHover text-white font-extrabold rounded-2xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest flex items-center justify-center gap-3 text-lg"
                  >
                      <RefreshCw size={24} strokeWidth={3} />
                      I've Updated The Rules, Retry
                  </button>
              </div>
          </div>
      )
  }

  if (loading) {
     return (
        <div className="min-h-screen bg-duo-bg flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-duo-green"></div>
        </div>
     );
  }

  if (!user) {
      // Just pass a dummy function for now, auth state is handled by listener
      return <AuthScreen onLogin={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-duo-bg text-white font-sans selection:bg-duo-green selection:text-white">
      <LeftSidebar 
        user={user}
        onLogout={handleLogout} 
        onLearnClick={navigateHome}
        onProfileClick={() => {
            setCurrentView('profile');
            window.scrollTo(0,0);
        }}
        onLeaderboardClick={() => {
            setCurrentView('leaderboard');
            window.scrollTo(0,0);
        }}
        currentView={currentView}
      />
      
      <main className="lg:ml-64 xl:mr-96 min-h-screen pb-20">
        
        {/* VIEW: ADD COURSE */}
        {currentView === 'add-course' && (
            user?.role === 'teacher' ? (
                <AddCourseScreen 
                    onBack={navigateHome} 
                    onCourseGenerated={handleCourseGenerated}
                    courses={courses}
                    onJoinCourse={handleJoinClassroom}
                    joining={isJoining}
                    joinError={joinError}
                />
            ) : (
                // Students see Join Classroom instead of Upgrade Screen
                <JoinClassroomScreen 
                    onBack={navigateHome}
                    onJoin={handleJoinClassroom}
                    joining={isJoining}
                    error={joinError}
                />
            )
        )}

        {/* VIEW: MANAGE COURSE (TEACHER EDITOR) */}
        {currentView === 'manage-course' && managedCourseId && user.role === 'teacher' && (
            <TeacherCourseEditor 
                courseId={managedCourseId}
                onBack={() => setCurrentView('course-analytics')}
            />
        )}

        {/* VIEW: UNITS OVERVIEW */}
        {currentView === 'units-overview' && courseStructure && (
            <UnitsOverviewScreen 
                units={courseStructure.units}
                lessons={lessons}
                onBack={navigateHome}
                onContinue={handleUnitSelect}
            />
        )}

        {/* VIEW: COURSE ANALYTICS */}
        {currentView === 'course-analytics' && user.role === 'teacher' && (
            <CourseAnalyticsScreen 
                course={courses.find(c => c.active) || null}
                onBack={() => {
                    const activeCourse = courses.find(c => c.active);
                    if (activeCourse) {
                        setManagedCourseId(activeCourse.id);
                        setCurrentView('manage-course');
                    } else {
                        // If no active course, teachers go to add course
                        setCurrentView('add-course');
                    }
                }}
            />
        )}

        {/* VIEW: PROFILE */}
        {currentView === 'profile' && (
            <ProfileScreen 
                user={user}
                courses={courses}
                onBack={navigateHome}
                onLeaveCourse={handleLeaveCourse}
            />
        )}

        {/* VIEW: LEADERBOARD */}
        {currentView === 'leaderboard' && (
            <LeaderboardScreen 
                currentUser={user}
                courseId={courses.find(c => c.active)?.id}
            />
        )}

        {/* VIEW: LEARN (LESSON PATH) */}
        {currentView === 'learn' && (
            courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-48 h-48 bg-duo-card rounded-full flex items-center justify-center border-4 border-dashed border-duo-border relative overflow-hidden group">
                        <div className="absolute inset-0 bg-duo-blue/10 transform rotate-12 scale-150 group-hover:rotate-45 transition-transform duration-700"></div>
                        <School size={80} className="text-duo-muted group-hover:text-duo-blue transition-colors relative z-10" />
                    </div>
                    
                    <div className="space-y-4 max-w-md">
                        <h1 className="text-3xl font-extrabold text-white">Your learning journey starts here!</h1>
                        <p className="text-duo-muted font-bold text-lg">
                            {user.role === 'teacher' 
                                ? "Create your first course to start teaching." 
                                : "Join a classroom to start your lessons."}
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <button 
                            onClick={() => setCurrentView('add-course')}
                            className="w-full py-4 bg-duo-green hover:bg-duo-greenHover text-white font-extrabold rounded-2xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            {user.role === 'teacher' ? (
                                <><PlusCircle size={20} /> Create Course</>
                            ) : (
                                <><School size={20} /> Join Class</>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                {/* Header with Sticky Unit Header Bar */}
                <div className="sticky top-0 z-40 bg-duo-bg/95 backdrop-blur-sm pt-6 pb-4 px-4 border-b-2 border-transparent transition-all">
                    
                    {/* Sticky Unit Header Bar */}
                    <div className="max-w-2xl mx-auto bg-duo-yellow p-4 rounded-2xl flex justify-between items-center border-b-4 border-[#bfa300] shadow-lg transition-all duration-300 relative z-50">
                         <div className="flex items-center gap-4">
                            <button 
                                onClick={() => {
                                    // Custom Back Logic for Teachers -> Analytics
                                    if (user.role === 'teacher') {
                                        setCurrentView('course-analytics');
                                    } else {
                                        setCurrentView('units-overview');
                                    }
                                }}
                                className="p-2 -ml-2 hover:bg-black/10 rounded-xl transition-colors text-white/80 hover:text-white"
                                title={user.role === 'teacher' ? "View Analytics" : "View All Units"}
                            >
                                <ArrowLeft size={24} strokeWidth={3} />
                            </button>
                            <div className="text-left relative">
                                <h2 className="font-extrabold text-white/70 uppercase text-xs tracking-widest mb-1">{headerInfo.topText}</h2>
                                <button 
                                    onClick={() => setShowSectionDropdown(!showSectionDropdown)}
                                    className="flex items-center gap-2 hover:bg-black/10 rounded-lg pr-2 -ml-2 pl-2 transition-colors"
                                >
                                    <h1 className="font-extrabold text-white text-xl animate-in slide-in-from-top-2 duration-300">
                                        {headerInfo.mainText}
                                    </h1>
                                    <ChevronDown size={20} className={`text-white transition-transform ${showSectionDropdown ? 'rotate-180' : ''}`} strokeWidth={3} />
                                </button>

                                {/* Dropdown Menu */}
                                {showSectionDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-duo-card border-2 border-duo-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 z-50">
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                            {currentUnitSections.map((sec, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSectionScroll(sec.title)}
                                                    className={`w-full text-left p-3 hover:bg-duo-border/50 transition-colors border-b border-duo-border/50 last:border-0 flex items-center justify-between ${headerInfo.mainText === sec.title ? 'bg-duo-border/30' : ''}`}
                                                >
                                                    <span className={`font-bold text-sm ${headerInfo.mainText === sec.title ? 'text-duo-green' : 'text-white'}`}>
                                                        {sec.title}
                                                    </span>
                                                    {headerInfo.mainText === sec.title && <Check size={16} className="text-duo-green" strokeWidth={3} />}
                                                </button>
                                            ))}
                                            {currentUnitSections.length === 0 && (
                                                <div className="p-4 text-center text-duo-muted text-sm font-bold">
                                                    No sections found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowGuidebook(true)}
                            className="flex items-center space-x-2 bg-black/20 hover:bg-black/30 transition-colors px-4 py-3 rounded-xl font-bold border-2 border-black/10"
                        >
                            <BookText size={20} />
                            <span className="hidden sm:inline">GUIDEBOOK</span>
                        </button>
                    </div>
                </div>

                {/* Path */}
                <div className="px-4 mt-8">
                    <LessonPath 
                        lessons={visibleLessons} 
                        onLessonClick={handleLessonClick} 
                        onSectionChange={handleSectionView}
                        hasNextUnit={hasNextUnit}
                        isUnitComplete={isCurrentUnitComplete}
                        onNextUnit={() => {
                            setActiveUnitId(prev => prev + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        userAvatarUrl={user?.avatarUrl}
                        userName={user?.name}
                    />
                </div>
                </>
            )
        )}
        
        {/* Floating Action Button (Mobile) */}
        {currentView === 'learn' && courses.length > 0 && (
            <div className="fixed bottom-6 right-6 lg:hidden z-20">
            <button className="bg-duo-blue p-4 rounded-full shadow-lg border-b-4 border-blue-700 active:translate-y-1 active:border-b-0">
                ⬇️
            </button>
            </div>
        )}
      </main>

      <RightSidebar 
        user={user} 
        courses={courses}
        onSelectCourse={async (id) => {
            setCourses(courses.map(c => ({...c, active: c.id === id})));
            try {
                const struct = await db.courses.getStructure(id);
                const finalStruct = struct || INITIAL_COURSE_STRUCTURE;
                setCourseStructure(finalStruct);
                
                // Attempt to load progress for the selected course
                const hasProgress = await loadProgress(user.id, id);
                
                if (!hasProgress) {
                    const generated = generateLessonsFromStructure(finalStruct);
                    setLessons(generated);
                    // Save initial progress immediately to prevent regeneration loop
                    if (generated.length > 0) {
                        await db.progress.save(user.id, generated, id);
                    }
                }
            } catch (e: any) {
                if (e.code === 'permission-denied') setDbError(true);
            }
        }}
        onAddCourse={() => setCurrentView('add-course')}
        onViewLeaderboard={() => {
            setCurrentView('leaderboard');
            window.scrollTo(0,0);
        }}
        onLeaveCourse={handleLeaveCourse}
      />

      {/* Exercise Modal */}
      {activeLesson && user && (
        <ExerciseModal 
            lesson={activeLesson}
            difficulty={activeLessonDifficulty}
            hearts={user.role === 'teacher' ? 999 : (user.hearts || 0)}
            onClose={() => setActiveLesson(null)} 
            onComplete={handleLessonComplete}
            onLoseHeart={handleLoseHeart}
        />
      )}

      {/* Guidebook Modal */}
      {showGuidebook && (
          <GuidebookModal 
              title={guidebookContent.title}
              description={guidebookContent.description}
              onClose={() => setShowGuidebook(false)}
          />
      )}
    </div>
  );
};

export default App;
