import React from 'react';
import { Player } from '../types';

interface PlayerListProps {
    players: Player[];
    currentPlayerId: number;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerId }) => {
    return (
        <div className="w-full mt-4">
            <h3 className="text-center text-xl font-bold uppercase text-gray-300 mb-2 border-t-2 border-red-900/50 pt-4">Người Chơi</h3>
            <div className="flex flex-col space-y-2">
                {players.sort((a,b) => b.score - a.score).map(player => (
                    <div 
                        key={player.id} 
                        className={`flex justify-between items-center p-2 rounded-md transition-all duration-300 shadow-md ${player.id === currentPlayerId ? 'bg-yellow-400 text-black scale-105' : 'bg-gray-700 text-white'}`}
                    >
                        <p className="font-bold text-sm truncate">{player.name}</p>
                        <p className="font-semibold text-lg">{player.score}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlayerList;