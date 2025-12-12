
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Heart, ArrowRight, XCircle, RefreshCw, MoveHorizontal, ArrowUp } from 'lucide-react';
import { generateQuiz } from '../services/geminiService';
import { GeneratedExercise, GameState, Lesson } from '../types';

interface ExerciseModalProps {
  lesson: Lesson;
  difficulty: string;
  hearts: number;
  onClose: () => void;
  onComplete: (xpEarned: number, heartsRecovered: boolean, score: number, totalQuestions: number, coveredConcepts: string[]) => void;
  onLoseHeart: () => void;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({ lesson, difficulty, hearts, onClose, onComplete, onLoseHeart }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [questions, setQuestions] = useState<GeneratedExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // -- Shared State --
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [questionMistake, setQuestionMistake] = useState(false); // Track if a mistake was made on current question

  // -- Exercise Type Specific State --
  // MCQ & Fill Blank
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Matching
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set()); // Stores "item:match" strings
  const [shuffledLeft, setShuffledLeft] = useState<{id: string, text: string}[]>([]);
  const [shuffledRight, setShuffledRight] = useState<{id: string, text: string}[]>([]);
  const [wrongSelection, setWrongSelection] = useState<{left: string | null, right: string | null}>({left: null, right: null});
  
  // Ordering
  const [orderSegments, setOrderSegments] = useState<{id: number, text: string}[]>([]);
  const [orderedSlots, setOrderedSlots] = useState<{id: number, text: string}[]>([]);

