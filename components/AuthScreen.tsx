
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { db } from '../services/db';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { User, UserRole } from '../types';
import { GraduationCap, School } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: Partial<User>) => void; // Passing partial user initially
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        // App.tsx auth listener will handle the rest
      } else {
        if (!name || !email || !password) {
            setError('All fields are required');
            setLoading(false);
            return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update display name immediately
        await updateProfile(userCredential.user, { displayName: name });
        
        // Create the user in Firestore explicitly to save the ROLE
        // This ensures the role is saved before App.tsx listener fires or immediately after
        await db.users.create({
            id: userCredential.user.uid,
            name: name,
            email: email,
            role: role
        });

        // App.tsx auth listener will handle the rest (syncing)
      }
    } catch (err: any) {
      console.error(err);
      let msg = 'An error occurred';
      if (err.code === 'auth/invalid-email') msg = 'Invalid email address';
      if (err.code === 'auth/user-disabled') msg = 'User disabled';
      if (err.code === 'auth/user-not-found') msg = 'User not found';
      if (err.code === 'auth/wrong-password') msg = 'Wrong password';
      if (err.code === 'auth/email-already-in-use') msg = 'Email already in use';
      if (err.code === 'auth/weak-password') msg = 'Password is too weak';
      if (err.code === 'auth/invalid-credential') msg = 'Invalid credentials';
      setError(msg);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // App.tsx auth listener will handle user creation (defaulting to Student)
    } catch (err: any) {
        console.error("Google Auth Error:", err);
        let msg = 'Failed to sign in with Google';
        
        // Handle specific error codes
        if (err.code === 'auth/unauthorized-domain') {
            msg = `Domain (${window.location.hostname}) is not authorized. Add it to Firebase Console > Authentication > Settings > Authorized Domains.`;
        } else if (err.code === 'auth/popup-closed-by-user') {
            msg = 'Sign-in cancelled.';
        } else if (err.code === 'auth/popup-blocked') {
            msg = 'Popup blocked. Please allow popups for this site.';
        } else if (err.message) {
            // Fallback to error message if code isn't standard
            msg = err.message;
        }

        setError(msg);
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-duo-bg p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-duo-green/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-duo-blue/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center space-y-2">
            <h1 className="text-5xl font-extrabold text-duo-green tracking-tighter mb-2">classmos</h1>
            <p className="text-xl text-duo-muted font-bold">The free, fun, and effective way to learn a language!</p>
        </div>

        <div className="bg-duo-card border-2 border-duo-border rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-white mb-6">
            {isLogin ? 'Log in' : 'Create your profile'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div 
                        onClick={() => setRole('student')}
                        className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${role === 'student' ? 'bg-duo-blue/20 border-duo-blue' : 'bg-duo-bg border-duo-border hover:bg-duo-border/50'}`}
                    >
                        <GraduationCap size={28} className={role === 'student' ? 'text-duo-blue' : 'text-duo-muted'} />
                        <span className={`font-bold text-sm uppercase tracking-widest ${role === 'student' ? 'text-duo-blue' : 'text-duo-muted'}`}>Student</span>
                    </div>
                    <div 
                        onClick={() => setRole('teacher')}
                        className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${role === 'teacher' ? 'bg-duo-green/20 border-duo-green' : 'bg-duo-bg border-duo-border hover:bg-duo-border/50'}`}
                    >
                        <School size={28} className={role === 'teacher' ? 'text-duo-green' : 'text-duo-muted'} />
                        <span className={`font-bold text-sm uppercase tracking-widest ${role === 'teacher' ? 'text-duo-green' : 'text-duo-muted'}`}>Teacher</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#202f36] border-2 border-duo-border rounded-xl px-4 py-3 text-white placeholder-duo-muted focus:outline-none focus:border-duo-blue focus:bg-[#202f36]"
                    />
                </div>
              </>
            )}
            
            <div className="space-y-1">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#202f36] border-2 border-duo-border rounded-xl px-4 py-3 text-white placeholder-duo-muted focus:outline-none focus:border-duo-blue focus:bg-[#202f36]"
              />
            </div>

            <div className="space-y-1">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#202f36] border-2 border-duo-border rounded-xl px-4 py-3 text-white placeholder-duo-muted focus:outline-none focus:border-duo-blue focus:bg-[#202f36]"
              />
            </div>

            {error && (
              <div className="text-duo-red font-bold text-sm text-center bg-duo-red/10 p-2 rounded-lg break-words">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-extrabold text-sm uppercase tracking-widest border-b-4 active:border-b-0 active:translate-y-1 transition-all ${
                isLogin 
                  ? 'bg-duo-blue hover:bg-duo-blueHover text-white border-blue-600'
                  : 'bg-duo-green hover:bg-duo-greenHover text-white border-green-700'
              } ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {loading ? 'Processing...' : (isLogin ? 'Log in' : 'Create Account')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
             <div className="h-0.5 flex-1 bg-duo-border"></div>
             <span className="text-duo-muted font-bold text-sm uppercase">OR</span>
             <div className="h-0.5 flex-1 bg-duo-border"></div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl font-extrabold text-sm uppercase tracking-widest border-2 border-duo-border border-b-4 bg-white hover:bg-gray-50 text-duo-card flex items-center justify-center gap-3 active:border-b-2 active:translate-y-1 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-duo-muted font-bold text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                }}
                className="ml-2 text-duo-blue hover:text-duo-blueHover uppercase tracking-wider"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
