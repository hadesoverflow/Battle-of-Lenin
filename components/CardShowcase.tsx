import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CardData, CardOriginRect, Player, QuestionForm, QuizResult } from '../types';

interface CardShowcaseProps {
  card: CardData;
  quiz: QuestionForm;
  players: Player[];
  originRect: CardOriginRect | null;
  onPlayerResult: (playerId: number, result: QuizResult) => void;
  onQuizComplete: (cardId: string) => void;
}

const COVER_IMAGE = '/images/cover.png';
const RATIO = 3 / 2;
const PREP_COUNTDOWN = 3;
const ANSWER_TIME_LIMIT = 20;
const MAX_POINTS = 100;
type QuizStage = 'countdown' | 'question';
const QUIZ_STAGE_TRACKS: Record<QuizStage, { src: string; loop: boolean; volume: number }> = {
  countdown: { src: '/audio/3s.mp3', loop: false, volume: 0.5 },
  question: { src: '/audio/Soundtrack2.mp3', loop: true, volume: 0.35 },
};

const buildTransform = (x: number, y: number, scale: number) =>
  `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;

const CardShowcase: React.FC<CardShowcaseProps> = ({
  card,
  quiz,
  players,
  originRect,
  onPlayerResult,
  onQuizComplete,
}) => {
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));

  const [currentTransform, setCurrentTransform] = useState(
    'translate(50vw, 50vh) translate(-50%, -50%) scale(0.5)',
  );
  const [showMeta, setShowMeta] = useState(false);
  const [showCardImage, setShowCardImage] = useState(false);
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [playerResults, setPlayerResults] = useState<Record<number, QuizResult> | null>(null);
  const [answerTimeLeft, setAnswerTimeLeft] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);

  const answerTimeRef = useRef(ANSWER_TIME_LIMIT);
  const finalizeRef = useRef(false);
  const finalizeQuizRef = useRef<() => void>(() => {});
  const stageAudioRef = useRef<HTMLAudioElement | null>(null);
  const stageTrackRef = useRef<QuizStage | null>(null);
  const stopStageAudio = useCallback(() => {
    if (stageAudioRef.current) {
      stageAudioRef.current.pause();
      stageAudioRef.current.currentTime = 0;
      stageAudioRef.current = null;
    }
    stageTrackRef.current = null;
  }, []);
  const playStageAudio = useCallback(
    (stage: QuizStage) => {
      if (stageTrackRef.current === stage && stageAudioRef.current) {
        if (stageAudioRef.current.paused) {
          stageAudioRef.current.play().catch(() => {});
        }
        return;
      }
      stopStageAudio();
      const config = QUIZ_STAGE_TRACKS[stage];
      const audio = new Audio(config.src);
      audio.loop = config.loop;
      audio.volume = config.volume;
      stageAudioRef.current = audio;
      stageTrackRef.current = stage;
      audio.play().catch(() => {});
    },
    [stopStageAudio],
  );

  const targetSize = useMemo(() => {
    let width = Math.min(viewport.width * 0.5, 460);
    let height = width * RATIO;
    const maxHeight = viewport.height * 0.75;
    if (height > maxHeight) {
      height = maxHeight;
      width = height / RATIO;
    }
    return { width, height };
  }, [viewport]);

  const correctAnswers = useMemo(
    () => new Set(quiz.answers.filter((answer) => answer.correct).map((answer) => answer.content)),
    [quiz.answers],
  );

  const initialTransform = useMemo(() => {
    const centerX = originRect ? originRect.left + originRect.width / 2 : viewport.width / 2;
    const centerY = originRect ? originRect.top + originRect.height / 2 : viewport.height / 2;
    const scale = originRect ? originRect.width / targetSize.width : 0.4;
    return buildTransform(centerX, centerY, scale);
  }, [originRect, targetSize.width, viewport.height, viewport.width]);

  const finalTransform = useMemo(
    () => buildTransform(viewport.width / 2, viewport.height / 2, 1),
    [viewport.height, viewport.width],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCurrentTransform(initialTransform);
    const frame = requestAnimationFrame(() => setCurrentTransform(finalTransform));
    const swapTimer = setTimeout(() => setShowCardImage(true), 1000);
    const metaTimer = setTimeout(() => setShowMeta(true), 1200);
    const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(swapTimer);
      clearTimeout(metaTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [finalTransform, initialTransform]);

  useEffect(() => {
    // Reset quiz state when card changes
    setSelectedAnswers({});
    setPlayerResults(null);
    setShowQuestionForm(false);
    setPrepCountdown(null);
    setAnswerTimeLeft(null);
    answerTimeRef.current = ANSWER_TIME_LIMIT;
    finalizeRef.current = false;
    setQuizFinished(false);

    if (!showCardImage || players.length === 0) return;

    let remaining = PREP_COUNTDOWN;
    setPrepCountdown(remaining);
    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        setPrepCountdown(0);
        setShowQuestionForm(true);
        setAnswerTimeLeft(ANSWER_TIME_LIMIT);
      } else {
        setPrepCountdown(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showCardImage, players.length, card.id]);
  useEffect(() => {
    const stage: QuizStage | null = showQuestionForm
      ? 'question'
      : prepCountdown !== null
        ? 'countdown'
        : null;
    if (!stage) {
      stopStageAudio();
      return;
    }
    playStageAudio(stage);
  }, [showQuestionForm, prepCountdown, playStageAudio, stopStageAudio]);
  useEffect(() => () => stopStageAudio(), [stopStageAudio]);

  const finalizeQuiz = useCallback(() => {
    if (finalizeRef.current || players.length === 0) return;
    finalizeRef.current = true;

    const remaining = Math.max(0, answerTimeRef.current);
    const currentPoints = Math.max(0, Math.round((remaining / ANSWER_TIME_LIMIT) * MAX_POINTS));

    const results: Record<number, QuizResult> = {};
    players.forEach((player) => {
      const choice = selectedAnswers[player.id];
      const answer = quiz.answers.find((a) => a.content === choice);
      const correct = Boolean(answer?.correct);
      const points = correct ? currentPoints : 0;
      const result = { correct, points };
      results[player.id] = result;
      onPlayerResult(player.id, result);
    });

    setPlayerResults(results);
    setQuizFinished(true);
  }, [players, quiz.answers, selectedAnswers, onPlayerResult]);
  useEffect(() => {
    finalizeQuizRef.current = finalizeQuiz;
  }, [finalizeQuiz]);

  useEffect(() => {
    if (!showQuestionForm || quizFinished) {
      setAnswerTimeLeft(null);
      answerTimeRef.current = ANSWER_TIME_LIMIT;
      return;
    }

    answerTimeRef.current = ANSWER_TIME_LIMIT;
    setAnswerTimeLeft(ANSWER_TIME_LIMIT);

    const interval = setInterval(() => {
      answerTimeRef.current = Math.max(0, answerTimeRef.current - 1);
      if (answerTimeRef.current <= 0) {
        setAnswerTimeLeft(0);
        clearInterval(interval);
        finalizeQuizRef.current();
      } else {
        setAnswerTimeLeft(answerTimeRef.current);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showQuestionForm, quizFinished]);

  useEffect(() => {
    if (!quizFinished || !playerResults) return;
    const timer = setTimeout(() => onQuizComplete(card.id), 3000);
    return () => clearTimeout(timer);
  }, [quizFinished, playerResults, onQuizComplete, card.id]);

  const handleSelect = (playerId: number, value: string) => {
    if (quizFinished) return;
    setSelectedAnswers((prev) => ({ ...prev, [playerId]: value }));
  };

  const handleManualSubmit = () => {
    if (quizFinished) return;
    finalizeQuiz();
  };

  const timeFraction =
    answerTimeLeft !== null ? Math.max(0, answerTimeLeft) / ANSWER_TIME_LIMIT : 0;
  const projectedPoints = Math.max(0, Math.round(timeFraction * MAX_POINTS));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full h-full">
        <div
          className="absolute top-0 left-0"
          style={{
            width: targetSize.width,
            height: targetSize.height,
            transformOrigin: 'center center',
            transform: currentTransform,
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            className={`relative w-full h-full rounded-2xl bg-black overflow-hidden transition-opacity duration-300 ${
              showQuestionForm ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <img
              src={COVER_IMAGE}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-contain rounded-2xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)] transition-opacity duration-400"
              style={{ opacity: showCardImage ? 0 : 1 }}
              draggable={false}
            />
            <img
              src={card.imageSrc || COVER_IMAGE}
              alt={card.content}
              className="absolute inset-0 w-full h-full object-contain rounded-2xl drop-shadow-[0_15px_40px_rgba(0,0,0,0.7)] transition-opacity duration-400"
              style={{ opacity: showCardImage ? 1 : 0 }}
              draggable={false}
            />
          </div>
        </div>

        <div
          className={`fixed left-1/2 bottom-10 -translate-x-1/2 text-center text-white transition-all duration-400 ${
            showMeta && !showQuestionForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <h3 className="mt-4 text-2xl font-bold mb-3">{card.content}</h3>
          <p className="max-w-xl text-sm sm:text-base text-gray-200 leading-relaxed mb-4">
            Mọi người chuẩn bị trả lời câu hỏi chung.
          </p>
          {prepCountdown !== null && prepCountdown > 0 && (
            <p className="text-sm text-red-200 mb-3">Bắt đầu sau {prepCountdown}s...</p>
          )}
        </div>

        {showQuestionForm && (
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-[#080808] border border-white/10 rounded-3xl shadow-2xl text-white p-6 space-y-6 relative">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-red-300">
                  Trắc nghiệm tập thể
                </p>
                <h3 className="text-xl font-semibold whitespace-pre-line">{quiz.content}</h3>
                {answerTimeLeft !== null && !quizFinished && (
                  <div className="space-y-2">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 via-yellow-300 to-red-500 transition-[width] duration-500"
                        style={{ width: `${timeFraction * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-gray-200">
                      <span>Thời gian còn lại: {answerTimeLeft}s</span>
                      <span>Điểm tối đa hiện tại: {projectedPoints}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {players.map((player) => {
                  const choice = selectedAnswers[player.id] || '';
                  const result = playerResults?.[player.id];
                  return (
                    <div key={player.id} className="border border-white/10 rounded-2xl p-4 space-y-3 bg-black/30">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{player.name}</p>
                        {result && (
                          <span className={`text-sm font-semibold ${result.correct ? 'text-green-300' : 'text-yellow-200'}`}>
                            {result.correct ? `+${result.points} điểm` : '0 điểm'}
                          </span>
                        )}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {quiz.answers.map((answer, index) => {
                          const letter = String.fromCharCode(65 + index);
                          const active = choice === answer.content;
                          const isCorrectChoice = correctAnswers.has(answer.content);
                          let resultHighlight = '';
                          if (quizFinished) {
                            const playerAnsweredThis = active;
                            if (playerAnsweredThis) {
                              resultHighlight = result?.correct
                                ? 'animate-pulse border-green-400 bg-green-500/20 text-green-100'
                                : 'animate-pulse border-red-400 bg-red-500/20 text-red-100';
                            } else if (!result?.correct && isCorrectChoice) {
                              resultHighlight = 'animate-pulse border-green-400 bg-green-500/20 text-green-100';
                            }
                          }
                          return (
                            <label
                              key={`${player.id}-${answer.content}`}
                              className={`flex items-start gap-2 rounded-2xl border px-3 py-2 text-sm cursor-pointer transition ${
                                active ? 'border-red-400 bg-white/10' : 'border-white/10 hover:border-white/30'
                              } ${quizFinished ? 'opacity-80 cursor-default' : ''} ${resultHighlight}`}
                            >
                              <input
                                type="radio"
                                name={`answer-${player.id}`}
                                value={answer.content}
                                checked={active}
                                onChange={() => handleSelect(player.id, answer.content)}
                                disabled={quizFinished}
                                className="mt-1 accent-red-500"
                              />
                              <span>
                                <span className="text-xs uppercase tracking-widest text-red-300 pr-2">{letter}</span>
                                {answer.content}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                {!quizFinished && (
                  <button
                    onClick={handleManualSubmit}
                    className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-full text-sm font-semibold transition-colors"
                  >
                    Chấm điểm ngay
                  </button>
                )}
                {quizFinished && (
                  <span className="text-sm text-green-300 font-semibold">
                    Đã chấm điểm! Trở lại bàn sau giây lát...
                  </span>
                )}
              </div>

              {quizFinished && quiz.explanation && (
                <div className="text-sm text-gray-200 bg-black/40 border border-white/10 rounded-2xl p-4">
                  {quiz.explanation}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardShowcase;
