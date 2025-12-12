
import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, FileText, Loader2, BookPlus, Trash2, Plus, Save, X, PlusCircle, Layers, FolderPlus, Users } from 'lucide-react';
import { generateCourseFromDocument } from '../services/geminiService';
import { CourseStructure, Course } from '../types';

interface AddCourseScreenProps {
  onBack: () => void;
  onCourseGenerated: (structure: CourseStructure, targetCourseId: string) => void;
  courses: Course[];
  onJoinCourse: (code: string) => void;
  joining: boolean;
  joinError: string;
}

const AddCourseScreen: React.FC<AddCourseScreenProps> = ({ onBack, onCourseGenerated, courses, onJoinCourse, joining, joinError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewStructure, setPreviewStructure] = useState<CourseStructure | null>(null);
  const [targetCourseId, setTargetCourseId] = useState<string>('new');
  
  // New State for Context
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState('English');

  // Join State
  const [joinCode, setJoinCode] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    
    if (!subject.trim()) {
        setError("Please enter a subject (e.g. Biology, History) before uploading.");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        setError("File is too large (max 10MB)");
        return;
    }

    setLoading(true);
    setError('');

    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            
            try {
                const structure = await generateCourseFromDocument(base64Data, file.type, subject, language);
                setPreviewStructure(structure);
                setLoading(false);
            } catch (err) {
                setError("Failed to generate course. Please try a different file.");
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    } catch (e) {
        setError("Error reading file.");
        setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualStart = () => {
      setPreviewStructure({
          courseTitle: subject ? `${subject} Course` : "My Custom Course",
          units: [
              {
                  title: "Unit 1",
                  description: "Introduction",
                  sections: [
                      {
                          title: "Section 1",
                          description: "Basics"
                      }
                  ]
              }
          ]
      });
  };

  // Editing Handlers
  const handleTitleChange = (val: string) => {
      if (previewStructure) setPreviewStructure({ ...previewStructure, courseTitle: val });
  };

  const handleUnitChange = (index: number, field: 'title' | 'description', val: string) => {
      if (!previewStructure) return;
      const newUnits = [...previewStructure.units];
      newUnits[index] = { ...newUnits[index], [field]: val };
      setPreviewStructure({ ...previewStructure, units: newUnits });
  };

  const addUnit = () => {
      if (!previewStructure) return;
      const newUnits = [...previewStructure.units];
      newUnits.push({
          title: `Unit ${newUnits.length + 1}`,
          description: "New Description",
          sections: [
              {
                  title: "Section 1",
                  description: "New Section"
              }
          ]
      });
      setPreviewStructure({ ...previewStructure, units: newUnits });
  };

  const removeUnit = (index: number) => {
      if (!previewStructure) return;
      const newUnits = [...previewStructure.units];
      newUnits.splice(index, 1);
      setPreviewStructure({ ...previewStructure, units: newUnits });
  };

  // Section Handlers
  const addSection = (unitIndex: number) => {
      if (!previewStructure) return;
      const newUnits = [...previewStructure.units];
      newUnits[unitIndex].sections.push({
          title: "New Section",
          description: "Description"
      });
      setPreviewStructure({ ...previewStructure, units: newUnits });
  };

  const removeSection = (unitIndex: number, sectionIndex: number) => {
      if (!previewStructure) return;
      const newUnits = [...previewStructure.units];
      newUnits[unitIndex].sections.splice(sectionIndex, 1);
      setPreviewStructure({ ...previewStructure, units: newUnits });
  };

  const handleSectionChange = (unitIndex: number, sectionIndex: number, field: 'title' | 'description', val: string) => {
      if (!previewStructure) return;
      const newUnits = [...previewStructure.units];
      newUnits[unitIndex].sections[sectionIndex] = { ...newUnits[unitIndex].sections[sectionIndex], [field]: val };
      setPreviewStructure({ ...previewStructure, units: newUnits });
  };

  // Preview / Edit View
  if (previewStructure) {
      return (
        <div className="min-h-screen bg-duo-bg text-white p-6 pb-20 lg:ml-64 xl:mr-96">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between mb-8 sticky top-0 bg-duo-bg/95 backdrop-blur z-10 py-4 border-b-2 border-duo-border">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setPreviewStructure(null)}
                            className="p-2 hover:bg-duo-border rounded-xl transition-colors text-duo-muted hover:text-duo-red"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-extrabold text-duo-text">
                                {loading ? 'Review Course' : 'Edit Generated Unit'}
                            </h1>
                        </div>
                    </div>
                    <div className="flex gap-4">
                         <button 
                            onClick={() => setPreviewStructure(null)}
                            className="px-6 py-3 font-bold text-duo-red hover:bg-duo-red/10 rounded-xl transition-colors"
                        >
                            Discard
                        </button>
                        <button 
                            onClick={() => onCourseGenerated(previewStructure, targetCourseId)}
                            className="px-6 py-3 bg-duo-green hover:bg-duo-greenHover text-white font-extrabold rounded-xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2"
                        >
                            <Save size={20} />
                            Save
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Course Selection / Title */}
                    <div className="bg-duo-card border-2 border-duo-border rounded-2xl p-6 space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                             <div className="flex-1">
                                <label className="text-duo-muted font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Layers size={14} /> Add To
                                </label>
                                <select 
                                    value={targetCourseId}
                                    onChange={(e) => setTargetCourseId(e.target.value)}
                                    className="w-full bg-duo-bg border-2 border-duo-border rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-duo-blue"
                                >
                                    <option value="new">🆕 Create New Course</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.flag} {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {targetCourseId === 'new' && (
                                <div className="flex-[2]">
                                    <label className="text-duo-muted font-bold text-xs uppercase tracking-widest mb-2 block">Course Title</label>
                                    <input 
                                        type="text" 
                                        value={previewStructure.courseTitle}
                                        onChange={(e) => handleTitleChange(e.target.value)}
                                        className="w-full bg-duo-bg border-2 border-duo-border rounded-xl px-4 py-3 text-xl font-bold text-white focus:outline-none focus:border-duo-blue"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Units */}
                    {previewStructure.units.map((unit, uIdx) => (
                        <div key={uIdx} className="bg-duo-card border-2 border-duo-border rounded-2xl p-6 relative group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="absolute -left-3 top-6 w-6 h-6 bg-duo-yellow rounded-full border-2 border-duo-card flex items-center justify-center font-bold text-duo-card text-xs z-10">
                                    {uIdx + 1}
                                </div>
                                <div className="w-full ml-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-duo-muted font-bold text-xs uppercase tracking-widest">Unit Title</label>
                                            <input 
                                                type="text" 
                                                value={unit.title}
                                                onChange={(e) => handleUnitChange(uIdx, 'title', e.target.value)}
                                                className="w-full bg-duo-bg border-2 border-duo-border rounded-xl px-4 py-2 font-bold text-white focus:outline-none focus:border-duo-blue"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-duo-muted font-bold text-xs uppercase tracking-widest">Description</label>
                                            <input 
                                                type="text" 
                                                value={unit.description}
                                                onChange={(e) => handleUnitChange(uIdx, 'description', e.target.value)}
                                                className="w-full bg-duo-bg border-2 border-duo-border rounded-xl px-4 py-2 text-duo-muted focus:text-white focus:outline-none focus:border-duo-blue"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeUnit(uIdx)}
                                    className="ml-4 p-2 text-duo-border hover:text-duo-red hover:bg-duo-red/10 rounded-xl transition-colors"
                                    title="Remove Unit"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            {/* Sections */}
                            <div className="ml-4 space-y-4">
                                {unit.sections.map((section, sIdx) => (
                                    <div key={sIdx} className="bg-duo-bg/50 border border-duo-border rounded-xl p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                                <input 
                                                    type="text" 
                                                    value={section.title}
                                                    onChange={(e) => handleSectionChange(uIdx, sIdx, 'title', e.target.value)}
                                                    className="bg-duo-bg border border-duo-border rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-duo-blue"
                                                    placeholder="Section Title"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={section.description}
                                                    onChange={(e) => handleSectionChange(uIdx, sIdx, 'description', e.target.value)}
                                                    className="bg-duo-bg border border-duo-border rounded-lg px-3 py-2 text-sm text-duo-muted focus:text-white focus:outline-none focus:border-duo-blue"
                                                    placeholder="Section Description (Cheat Sheet)"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => removeSection(uIdx, sIdx)}
                                                className="ml-2 text-duo-muted hover:text-duo-red transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => addSection(uIdx)}
                                    className="w-full py-3 border-2 border-dashed border-duo-border rounded-xl flex items-center justify-center gap-2 text-duo-muted hover:text-duo-text hover:bg-duo-border/20 transition-all"
                                >
                                    <FolderPlus size={18} />
                                    <span className="font-bold text-sm uppercase tracking-widest">Add Section</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add Unit Button */}
                    <button 
                        onClick={addUnit}
                        className="w-full py-6 border-2 border-dashed border-duo-border rounded-3xl flex items-center justify-center gap-3 text-duo-muted hover:text-duo-text hover:bg-duo-border/20 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-duo-border flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold text-lg uppercase tracking-widest">Add New Unit</span>
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // Upload / Start View
  return (
    <div className="min-h-screen bg-duo-bg text-white p-6 pb-20 lg:ml-64 xl:mr-96">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
            <button 
                onClick={onBack}
                className="p-2 hover:bg-duo-border rounded-xl transition-colors"
            >
                <ArrowLeft size={24} className="text-duo-muted" />
            </button>
            <h1 className="text-2xl font-extrabold text-duo-text">Create or Join Course</h1>
        </div>

        {/* AI Upload Section */}
        <div className="bg-duo-card border-2 border-duo-border rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileText size={120} />
            </div>
            
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <span className="text-duo-blue">✨</span> 
                Generate from Document
            </h2>
            <p className="text-duo-muted mb-6">
                Upload a textbook PDF, notes, or an image. AI will analyze it and create a structured single unit with sections.
            </p>

            {/* Inputs for Subject and Language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                    <label className="text-duo-muted font-bold text-xs uppercase tracking-widest">Subject <span className="text-duo-red">*</span></label>
                    <input 
                        type="text" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Calculus, Japanese History"
                        className="w-full bg-duo-bg border-2 border-duo-border rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:border-duo-blue"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-duo-muted font-bold text-xs uppercase tracking-widest">Target Language</label>
                    <input 
                        type="text" 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        placeholder="e.g. English, Spanish"
                        className="w-full bg-duo-bg border-2 border-duo-border rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:border-duo-blue"
                    />
                </div>
            </div>

            <div 
                className={`border-4 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px] ${
                    dragActive ? 'border-duo-blue bg-duo-blue/10' : 'border-duo-border hover:border-duo-muted hover:bg-duo-border/20'
                }`}
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !loading && fileInputRef.current?.click()}
            >
                <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.txt,.md,image/*,application/pdf"
                    onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                />
                
                {loading ? (
                    <div className="flex flex-col items-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-duo-blue opacity-20 blur-xl rounded-full animate-pulse"></div>
                            <Loader2 className="animate-spin text-duo-blue relative z-10" size={64} />
                        </div>
                        <div className="space-y-2">
                            <p className="font-extrabold text-xl text-white">Analyzing Document</p>
                            <p className="text-duo-blue font-bold animate-pulse">Generating your personalized unit...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-6">
                        <div className="w-20 h-20 bg-duo-blue rounded-2xl flex items-center justify-center shadow-lg shadow-duo-blue/20 transform rotate-3 transition-transform group-hover:rotate-6">
                            <Upload className="text-white" size={32} strokeWidth={3} />
                        </div>
                        <div className="space-y-2">
                            <p className="font-extrabold text-2xl">Drag & Drop File</p>
                            <p className="text-duo-muted font-bold">PDF, TXT, or Images (MAX 10MB)</p>
                        </div>
                        <button 
                            className="px-8 py-3 bg-white text-duo-bg font-extrabold rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest text-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                        >
                            Or Select File
                        </button>
                    </div>
                )}
            </div>
            {error && (
                <div className="mt-4 p-4 bg-red-500/10 border-2 border-red-500/20 rounded-2xl text-red-400 font-bold flex items-center justify-center gap-2">
                    <span className="text-xl">⚠️</span> {error}
                </div>
            )}
        </div>

        {/* Manual Section */}
        <div className="bg-duo-card border-2 border-duo-border rounded-3xl p-8 opacity-90 hover:opacity-100 transition-opacity">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <BookPlus className="text-duo-green" /> 
                Create Manually
            </h2>
            <p className="text-duo-muted mb-6">
                Start from scratch. Add units and sections manually.
            </p>
            <button 
                onClick={handleManualStart}
                className="w-full py-4 bg-duo-card border-2 border-duo-border hover:bg-duo-border rounded-xl font-bold text-duo-muted hover:text-duo-text uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
                <PlusCircle size={20} />
                Start Empty Course
            </button>
        </div>

        {/* Join Existing Section */}
        <div className="bg-duo-card border-2 border-duo-border rounded-3xl p-8 opacity-90 hover:opacity-100 transition-opacity">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Users className="text-duo-blue" /> 
                Join Existing Course
            </h2>
            <p className="text-duo-muted mb-6">
                Enter a 6-digit course code to join another classroom as a co-teacher or observer.
            </p>
            <div className="flex gap-4">
                <input 
                    type="text" 
                    placeholder="Course Code" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-duo-bg border-2 border-duo-border rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:border-duo-blue placeholder-duo-muted"
                    maxLength={6}
                />
                <button 
                    onClick={() => onJoinCourse(joinCode)}
                    disabled={joining || joinCode.length < 6}
                    className="px-8 py-3 bg-duo-blue hover:bg-duo-blueHover text-white font-extrabold rounded-xl border-b-4 border-blue-600 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest disabled:opacity-50 disabled:active:border-b-4 disabled:active:translate-y-0"
                >
                    {joining ? '...' : 'Join'}
                </button>
            </div>
            {joinError && (
                <div className="mt-4 text-duo-red font-bold flex items-center gap-2">
                    <span>⚠️</span> {joinError}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default AddCourseScreen;
