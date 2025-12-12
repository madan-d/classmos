
import { Lesson, User, CourseStructure, Course } from '../types';
import { firestore } from './firebase';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs,
    where,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';

// Mock Structure matching the lessons below
export const INITIAL_COURSE_STRUCTURE: CourseStructure = {
    courseTitle: "Demo Course",
    units: []
};

// Initial template for new users - tailored to show completed unit 1, active unit 2
export const INITIAL_LESSONS: Lesson[] = [];

const generateId = () => Math.random().toString(36).substr(2, 9);

// LocalStorage Helper for Fallback
const LS = {
    getKeys: {
        USERS: 'lingo_users',
        PROGRESS: 'lingo_progress',
        COURSES: 'lingo_courses',
        USER_COURSES: 'lingo_user_courses'
    },
    getItem: (key: string) => {
        try {
            return JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
            return {};
        }
    },
    setItem: (key: string, value: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error("LocalStorage save failed", e);
        }
    }
};

export const db = {
  users: {
    // Subscribe to real-time updates for a user
    subscribe(userId: string, callback: (user: User | null) => void) {
        return onSnapshot(
            doc(firestore, "users", userId), 
            (doc) => {
                if (doc.exists()) {
                    callback(doc.data() as User);
                } else {
                    callback(null);
                }
            },
            (error) => {
                console.warn("Firestore snapshot error (users):", error.message);
                // Suppress error to avoid crashing, likely permission issue handled by App.tsx
            }
        );
    },

    // Find user by Firebase Auth UID
    async findById(id: string): Promise<User | null> {
        try {
            const docRef = doc(firestore, "users", id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data() as User;
            } else {
                return null;
            }
        } catch (e: any) {
            console.warn("Firestore error (findById), falling back to LocalStorage:", e.message);
            // Fallback: Check LocalStorage
            const users = LS.getItem(LS.getKeys.USERS);
            return users[id] || null;
        }
    },

    // Kept for interface compatibility
    async findOne({ email }: { email: string }): Promise<User | null> {
        return null;
    },

    async create(userData: Partial<User>): Promise<User> {
      const userId = userData.id || generateId();
      const role = userData.role || 'student';
      
      let newUser: User = {
        id: userId,
        name: userData.name || 'Learner',
        email: userData.email!,
        role: role,
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        avatarUrl: userData.avatarUrl || '', // Empty string triggers Initials fallback
        ...userData
      };

      // Only add Student Stats if role is student
      if (role === 'student') {
          newUser = {
              ...newUser,
              xp: 0,
              streak: 1,
              gems: 500,
              hearts: 5,
              lastHeartRefill: Date.now(),
              league: 'Bronze',
              topFinishes: 0,
              dailyXp: 0,
              lastActiveDate: Date.now(),
              achievements: [
                  { id: '1', title: 'Wildfire', description: 'Reach a 3 day streak', level: 1, maxLevel: 10, progress: 1, maxProgress: 3, icon: '🔥', color: 'gold' },
                  { id: '2', title: 'Sage', description: 'Earn 100 XP', level: 1, maxLevel: 10, progress: 0, maxProgress: 100, icon: '🧙‍♂️', color: 'green' }
              ],
              totalAccuracy: 100,
              retentionRate: 100,
              elo: 800,
              eloHistory: [800],
              enrolledCourseIds: [],
              courseXp: {}
          };
      }

      try {
          // Save User
          await setDoc(doc(firestore, "users", userId), newUser);

          // Save Initial Progress (Course 1) - Default Main
          await setDoc(doc(firestore, "users", userId, "progress", "main"), {
              lessons: INITIAL_LESSONS
          });
          
          return newUser;
      } catch (e: any) {
          console.warn("Firestore error (create), falling back to LocalStorage:", e.message);
          
          // Save to LocalStorage
          const users = LS.getItem(LS.getKeys.USERS);
          users[userId] = newUser;
          LS.setItem(LS.getKeys.USERS, users);

          // Save Progress to LocalStorage
          const progress = LS.getItem(LS.getKeys.PROGRESS);
          // Default key for main course
          progress[`${userId}_main`] = INITIAL_LESSONS;
          LS.setItem(LS.getKeys.PROGRESS, progress);

          return newUser;
      }
    },
    
    async updateStats(userId: string, stats: Partial<User>): Promise<User> {
        // Logic to merge stats
        const mergeStats = (currentUser: User, updates: Partial<User>) => {
            return {
                ...currentUser,
                ...updates
            };
        };

        try {
            const userRef = doc(firestore, "users", userId);
            const docSnap = await getDoc(userRef);
            
            if (!docSnap.exists()) throw new Error("User not found (Firestore)");
            const currentUser = docSnap.data() as User;
            const updatedUser = mergeStats(currentUser, stats);

            await updateDoc(userRef, updatedUser);
            return updatedUser;
        } catch (e: any) {
            console.warn("Firestore error (updateStats), falling back to LocalStorage:", e.message);
            
            const users = LS.getItem(LS.getKeys.USERS);
            const currentUser = users[userId];
            
            if (!currentUser) throw new Error("User not found (LocalStorage)");
            
            const updatedUser = mergeStats(currentUser, stats);
            users[userId] = updatedUser;
            LS.setItem(LS.getKeys.USERS, users);
            
            return updatedUser;
        }
    },
    
    // Get list of courses enrolled by user
    async getEnrolledCourses(userId: string): Promise<Course[]> {
        try {
            const docRef = doc(firestore, "users", userId, "courses", "list");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().list as Course[];
            }
            return [];
        } catch (e: any) {
             console.warn("Firestore error (getEnrolledCourses), falling back to LocalStorage:", e.message);
             const userCourses = LS.getItem(LS.getKeys.USER_COURSES);
             return userCourses[userId] || [];
        }
    },

    // Enroll user in a course
    async enrollCourse(userId: string, course: Course): Promise<void> {
        try {
            // 1. Update Subcollection for List UI
            const docRef = doc(firestore, "users", userId, "courses", "list");
            const docSnap = await getDoc(docRef);
            let list: Course[] = [];
            if (docSnap.exists()) {
                list = docSnap.data().list;
            }
            
            if (!list.find(c => c.id === course.id)) {
                list.push(course);
                await setDoc(docRef, { list });
            }

            // 2. Update User Document for Querying
            const userRef = doc(firestore, "users", userId);
            await updateDoc(userRef, {
                enrolledCourseIds: arrayUnion(course.id)
            });

        } catch (e: any) {
             console.warn("Firestore error (enrollCourse), falling back to LocalStorage:", e.message);
             const userCourses = LS.getItem(LS.getKeys.USER_COURSES);
             const list = userCourses[userId] || [];
             if (!list.find((c: Course) => c.id === course.id)) {
                 list.push(course);
                 userCourses[userId] = list;
                 LS.setItem(LS.getKeys.USER_COURSES, userCourses);
             }
        }
    },

    // Leave/Remove course
    async leaveCourse(userId: string, courseId: string): Promise<void> {
        try {
            // 1. Update Subcollection for List UI
            const docRef = doc(firestore, "users", userId, "courses", "list");
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const list = docSnap.data().list as Course[];
                const newList = list.filter(c => c.id !== courseId);
                await setDoc(docRef, { list: newList });
            }

            // 2. Update User Document for Querying
            const userRef = doc(firestore, "users", userId);
            await updateDoc(userRef, {
                enrolledCourseIds: arrayRemove(courseId)
            });

        } catch (e: any) {
             console.warn("Firestore error (leaveCourse), falling back to LocalStorage:", e.message);
             const userCourses = LS.getItem(LS.getKeys.USER_COURSES);
             const list = userCourses[userId] || [];
             const newList = list.filter((c: Course) => c.id !== courseId);
             userCourses[userId] = newList;
             LS.setItem(LS.getKeys.USER_COURSES, userCourses);
        }
    },

    async getStudentsByCourse(courseId: string): Promise<User[]> {
        try {
            const q = query(
                collection(firestore, "users"),
                where("role", "==", "student"),
                where("enrolledCourseIds", "array-contains", courseId)
            );
            const querySnapshot = await getDocs(q);
            const students: User[] = [];
            querySnapshot.forEach((doc) => {
                students.push(doc.data() as User);
            });

            return students;
        } catch (e: any) {
             console.warn("Firestore error (getStudentsByCourse):", e.message);
             return [];
        }
    },

    async getLeaderboard(courseId?: string): Promise<User[]> {
        let allUsers: User[] = [];

        try {
            // Fetch users. 
            // Note: We avoid 'orderBy' in the Firestore query here to prevent "Index Missing" errors.
            // Sorting is done client-side since the dataset (class size) is expected to be manageable for this demo.
            
            let q;
            if (courseId) {
                 q = query(
                    collection(firestore, "users"), 
                    where("role", "==", "student"),
                    where("enrolledCourseIds", "array-contains", courseId)
                );
            } else {
                 q = query(
                    collection(firestore, "users"), 
                    where("role", "==", "student")
                );
            }

            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                allUsers.push(doc.data() as User);
            });
            
            // Client-side Sort
            allUsers.sort((a, b) => {
                if (courseId) {
                     // Sort by Course XP
                     const xpA = a.courseXp?.[courseId] || 0;
                     const xpB = b.courseXp?.[courseId] || 0;
                     return xpB - xpA;
                } else {
                     // Sort by Total XP
                     return (b.xp || 0) - (a.xp || 0);
                }
            });

        } catch (e: any) {
             console.warn("Firestore error (leaderboard):", e.message);
             
             // Fallback to LocalStorage
             const usersMap = LS.getItem(LS.getKeys.USERS);
             allUsers = Object.values(usersMap).filter((u: any) => u.role === 'student') as User[];
             
             // Sort fallback
             allUsers.sort((a, b) => {
                 if (courseId) {
                     const xpA = a.courseXp?.[courseId] || 0;
                     const xpB = b.courseXp?.[courseId] || 0;
                     return xpB - xpA;
                 } else {
                     return (b.xp || 0) - (a.xp || 0);
                 }
             });
        }

        return allUsers;
    }
  },

  progress: {
    // UPDATED: Now accepts courseId to fetch specific course progress
    async get(userId: string, courseId: string = 'main'): Promise<Lesson[] | null> {
      try {
          const docRef = doc(firestore, "users", userId, "progress", courseId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
              return docSnap.data().lessons as Lesson[];
          }
          return null; // Return null if not found
      } catch (e: any) {
          console.warn("Firestore error (progress.get), falling back to LocalStorage:", e.message);
          const progressMap = LS.getItem(LS.getKeys.PROGRESS);
          // Check specific course key first, then fallback
          return progressMap[`${userId}_${courseId}`] || null;
      }
    },

    // UPDATED: Now accepts courseId to save specific course progress
    async save(userId: string, lessons: Lesson[], courseId: string = 'main'): Promise<void> {
      try {
          const docRef = doc(firestore, "users", userId, "progress", courseId);
          await setDoc(docRef, { lessons }, { merge: true });
      } catch (e: any) {
          console.warn("Firestore error (progress.save), falling back to LocalStorage:", e.message);
          const progressMap = LS.getItem(LS.getKeys.PROGRESS);
          // Use specific course key
          progressMap[`${userId}_${courseId}`] = lessons;
          LS.setItem(LS.getKeys.PROGRESS, progressMap);
      }
    }
  },

  courses: {
      async findByCode(code: string): Promise<Course | null> {
          try {
              const q = query(collection(firestore, "courses"), where("code", "==", code), limit(1));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                  const doc = querySnapshot.docs[0];
                  const data = doc.data();
                  return {
                      id: doc.id,
                      title: data.courseTitle || 'Unknown Course',
                      flag: '🏫', // Default flag for joined courses
                      active: true,
                      code: data.code
                  };
              }
              return null;
          } catch (e: any) {
               console.warn("Firestore error (findByCode), falling back to LocalStorage:", e.message);
               // Simple fallback search in local storage
               const coursesMap = LS.getItem(LS.getKeys.COURSES);
               const found = Object.values(coursesMap).find((c: any) => c.code === code) as any;
               if (found) {
                   return {
                       id: 'local_found',
                       title: found.courseTitle,
                       flag: '🏫',
                       active: true,
                       code: found.code
                   };
               }
               return null;
          }
      },

      async getStructure(courseId: string): Promise<CourseStructure | null> {
          try {
              if (courseId === '1') {
                   // Return the (now empty) initial structure for default calls
                   return INITIAL_COURSE_STRUCTURE;
              }

              const docRef = doc(firestore, "courses", courseId);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists()) {
                  return docSnap.data() as CourseStructure;
              }
              return null;
          } catch (e: any) {
               console.warn("Firestore error (courses.get), falling back to LocalStorage:", e.message);
               // If default course
               if (courseId === '1') return INITIAL_COURSE_STRUCTURE;
               
               const coursesMap = LS.getItem(LS.getKeys.COURSES);
               return coursesMap[courseId] || null;
          }
      },
      
      async saveStructure(courseId: string, structure: CourseStructure, metadata?: { code: string }): Promise<void> {
          const dataToSave = { ...structure, ...metadata };
          try {
              await setDoc(doc(firestore, "courses", courseId), dataToSave);
          } catch (e: any) {
              console.warn("Firestore error (courses.save), falling back to LocalStorage:", e.message);
              const coursesMap = LS.getItem(LS.getKeys.COURSES);
              coursesMap[courseId] = dataToSave;
              LS.setItem(LS.getKeys.COURSES, coursesMap);
          }
      }
  }
};
