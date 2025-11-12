import React from 'react';

type GameMode = 'single' | 'couple';

interface MainMenuProps {
  onSelectMode: (mode: GameMode) => void;
  onShowInstructions: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onSelectMode, onShowInstructions }) => {
  
  const buttonStyle = "w-full px-6 py-4 text-xl bg-[#c70000] text-white font-bold rounded-lg hover:bg-[#a60000] transition-transform duration-300 transform hover:scale-105 border-2 border-black shadow-lg uppercase tracking-wider";

  return (
    <div className="bg-[#fdf6e3] p-8 rounded-xl shadow-2xl w-full max-w-md text-center border-4 border-black">
      <div className="space-y-6">
        <button
          onClick={() => onSelectMode('single')}
          className={buttonStyle}
        >
          Chơi Đơn
        </button>
        <button
          onClick={() => onSelectMode('couple')}
          className={buttonStyle}
        >
          Cặp Đôi Hoàn Hảo
        </button>
        <button
          onClick={onShowInstructions}
          className={`${buttonStyle} bg-black text-white hover:bg-gray-800`}
        >
          Hướng Dẫn
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
