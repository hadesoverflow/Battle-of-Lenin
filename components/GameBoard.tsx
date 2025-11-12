
import React from 'react';
import { CardData } from '../types';
import Card from './Card';

interface GameBoardProps {
  cards: CardData[];
  onCardClick: (card: CardData) => void;
  isDisabled: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ cards, onCardClick, isDisabled }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full max-w-4xl">
      {cards.map((card) => (
        <Card key={card.id} card={card} onCardClick={onCardClick} isDisabled={isDisabled}/>
      ))}
    </div>
  );
};

export default GameBoard;
