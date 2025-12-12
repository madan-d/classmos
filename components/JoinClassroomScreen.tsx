
import React, { useState } from 'react';
import { Users } from 'lucide-react';

interface JoinClassroomScreenProps {
  onJoin: (code: string) => void;
  onBack: () => void;
  joining: boolean;
  error?: string;
}

const JoinClassroomScreen: React.FC<JoinClassroomScreenProps> = ({ onJoin, onBack, joining, error }) => {
  const [code, setCode] = useState('');

  return (
    <div className="min-h-screen bg-duo-bg flex flex-col items-center justify-center p-6 lg:ml-64 xl:mr-96 relative">
      <div className="max-w-3xl w-full bg-white rounded-3xl p-8 shadow-xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 mb-2">
            <Users className="text-black" size={24} />
            <h1 className="text-2xl font-extrabold text-black">Join a Classroom</h1>
        </div>
        <p className="text-gray-500 font-bold mb-8 text-lg">
            Enter the 6-digit code provided by your teacher to join a classroom
        </p>

        <div className="flex flex-col md:flex-row gap-4">
            <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code (e.g., ABC123)"
                className="flex-1 bg-gray-100 border-2 border-gray-200 rounded-xl px-6 py-4 text-xl text-black font-bold focus:outline-none focus:border-indigo-500 focus:bg-white placeholder-gray-400 transition-all"
                maxLength={6}
            />
            <button
                onClick={() => code.length >= 6 && onJoin(code)}
                disabled={joining || code.length < 6}
                className={`px-10 py-4 rounded-xl font-extrabold text-white text-lg transition-all uppercase tracking-widest shadow-lg ${
                    joining || code.length < 6
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-500 hover:bg-indigo-600 active:scale-95 shadow-indigo-500/30'
                }`}
            >
                {joining ? 'Joining...' : 'Join'}
            </button>
        </div>
        {error && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-100 rounded-xl text-red-500 font-bold animate-in slide-in-from-top-2">
                {error}
            </div>
        )}
      </div>
      <button 
        onClick={onBack} 
        className="mt-8 text-duo-muted font-bold hover:text-white uppercase tracking-widest text-sm py-2 px-4 hover:bg-white/10 rounded-xl transition-colors"
      >
          Cancel
      </button>
    </div>
  );
};

export default JoinClassroomScreen;
