
import React from 'react';
import { CardData, CardOriginRect } from '../types';
import Card from './Card';

interface GameBoardProps {
  cards: CardData[];
  onCardClick: (card: CardData) => void;
  onRevealCard: (card: CardData, origin: CardOriginRect | null) => void;
  isDisabled: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ cards, onCardClick, onRevealCard, isDisabled }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 w-full max-w-6xl">
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          onCardClick={onCardClick}
          onReveal={onRevealCard}
          isDisabled={isDisabled}
        />
      ))}
    </div>
  );
};

export default GameBoard;
