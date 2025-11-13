import React, { useState } from 'react';

interface LobbyProps {
  onStartGame: (playerNames: string[]) => void;
  onReturnToMenu: () => void;
  isLoading: boolean;
  error: string | null;
}

const Lobby: React.FC<LobbyProps> = ({ onStartGame, onReturnToMenu, isLoading, error }) => {
  const [username, setUsername] = useState('');
  const [confirmedName, setConfirmedName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!username.trim()) {
      setMessage('Vui lòng nhập username để tiếp tục.');
      setConfirmedName(null);
      return;
    }
    setConfirmedName(username.trim());
    setMessage('Đã xác nhận! Bạn có thể vào phòng chơi.');
  };

  const handleEdit = () => {
    setConfirmedName(null);
    setMessage(null);
  };

  const handleEnterRoom = () => {
    const playerName = confirmedName ?? username.trim();
    if (!playerName) {
      setMessage('Vui lòng xác nhận username trước khi vào phòng.');
      return;
    }
    onStartGame([playerName]);
  };

  return (
    <div className="bg-[#fdf6e3] p-8 rounded-xl shadow-2xl w-full max-w-md border-4 border-black space-y-6 text-left">
      <div>
        <p className="text-sm font-semibold text-black uppercase tracking-wide">Bước 1</p>
        <h2 className="text-3xl font-bold text-black">Nhập username của bạn</h2>
        <p className="text-black/70 mt-2">
          Đây sẽ là tên hiển thị trong suốt trận đấu. Bạn có thể thay đổi trước khi xác nhận.
        </p>
      </div>

      <div className="space-y-3">
        <label htmlFor="username" className="font-semibold text-black">
          Username
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="username"
            type="text"
            value={confirmedName ?? username}
            onChange={(e) => !confirmedName && setUsername(e.target.value)}
            placeholder="Ví dụ: LeninMaster"
            className="flex-grow p-3 rounded-lg border-2 border-black text-black text-lg"
            disabled={!!confirmedName}
            onKeyDown={(e) => e.key === 'Enter' && !confirmedName && handleConfirm()}
          />
          {confirmedName ? (
            <button
              onClick={handleEdit}
              className="px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors border-2 border-black"
            >
              Thay đổi
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition-colors border-2 border-black"
            >
              Xác nhận
            </button>
          )}
        </div>
        {message && <p className="text-black font-medium">{message}</p>}
        {error && <p className="text-red-600 font-semibold">{error}</p>}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-black uppercase tracking-wide">Bước 2</p>
        <h3 className="text-2xl font-bold text-black">Vào phòng chơi</h3>
        <p className="text-black/70">
          Sau khi xác nhận username, nhấn &quot;Vào Phòng Chơi&quot; để bắt đầu ngay.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onReturnToMenu}
          className="w-full px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors border-2 border-gray-500"
        >
          Về Menu Chính
        </button>
        <button
          onClick={handleEnterRoom}
          disabled={!confirmedName || isLoading}
          className="w-full px-6 py-3 bg-[#c70000] text-white font-semibold rounded-lg hover:bg-[#a60000] transition-colors border-2 border-black disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            'Vào Phòng Chơi'
          )}
        </button>
      </div>
    </div>
  );
};

export default Lobby;
