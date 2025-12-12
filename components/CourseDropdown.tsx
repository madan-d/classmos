
import React from 'react';
import { Plus, Check } from 'lucide-react';
import { Course } from '../types';

interface CourseDropdownProps {
  courses: Course[];
  onSelectCourse: (courseId: string) => void;
  onAddCourse: () => void;
  onClose: () => void;
  onLeaveCourse: (courseId: string) => void;
  className?: string;
}

const CourseDropdown: React.FC<CourseDropdownProps> = ({ courses, onSelectCourse, onAddCourse, onClose, className }) => {
  return (
    <div className={`absolute bg-duo-bg border-2 border-duo-border rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${className ? className : 'top-16 left-0 w-80'}`}>
      <div className="bg-duo-border/30 p-4 border-b-2 border-duo-border">
        <h3 className="text-duo-muted font-bold text-sm tracking-widest uppercase">My Courses</h3>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {courses.map((course) => (
          <div 
            key={course.id}
            onClick={() => {
              onSelectCourse(course.id);
              onClose();
            }}
            className={`flex items-center justify-between p-4 cursor-pointer hover:bg-duo-border/50 transition-colors ${course.active ? 'bg-duo-border/20' : ''}`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-8 bg-duo-border rounded border border-duo-border flex items-center justify-center text-xl shadow-sm">
                {course.flag}
              </div>
              <span className={`font-bold ${course.active ? 'text-duo-blue' : 'text-duo-text'}`}>
                {course.title}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
                {course.active && <Check className="text-duo-blue" size={20} strokeWidth={3} />}
            </div>
          </div>
        ))}

        <div 
          onClick={() => {
            onAddCourse();
            onClose();
          }}
          className="flex items-center space-x-4 p-4 cursor-pointer hover:bg-duo-border/50 transition-colors border-t-2 border-duo-border group"
        >
          <div className="w-10 h-10 rounded-xl border-2 border-duo-border border-dashed flex items-center justify-center group-hover:border-duo-text transition-colors">
            <Plus className="text-duo-muted group-hover:text-duo-text" />
          </div>
          <span className="font-bold text-duo-text">Add a new course</span>
        </div>
      </div>
    </div>
  );
};

export default CourseDropdown;
