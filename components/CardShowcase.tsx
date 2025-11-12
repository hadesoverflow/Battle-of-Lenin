import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CardData, CardOriginRect } from '../types';

interface CardShowcaseProps {
  card: CardData;
  originRect: CardOriginRect | null;
  onQuestionComplete: (cardId: string, isCorrect: boolean) => void;
  onClose: () => void;
}

const ratio = 3 / 2;
const ANSWER_TIME_LIMIT = 20;
const MAX_POINTS = 100;

const getImageName = (card: CardData): string => {
  if (card.imageSrc) {
    const raw = decodeURIComponent(card.imageSrc.split('/').pop() || '');
    return raw.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').trim() || 'Hình ảnh';
  }
  return 'Hình ảnh';
};

const buildTransform = (x: number, y: number, scale: number) =>
  `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;

const CardShowcase: React.FC<CardShowcaseProps> = ({ card, originRect, onQuestionComplete, onClose }) => {
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));
  const [currentTransform, setCurrentTransform] = useState('translate(50vw, 50vh) translate(-50%, -50%) scale(0.5)');
  const [showMeta, setShowMeta] = useState(false);
  const [showCardImage, setShowCardImage] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [answerTimeLeft, setAnswerTimeLeft] = useState<number | null>(null);
  const [awardedPoints, setAwardedPoints] = useState<number | null>(null);

  const imageName = getImageName(card);
  const description = card.content || 'Chưa có mô tả cho thẻ này.';
  const cover = '/images/cover.png';
  const cardImage = card.imageSrc || cover;

  const { targetWidth, targetHeight } = useMemo(() => {
    let width = Math.min(viewport.width * 0.5, 460);
    let height = width * ratio;
    const maxHeight = viewport.height * 0.75;
    if (height > maxHeight) {
      height = maxHeight;
      width = height / ratio;
    }
    return { targetWidth: width, targetHeight: height };
  }, [viewport]);

  const initialTransform = useMemo(() => {
    const centerX = originRect ? originRect.left + originRect.width / 2 : viewport.width / 2;
    const centerY = originRect ? originRect.top + originRect.height / 2 : viewport.height / 2;
    const scale = originRect ? originRect.width / targetWidth : 0.4;
    return buildTransform(centerX, centerY, scale);
  }, [originRect, targetWidth, viewport.height, viewport.width]);

  const finalTransform = useMemo(() => {
    return buildTransform(viewport.width / 2, viewport.height / 2, 1);
  }, [viewport.height, viewport.width]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setCurrentTransform(initialTransform);
    const frame = requestAnimationFrame(() => setCurrentTransform(finalTransform));
    const swapDelay = 1000;
    const swapTimer = setTimeout(() => setShowCardImage(true), swapDelay);
    const metaTimer = setTimeout(() => setShowMeta(true), swapDelay + 200);
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
    setShowQuestionForm(false);
    setCountdown(null);
    setSelectedAnswer('');
    setIsSubmitted(false);
    setIsAnswerCorrect(null);
    setAnswerTimeLeft(null);
    setAwardedPoints(null);

    if (!showCardImage || !card.questionForm) return;

    let remaining = 3;
    setCountdown(remaining);
    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        setCountdown(0);
        setShowQuestionForm(true);
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showCardImage, card.questionForm, card.id]);

  const finalizeAnswer = useCallback((correct: boolean) => {
    if (isSubmitted) return;
    const remaining = correct ? Math.max(0, answerTimeLeft ?? 0) : 0;
    const points = correct ? Math.max(0, Math.round((remaining / ANSWER_TIME_LIMIT) * MAX_POINTS)) : 0;
    setIsAnswerCorrect(correct);
    setAwardedPoints(points);
    setIsSubmitted(true);
    onQuestionComplete(card.id, { correct, points });
  }, [answerTimeLeft, card.id, isSubmitted, onQuestionComplete]);

  const handleSubmit = useCallback((auto = false) => {
    if (!card.questionForm || isSubmitted) return;
    if (!selectedAnswer && !auto) return;

    let correct = false;
    if (selectedAnswer) {
      const target = card.questionForm.answers.find(answer => answer.content === selectedAnswer);
      correct = target?.correct ?? false;
    } else if (!auto) {
      return;
    }

    finalizeAnswer(auto ? (selectedAnswer ? correct : false) : correct);
  }, [card.questionForm, finalizeAnswer, isSubmitted, selectedAnswer]);

  useEffect(() => {
    if (!showQuestionForm || isSubmitted) {
      setAnswerTimeLeft(null);
      return;
    }
    let remaining = ANSWER_TIME_LIMIT;
    setAnswerTimeLeft(remaining);
    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        setAnswerTimeLeft(0);
        clearInterval(interval);
        if (!isSubmitted) {
          handleSubmit(true);
        }
      } else {
        setAnswerTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [handleSubmit, isSubmitted, showQuestionForm]);

  useEffect(() => {
    if (!isSubmitted) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isSubmitted, onClose]);

  const timeFraction = answerTimeLeft !== null ? Math.max(0, answerTimeLeft) / ANSWER_TIME_LIMIT : 0;
  const projectedPoints = Math.max(0, Math.round(timeFraction * MAX_POINTS));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full h-full">
        <div
          className="absolute top-0 left-0"
          style={{
            width: targetWidth,
            height: targetHeight,
            transformOrigin: 'center center',
            transform: currentTransform,
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            className={`relative w-full h-full rounded-2xl bg-black overflow-hidden transition-opacity duration-300 ${
              showQuestionForm && !isSubmitted ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <img
              src={cover}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-contain rounded-2xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)] transition-opacity duration-400"
              style={{ opacity: showCardImage ? 0 : 1 }}
              draggable={false}
            />
            <img
              src={cardImage}
              alt={imageName}
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
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mt-4 text-2xl font-bold mb-3">{imageName}</h3>
          <p className="max-w-xl text-sm sm:text-base text-gray-200 leading-relaxed mb-4">{description}</p>
          {card.questionForm && !showQuestionForm && countdown !== null && countdown > 0 && (
            <p className="text-sm text-red-200 mb-3">Form trả lời sẽ xuất hiện sau {countdown}s...</p>
          )}
        </div>

        {card.questionForm && showQuestionForm && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-2xl bg-[#080808] border border-white/10 rounded-3xl shadow-2xl text-white p-6 space-y-6 relative">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-red-300">Trắc nghiệm</p>
                <h3 className="text-xl font-semibold whitespace-pre-line">{card.questionForm.content}</h3>
                {answerTimeLeft !== null && !isSubmitted && (
                  <div className="space-y-2">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 via-yellow-300 to-red-500 transition-[width] duration-500"
                        style={{ width: `${timeFraction * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-gray-200">
                      <span>Thời gian còn lại: {answerTimeLeft}s</span>
                      <span>Điểm tối đa: {projectedPoints}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {card.questionForm.answers.map((answer, index) => {
                  const letter = String.fromCharCode(65 + index);
                  const active = selectedAnswer === answer.content;
                  return (
                    <label
                      key={`${answer.content}-${index}`}
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition ${
                        active ? 'border-red-400 bg-white/10' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`answer-${card.id}`}
                        value={answer.content}
                        checked={active}
                        onChange={() => {
                          if (isSubmitted) return;
                          setSelectedAnswer(answer.content);
                        }}
                        className="mt-1 accent-red-500"
                        disabled={isSubmitted}
                      />
                      <div>
                        <span className="text-xs uppercase tracking-widest text-red-300">{letter}</span>
                        <p className="text-sm sm:text-base text-white">{answer.content}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer || isSubmitted}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full text-sm font-semibold transition-colors"
                >
                  Gửi đáp án
                </button>
                {isSubmitted && (
                  <span className={`text-sm font-semibold ${isAnswerCorrect ? 'text-green-300' : 'text-yellow-200'}`}>
                    {isAnswerCorrect ? 'Chính xác!' : 'Chưa đúng, thử lại nhé!'}
                  </span>
                )}
              </div>
              {isSubmitted && card.questionForm.explanation && (
                <div className="text-sm text-gray-200 bg-black/40 border border-white/10 rounded-2xl p-4">
                  {card.questionForm.explanation}
                </div>
              )}
              {isSubmitted && awardedPoints !== null && (
                <div className="text-center text-sm font-semibold text-white">
                  Điểm nhận được: <span className="text-green-300">{awardedPoints}</span> / {MAX_POINTS}
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
