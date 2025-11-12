import React from 'react';
import { CardData } from '../types';

interface CardProps {
  card: CardData;
  onCardClick: (card: CardData) => void;
  isDisabled: boolean;
}

const Card: React.FC<CardProps> = ({ card, onCardClick, isDisabled }) => {
  const { content, isFlipped, isMatched } = card;

  const handleClick = () => {
    if (!isFlipped && !isMatched && !isDisabled) {
      onCardClick(card);
    }
  };

  const cardBaseStyle = "absolute w-full h-full rounded-lg shadow-lg flex items-center justify-center p-2 sm:p-4 text-center backface-hidden border-2 border-black";
  const cardTransition = `transition-all duration-500 ease-in-out ${isMatched ? 'opacity-60' : ''}`;

  return (
    <div className="w-full h-36 sm:h-40 md:h-48 perspective-1000" onClick={handleClick}>
      <div
        className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Card Back */}
        <div className={`${cardBaseStyle} bg-[#c70000] hover:bg-[#a60000] cursor-pointer ${isFlipped ? 'z-0' : 'z-10'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        </div>

        {/* Card Front */}
        <div className={`${cardBaseStyle} bg-[#fdf6e3] text-black transform rotate-y-180 ${isMatched ? 'bg-green-300 border-green-800' : ''}`}>
          <p className="text-xs sm:text-sm font-semibold">{content}</p>
        </div>
      </div>
    </div>
  );
};

export default Card;