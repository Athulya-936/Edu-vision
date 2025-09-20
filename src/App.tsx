import React, { useState, useRef, useEffect } from "react";

import {
  BookOpen,
  Upload,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Award,
  Target,
  TrendingUp,
  RotateCcw,
} from "lucide-react";

interface Slide {
  title: string;
  content: string[];
  imagePrompt: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface StudySession {
  slides: Slide[];
  quiz: QuizQuestion[];
  topic: string;
}

const EduVision: React.FC = () => {
  const [currentView, setCurrentView] = useState<
    "upload" | "presentation" | "quiz" | "results"
  >("upload");
  const [studyMaterial, setStudyMaterial] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [score, setScore] = useState(0);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    speechSynthesis.current = window.speechSynthesis;
    return () => {
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
    };
  }, []);

  const generateStudySession = (material: string): StudySession => {
    // AI simulation for generating slides and quiz from study material
    const sentences = material
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 10);
    const topic = sentences[0]?.substring(0, 50) + "..." || "Study Topic";

    const slides: Slide[] = [];
    const chunkSize = Math.ceil(sentences.length / 5);

    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize);
      const slideTitle = `Topic ${Math.floor(i / chunkSize) + 1}`;
      const content = chunk.map((s) => s.trim()).filter((s) => s.length > 5);

      slides.push({
        title: slideTitle,
        content: content.slice(0, 4),
        imagePrompt: `Educational illustration for ${slideTitle.toLowerCase()}`,
      });
    }

    // Generate quiz questions
    const quiz: QuizQuestion[] = [
      {
        question: "What is the main concept discussed in this material?",
        options: [
          "Basic fundamentals and core principles",
          "Advanced theoretical frameworks",
          "Practical applications only",
          "Historical background information",
        ],
        correctAnswer: 0,
        explanation:
          "The material focuses on fundamental concepts and core principles as the foundation for understanding.",
      },
      {
        question: "Which learning approach is most effective for this topic?",
        options: [
          "Memorization only",
          "Active engagement and practice",
          "Passive reading",
          "Group discussions only",
        ],
        correctAnswer: 1,
        explanation:
          "Active engagement and practice help reinforce learning and improve retention of the material.",
      },
      {
        question: "What is the key benefit of visual learning aids?",
        options: [
          "They look attractive",
          "They replace text completely",
          "They enhance comprehension and memory retention",
          "They are easier to create",
        ],
        correctAnswer: 2,
        explanation:
          "Visual learning aids significantly enhance comprehension and help with long-term memory retention.",
      },
    ];

    return { slides, quiz, topic };
  };

  const handleTextUpload = async () => {
    if (!studyMaterial.trim()) return;

    setIsProcessing(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const session = generateStudySession(studyMaterial);
    setStudySession(session);
    setCurrentView("presentation");
    setIsProcessing(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setStudyMaterial(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const speakSlide = (slide: Slide) => {
    if (!speechSynthesis.current) return;

    if (isPlaying) {
      speechSynthesis.current.cancel();
      setIsPlaying(false);
      return;
    }

    const text = `${slide.title}. ${slide.content.join(". ")}`;
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = isMuted ? 0 : 1;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);

    currentUtterance.current = utterance;
    speechSynthesis.current.speak(utterance);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (currentUtterance.current) {
      currentUtterance.current.volume = isMuted ? 1 : 0;
    }
  };

  const nextSlide = () => {
    if (studySession && currentSlide < studySession.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
        setIsPlaying(false);
      }
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
        setIsPlaying(false);
      }
    }
  };

  const startQuiz = () => {
    setCurrentView("quiz");
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowQuizResults(false);
    setScore(0);
  };

  const handleQuizAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (studySession && currentQuestionIndex < studySession.quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateScore();
    }
  };

  const calculateScore = () => {
    if (!studySession) return;

    let correctAnswers = 0;
    selectedAnswers.forEach((answer, index) => {
      if (answer === studySession.quiz[index].correctAnswer) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round(
      (correctAnswers / studySession.quiz.length) * 100
    );
    setScore(finalScore);
    setShowQuizResults(true);
    setCurrentView("results");
  };

  const getMotivationMessage = (
    score: number
  ): { message: string; icon: JSX.Element; color: string } => {
    if (score >= 90) {
      return {
        message: "Outstanding! You've mastered this topic! 🌟",
        icon: <Award className="w-8 h-8" />,
        color: "text-yellow-500",
      };
    } else if (score >= 70) {
      return {
        message: "Great job! You're on the right track! 💪",
        icon: <Target className="w-8 h-8" />,
        color: "text-green-500",
      };
    } else if (score >= 50) {
      return {
        message: "Good effort! Keep practicing to improve! 📚",
        icon: <TrendingUp className="w-8 h-8" />,
        color: "text-blue-500",
      };
    } else {
      return {
        message: "Don't give up! Review the material and try again! 🚀",
        icon: <RotateCcw className="w-8 h-8" />,
        color: "text-orange-500",
      };
    }
  };

  const resetApp = () => {
    setCurrentView("upload");
    setStudyMaterial("");
    setStudySession(null);
    setCurrentSlide(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setScore(0);
    setShowQuizResults(false);
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
    }
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="gradient-bg text-white py-6 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">EduVision</h1>
              <p className="text-blue-100 text-sm">
                AI-Powered Interactive Learning
              </p>
            </div>
          </div>
          {currentView !== "upload" && (
            <button
              onClick={resetApp}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              New Session
            </button>
          )}
        </div>
      </header>

      {/* Upload View */}
      {currentView === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Transform Your Study Materials
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Upload your textbook content or notes, and watch them come alive
              with interactive slides, voice narration, and personalized quizzes
              powered by AI.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 card-hover">
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Paste your study material or upload a text file:
              </label>
              <textarea
                value={studyMaterial}
                onChange={(e) => setStudyMaterial(e.target.value)}
                placeholder="Paste your textbook content, lecture notes, or any study material here..."
                className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-200"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-6 text-center transition-all duration-200">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <span className="text-gray-600">Upload Text File</span>
                </div>
              </label>
            </div>

            <button
              onClick={handleTextUpload}
              disabled={!studyMaterial.trim() || isProcessing}
              className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                !studyMaterial.trim() || isProcessing
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "gradient-bg text-white hover:shadow-lg transform hover:-translate-y-1"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Processing with AI...</span>
                </div>
              ) : (
                "Create Interactive Presentation"
              )}
            </button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              {
                icon: <Play className="w-8 h-8" />,
                title: "Interactive Slides",
                description:
                  "Auto-generated slides with bullet points and visual elements",
              },
              {
                icon: <Volume2 className="w-8 h-8" />,
                title: "Voice Narration",
                description:
                  "AI-powered speech synthesis for auditory learning",
              },
              {
                icon: <Award className="w-8 h-8" />,
                title: "Smart Quizzes",
                description: "Personalized quizzes with motivational feedback",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg card-hover text-center"
              >
                <div className="gradient-bg w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Presentation View */}
      {currentView === "presentation" && studySession && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Presentation Header */}
            <div className="gradient-bg text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {studySession.topic}
                  </h2>
                  <p className="text-blue-100">
                    Slide {currentSlide + 1} of {studySession.slides.length}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleMute}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      speakSlide(studySession.slides[currentSlide])
                    }
                    className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all duration-200"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-5 h-5" />
                        <div className="speech-wave">
                          <span></span>
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Narrate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full progress-bar"
                  style={{
                    width: `${
                      ((currentSlide + 1) / studySession.slides.length) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Slide Content */}
            <div className="p-8 slide-animation">
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-6">
                    {studySession.slides[currentSlide].title}
                  </h3>
                  <ul className="space-y-4">
                    {studySession.slides[currentSlide].content.map(
                      (point, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mt-3 flex-shrink-0"></div>
                          <p className="text-lg text-gray-700 leading-relaxed">
                            {point}
                          </p>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Visual Placeholder */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-16 h-16 text-indigo-600" />
                    </div>
                    <p className="text-gray-600 italic">
                      {studySession.slides[currentSlide].imagePrompt}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentSlide === 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-indigo-600 hover:bg-indigo-50"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>

                <div className="flex space-x-2">
                  {studySession.slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentSlide
                          ? "bg-indigo-600"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>

                {currentSlide === studySession.slides.length - 1 ? (
                  <button
                    onClick={startQuiz}
                    className="gradient-bg text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Start Quiz
                  </button>
                ) : (
                  <button
                    onClick={nextSlide}
                    className="flex items-center space-x-2 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz View */}
      {currentView === "quiz" && studySession && !showQuizResults && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Knowledge Check
                </h2>
                <span className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of{" "}
                  {studySession.quiz.length}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="gradient-bg h-2 rounded-full progress-bar"
                  style={{
                    width: `${
                      ((currentQuestionIndex + 1) / studySession.quiz.length) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {studySession.quiz[currentQuestionIndex].question}
              </h3>

              <div className="space-y-4">
                {studySession.quiz[currentQuestionIndex].options.map(
                  (option, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuizAnswer(index)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                        selectedAnswers[currentQuestionIndex] === index
                          ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedAnswers[currentQuestionIndex] === index
                              ? "border-indigo-500 bg-indigo-500 text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedAnswers[currentQuestionIndex] === index && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span>{option}</span>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={nextQuestion}
                disabled={selectedAnswers[currentQuestionIndex] === undefined}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  selectedAnswers[currentQuestionIndex] === undefined
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "gradient-bg text-white hover:shadow-lg"
                }`}
              >
                {currentQuestionIndex === studySession.quiz.length - 1
                  ? "Finish Quiz"
                  : "Next Question"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results View */}
      {currentView === "results" && studySession && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-8">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  getMotivationMessage(score).color
                }`}
              >
                <div className="bg-current rounded-full p-4 text-white">
                  {getMotivationMessage(score).icon}
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Quiz Complete!
              </h2>
              <p className="text-6xl font-bold gradient-bg bg-clip-text text-transparent mb-4">
                {score}%
              </p>
              <p className="text-xl text-gray-600 mb-8">
                {getMotivationMessage(score).message}
              </p>
            </div>

            {/* Detailed Results */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Question Review
              </h3>
              <div className="space-y-6">
                {studySession.quiz.map((question, index) => {
                  const userAnswer = selectedAnswers[index];
                  const isCorrect = userAnswer === question.correctAnswer;

                  return (
                    <div key={index} className="text-left">
                      <div className="flex items-start space-x-3 mb-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            isCorrect ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 mb-2">
                            {question.question}
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className={`p-2 rounded text-sm ${
                                  optionIndex === question.correctAnswer
                                    ? "quiz-correct"
                                    : optionIndex === userAnswer && !isCorrect
                                    ? "quiz-incorrect"
                                    : "quiz-neutral"
                                }`}
                              >
                                {option}
                                {optionIndex === question.correctAnswer && (
                                  <span className="ml-2">✓ Correct Answer</span>
                                )}
                                {optionIndex === userAnswer && !isCorrect && (
                                  <span className="ml-2">✗ Your Answer</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-2 italic">
                            💡 {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setCurrentView("presentation");
                  setCurrentSlide(0);
                }}
                className="px-8 py-3 border-2 border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all duration-200"
              >
                Review Slides
              </button>
              <button
                onClick={() => {
                  setCurrentView("quiz");
                  setCurrentQuestionIndex(0);
                  setSelectedAnswers([]);
                  setShowQuizResults(false);
                  setScore(0);
                }}
                className="px-8 py-3 gradient-bg text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                Retake Quiz
              </button>
              <button
                onClick={resetApp}
                className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
              >
                New Session
              </button>
            </div>

            {/* Performance Insights */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Learning Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {
                      selectedAnswers.filter(
                        (answer, index) =>
                          answer === studySession.quiz[index].correctAnswer
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-indigo-600 mb-1">
                    {Math.round((score / 100) * studySession.slides.length)}
                  </div>
                  <div className="text-sm text-gray-600">Slides Mastered</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {score >= 70 ? "Ready" : "Review"}
                  </div>
                  <div className="text-sm text-gray-600">Next Level</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <BookOpen className="w-6 h-6" />
            <span className="text-xl font-bold">EduVision</span>
          </div>
          <p className="text-gray-400 mb-4">
            Transforming education with AI-powered interactive learning
            experiences
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <span>📚 Interactive Slides</span>
            <span>🎙️ Voice Narration</span>
            <span>🎯 Smart Quizzes</span>
            <span>📊 Progress Tracking</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EduVision;
