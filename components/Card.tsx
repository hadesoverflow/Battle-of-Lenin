import React, { useRef } from 'react';
import { CardData, CardOriginRect } from '../types';

interface CardProps {
  card: CardData;
  onCardClick: (card: CardData) => void;
  isDisabled: boolean;
  onReveal: (card: CardData, origin: CardOriginRect | null) => void;
}

const Card: React.FC<CardProps> = ({ card, onCardClick, isDisabled, onReveal }) => {
  const { content, isFlipped, isMatched, imageSrc } = card;
  const coverImage = '/images/cover.png';
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (!isFlipped && !isMatched && !isDisabled) {
      onCardClick(card);
      const rect = cardRef.current?.getBoundingClientRect();
      const origin = rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null;
      onReveal(card, origin);
    }
  };

  const cardBaseStyle = "absolute inset-0 rounded-2xl shadow-lg flex items-center justify-center p-2 text-center backface-hidden border border-black overflow-hidden";

  return (
    <div
      className="w-full max-h-[220px] perspective-1000 cursor-pointer"
      style={{ aspectRatio: '2 / 3' }}
      onClick={handleClick}
      ref={cardRef}
    >
      <div
        className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Card Back (default view shows cover) */}
        <div className={`${cardBaseStyle} bg-gradient-to-br from-black via-gray-900 to-black ${isFlipped ? 'z-0' : 'z-10'} ${isMatched ? 'opacity-60' : ''}`}>
          <div className="w-full h-full flex items-center justify-center p-2">
            <img
              src={coverImage}
              alt="Cover"
              className="max-w-full max-h-full object-contain rounded-2xl border border-white/20 shadow-inner"
              draggable={false}
            />
          </div>
        </div>

        {/* Card Front (reveals actual card image) */}
        <div className={`${cardBaseStyle} bg-black transform rotate-y-180 ${isMatched ? 'opacity-70 border-green-500' : ''}`}>
          {imageSrc ? (
            <div className="w-full h-full flex items-center justify-center p-1">
              <img
                src={imageSrc}
                alt={content}
                className="max-w-full max-h-full object-contain rounded-2xl border border-white/20 shadow-inner"
                draggable={false}
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-md bg-gradient-to-br from-[#c70000] to-[#8b0000]" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
