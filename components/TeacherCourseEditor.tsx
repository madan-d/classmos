
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Plus, FolderPlus, X, Copy, Check, AlertTriangle } from 'lucide-react';
import { CourseStructure } from '../types';
import { db } from '../services/db';

interface TeacherCourseEditorProps {
  courseId: string;
  onBack: () => void;
}

const TeacherCourseEditor: React.FC<TeacherCourseEditorProps> = ({ courseId, onBack }) => {
  const [structure, setStructure] = useState<CourseStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<number | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await db.courses.getStructure(courseId);
        if (data) {
          setStructure(data);
        }
      } catch (e) {
        console.error("Failed to load course", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const handleSave = async () => {
    if (!structure) return;
    setSaving(true);
    try {
      await db.courses.saveStructure(courseId, structure);
      alert("Course updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const copyCode = () => {
      if (structure?.code) {
          navigator.clipboard.writeText(structure.code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  // Editing Logic - Using Functional Updates for reliability
  const handleUnitChange = (index: number, field: 'title' | 'description', val: string) => {
      setStructure(prev => {
          if (!prev) return null;
          const newUnits = [...prev.units];
          newUnits[index] = { ...newUnits[index], [field]: val };
          return { ...prev, units: newUnits };
      });
  };

  const addUnit = () => {
      setStructure(prev => {
          if (!prev) return null;
          const newUnits = [...prev.units];
          newUnits.push({
              title: `Unit ${newUnits.length + 1}`,
              description: "New Unit Description",
              sections: [
                  { title: "Section 1", description: "New Section Content" }
              ]
          });
          return { ...prev, units: newUnits };
      });
  };

  const removeUnit = (index: number) => {
      setUnitToDelete(index);
  };

  const confirmDeleteUnit = () => {
      if (unitToDelete === null) return;

      setStructure(prev => {
          if (!prev) return null;
          const newUnits = [...prev.units];
          newUnits.splice(unitToDelete, 1);
          return { ...prev, units: newUnits };
      });
      setUnitToDelete(null);
  };

  const addSection = (unitIndex: number) => {
      setStructure(prev => {
          if (!prev) return null;
          const newUnits = [...prev.units];
          
          // Deep copy
          const newSections = [...newUnits[unitIndex].sections];
          newSections.push({
              title: "New Section",
              description: "Content for this section"
          });

          newUnits[unitIndex] = {
              ...newUnits[unitIndex],
              sections: newSections
          };

          return { ...prev, units: newUnits };
      });
  };

  const removeSection = (unitIndex: number, sectionIndex: number) => {
      setStructure(prev => {
          if (!prev) return null;
          const newUnits = [...prev.units];

          // Deep copy
          const newSections = [...newUnits[unitIndex].sections];
          newSections.splice(sectionIndex, 1);

          newUnits[unitIndex] = {
              ...newUnits[unitIndex],
              sections: newSections
          };
          
          return { ...prev, units: newUnits };
      });
  };

  const handleSectionChange = (unitIndex: number, sectionIndex: number, field: 'title' | 'description', val: string) => {
      setStructure(prev => {
          if (!prev) return null;
          const newUnits = [...prev.units];
          
          // Deep copy
          const newSections = [...newUnits[unitIndex].sections];
          newSections[sectionIndex] = { ...newSections[sectionIndex], [field]: val };

          newUnits[unitIndex] = {
              ...newUnits[unitIndex],
              sections: newSections
          };

          return { ...prev, units: newUnits };
      });
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-duo-bg flex items-center justify-center lg:ml-64 xl:mr-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-duo-green"></div>
        </div>
     );
  }

  if (!structure) {
      return (
          <div className="min-h-screen bg-duo-bg text-white p-8 lg:ml-64 xl:mr-96 flex flex-col items-center justify-center">
              <p className="text-xl font-bold mb-4">Course not found</p>
              <button onClick={onBack} className="text-duo-blue font-bold uppercase">Go Back</button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-duo-bg text-white pb-20 lg:ml-64 xl:mr-96">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-duo-bg/95 backdrop-blur border-b-2 border-duo-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 hover:bg-duo-border rounded-xl transition-colors text-duo-muted hover:text-white"
                >
                    <ArrowLeft size={24} strokeWidth={3} />
                </button>
                <h1 className="text-xl font-extrabold text-white truncate max-w-[200px] md:max-w-md">
                    {structure.courseTitle}
                </h1>
            </div>
            <button 
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-duo-green hover:bg-duo-greenHover text-white font-extrabold rounded-xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 uppercase tracking-widest text-sm"
            >
                {saving ? 'Saving...' : (
                    <>
                        <Save size={18} /> Save
                    </>
                )}
            </button>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-8">
            
            {/* Code Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-indigo-200 font-bold text-sm uppercase tracking-widest mb-1">Student Join Code</h2>
                        <div className="text-4xl font-black text-white tracking-wider">{structure.code || 'NO-CODE'}</div>
                        <p className="text-indigo-100 text-sm mt-2 font-medium">Share this code with your students to let them join this course.</p>
                    </div>
                    <button 
                        onClick={copyCode}
                        className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-4 rounded-xl font-extrabold uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                        {copied ? <Check size={20} /> : <Copy size={20} />}
                        {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="space-y-6">
                 <div className="flex items-center justify-between">
                     <h3 className="text-duo-muted font-extrabold uppercase tracking-widest">Course Structure</h3>
                 </div>

                 {structure.units.map((unit, uIdx) => (
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
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeUnit(uIdx); }}
                                className="ml-4 p-2 text-duo-border hover:text-duo-red hover:bg-duo-red/10 rounded-xl transition-colors z-10"
                                title="Delete Unit"
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
                                            <div className="space-y-1">
                                                <label className="text-duo-muted font-bold text-[10px] uppercase tracking-widest">Section Title</label>
                                                <input 
                                                    type="text" 
                                                    value={section.title}
                                                    onChange={(e) => handleSectionChange(uIdx, sIdx, 'title', e.target.value)}
                                                    className="w-full bg-duo-bg border border-duo-border rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-duo-blue"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-duo-muted font-bold text-[10px] uppercase tracking-widest">Content Source</label>
                                                <textarea 
                                                    value={section.description}
                                                    onChange={(e) => handleSectionChange(uIdx, sIdx, 'description', e.target.value)}
                                                    className="w-full bg-duo-bg border border-duo-border rounded-lg px-3 py-2 text-sm text-duo-muted focus:text-white focus:outline-none focus:border-duo-blue min-h-[80px]"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeSection(uIdx, sIdx); }}
                                            className="ml-2 text-duo-muted hover:text-duo-red transition-colors z-10"
                                            title="Delete Section"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); addSection(uIdx); }}
                                className="w-full py-3 border-2 border-dashed border-duo-border rounded-xl flex items-center justify-center gap-2 text-duo-muted hover:text-duo-text hover:bg-duo-border/20 transition-all"
                            >
                                <FolderPlus size={18} />
                                <span className="font-bold text-sm uppercase tracking-widest">Add Section</span>
                            </button>
                        </div>
                    </div>
                ))}

                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); addUnit(); }}
                    className="w-full py-6 border-2 border-dashed border-duo-border rounded-3xl flex items-center justify-center gap-3 text-duo-muted hover:text-duo-text hover:bg-duo-border/20 transition-all group"
                >
                    <div className="w-10 h-10 rounded-full bg-duo-border flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <span className="font-bold text-lg uppercase tracking-widest">Add New Unit</span>
                </button>
            </div>
        </div>

        {/* Delete Unit Confirmation Modal */}
        {unitToDelete !== null && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
                <div className="bg-duo-bg border-2 border-duo-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6 relative overflow-hidden">
                    <div className="flex flex-col items-center text-center gap-4 relative z-10">
                        <div className="w-20 h-20 bg-duo-red/10 rounded-full flex items-center justify-center border-2 border-duo-red/20 mb-2">
                            <AlertTriangle size={40} className="text-duo-red" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-white">Delete Unit?</h2>
                        <p className="text-duo-muted font-bold text-sm leading-relaxed">
                            Are you sure you want to delete this unit?
                            <br/><br/>
                            This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={confirmDeleteUnit}
                            className="w-full py-3 bg-duo-red hover:bg-red-600 text-white font-extrabold rounded-xl border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-sm"
                        >
                            Yes, Delete
                        </button>
                        <button
                            onClick={() => setUnitToDelete(null)}
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

export default TeacherCourseEditor;
