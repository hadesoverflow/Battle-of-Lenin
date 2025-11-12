import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import MainMenu from './components/MainMenu';
import Lobby from './components/Lobby';
import InstructionsModal from './components/InstructionsModal';
import Dashboard from './components/Dashboard';
import PlayerList from './components/PlayerList';
import { CardData, QAPair, Player } from './types';
import { generateQAPairs } from './services/geminiService';

type View = 'menu' | 'lobby' | 'playing' | 'finished' | 'instructions';
type GameMode = 'single' | 'couple';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedCards, setFlippedCards] = useState<CardData[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);

  const CARD_COUNT = 8; // Number of pairs

  const createGameBoard = (qaPairs: QAPair[]) => {
    const gameCards: CardData[] = [];
    qaPairs.forEach((pair, index) => {
      gameCards.push({
        id: `q-${index}`, pairId: index, type: 'question', content: pair.question, isFlipped: false, isMatched: false,
      });
      gameCards.push({
        id: `a-${index}`, pairId: index, type: 'answer', content: pair.answer, isFlipped: false, isMatched: false,
      });
    });
    setCards(shuffleArray(gameCards));
  };

  const handleStartGame = useCallback(async (playerNames: string[]) => {
    if (playerNames.length === 0) {
      setError("Cần có ít nhất một người chơi để bắt đầu!");
      return;
    }
    setIsLoading(true);
    setError(null);
    setCards([]);
    setMoves(0);
    setFlippedCards([]);
    setCurrentPlayerIndex(0);
    setPlayers(playerNames.map((name, index) => ({ id: index, name, score: 0 })));

    try {
      const pairs = await generateQAPairs("Chủ nghĩa Mác-Lênin", CARD_COUNT);
      createGameBoard(pairs);
      setView('playing');
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
      setView('lobby'); // Go back to lobby on error
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleRestartGame = useCallback(() => {
    handleStartGame(players.map(p => p.name));
  }, [players, handleStartGame]);


  const handleCardClick = (clickedCard: CardData) => {
    if (isChecking || clickedCard.isFlipped || clickedCard.isMatched || flippedCards.length >= 2) {
      return;
    }
    const newFlippedCards = [...flippedCards, clickedCard];
    setFlippedCards(newFlippedCards);
    setCards(prev => prev.map(c => c.id === clickedCard.id ? { ...c, isFlipped: true } : c));
  };

  const handleReturnToMenu = () => {
    setView('menu');
    setError(null);
    setPlayers([]);
  }

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    setView('lobby');
  }

  const nextTurn = () => {
    setCurrentPlayerIndex(prevIndex => (prevIndex + 1) % players.length);
  };

  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      const [firstCard, secondCard] = flippedCards;
      
      setMoves(m => m + 1); // Increment moves for every pair flip

      if (firstCard.pairId === secondCard.pairId) {
        setCards(prev => prev.map(card => card.pairId === firstCard.pairId ? { ...card, isMatched: true } : card));
        setPlayers(prevPlayers => prevPlayers.map((player, index) => 
            index === currentPlayerIndex ? { ...player, score: player.score + 1 } : player
        ));
        setFlippedCards([]);
        setIsChecking(false);
        // Player gets another turn
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(card => (card.id === firstCard.id || card.id === secondCard.id) ? { ...card, isFlipped: false } : card));
          setFlippedCards([]);
          setIsChecking(false);
          nextTurn();
        }, 1200);
      }
    }
  }, [flippedCards, currentPlayerIndex, players]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.isMatched)) {
      setView('finished');
    }
  }, [cards]);

  const renderFinishedModal = () => {
    if (view !== 'finished') return null;
    
    const maxScore = Math.max(...players.map(p => p.score));
    const winners = players.filter(p => p.score === maxScore);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#fdf6e3] p-8 rounded-xl shadow-2xl text-center border-4 border-black w-full max-w-md">
          <h2 className="text-3xl font-bold text-green-700 mb-4">
            {winners.length > 1 ? "HÒA!" : "THẮNG LỢI!"}
          </h2>
          <p className="text-lg text-black mb-2">Người chiến thắng:</p>
          <p className="text-2xl font-bold text-[#c70000] mb-6">
            {winners.map(w => w.name).join(' & ')}
          </p>
          <div className="text-left text-black w-full mb-6">
            <h3 className="font-bold text-center mb-2">Bảng Điểm Cuối Cùng:</h3>
            <ul className="space-y-1">
              {players.sort((a,b) => b.score - a.score).map(p => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="font-bold">{p.score}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Restart and Menu buttons are now in the sidebar */}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'menu':
        return <MainMenu onSelectMode={handleSelectMode} onShowInstructions={() => setView('instructions')} />;
      case 'lobby':
        return <Lobby gameMode={gameMode} onStartGame={handleStartGame} onReturnToMenu={handleReturnToMenu} isLoading={isLoading} error={error} />;
      case 'playing':
      case 'finished':
        const currentPlayer = players[currentPlayerIndex];
        return (
          <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto gap-6 flex-grow">
            {/* Sidebar */}
            <div className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-black/80 p-4 rounded-lg border-2 border-[#c70000] flex flex-col shadow-lg">
                <Dashboard currentPlayer={currentPlayer} moves={moves}/>
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
                <GameBoard cards={cards} onCardClick={handleCardClick} isDisabled={isChecking} />
            </div>
          </div>
        );
      default:
        return <MainMenu onSelectMode={handleSelectMode} onShowInstructions={() => setView('instructions')} />;
    }
  };

  return (
    <main className="min-h-screen text-slate-100 flex flex-col items-center p-4 sm:p-6">
      <h1 className="text-4xl sm:text-5xl font-bold text-center text-[#c70000] my-4 sm:my-8 uppercase tracking-wider flex-shrink-0" style={{ textShadow: '2px 2px #000' }}>
        Đấu Trí Mác-Lênin
      </h1>
      {renderContent()}
      {view === 'instructions' && <InstructionsModal onClose={() => setView(gameMode ? 'lobby' : 'menu')} />}
      {renderFinishedModal()}
    </main>
  );
};

export default App;