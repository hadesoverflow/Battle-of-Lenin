import React, { useState, useEffect } from 'react';

type GameMode = 'single' | 'couple';

interface LobbyProps {
    gameMode: GameMode;
    onStartGame: (playerNames: string[]) => void;
    onReturnToMenu: () => void;
    isLoading: boolean;
    error: string | null;
}

const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const Lobby: React.FC<LobbyProps> = ({ gameMode, onStartGame, onReturnToMenu, isLoading, error }) => {
    const [roomCode, setRoomCode] = useState('');
    const [playerNames, setPlayerNames] = useState<string[]>([]);
    const [playerNameInput, setPlayerNameInput] = useState('');
    const [hostName, setHostName] = useState('');
    const [hostLocked, setHostLocked] = useState(false);
    const [lobbyMode, setLobbyMode] = useState<'create' | 'join'>('create');
    const [joinName, setJoinName] = useState('');
    const [joinLocked, setJoinLocked] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinMessage, setJoinMessage] = useState<string | null>(null);

    useEffect(() => {
        setRoomCode(generateRoomCode());
        setPlayerNames([]);
        setHostName('');
        setHostLocked(false);
        setJoinName('');
        setJoinLocked(false);
        setJoinCode('');
        setJoinMessage(null);
    }, [gameMode]);

    const handleAddPlayer = () => {
        if (playerNameInput.trim() && !playerNames.includes(playerNameInput.trim())) {
            setPlayerNames([...playerNames, playerNameInput.trim()]);
            setPlayerNameInput('');
        }
    };
    
    const handleRemovePlayer = (nameToRemove: string) => {
        setPlayerNames(playerNames.filter(name => name !== nameToRemove));
    };

    const handleConfirmHostName = () => {
        if (!hostName.trim()) return;
        const hostLabel = `${hostName.trim()} (Chủ Phòng)`;
        setPlayerNames(prev => {
            const withoutHost = prev.filter(name => !name.endsWith('(Chủ Phòng)'));
            return [hostLabel, ...withoutHost];
        });
        setHostLocked(true);
    };

    const handleJoinRoom = () => {
        setJoinMessage(null);
        if (!joinName.trim()) {
            setJoinMessage('Vui lòng nhập username của bạn.');
            return;
        }
        if (!joinCode.trim()) {
            setJoinMessage('Vui lòng nhập mã phòng.');
            return;
        }
        if (joinCode.trim().toUpperCase() !== roomCode.toUpperCase()) {
            setJoinMessage('Mã phòng không hợp lệ.');
            return;
        }
        if (!playerNames.includes(joinName.trim())) {
            setPlayerNames(prev => [...prev, joinName.trim()]);
            setJoinMessage('Tham gia phòng thành công!');
            setJoinLocked(true);
        } else {
            setJoinMessage('Username này đã có trong phòng.');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(roomCode).then(() => {
            alert('Đã sao chép mã phòng!');
        });
    };
    
    const gameModeText = gameMode === 'single' ? 'Chơi Đơn' : 'Cặp Đôi Hoàn Hảo';

    return (
        <div className="bg-[#fdf6e3] p-8 rounded-xl shadow-2xl w-full max-w-2xl border-4 border-black space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-black">{gameModeText}</h2>
                <div className="flex bg-black/10 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setLobbyMode('create')}
                        className={`px-4 py-2 text-sm font-semibold ${lobbyMode === 'create' ? 'bg-black text-white' : 'text-black'}`}
                    >
                        Tạo Phòng
                    </button>
                    <button
                        onClick={() => setLobbyMode('join')}
                        className={`px-4 py-2 text-sm font-semibold ${lobbyMode === 'join' ? 'bg-black text-white' : 'text-black'}`}
                    >
                        Vào Phòng
                    </button>
                </div>
            </div>
            
            {lobbyMode === 'create' ? (
                <>
                    <div>
                        <p className="text-black mb-2 font-semibold">MÃ PHÒNG</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-4xl font-bold text-[#c70000] bg-gray-200 border-2 border-black px-4 py-2 rounded-md">
                                {roomCode}
                            </p>
                            <button onClick={copyToClipboard} className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="text-left">
                        <h3 className="font-bold text-xl mb-2 text-black">Username của bạn</h3>
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="text"
                                value={hostName}
                                onChange={(e) => !hostLocked && setHostName(e.target.value)}
                                placeholder="Nhập tên của bạn"
                                className="flex-grow p-2 rounded-md border-2 border-black text-black"
                                onKeyDown={(e) => e.key === 'Enter' && !hostLocked && handleConfirmHostName()}
                                disabled={hostLocked}
                            />
                            <button
                                onClick={handleConfirmHostName}
                                disabled={hostLocked}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {hostLocked ? 'Đã xác nhận' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>

                </>
            ) : (
                <div className="bg-white/70 border-2 border-black rounded-xl p-4 text-left space-y-4">
                    <div>
                        <h3 className="font-bold text-xl mb-2 text-black">Username của bạn</h3>
                        <input
                            type="text"
                            value={joinName}
                            onChange={(e) => !joinLocked && setJoinName(e.target.value)}
                            placeholder="Nhập tên của bạn"
                            className="w-full p-2 rounded-md border-2 border-black text-black"
                            disabled={joinLocked}
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl mb-2 text-black">Nhập mã phòng</h3>
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="Ví dụ: ABC123"
                            className="w-full p-2 rounded-md border-2 border-black text-black uppercase"
                            disabled={joinLocked}
                        />
                    </div>
                    {joinMessage && <p className="text-sm font-semibold text-black">{joinMessage}</p>}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleJoinRoom}
                            disabled={joinLocked}
                            className="flex-1 px-4 py-3 bg-[#c70000] text-white rounded-lg font-semibold hover:bg-[#a60000] transition-colors border-2 border-black disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {joinLocked ? 'Đã tham gia' : 'Xác nhận'}
                        </button>
                        <button
                            onClick={onReturnToMenu}
                            className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors border-2 border-gray-500"
                        >
                            Quay Lại
                        </button>
                    </div>
                </div>
            )}

            {lobbyMode === 'create' && (
                <div className="text-left">
                    <h3 className="font-bold text-xl mb-2 text-black">Danh sách người chơi</h3>
                    <ul className="list-none bg-gray-100 p-3 rounded-lg border-2 border-black h-40 overflow-y-auto space-y-2">
                        {playerNames.map((name, index) => (
                            <li key={index} className="text-black flex justify-between items-center bg-white p-2 rounded">
                                <span>{name}</span>
                                <button onClick={() => handleRemovePlayer(name)} className="text-red-600 hover:text-red-800 font-bold">X</button>
                            </li>
                        ))}
                        {playerNames.length === 0 && <p className="text-gray-500">Chưa có ai trong phòng.</p>}
                    </ul>
                </div>
            )}

            {lobbyMode === 'join' && joinLocked && (
                <div className="text-left">
                    <h3 className="font-bold text-xl mb-2 text-black">Danh sách người chơi trong phòng</h3>
                    <ul className="list-none bg-gray-100 p-3 rounded-lg border-2 border-black h-40 overflow-y-auto space-y-2">
                        {playerNames.map((name, index) => (
                            <li key={index} className="text-black bg-white p-2 rounded text-sm sm:text-base">
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {error && <p className="text-red-600 mb-4 font-semibold">{error}</p>}

            {lobbyMode === 'create' && (
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={onReturnToMenu}
                  className="w-full px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors duration-300 border-2 border-gray-500"
                >
                  Quay Lại
                </button>
                  <button
                    onClick={() => onStartGame(playerNames)}
                    disabled={isLoading || playerNames.length === 0}
                    className="w-full px-6 py-3 bg-[#c70000] text-white font-semibold rounded-lg hover:bg-[#a60000] transition-colors duration-300 disabled:bg-red-400 disabled:cursor-not-allowed border-2 border-black flex items-center justify-center"
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : "Bắt Đầu"}
                  </button>
              </div>
            )}
        </div>
    );
}

export default Lobby;
