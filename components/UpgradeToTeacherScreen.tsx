
import React from 'react';
import { X, Sparkles, Brain, Users, Zap, Check } from 'lucide-react';

interface UpgradeToTeacherScreenProps {
  onBack: () => void;
}

const FeatureRow = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shrink-0">
            <Icon size={24} className="text-white" />
        </div>
        <div>
            <h3 className="font-extrabold text-white text-lg">{title}</h3>
            <p className="text-duo-muted font-medium text-sm leading-relaxed">{description}</p>
        </div>
    </div>
);

const UpgradeToTeacherScreen: React.FC<UpgradeToTeacherScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#0a0f12] text-white lg:ml-64 xl:mr-96 flex flex-col relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1cb0f6]/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Close Button */}
        <button 
            onClick={onBack}
            className="absolute top-6 left-6 z-20 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors backdrop-blur-md"
        >
            <X size={24} className="text-white" strokeWidth={3} />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 z-10">
            
            {/* Header Content */}
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/50 mb-4 animate-in zoom-in slide-in-from-bottom-4 duration-700">
                    <Sparkles size={16} className="text-indigo-400" />
                    <span className="text-indigo-300 font-extrabold text-xs uppercase tracking-widest">Teacher Exclusive</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-200 animate-in slide-in-from-bottom-8 duration-700">
                    Create Your Own Curriculum
                </h1>
                <p className="text-xl text-duo-muted font-bold max-w-lg mx-auto animate-in slide-in-from-bottom-10 duration-700">
                    Unlock the power of AI to generate custom courses, manage classrooms, and track detailed analytics.
                </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full mb-12 animate-in slide-in-from-bottom-12 duration-700 delay-100">
                <FeatureRow 
                    icon={Brain} 
                    title="AI Course Generation" 
                    description="Upload textbooks or notes and let Gemini AI build a complete gamified learning path in seconds." 
                />
                <FeatureRow 
                    icon={Users} 
                    title="Classroom Management" 
                    description="Assign specific units to students and track their progress in real-time." 
                />
                <FeatureRow 
                    icon={Zap} 
                    title="Unlimited Customization" 
                    description="Edit every single question, exercise, and grammar tip to fit your teaching style." 
                />
                <FeatureRow 
                    icon={Check} 
                    title="Detailed Analytics" 
                    description="View accuracy rates, retention scores, and identify struggling students instantly." 
                />
            </div>

            {/* Pricing / CTA Card */}
            <div className="bg-gradient-to-b from-[#18252b] to-[#131f24] border-2 border-duo-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative animate-in zoom-in duration-500 delay-200">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2 rounded-xl border-4 border-[#0a0f12] shadow-lg">
                    <span className="font-extrabold text-white text-sm uppercase tracking-widest">Most Popular</span>
                </div>

                <h2 className="text-2xl font-extrabold text-white mb-2">Classmos for Teachers</h2>
                <div className="flex justify-center items-baseline mb-6">
                    <span className="text-4xl font-extrabold text-white">$0</span>
                    <span className="text-duo-muted font-bold ml-2">/ month</span>
                </div>

                <div className="space-y-3 mb-8">
                    <button className="w-full py-4 rounded-xl font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-b-4 border-purple-800 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest shadow-lg shadow-purple-900/20">
                        Upgrade Now
                    </button>
                    <button 
                        onClick={onBack}
                        className="w-full py-3 rounded-xl font-bold text-duo-muted hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest text-sm"
                    >
                        No Thanks
                    </button>
                </div>

                <p className="text-xs text-duo-muted font-bold">
                    * This is a demo. You can create a new account with the "Teacher" role to access these features for free.
                </p>
            </div>
        </div>
    </div>
  );
};

export default UpgradeToTeacherScreen;
