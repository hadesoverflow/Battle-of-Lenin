export interface QAPair {
  question: string;
  answer: string;
}

export interface CardData {
  id: string;
  pairId: number;
  type: 'question' | 'answer';
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface Player {
  id: number;
  name: string;
  score: number;
}
