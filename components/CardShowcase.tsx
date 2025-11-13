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

const CARD_IMAGE_META: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  'card 1.png': {
    title: 'Ngày Quốc tế Lao động',
    description:
      'Hình tờ lịch vàng cam với dòng chữ “1 MAY”, phong cách minh họa cổ điển và nền tỏa sáng dạng tia.',
  },
  'card 2.jpg': {
    title: 'C.Mác',
    description:
      'Hình tượng nhà triết học – tư tưởng có ảnh hưởng lớn, nét vẽ đậm chất chân dung lịch sử.',
  },
  'card 3.png': {
    title: 'Nhiệm vụ Bùng Nổ',
    description:
      'Biểu tượng ngọn lửa vàng cam với chữ “BANG CHÁY”, cảm giác sự kiện hoặc thử thách đặc biệt.',
  },
  'card 4.jpg': {
    title: 'Biểu trưng Công – Nông',
    description:
      'Búa và liềm vàng đặt chéo nhau trên nền đỏ – vàng rực, giống phong cách cổ động truyền thống.',
  },
  'card 5.png': {
    title: 'Ngọn Đuốc Tự Do',
    description:
      'Ngọn đuốc bốc lửa vàng trên nền đỏ tỏa tia sáng, biểu tượng cho ý chí và ánh sáng dẫn đường.',
  },
  'card 6.jpg': {
    title: 'Thẻ Sự Kiện',
    description: 'Thiết kế viền vàng cùng nền hoa văn cổ động, gợi nhắc các bảng thông báo đặc biệt.',
  },
  'card 7.png': {
    title: 'Thẻ Phần Thưởng',
    description:
      'Hộp quà đỏ thắt nơ vàng phát sáng nhẹ, phù hợp cho vật phẩm thưởng hoặc mở rương.',
  },
  'card 8.png': {
    title: 'Phong trào Quần Chúng',
    description:
      'Đám đông giơ tay và cầm cờ lớn, tông đỏ – vàng cổ điển tạo khí thế vận động mạnh mẽ.',
  },
  'card 9.png': {
    title: 'Thẻ Kim Cương',
    description:
      'Viên kim cương vàng óng phát sáng rực rỡ, biểu tượng cho phần thưởng hiếm và giá trị cao.',
  },
  'card 10.jpg': {
    title: 'Lê Nin',
    description:
      'Chân dung minh họa nhà lãnh đạo cách mạng với thần thái kiên định, biểu tượng quen thuộc.',
  },
  'card 11.jpg': {
    title: 'Ngày Trọng Điểm',
    description:
      'Thẻ gợi ý một mốc lịch sử đặc biệt, thể hiện sự quan trọng của sự kiện hoặc ngày kỷ niệm.',
  },
  'card 12.jpg': {
    title: 'Tuyên Truyền 1',
    description:
      'Loa vàng kiểu cổ điển trên nền đỏ rực tỏa sáng, biểu tượng cho thông điệp lan tỏa mạnh mẽ.',
  },
  'card 13.png': {
    title: 'Tuyên Truyền 2',
    description:
      'Loa phóng thanh góc nhìn hơi nghiêng, có thể dùng như biến thể hoặc cấp độ khác của thẻ loa.',
  },
  'card 14.jpg': {
    title: 'Đoàn Kết',
    description:
      'Ba cánh tay giơ cao đầy quyết tâm, thể hiện sức mạnh tập thể và tinh thần chiến đấu chung.',
  },
  'card 15.jpg': {
    title: 'Ăn Mừng',
    description:
      'Ba chùm pháo hoa đỏ – vàng tạo không khí lễ hội, phù hợp cho sự kiện nâng điểm hay phần thưởng.',
  },
  'card 16.jpg': {
    title: 'Giáo Trình Lý Luận',
    description:
      'Cuốn sách đỏ có biểu tượng búa liềm và dòng chữ “CHỦ NGHĨA CỘNG SẢN”, tượng trưng tri thức nền tảng.',
  },
  'card 17.jpg': {
    title: 'Ngôi Sao Vàng',
    description:
      'Ngôi sao vàng năm cánh nổi bật trên nền đỏ, gợi sự vinh danh, thành tựu hoặc quyền lợi đặc biệt.',
  },
  'card 18.png': {
    title: 'Biểu Tượng Danh Dự',
    description:
      'Biến thể ngôi sao vàng sắc nét và tỏa sáng hơn, thích hợp làm thẻ cấp cao hay điểm số đặc biệt.',
  },
  'card 19.jpg': {
    title: 'Mốc Sự Kiện 5',
    description:
      'Số 5 lớn trên nền đỏ, có thể đại diện cấp độ, điểm thưởng hoặc gợi nhớ tháng 5 – ngày Lao động.',
  },
  'card 20.png': {
    title: 'Sự Kiện Lớn',
    description:
      'Biểu ngữ đỏ – vàng với chữ “SỰ KIỆN”, tượng trưng cho hoạt động, nhiệm vụ hay thử thách nổi bật.',
  },
  'card 21.jpg': {
    title: 'Chiến Xa',
    description:
      'Xe tăng vàng – nâu trên nền đỏ tỏa tia sáng, biểu tượng của sức mạnh, đột phá và ý chí tiến công.',
  },
  'card 22.png': {
    title: 'Vé May Mắn',
    description:
      'Tấm vé cam – đỏ với chữ “TICKET”, gợi ý cơ hội, lượt chơi bổ sung hoặc sự kiện bí ẩn.',
  },
  'card 23.jpg': {
    title: 'Vinh Quang',
    description:
      'Lá cờ đỏ in chữ “VINH QUANG”, mang tinh thần chiến thắng và tôn vinh thành tích đặc biệt.',
  },
  'card 24.jpg': {
    title: 'Tài Nguyên',
    description:
      'Đồng xu vàng có ký hiệu “$” trên nền đỏ tỏa sáng, tượng trưng cho tài sản, điểm thưởng hay kinh tế.',
  },
};

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
  const [revealCorrectAnswers, setRevealCorrectAnswers] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<Set<string>>(new Set());
  const [answerBotUsed, setAnswerBotUsed] = useState(false);
  const [eliminateBotUsed, setEliminateBotUsed] = useState(false);
  const [helpPenalty, setHelpPenalty] = useState(0);

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
  const highestPlayerScore = useMemo(
    () => players.reduce((max, player) => Math.max(max, player.score), 0),
    [players],
  );
  const canAffordAnswerBot = highestPlayerScore > 70;
  const canAffordEliminateBot = highestPlayerScore > 40;

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

  const cardImageMeta = useMemo(() => {
    if (!card.imageSrc) return null;
    const rawName = card.imageSrc.split('/').pop() ?? '';
    const decodedName = decodeURIComponent(rawName).toLowerCase();
    return CARD_IMAGE_META[decodedName] ?? null;
  }, [card.imageSrc]);

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
    setRevealCorrectAnswers(false);
    setEliminatedOptions(new Set());
    setAnswerBotUsed(false);
    setEliminateBotUsed(false);
    setHelpPenalty(0);

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

  const correctAnswerDetails = useMemo(
    () => quiz.answers.filter((answer) => answer.correct),
    [quiz.answers],
  );

  const finalizeQuiz = useCallback(() => {
    if (finalizeRef.current || players.length === 0) return;
    finalizeRef.current = true;

    const remaining = Math.max(0, answerTimeRef.current);
    const rawPoints = Math.max(0, Math.round((remaining / ANSWER_TIME_LIMIT) * MAX_POINTS));
    const helpCost = helpPenalty;

    const results: Record<number, QuizResult> = {};
    players.forEach((player) => {
      const choice = selectedAnswers[player.id];
      const answer = quiz.answers.find((a) => a.content === choice);
      const correct = Boolean(answer?.correct);
      let points = 0;
      if (correct) {
        points = Math.max(0, rawPoints - helpCost);
      } else if (helpCost > 0) {
        points = -helpCost;
      }
      const result = { correct, points };
      results[player.id] = result;
      onPlayerResult(player.id, result);
    });

    setPlayerResults(results);
    setQuizFinished(true);
  }, [players, quiz.answers, selectedAnswers, onPlayerResult, helpPenalty]);
  const handleUseAnswerBot = () => {
    if (answerBotUsed || quizFinished || !showQuestionForm || !canAffordAnswerBot) return;
    setRevealCorrectAnswers(true);
    setAnswerBotUsed(true);
    setHelpPenalty((prev) => prev + 70);
  };

  const handleUseEliminateBot = () => {
    if (eliminateBotUsed || quizFinished || !showQuestionForm || !canAffordEliminateBot) return;
    const candidates = quiz.answers.filter(
      (answer) => !answer.correct && !eliminatedOptions.has(answer.content),
    );
    if (!candidates.length) return;
    const pickPool = [...candidates];
    const next = new Set(eliminatedOptions);
    for (let i = 0; i < 2 && pickPool.length; i += 1) {
      const randomIndex = Math.floor(Math.random() * pickPool.length);
      const [choice] = pickPool.splice(randomIndex, 1);
      next.add(choice.content);
    }
    setEliminatedOptions(next);
    setEliminateBotUsed(true);
    setHelpPenalty((prev) => prev + 40);
  };
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
  const projectedPoints = Math.max(0, Math.round(timeFraction * MAX_POINTS) - helpPenalty);

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
          <h3 className="mt-4 text-2xl font-bold mb-3">
            {cardImageMeta?.title ?? card.content}
          </h3>
          <p className="max-w-xl text-sm sm:text-base text-gray-200 leading-relaxed mb-4">
            {cardImageMeta?.description ?? 'Mọi người chuẩn bị trả lời câu hỏi chung.'}
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
              <div className="flex flex-col items-stretch sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleUseAnswerBot}
                    disabled={answerBotUsed || quizFinished || !showQuestionForm || !canAffordAnswerBot}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition ${
                      answerBotUsed || quizFinished || !canAffordAnswerBot
                        ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed'
                        : 'bg-red-700/30 border-red-400 text-white hover:bg-red-600/40'
                    }`}
                  >
                    <span role="img" aria-label="bot">
                      🤖
                    </span>
                    Gợi ý đáp án (-70đ)
                  </button>
                  <button
                    onClick={handleUseEliminateBot}
                    disabled={eliminateBotUsed || quizFinished || !showQuestionForm || !canAffordEliminateBot}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition ${
                      eliminateBotUsed || quizFinished || !canAffordEliminateBot
                        ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-600/30 border-yellow-400 text-white hover:bg-yellow-500/40'
                    }`}
                  >
                    <span role="img" aria-label="eliminate">
                      ❌
                    </span>
                    Loại đáp án sai (-40đ)
                  </button>
                </div>
                <div className="flex-1 text-right text-xs text-gray-300 space-y-1">
                  {helpPenalty > 0 && (
                    <p>
                      Điểm tối đa đã giảm <span className="text-red-300 font-semibold">-{helpPenalty}đ</span>.
                    </p>
                  )}
                  {helpPenalty > 0 && (
                    <p>
                      Trả lời đúng: điểm thưởng bị trừ; trả lời sai: bị trừ thẳng {helpPenalty}đ vào tổng điểm.
                    </p>
                  )}
                  {!quizFinished && showQuestionForm && (
                    <>
                      {!canAffordAnswerBot && (
                        <p>Yêu cầu &gt; 70 điểm để dùng bot gợi ý (hiện có {highestPlayerScore}đ).</p>
                      )}
                      {!canAffordEliminateBot && (
                        <p>Yêu cầu &gt; 40 điểm để loại đáp án (hiện có {highestPlayerScore}đ).</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              {revealCorrectAnswers && (
                <div className="bg-green-900/10 border border-green-400/60 rounded-2xl p-4 text-left space-y-2">
                  <p className="text-sm font-semibold text-green-300 flex items-center gap-2">
                    <span role="img" aria-label="insight">
                      💡
                    </span>
                    Bot gợi ý: Đây là đáp án đúng.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-100 space-y-1">
                    {correctAnswerDetails.map((answer) => (
                      <li key={answer.content}>
                        <span className="font-semibold text-white">{answer.content}</span> –{' '}
                        {quiz.explanation ||
                          'Đáp án này phù hợp nhất với thông tin trong câu hỏi, được hệ thống xác thực.'}
                      </li>
                    ))}
                  </ul>
                  {quiz.explanation && (
                    <p className="text-xs text-gray-200 italic">
                      Giải thích thêm: {quiz.explanation}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {players.map((player) => {
                  const choice = selectedAnswers[player.id] || '';
                  const result = playerResults?.[player.id];
                  return (
                    <div key={player.id} className="border border-white/10 rounded-2xl p-4 space-y-3 bg-black/30">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{player.name}</p>
                        {result && (
                          <span
                            className={`text-sm font-semibold ${
                              result.points > 0
                                ? 'text-green-300'
                                : result.points < 0
                                  ? 'text-red-400'
                                  : 'text-yellow-200'
                            }`}
                          >
                            {result.points > 0
                              ? `+${result.points} điểm`
                              : result.points < 0
                                ? `${result.points} điểm`
                                : '0 điểm'}
                          </span>
                        )}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {quiz.answers.map((answer, index) => {
                          const letter = String.fromCharCode(65 + index);
                          const active = choice === answer.content;
                          const isCorrectChoice = correctAnswers.has(answer.content);
                          const isEliminated = eliminatedOptions.has(answer.content);
                          const revealHighlight =
                            (revealCorrectAnswers && isCorrectChoice && !quizFinished) ||
                            (quizFinished && isCorrectChoice);
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
                              } ${quizFinished ? 'opacity-80 cursor-default' : ''} ${
                                isEliminated ? 'opacity-40 line-through cursor-not-allowed' : ''
                              } ${revealHighlight ? 'border-green-400 bg-green-500/10' : ''} ${resultHighlight}`}
                            >
                              <input
                                type="radio"
                                name={`answer-${player.id}`}
                                value={answer.content}
                                checked={active}
                                onChange={() => handleSelect(player.id, answer.content)}
                                disabled={quizFinished || isEliminated}
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
