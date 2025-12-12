import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface GuidebookModalProps {
    title: string;
    description: string;
    onClose: () => void;
}

const GuidebookModal: React.FC<GuidebookModalProps> = ({ title, description, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-duo-bg border-2 border-duo-border rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b-2 border-duo-border flex justify-between items-center bg-duo-card rounded-t-[22px]">
                    <div className="flex items-center gap-3">
                        <div className="bg-duo-green/20 p-2 rounded-lg">
                            <BookOpen className="text-duo-green" size={24} />
                        </div>
                        <h2 className="text-xl font-extrabold text-duo-text uppercase tracking-widest">{title} Guidebook</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-duo-muted hover:text-duo-text transition-colors p-1 rounded-lg hover:bg-duo-border/50"
                    >
                        <X size={28} strokeWidth={3} />
                    </button>
                </div>
                
                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-duo-bg">
                    {description ? (
                        <div className="prose prose-invert max-w-none prose-lg">
                             <div className="bg-duo-card border-2 border-duo-border rounded-2xl p-6 shadow-sm">
                                <h3 className="text-duo-green font-extrabold text-sm uppercase tracking-widest mb-4">Key Concepts</h3>
                                <p className="text-duo-text whitespace-pre-wrap leading-relaxed font-medium text-lg">
                                    {description}
                                </p>
                             </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-duo-muted">
                            <BookOpen size={48} className="mb-4 opacity-50" />
                            <p className="font-bold text-lg">No guidebook content available for this section.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t-2 border-duo-border bg-duo-bg rounded-b-[22px]">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-duo-green hover:bg-duo-greenHover text-white font-extrabold rounded-xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuidebookModal;