
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Zap, Target, TrendingUp, X, Flame, Award, Brain } from 'lucide-react';
import { User, Course } from '../types';
import { db } from '../services/db';
import { AnalyticsScatterPlot, AnalyticStudent } from './AnalyticsScatterPlot';

interface CourseAnalyticsScreenProps {
    course: Course | null;
    onBack: () => void;
}

// Reusing StatCard from ProfileScreen style (inline for simplicity)
const StatCard = ({ icon: Icon, value, label, color }: { icon: any, value: string | number, label: string, color: string }) => (
    <div className="bg-duo-card border-2 border-duo-border rounded-2xl p-4 flex items-center space-x-4 flex-1">
        <div className={`${color} p-3 rounded-xl bg-white/5`}>
            <Icon size={24} />
        </div>
        <div>
            <h3 className="font-extrabold text-2xl text-white">{value}</h3>
            <p className="text-duo-muted text-xs font-bold uppercase tracking-widest">{label}</p>
        </div>
    </div>
);

// Simple SVG Graph (reused logic)
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
                {yTicks.map(({ val, y }) => (
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
                <path d={`M${areaPoints} Z`} fill="url(#elo-gradient-analytics)" opacity="0.2" />

                <defs>
                    <linearGradient id="elo-gradient-analytics" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#ffc800" />
                        <stop offset="100%" stopColor="#ffc800" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            {/* X Labels */}
            <div className="flex justify-between text-xs text-duo-muted font-bold mt-2 pl-[40px]">
                <span>Lesson 1</span>
                <span>Current ({history[history.length - 1]})</span>
            </div>
        </div>
    );
};

const StudentDetailModal = ({ student, onClose }: { student: User, onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
        <div className="bg-duo-bg border-2 border-duo-border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b-2 border-duo-border flex justify-between items-center bg-duo-card">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-2 border-duo-border bg-duo-bg overflow-hidden">
                        {student.avatarUrl ? (
                            <img
                                src={student.avatarUrl}
                                className="w-full h-full object-cover"
                                alt={student.name}
                            />
                        ) : (
                            <div className="w-full h-full bg-duo-blue flex items-center justify-center text-white font-extrabold uppercase text-2xl">
                                {student.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-white">{student.name}</h2>
                        <p className="text-duo-muted font-bold text-sm">Student Profile</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-duo-border rounded-xl transition-colors text-duo-muted">
                    <X size={24} />
                </button>
            </div>

            <div className="p-8 space-y-8">
                {/* Key Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard icon={Flame} value={student.streak || 0} label="Streak" color="text-orange-500" />
                    <StatCard icon={Zap} value={student.xp || 0} label="Total XP" color="text-yellow-400" />
                    <StatCard icon={Target} value={`${student.totalAccuracy || 0}%`} label="Accuracy" color="text-duo-green" />
                </div>

                {/* Progress Analysis */}
                <div>
                    <h3 className="text-xl font-extrabold mb-4">Performance Analysis</h3>
                    <div className="bg-duo-card border-2 border-duo-border rounded-2xl p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-duo-muted font-bold text-xs uppercase tracking-widest">
                                    <Brain size={16} /> Knowledge Retention
                                </div>
                                <div className="text-3xl font-extrabold text-duo-blue">{student.retentionRate || 0}%</div>
                            </div>
                            <div className="text-right">
                                <div className="text-duo-muted font-bold text-xs uppercase tracking-widest mb-1">Current Elo</div>
                                <div className="text-2xl font-extrabold text-yellow-500">{student.elo || 800}</div>
                            </div>
                        </div>

                        <div className="pt-4 border-t-2 border-duo-border">
                            <h4 className="text-duo-muted font-bold text-xs uppercase tracking-widest mb-4">Skill Growth (ELO History)</h4>
                            <EloGraph history={student.eloHistory || []} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const CourseAnalyticsScreen: React.FC<CourseAnalyticsScreenProps> = ({ course, onBack }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [analyticStudents, setAnalyticStudents] = useState<AnalyticStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('http://localhost:8000/analytics');
            const data = await res.json();
            if (data.status === 'success') {
                setAnalyticStudents(data.students);
            }
        } catch (e) {
            console.error("Failed to fetch analytics", e);
        }
    };

    useEffect(() => {
        const fetchStudents = async () => {
            if (course) {
                const data = await db.users.getStudentsByCourse(course.id);
                setStudents(data);
            }
            setLoading(false);
        };

        fetchStudents();
        fetchAnalytics();

        const interval = setInterval(fetchAnalytics, 30 * 60 * 1000); // 30 mins
        return () => clearInterval(interval);
    }, [course]);

    // Derived Stats
    const avgAccuracy = students.length > 0
        ? Math.round(students.reduce((acc, s) => acc + (s.totalAccuracy || 0), 0) / students.length)
        : 0;

    const avgXP = students.length > 0
        ? Math.round(students.reduce((acc, s) => acc + (s.xp || 0), 0) / students.length)
        : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-duo-bg flex items-center justify-center lg:ml-64 xl:mr-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-duo-green"></div>
            </div>
        );
    }

    if (!course) return null;

    return (
        <div className="min-h-screen bg-duo-bg text-white pb-20 lg:ml-64 xl:mr-96">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-duo-bg/95 backdrop-blur-sm border-b-2 border-duo-border px-6 py-4 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-duo-border rounded-xl transition-colors text-duo-muted hover:text-white"
                >
                    <ArrowLeft size={24} strokeWidth={3} />
                </button>
                <div>
                    <h1 className="text-xl font-extrabold text-white">{course.title}</h1>
                    <p className="text-xs font-bold text-duo-muted uppercase tracking-widest">Analytics Dashboard</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-8">

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard icon={Users} value={students.length} label="Total Students" color="text-duo-blue" />
                    <StatCard icon={Target} value={`${avgAccuracy}%`} label="Class Accuracy" color="text-duo-green" />
                    <StatCard icon={Zap} value={avgXP} label="Avg XP / Student" color="text-yellow-400" />
                </div>

                {/* Leaderboard Table */}
                <div>
                    <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
                        <TrendingUp /> Student Performance
                    </h2>
                    <div className="bg-duo-card border-2 border-duo-border rounded-3xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-duo-border/30 border-b-2 border-duo-border">
                                    <tr>
                                        <th className="p-4 text-duo-muted font-bold text-xs uppercase tracking-widest">Rank</th>
                                        <th className="p-4 text-duo-muted font-bold text-xs uppercase tracking-widest">Student</th>
                                        <th className="p-4 text-duo-muted font-bold text-xs uppercase tracking-widest">XP</th>
                                        <th className="p-4 text-duo-muted font-bold text-xs uppercase tracking-widest">Accuracy</th>
                                        <th className="p-4 text-duo-muted font-bold text-xs uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-duo-border">
                                    {students.sort((a, b) => (b.xp || 0) - (a.xp || 0)).map((student, index) => (
                                        <tr
                                            key={student.id}
                                            onClick={() => setSelectedStudent(student)}
                                            className="hover:bg-duo-border/30 transition-colors cursor-pointer group"
                                        >
                                            <td className="p-4 font-bold text-duo-muted w-16">#{index + 1}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full border border-duo-border bg-duo-bg overflow-hidden">
                                                        {student.avatarUrl ? (
                                                            <img
                                                                src={student.avatarUrl}
                                                                className="w-full h-full object-cover"
                                                                alt="avatar"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-duo-blue flex items-center justify-center text-white font-bold uppercase text-sm">
                                                                {student.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-white group-hover:text-duo-blue transition-colors">
                                                        {student.name}
                                                    </span>
                                                    {/* Risk Indicator */}
                                                    {analyticStudents.find(a => a.id === student.id)?.is_at_risk && (
                                                        <span className="bg-red-500/10 text-red-500 text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded ml-2 border border-red-500/20">
                                                            ⚠️ At Risk
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-yellow-400">{student.xp || 0}</td>
                                            <td className="p-4 font-bold text-duo-green">{student.totalAccuracy || 0}%</td>
                                            <td className="p-4">
                                                <button className="text-xs font-extrabold uppercase tracking-widest bg-duo-border/50 hover:bg-duo-blue hover:text-white px-3 py-2 rounded-lg transition-all text-duo-muted">
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-duo-muted font-bold">
                                                No students enrolled yet. Share your course code!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Scatter Plot */}
                <div>
                    <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
                        <Target /> Performance Distribution
                    </h2>
                    <div className="bg-duo-card border-2 border-duo-border rounded-3xl p-6 shadow-xl">
                        <AnalyticsScatterPlot students={analyticStudents} />
                    </div>
                </div>
            </div>

            {selectedStudent && (
                <StudentDetailModal
                    student={selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                />
            )}
        </div>
    );
};

export default CourseAnalyticsScreen;
