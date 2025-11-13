import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from './components/GameBoard';
import MainMenu from './components/MainMenu';
import Lobby from './components/Lobby';
import InstructionsModal from './components/InstructionsModal';
import Dashboard from './components/Dashboard';
import PlayerList from './components/PlayerList';
import CardShowcase from './components/CardShowcase';
import { CardData, QAPair, Player, CardOriginRect, QuestionForm, QuizResult } from './types';

type View = 'menu' | 'lobby' | 'playing' | 'finished' | 'instructions';
type FocusedCardState = {
  card: CardData;
  origin: CardOriginRect | null;
  quiz: QuestionForm;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const CARD_IMAGE_FILES = [
  'card 1.png',
  'card 2.jpg',
  'card 3.png',
  'card 4.jpg',
  'card 5.png',
  'card 6.jpg',
  'card 7.png',
  'card 8.png',
  'card 9.png',
  'card 10.jpg',
  'card 11.jpg',
  'card 12.jpg',
  'card 13.png',
  'card 14.jpg',
  'card 15.jpg',
  'card 16.jpg',
  'card 17.jpg',
  'card 18.png',
  'card 19.jpg',
  'card 20.png',
  'card 21.jpg',
  'card 22.png',
  'card 23.jpg',
  'card 24.jpg',
];
const CARD_IMAGE_PATHS = CARD_IMAGE_FILES.map((name) => `/images/${encodeURIComponent(name)}`);

const VIEW_SOUNDTRACKS: Record<View, string> = {
  menu: '/audio/Soundtrack1.mp3',
  lobby: '/audio/Soundtrack1.mp3',
  playing: '/audio/Soundtrack3.mp3',
  finished: '/audio/Soundtrack3.mp3',
  instructions: '/audio/Soundtrack1.mp3',
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('menu');
  const [previousView, setPreviousView] = useState<View>('menu');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedCards, setFlippedCards] = useState<CardData[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [wrongAnswers, setWrongAnswers] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [focusedCard, setFocusedCard] = useState<FocusedCardState | null>(null);
  const [quizBank, setQuizBank] = useState<QuestionForm[]>([]);
  const [quizError, setQuizError] = useState<string | null>(null);
  const quizDeckRef = useRef<QuestionForm[]>([]);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundTrackRef = useRef<string | null>(null);
  const stopBackgroundAudio = useCallback(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
      backgroundAudioRef.current = null;
      backgroundTrackRef.current = null;
    }
  }, []);
  const playBackgroundAudio = useCallback(
    (src: string) => {
      if (backgroundTrackRef.current === src && backgroundAudioRef.current) {
        if (backgroundAudioRef.current.paused) {
          backgroundAudioRef.current.play().catch(() => {});
        }
        return;
      }

      stopBackgroundAudio();
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0.35;
      backgroundAudioRef.current = audio;
      backgroundTrackRef.current = src;
      audio.play().catch(() => {});
    },
    [stopBackgroundAudio],
  );

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const response = await fetch('/data/Quiz.json');
        if (!response.ok) {
          throw new Error('Failed to load quiz data');
        }
        const data = await response.json() as QuestionForm[];
        setQuizBank(data);
      } catch (err) {
        setQuizError('Không thể tải dữ liệu câu hỏi. Vui lòng thử lại.');
      }
    };
    loadQuiz();
  }, []);
  useEffect(() => {
    quizDeckRef.current = quizBank.length ? shuffleArray(quizBank) : [];
  }, [quizBank]);
  const drawQuizQuestion = useCallback(() => {
    if (!quizBank.length) {
      return null;
    }
    if (!quizDeckRef.current.length) {
      quizDeckRef.current = shuffleArray(quizBank);
    }
    return quizDeckRef.current.shift() ?? null;
  }, [quizBank]);
  useEffect(() => {
    if (focusedCard) {
      stopBackgroundAudio();
      return;
    }
    const targetTrack = VIEW_SOUNDTRACKS[view];
    if (targetTrack) {
      playBackgroundAudio(targetTrack);
    } else {
      stopBackgroundAudio();
    }
  }, [view, focusedCard, playBackgroundAudio, stopBackgroundAudio]);
  useEffect(() => () => stopBackgroundAudio(), [stopBackgroundAudio]);

  const CARD_COUNT = 12; // Number of pairs (24 cards total)

  const buildPairsFromQuiz = useCallback(
    (count: number): QAPair[] => {
      const validQuestions = quizBank.filter((question) =>
        question.answers.some((answer) => answer.correct),
      ) as QuestionForm[];
      if (validQuestions.length === 0) {
        throw new Error('Bộ câu hỏi chưa sẵn sàng hoặc thiếu đáp án đúng.');
      }

      const pool: QuestionForm[] = [];
      while (pool.length < count) {
        pool.push(...shuffleArray(validQuestions));
      }

      return pool.slice(0, count).map((question) => {
        const correctAnswer = question.answers.find((answer) => answer.correct);
        if (!correctAnswer) {
          throw new Error(`Câu hỏi "${question.content}" không có đáp án đúng.`);
        }
        return {
          question: question.content,
          answer: correctAnswer.content,
        };
      });
    },
    [quizBank],
  );

  const createGameBoard = (qaPairs: QAPair[]) => {
    const requiredCards = qaPairs.length * 2;
    const availableImages = shuffleArray(CARD_IMAGE_PATHS);
    if (availableImages.length < requiredCards) {
      throw new Error('Không đủ ảnh để tạo bộ bài.');
    }
    const gameCards: CardData[] = [];
    qaPairs.forEach((pair, index) => {
      const questionImageSrc = availableImages[index * 2];
      const answerImageSrc = availableImages[index * 2 + 1];
      gameCards.push({
        id: `q-${index}`,
        pairId: index,
        type: 'question',
        content: pair.question,
        imageSrc: questionImageSrc,
        isFlipped: false,
        isMatched: false,
        isCompleted: false,
      });
      gameCards.push({
        id: `a-${index}`,
        pairId: index,
        type: 'answer',
        content: pair.answer,
        imageSrc: answerImageSrc,
        isFlipped: false,
        isMatched: false,
        isCompleted: false,
      });
    });
    setCards(shuffleArray(gameCards));
  };

  const handleStartGame = useCallback((playerNames: string[]) => {
    if (playerNames.length === 0) {
      setError("Cần có ít nhất một người chơi để bắt đầu!");
      return;
    }
    setIsLoading(true);
    setError(null);
    setCards([]);
    setMoves(0);
    setWrongAnswers(0);
    setFlippedCards([]);
    setCurrentPlayerIndex(0);
    const initialPlayers = playerNames.map((name, index) => ({ id: index, name, score: 0 }));
    setPlayers(initialPlayers);
    if (initialPlayers.length > 0) {
      setCurrentPlayerIndex(Math.floor(Math.random() * initialPlayers.length));
    }

    try {
      const pairs = buildPairsFromQuiz(CARD_COUNT);
      createGameBoard(pairs);
      setView('playing');
    } catch (e: any) {
      setError(e.message || "Không thể tạo bộ câu hỏi từ Quiz.json.");
      setView('lobby'); // Go back to lobby on error
    } finally {
      setIsLoading(false);
    }
  }, [buildPairsFromQuiz]);
  
  const handleRestartGame = useCallback(() => {
    handleStartGame(players.map(p => p.name));
  }, [players, handleStartGame]);


  const pickRandomChooser = useCallback(() => {
    if (!players.length) return;
    setCurrentPlayerIndex(Math.floor(Math.random() * players.length));
  }, [players.length]);

  const handleCardClick = (clickedCard: CardData) => {
    // Chỉ đếm những thẻ chưa completed trong flippedCards
    const activeFlippedCards = flippedCards.filter(card => !card.isCompleted);
    if (isChecking || clickedCard.isFlipped || clickedCard.isMatched || activeFlippedCards.length >= 2) {
      return;
    }
    const newFlippedCards = [...flippedCards, clickedCard];
    setFlippedCards(newFlippedCards);
    setCards(prev => prev.map(c => c.id === clickedCard.id ? { ...c, isFlipped: true } : c));
  };
  
  const handleCardReveal = (card: CardData, origin: CardOriginRect | null) => {
    const quiz = drawQuizQuestion();
    if (!quiz) {
      setError(quizError ?? 'Đang tải câu hỏi, hãy thử lại sau.');
      return;
    }
    setFocusedCard({ card, origin, quiz });
  };

  const handleReturnToMenu = () => {
    setView('menu');
    setError(null);
    setPlayers([]);
  }

  const handleShowInstructions = useCallback(() => {
    setPreviousView(view);
    setView('instructions');
  }, [view]);

  const handleCloseInstructions = useCallback(() => {
    setView(previousView);
  }, [previousView]);

  const handleEnterLobby = () => {
    setView('lobby');
  };

  const handlePlayerQuizResult = useCallback((playerId: number, result: QuizResult) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId ? { ...player, score: player.score + result.points } : player
      )
    );
    // Tăng wrongAnswers nếu người chơi hiện tại trả lời sai
    if (!result.correct && playerId === currentPlayerIndex) {
      setWrongAnswers(prev => prev + 1);
    }
  }, [currentPlayerIndex]);

  const handleQuizComplete = useCallback((cardId: string) => {
    setCards(prev =>
      prev.map(card =>
        card.id === cardId ? { ...card, isFlipped: true, isCompleted: true } : card
      )
    );
    // Xóa thẻ đã completed khỏi flippedCards để không ảnh hưởng logic kiểm tra cặp
    setFlippedCards(prev => prev.filter(card => card.id !== cardId));
    setFocusedCard(null);
    pickRandomChooser();
  }, [pickRandomChooser]);

  useEffect(() => {
    // Chỉ kiểm tra khi có đúng 2 thẻ chưa completed
    const activeFlippedCards = flippedCards.filter(card => !card.isCompleted);
    if (activeFlippedCards.length === 2) {
      setIsChecking(true);
      const [firstCard, secondCard] = activeFlippedCards;
      
      setMoves(m => m + 1); // Increment moves for every pair flip

      if (firstCard.pairId === secondCard.pairId) {
        setCards(prev => prev.map(card => card.pairId === firstCard.pairId ? { ...card, isMatched: true } : card));
        setPlayers(prevPlayers => prevPlayers.map((player, index) => 
            index === currentPlayerIndex ? { ...player, score: player.score + 1 } : player
        ));
        // Xóa cả 2 thẻ khỏi flippedCards (kể cả completed)
        setFlippedCards(prev => prev.filter(card => card.id !== firstCard.id && card.id !== secondCard.id));
        setIsChecking(false);
        pickRandomChooser();
      } else {
        setTimeout(() => {
          setCards(prev =>
            prev.map(card => {
              if (card.id === firstCard.id || card.id === secondCard.id) {
                // Chỉ úp lại nếu thẻ chưa completed
                if (!card.isCompleted) {
                  return { ...card, isFlipped: false };
                }
                return card; // Giữ nguyên nếu đã completed
              }
              return card;
            })
          );
          // Chỉ xóa khỏi flippedCards những thẻ chưa completed (giữ lại thẻ đã completed)
          setFlippedCards(prev => prev.filter(card => card.isCompleted || (card.id !== firstCard.id && card.id !== secondCard.id)));
          setIsChecking(false);
          pickRandomChooser();
        }, 1200);
      }
    }
  }, [flippedCards, pickRandomChooser, currentPlayerIndex, players]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.isCompleted)) {
      setView('finished');
    }
  }, [cards]);

  const renderFinishedModal = () => {
    if (view !== 'finished') return null;
    
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const [first, second, third] = sortedPlayers;
    const podium = sortedPlayers.slice(0, 3);
    const maxScore = first?.score ?? 0;
    const winners = sortedPlayers.filter((p) => p.score === maxScore);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#fdf6e3] p-8 rounded-xl shadow-2xl text-center border-4 border-black w-full max-w-2xl space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-green-700 mb-2 uppercase">
              {winners.length > 1 ? 'Đồng Quán Quân' : 'Chiến Thắng Tuyệt Đối'}
            </h2>
            <p className="text-lg text-black">
              {winners.length > 1
                ? `Người dẫn đầu: ${winners.map((w) => w.name).join(' & ')}`
                : `Người chiến thắng: ${first?.name ?? 'Chưa xác định'}`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {podium.map((player, index) => {
              const rank = index + 1;
              const rankStyles =
                rank === 1
                  ? 'bg-yellow-100 border-yellow-400 text-yellow-900'
                  : rank === 2
                  ? 'bg-gray-100 border-gray-400 text-gray-900'
                  : 'bg-orange-100 border-orange-400 text-orange-900';
              const label = `Top ${rank}`;
              return (
                <div
                  key={player.id}
                  className={`rounded-2xl border-2 shadow-inner p-4 flex flex-col items-center ${rankStyles}`}
                >
                  <span className="text-xs uppercase tracking-widest">{label}</span>
                  <p className="text-xl font-bold mt-2">{player.name}</p>
                  <p className="text-sm font-semibold mt-1">{player.score} điểm</p>
                </div>
              );
            })}
            {podium.length < 3 &&
              Array.from({ length: 3 - podium.length }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="rounded-2xl border-2 border-dashed border-gray-300 p-4 flex flex-col items-center text-gray-400"
                >
                  <span className="text-xs uppercase tracking-widest">Top {podium.length + i + 1}</span>
                  <p className="text-sm mt-2">Chờ người chơi...</p>
                </div>
              ))}
          </div>

          <div className="text-left text-black w-full">
            <h3 className="font-bold text-center mb-2">Bảng Điểm Cuối Cùng</h3>
            <ul className="space-y-1">
              {sortedPlayers.map((p, index) => (
                <li key={p.id} className="flex justify-between">
                  <span>
                    #{index + 1} {p.name}
                  </span>
                  <span className="font-bold">{p.score}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'menu':
        return <MainMenu onStartSingle={handleEnterLobby} onShowInstructions={handleShowInstructions} />;
      case 'lobby':
        return <Lobby onStartGame={handleStartGame} onReturnToMenu={handleReturnToMenu} isLoading={isLoading} error={error} />;
      case 'playing':
      case 'finished':
        const currentPlayer = players[currentPlayerIndex];
        return (
          <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto gap-6 flex-grow">
            {/* Sidebar */}
            <div className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-black/80 p-4 rounded-lg border-2 border-[#c70000] flex flex-col shadow-lg">
                <Dashboard currentPlayer={currentPlayer} wrongAnswers={wrongAnswers}/>
                <PlayerList players={players} currentPlayerId={currentPlayer?.id ?? -1} />
                <div className="mt-auto pt-4 space-y-3">
                   {view === 'finished' && (
                     <button
                        onClick={handleRestartGame}
                        className="w-full px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors duration-300 border-2 border-black"
                      >
                        Chơi Lại
                      </button>
                   )}
                   <button
                    onClick={handleReturnToMenu}
                    className="w-full px-6 py-3 bg-[#c70000] text-white font-semibold rounded-lg hover:bg-[#a60000] transition-colors duration-300 border-2 border-black"
                  >
                    Về Menu Chính
                  </button>
                </div>
            </div>
            {/* Game Board */}
            <div className="w-full flex-grow flex items-center justify-center">
                <GameBoard cards={cards} onCardClick={handleCardClick} onRevealCard={handleCardReveal} isDisabled={isChecking} />
            </div>
          </div>
        );
      default:
        return <MainMenu onStartSingle={handleEnterLobby} onShowInstructions={handleShowInstructions} />;
    }
  };

  return (
    <main
      className="min-h-screen text-slate-100 flex flex-col items-center p-4 sm:p-6 bg-black/80"
      style={{
        backgroundImage: "url('/background/background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <h1 className="text-4xl sm:text-5xl font-bold text-center text-[#c70000] my-4 sm:my-8 uppercase tracking-wider flex-shrink-0" style={{ textShadow: '2px 2px #000' }}>
        Battle Of Lenin
      </h1>
      {quizError && (
        <p className="text-center text-sm text-red-300 mb-2">{quizError}</p>
      )}
      {renderContent()}
      {view === 'instructions' && <InstructionsModal onClose={handleCloseInstructions} />}
      {focusedCard && (
        <CardShowcase
          card={focusedCard.card}
          quiz={focusedCard.quiz}
          players={players}
          originRect={focusedCard.origin}
          onPlayerResult={handlePlayerQuizResult}
          onQuizComplete={handleQuizComplete}
        />
      )}
      {renderFinishedModal()}
    </main>
  );
};

export default App;
