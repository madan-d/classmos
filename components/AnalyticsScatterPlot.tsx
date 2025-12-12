import React from 'react';
import { User } from '../types';

export interface AnalyticStudent extends User {
    category?: 'Top Performer' | 'Consistent Learner' | 'Needs Support';
    is_at_risk?: boolean;
}

interface AnalyticsScatterPlotProps {
    students: AnalyticStudent[];
}

export const AnalyticsScatterPlot: React.FC<AnalyticsScatterPlotProps> = ({ students }) => {
    if (!students || students.length < 2) {
        return (
            <div className="h-64 flex items-center justify-center text-duo-muted font-bold bg-duo-bg rounded-xl border-2 border-duo-border border-dashed">
                Not enough data for classification
            </div>
        );
    }

    // Dimensions
    const width = 600;
    const height = 300;
    const padding = 40;

    // Scales
    // Accuracy 0-100 x-axis
    // Elo 0-Max y-axis (default around 800-1200)

    const minElo = Math.min(...students.map(s => s.elo || 800)) - 50;
    const maxElo = Math.max(...students.map(s => s.elo || 800)) + 50;
    const eloRange = maxElo - minElo || 100;

    const getX = (accuracy: number) => padding + (accuracy / 100) * (width - 2 * padding);
    const getY = (elo: number) => height - padding - ((elo - minElo) / eloRange) * (height - 2 * padding);

    const getColor = (category?: string) => {
        switch (category) {
            case 'Top Performer': return '#58cc02'; // Green
            case 'Consistent Learner': return '#20bef6'; // Blue
            case 'Needs Support': return '#ff4b4b'; // Red
            default: return '#afafaf'; // Grey
        }
    };

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-[600px] select-none relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                    {/* Grid & Axes */}
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#52656d" strokeWidth="2" />
                    <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#52656d" strokeWidth="2" />

                    {/* Y Axis Labels */}
                    <text x={padding - 10} y={height - padding} textAnchor="end" className="text-[10px] fill-duo-muted font-bold">{Math.round(minElo)}</text>
                    <text x={padding - 10} y={padding} textAnchor="end" className="text-[10px] fill-duo-muted font-bold">{Math.round(maxElo)}</text>
                    <text x={padding - 10} y={height / 2} textAnchor="middle" transform={`rotate(-90 ${padding - 15} ${height / 2})`} className="text-[10px] fill-duo-muted font-bold uppercase tracking-widest">Elo Rating</text>

                    {/* X Axis Labels */}
                    <text x={padding} y={height - padding + 20} textAnchor="middle" className="text-[10px] fill-duo-muted font-bold">0%</text>
                    <text x={width - padding} y={height - padding + 20} textAnchor="middle" className="text-[10px] fill-duo-muted font-bold">100%</text>
                    <text x={width / 2} y={height - padding + 35} textAnchor="middle" className="text-[10px] fill-duo-muted font-bold uppercase tracking-widest">Total Accuracy</text>

                    {/* Points */}
                    {students.map((student) => {
                        const x = getX(student.totalAccuracy || 0);
                        const y = getY(student.elo || 800);
                        const color = getColor(student.category);

                        return (
                            <g key={student.id} className="group">
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={student.is_at_risk ? 8 : 5}
                                    fill={color}
                                    fillOpacity="0.8"
                                    stroke={student.is_at_risk ? "#ffc800" : "white"}
                                    strokeWidth={student.is_at_risk ? 3 : 1}
                                    className="transition-all duration-300 hover:r-8 hover:fill-opacity-100 cursor-pointer"
                                />
                                {/* Tooltip on hover */}
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <rect x={x - 40} y={y - 45} width="80" height="35" rx="8" fill="#1f2937" />
                                    <text x={x} y={y - 28} textAnchor="middle" fill="white" className="text-[10px] font-bold">{student.name}</text>
                                    <text x={x} y={y - 15} textAnchor="middle" fill="#9ca3af" className="text-[8px] font-bold">{student.category}</text>
                                </g>
                            </g>
                        );
                    })}
                </svg>

                {/* Legend */}
                <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-duo-green"></div>
                        <span className="text-xs text-duo-muted font-bold">Top Performer</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-duo-blue"></div>
                        <span className="text-xs text-duo-muted font-bold">Consistent Learner</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-xs text-duo-muted font-bold">Needs Support</span>
                    </div>
                    <div className="flex items-center gap-2 border-l-2 border-duo-border pl-6">
                        <div className="w-3 h-3 rounded-full bg-transparent border-2 border-yellow-400"></div>
                        <span className="text-xs text-yellow-400 font-bold">⚠️ At Risk</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
