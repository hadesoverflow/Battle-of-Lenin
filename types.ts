export interface QAPair {
  question: string;
  answer: string;
}

export interface CardData {
  id: string;
  pairId: number;
  type: 'question' | 'answer';
  content: string;
  imageSrc?: string;
  questionForm?: QuestionForm;
  isFlipped: boolean;
  isMatched: boolean;
  isCompleted: boolean;
}

export interface Player {
  id: number;
  name: string;
  score: number;
}

export interface AnswerOption {
  content: string;
  correct: boolean;
}

export interface QuestionForm {
  type: 'singlechoice';
  content: string;
  answers: AnswerOption[];
  explanation?: string;
}

export interface CardOriginRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface QuizResult {
  correct: boolean;
  points: number;
}
