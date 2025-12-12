import React from 'react';
import { ArrowLeft, Check, Lock, Star } from 'lucide-react';
import { Unit, Lesson } from '../types';

interface UnitsOverviewScreenProps {
    units: Unit[];
    lessons: Lesson[];
    onBack: () => void;
    onContinue: (unitId: number) => void;
}

const UnitsOverviewScreen: React.FC<UnitsOverviewScreenProps> = ({ units, lessons, onBack, onContinue }) => {

    const getUnitStatus = (index: number) => {
        // Unit IDs are 1-based in our mock
        const unitId = index + 1;
        const unitLessons = lessons.filter(l => l.unitId === unitId);

        if (unitLessons.length === 0) return 'locked'; // Or future content

        const allCompleted = unitLessons.every(l => l.status === 'completed');
        if (allCompleted) return 'completed';

        const anyUnlocked = unitLessons.some(l => l.status !== 'locked');
        if (anyUnlocked) return 'active';

        return 'locked';
    };

    const getProgress = (unitId: number) => {
        const unitLessons = lessons.filter(l => l.unitId === unitId);
        if (unitLessons.length === 0) return 0;
        const completed = unitLessons.filter(l => l.status === 'completed').length;
        return Math.round((completed / unitLessons.length) * 100);
    };

    return (
        <div className="min-h-screen bg-duo-bg text-white pb-20 lg:ml-64 xl:mr-96">
            <div className="max-w-2xl mx-auto p-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 sticky top-0 bg-duo-bg/95 z-10 py-4 border-b-2 border-duo-border">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-duo-muted hover:text-duo-text transition-colors font-bold uppercase tracking-widest text-sm"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>
                </div>

                <div className="space-y-6">
                    {units.map((unit, index) => {
                        const status = getUnitStatus(index);
                        const progress = getProgress(index + 1);
                        const isCompleted = status === 'completed';
                        const isActive = status === 'active';
                        const isLocked = status === 'locked';

                        return (
                            <div
                                key={index}
                                className={`rounded-2xl border-2 overflow-hidden relative transition-all ${isLocked
                                    ? 'border-duo-border bg-duo-card opacity-60'
                                    : 'border-duo-border bg-duo-card'
                                    }`}
                            >
                                {/* Header Stripe for Completed/Active */}
                                <div className={`min-h-[6rem] p-6 flex items-start justify-between ${isCompleted ? 'bg-duo-green/20' : (isActive ? 'bg-duo-blue/10' : 'bg-transparent')
                                    }`}>
                                    <div className="space-y-1 z-10">
                                        <h2 className={`text-2xl font-extrabold ${isCompleted ? 'text-duo-green' : (isActive ? 'text-white' : 'text-duo-muted')}`}>
                                            {unit.title}
                                        </h2>
                                        <p className="text-duo-muted font-bold text-sm max-w-[300px]">{unit.description}</p>
                                    </div>
                                    {isCompleted && (
                                        <div className="bg-duo-green text-white text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                            <Check size={14} strokeWidth={4} /> Completed!
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-6 pt-2">
                                    {/* Mascot / Visual */}
                                    <div className="absolute right-4 top-8 opacity-20 pointer-events-none grayscale">
                                        <Star size={120} className={isLocked ? 'text-duo-border' : (isCompleted ? 'text-duo-green' : 'text-duo-blue')} fill="currentColor" />
                                    </div>

                                    {isActive && (
                                        <div className="mb-6 relative z-10">
                                            <div className="flex justify-between text-xs font-bold text-duo-muted mb-2 uppercase tracking-widest">
                                                <span>Progress</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-4 bg-duo-border rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-duo-green transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative z-10">
                                        {isCompleted ? (
                                            <button
                                                onClick={() => onContinue(index + 1)}
                                                className="w-full py-3 rounded-xl border-2 border-duo-border font-bold text-duo-blue hover:bg-duo-border/50 transition-colors uppercase tracking-widest"
                                            >
                                                Review
                                            </button>
                                        ) : isActive ? (
                                            <button
                                                onClick={() => onContinue(index + 1)}
                                                className="w-full py-3 rounded-xl border-b-4 bg-duo-blue hover:bg-duo-blueHover border-blue-600 text-white font-extrabold uppercase tracking-widest active:border-b-0 active:translate-y-1 transition-all shadow-lg shadow-blue-900/20"
                                            >
                                                Continue
                                            </button>
                                        ) : (
                                            <div className="w-full py-3 rounded-xl border-2 border-duo-border border-dashed font-bold text-duo-muted flex items-center justify-center gap-2 uppercase tracking-widest cursor-not-allowed">
                                                <Lock size={16} /> Locked
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default UnitsOverviewScreen;