  // Constants
  const isPracticeMode = lesson.status === 'completed';
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await generateQuiz(
            lesson.sectionTitle || 'General', 
            lesson.sectionDescription || '', 
            difficulty,
            lesson.topic || 'General' 
        );
        setQuestions(data);
        setGameState(GameState.PLAYING);
      } catch (error) {
        console.error(error);
        setGameState(GameState.ERROR);
      }
    };
    fetchQuiz();
  }, [lesson, difficulty]);

  // Reset internal state when question changes
  useEffect(() => {
    if (!currentQuestion) return;

    setIsChecked(false);
    setIsCorrect(false);
    setSelectedOption(null);
    setQuestionMistake(false);
    setWrongSelection({left: null, right: null});
    
    // Reset Matching State
    if (currentQuestion.type === 'MATCHING' && currentQuestion.pairs) {
        setMatchedPairs(new Set());
        setSelectedLeft(null);
        // Shuffle pairs
        const left = currentQuestion.pairs.map(p => ({ id: p.item, text: p.item }));
        const right = currentQuestion.pairs.map(p => ({ id: p.item, text: p.match })); // Use item as ID to link
        
        setShuffledLeft(left.sort(() => Math.random() - 0.5));
        setShuffledRight(right.sort(() => Math.random() - 0.5));
    }

    // Reset Ordering State
    if (currentQuestion.type === 'ORDERING' && currentQuestion.segments) {
        const segs = currentQuestion.segments.map((text, i) => ({ id: i, text }));
        setOrderSegments(segs.sort(() => Math.random() - 0.5));
        setOrderedSlots([]);
    }

  }, [currentIndex, questions]);

  useEffect(() => {
    if (hearts <= 0 && !isPracticeMode && gameState === GameState.PLAYING) {
        setGameState(GameState.GAME_OVER);
    }
  }, [hearts, isPracticeMode, gameState]);

  // -- Interaction Handlers --

  const handleMatchingClick = (side: 'left' | 'right', item: {id: string, text: string}) => {
      if (isChecked || wrongSelection.left || wrongSelection.right) return; // Locked during check or animation

      if (side === 'left') {
          // If already matched, ignore
          if (matchedPairs.has(item.id)) return;
          setSelectedLeft(item.id);
      } else {
          // Right side click
          if (!selectedLeft) return; // Must select left first (simplification)
          if (matchedPairs.has(item.id)) return;

          // Check match
          if (selectedLeft === item.id) {
              // Correct Match
              setMatchedPairs(prev => new Set(prev).add(item.id));
              setSelectedLeft(null);
          } else {
              // Wrong match
              const currentLeft = selectedLeft;
              setWrongSelection({left: currentLeft, right: item.id});
              setQuestionMistake(true);
              
              if (!isPracticeMode) {
                   onLoseHeart();
              }

              // Reset after visual feedback
              setTimeout(() => {
                  setWrongSelection({left: null, right: null});
                  setSelectedLeft(null);
              }, 1000);
          }
      }
  };

  const handleOrderingClick = (item: {id: number, text: string}, from: 'bank' | 'slots') => {
      if (isChecked) return;

      if (from === 'bank') {
          setOrderSegments(prev => prev.filter(i => i.id !== item.id));
          setOrderedSlots(prev => [...prev, item]);
      } else {
          setOrderedSlots(prev => prev.filter(i => i.id !== item.id));
          setOrderSegments(prev => [...prev, item]);
      }
  };

  const handleCheck = () => {
    let correct = false;

    if (currentQuestion.type === 'MATCHING') {
        // Correct if all pairs are matched
        correct = matchedPairs.size === (currentQuestion.pairs?.length || 0);
    } 
    else if (currentQuestion.type === 'ORDERING') {
        // Correct if ordered slots match the original segments string
        const userOrder = orderedSlots.map(s => s.text).join(' ');
        const correctOrder = currentQuestion.segments?.join(' ');
        correct = userOrder === correctOrder;
    }
    else {
        // MCQ & Fill Blank
        if (!selectedOption) return;
        correct = selectedOption === currentQuestion.correctAnswer;
    }
    
    setIsCorrect(correct);
    setIsChecked(true);

    if (correct) {
        // Only give full score credit if no mistakes were made (perfect run)
        // For matching, this means no mismatches. For others, checks happen once anyway.
        if (!questionMistake) {
            setScore(prev => prev + 1);
        }
    } else {
        if (!isPracticeMode) {
             onLoseHeart();
        }
    }
  };

  const handleNext = () => {
      if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
      } else {
          // Check Pass/Fail Score
          const percentage = (score / questions.length) * 100;
          if (percentage >= 70) {
              setGameState(GameState.SUCCESS);
          } else {
              setGameState(GameState.FAILED);
          }
      }
  };

  const getCoveredConcepts = () => {
      const concepts = new Set(questions.map(q => q.concept));
      return Array.from(concepts);
  };

  const getButtonState = () => {
      if (currentQuestion.type === 'MATCHING') {
          return matchedPairs.size === (currentQuestion.pairs?.length || 0);
      }
      if (currentQuestion.type === 'ORDERING') {
          return orderedSlots.length === (currentQuestion.segments?.length || 0);
      }
      return !!selectedOption;
  };

  // -- RENDER STATES --

  if (gameState === GameState.LOADING) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-duo-green"></div>
            <p className="text-white font-bold text-lg animate-pulse">Generating {difficulty} exercises...</p>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-duo-bg border-2 border-duo-border rounded-3xl p-8 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-24 h-24 bg-duo-border rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-12 h-12 text-duo-red fill-current opacity-50" />
                </div>
                <h2 className="text-3xl font-extrabold text-duo-red">Out of Hearts!</h2>
                <p className="text-duo-muted text-lg font-bold">
                    You made too many mistakes. Wait for hearts to refill or practice completed lessons.
                </p>
                <div className="space-y-3">
                     <button 
                        onClick={onClose}
                        className="w-full py-3 bg-duo-blue hover:bg-duo-blueHover text-white font-extrabold rounded-2xl border-b-4 border-blue-600 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
      );
  }

  if (gameState === GameState.FAILED) {
      const percentage = Math.round((score / questions.length) * 100);
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-duo-bg border-2 border-duo-border rounded-3xl p-8 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-24 h-24 bg-duo-border rounded-full flex items-center justify-center mx-auto mb-4 relative">
                     <div className="absolute inset-0 bg-duo-red/20 rounded-full animate-pulse"></div>
                    <XCircle className="w-12 h-12 text-duo-red" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-extrabold text-duo-text">Lesson Failed</h2>
                    <p className="text-duo-muted text-lg font-bold">
                        You scored {percentage}%. You need 70% to pass.
                    </p>
                </div>
                <button 
                    onClick={() => onComplete(5, false, score, questions.length, getCoveredConcepts())}
                    className="w-full py-4 bg-duo-blue hover:bg-duo-blueHover text-white font-extrabold rounded-2xl border-b-4 border-blue-600 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <RefreshCw size={20} />
                    Continue
                </button>
            </div>
        </div>
      );
  }

  if (gameState === GameState.SUCCESS) {
      const xpEarned = score * 2 + (isPracticeMode ? 5 : 10);
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-duo-bg border-2 border-duo-border rounded-3xl p-8 max-w-md w-full text-center space-y-8 animate-bounce-in">
                <div className="relative">
                    <div className="absolute inset-0 bg-duo-yellow blur-2xl opacity-20 rounded-full"></div>
                    <CheckCircle className="w-24 h-24 text-duo-yellow mx-auto relative z-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-extrabold text-duo-yellow">Lesson Complete!</h2>
                    <p className="text-duo-text font-bold text-lg">
                        You scored {score} out of {questions.length}
                    </p>
                </div>
                <div className="flex justify-center gap-4">
                    <div className="bg-duo-card border-2 border-duo-border p-4 rounded-2xl w-32">
                        <p className="text-duo-muted font-bold text-xs uppercase">Total XP</p>
                        <p className="text-2xl font-extrabold text-duo-yellow">+{xpEarned}</p>
                    </div>
                </div>
                <button 
                    onClick={() => onComplete(xpEarned, isPracticeMode, score, questions.length, getCoveredConcepts())}
                    className="w-full py-4 bg-duo-green hover:bg-duo-greenHover text-white font-extrabold rounded-2xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest"
                >
                    Continue
                </button>
            </div>
        </div>
      );
  }

  const progressPercent = ((currentIndex) / questions.length) * 100;
  const isButtonDisabled = !getButtonState();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-duo-bg">
        {/* Header */}
        <div className="p-4 flex items-center justify-between max-w-3xl mx-auto w-full gap-4">
          <X 
            className="text-duo-muted hover:text-duo-text cursor-pointer transition-colors" 
            size={28} 
            strokeWidth={3}
            onClick={onClose}
          />
          <div className="flex-1 bg-duo-border rounded-full h-4 relative overflow-hidden">
            <div 
                className="bg-duo-green h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
            >
                <div className="absolute top-1 right-2 w-2/3 h-1 bg-white/20 rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
               <Heart className="text-duo-red fill-current animate-pulse" size={24} />
               <span className="text-duo-red font-bold text-xl">{hearts}</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-40">
            <div className="max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in slide-in-from-right duration-300" key={currentIndex}>
                
                <h2 className="text-2xl font-bold text-duo-muted text-center max-w-lg">
                    {currentQuestion?.question}
                </h2>

                {/* --- RENDER LOGIC BASED ON TYPE --- */}

                {/* 1. MATCHING */}
                {currentQuestion.type === 'MATCHING' && (
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="space-y-3">
                            {shuffledLeft.map(item => {
                                const isMatched = matchedPairs.has(item.id);
                                const isSelected = selectedLeft === item.id;
                                const isWrong = wrongSelection.left === item.id;
                                
                                return (
                                    <button 
                                        key={item.id}
                                        disabled={isMatched || isChecked || !!wrongSelection.left}
                                        onClick={() => handleMatchingClick('left', item)}
                                        className={`w-full p-4 rounded-xl border-2 border-b-4 font-bold text-sm transition-all ${
                                            isMatched 
                                                ? 'bg-duo-bg border-transparent text-duo-muted opacity-50'
                                                : isWrong
                                                    ? 'bg-duo-red/20 border-duo-red text-duo-red animate-pulse'
                                                : isSelected
                                                    ? 'bg-duo-blue/20 border-duo-blue text-duo-blue'
                                                    : 'bg-duo-card border-duo-border text-white hover:bg-duo-border/50'
                                        }`}
                                    >
                                        {item.text}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="space-y-3">
                            {shuffledRight.map(item => {
                                const isMatched = matchedPairs.has(item.id);
                                const isWrong = wrongSelection.right === item.id;
                                
                                return (
                                    <button 
                                        key={item.id}
                                        disabled={isMatched || isChecked || !!wrongSelection.right}
                                        onClick={() => handleMatchingClick('right', item)}
                                        className={`w-full p-4 rounded-xl border-2 border-b-4 font-bold text-sm transition-all ${
                                            isMatched 
                                                ? 'bg-duo-green/20 border-duo-green text-duo-green'
                                                : isWrong
                                                    ? 'bg-duo-red/20 border-duo-red text-duo-red animate-pulse'
                                                : 'bg-duo-card border-duo-border text-white hover:bg-duo-border/50'
                                        }`}
                                    >
                                        {item.text}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 2. ORDERING */}
                {currentQuestion.type === 'ORDERING' && (
                    <div className="w-full space-y-8">
                        {/* Slots */}
                        <div className="flex flex-wrap gap-2 min-h-[80px] p-4 bg-duo-border/20 rounded-2xl border-2 border-duo-border items-center justify-center">
                            {orderedSlots.map((item, idx) => (
                                <button
                                    key={idx}
                                    disabled={isChecked}
                                    onClick={() => handleOrderingClick(item, 'slots')}
                                    className="px-4 py-2 bg-duo-blue text-white font-bold rounded-xl border-b-4 border-blue-700 active:translate-y-1 active:border-b-0"
                                >
                                    {item.text}
                                </button>
                            ))}
                            {orderedSlots.length === 0 && (
                                <span className="text-duo-muted font-bold opacity-50">Tap words below to order</span>
                            )}
                        </div>

                        {/* Word Bank */}
                        <div className="flex flex-wrap gap-3 justify-center">
                            {orderSegments.map((item) => (
                                <button
                                    key={item.id}
                                    disabled={isChecked}
                                    onClick={() => handleOrderingClick(item, 'bank')}
                                    className="px-4 py-3 bg-duo-card border-2 border-duo-border border-b-4 text-white font-bold rounded-xl hover:bg-duo-border/50 active:translate-y-1 active:border-b-2"
                                >
                                    {item.text}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. FILL IN BLANK */}
                {currentQuestion.type === 'FILL_IN_THE_BLANK' && (
                    <div className="w-full space-y-8">
                         <div className="p-8 border-2 border-duo-border rounded-3xl bg-duo-card w-full text-center relative">
                            {/* Speech bubble tail */}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-duo-card border-r-2 border-b-2 border-duo-border rotate-45"></div>
                            
                            <p className="text-2xl font-extrabold text-white leading-relaxed">
                                {currentQuestion.question.split('[BLANK]').map((part, i, arr) => (
                                    <React.Fragment key={i}>
                                        {part}
                                        {i < arr.length - 1 && (
                                            <span className={`inline-block px-3 min-w-[80px] border-b-4 mx-2 ${
                                                selectedOption 
                                                    ? 'text-duo-blue border-duo-blue' 
                                                    : 'text-transparent border-duo-muted'
                                            }`}>
                                                {selectedOption || '____'}
                                            </span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 w-full">
                            {currentQuestion.options?.map((option, idx) => (
                                <button
                                    key={idx}
                                    disabled={isChecked}
                                    onClick={() => setSelectedOption(option)}
                                    className={`p-4 rounded-2xl border-2 border-b-4 font-bold text-lg text-center transition-all active:translate-y-1 active:border-b-2 ${
                                        selectedOption === option
                                            ? "bg-duo-blue/20 border-duo-blue text-duo-blue"
                                            : "bg-duo-card border-duo-border text-white hover:bg-duo-border/50"
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. MULTIPLE CHOICE (Legacy/Default) */}
                {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                     <div className="w-full space-y-6">
                        <div className="p-6 md:p-10 border-2 border-duo-border rounded-3xl bg-duo-card w-full text-center min-h-[200px] flex items-center justify-center shadow-lg">
                            <p className="text-2xl md:text-3xl font-extrabold text-white leading-relaxed">
                                {currentQuestion?.question}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 w-full">
                            {currentQuestion?.options?.map((option, idx) => {
                                let styleClass = "bg-duo-card border-duo-border text-white hover:bg-duo-border/50";
                                
                                if (isChecked) {
                                    if (option === currentQuestion.correctAnswer) {
                                        styleClass = "bg-duo-green/20 border-duo-green text-duo-green";
                                    } else if (option === selectedOption && selectedOption !== currentQuestion.correctAnswer) {
                                        styleClass = "bg-duo-red/20 border-duo-red text-duo-red";
                                    } else {
                                        styleClass = "opacity-50 border-duo-border bg-duo-card";
                                    }
                                } else if (selectedOption === option) {
                                    styleClass = "bg-duo-blue/20 border-duo-blue text-duo-blue";
                                }

                                return (
                                    <button
                                        key={idx}
                                        disabled={isChecked}
                                        onClick={() => setSelectedOption(option)}
                                        className={`p-4 rounded-2xl border-2 border-b-4 font-bold text-lg text-left transition-all active:translate-y-1 active:border-b-2 ${styleClass}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{option}</span>
                                            {isChecked && option === currentQuestion.correctAnswer && <CheckCircle size={20} />}
                                            {isChecked && option === selectedOption && option !== currentQuestion.correctAnswer && <X size={20} />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>

        {/* Footer / Feedback Sheet */}
        <div className={`fixed bottom-0 left-0 right-0 border-t-2 border-duo-border p-4 pb-8 transition-colors duration-300 z-50 ${
            isChecked 
                ? (isCorrect ? 'bg-duo-bg border-duo-green' : 'bg-duo-bg border-duo-red') 
                : 'bg-duo-bg'
        }`}>
            <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                
                {isChecked && (
                    <div className="flex items-center gap-4 w-full md:w-auto animate-in slide-in-from-bottom-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-duo-green text-white' : 'bg-duo-red text-white'}`}>
                            {isCorrect ? <CheckCircle size={24} /> : <X size={24} />}
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-extrabold text-xl ${isCorrect ? 'text-duo-green' : 'text-duo-red'}`}>
                                {isCorrect ? 'Excellent!' : 'Correct solution:'}
                            </h3>
                            {!isCorrect && (
                                <div className="text-duo-red font-bold">
                                    {currentQuestion.type === 'ORDERING' 
                                        ? currentQuestion.segments?.join(' ') 
                                        : currentQuestion.type === 'MATCHING'
                                            ? 'Match the pairs correctly'
                                            : currentQuestion.correctAnswer
                                    }
                                </div>
                            )}
                            {isCorrect && currentQuestion?.explanation && (
                                <p className="text-duo-green font-bold text-sm opacity-90">{currentQuestion.explanation}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className={`w-full md:w-auto ${isChecked ? '' : 'ml-auto'}`}>
                    {!isChecked ? (
                        <button
                            disabled={isButtonDisabled}
                            onClick={handleCheck}
                            className={`w-full md:w-48 py-3 rounded-xl font-extrabold border-b-4 transition-all uppercase tracking-widest ${
                                !isButtonDisabled 
                                ? 'bg-duo-green hover:bg-duo-greenHover text-white border-green-700 cursor-pointer active:translate-y-1 active:border-b-0' 
                                : 'bg-duo-border text-duo-muted border-transparent cursor-not-allowed'
                            }`}
                        >
                            Check
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className={`w-full md:w-48 py-3 rounded-xl font-extrabold border-b-4 transition-all uppercase tracking-widest text-white active:translate-y-1 active:border-b-0 ${
                                isCorrect 
                                ? 'bg-duo-green hover:bg-duo-greenHover border-green-700' 
                                : 'bg-duo-red hover:bg-red-500 border-red-700'
                            }`}
                        >
                            {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ExerciseModal;
