
export type UserRole = 'student' | 'teacher';

export interface Lesson {
  id: number;
  status: 'completed' | 'current' | 'locked';
  type: 'star' | 'book' | 'trophy' | 'chest';
  position: 'center' | 'left' | 'right';
  topic: string; // Used for UI Label only (e.g. "Basics 1")
  unitId: number; 
  sectionTitle?: string; 
  sectionDescription?: string; 
  levelsCompleted: number;
  totalLevels: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  concepts?: string[]; // Specific topics covered in this lesson (e.g. "Mitochondria", "Past Tense")
}

export type ExerciseType = 'MULTIPLE_CHOICE' | 'FILL_IN_THE_BLANK' | 'MATCHING' | 'ORDERING';

export interface GeneratedExercise {
  type: ExerciseType;
  question: string;
  concept: string;
  explanation: string;
  
  // MCQ & Fill in the Blank
  options?: string[];
  correctAnswer?: string; // String for MCQ, or the word that fills the blank
  
  // Matching
  pairs?: { item: string; match: string }[];
  
  // Ordering
  segments?: string[]; // The correct order of segments
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  level: number;
  maxLevel: number;
  progress: number;
  maxProgress: number;
  icon: string; 
  color: string; // 'gold' | 'green' | 'purple' etc
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole; 
  password?: string; 
  avatarUrl?: string; // Profile Picture URL
  
  // Profile Stats (Common)
  joinedDate: string;
  enrolledCourseIds?: string[]; // Array of course IDs the user is enrolled in
  courseXp?: { [key: string]: number }; // Map of courseId -> XP earned in that course
  
  // Student Specific Stats (Optional for Teachers)
  xp?: number;
  streak?: number;
  gems?: number;
  hearts?: number;
  lastHeartRefill?: number; 
  league?: string;
  topFinishes?: number;
  achievements?: Achievement[];
  
  // Daily Progress
  dailyXp?: number;
  lastActiveDate?: number; // Timestamp

  // Learning Metrics (Student Only)
  totalAccuracy?: number;
  retentionRate?: number;
  elo?: number;
  eloHistory?: number[];
}

export interface Course {
    id: string;
    title: string;
    flag: string; 
    active: boolean;
    code?: string; // 6-digit join code
}

export interface Section {
    title: string;
    description: string;
    // Topics removed
}

export interface Unit {
    title: string;
    description: string;
    sections: Section[];
}

export interface CourseStructure {
    courseTitle: string;
    units: Unit[];
    code?: string; // Added code for editor
}

export enum GameState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  ERROR = 'ERROR',
  GAME_OVER = 'GAME_OVER'
}
