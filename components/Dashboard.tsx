import React from 'react';
import { Player } from '../types';

interface DashboardProps {
    currentPlayer?: Player;
    wrongAnswers: number;
}

const Dashboard: React.FC<DashboardProps> = ({ currentPlayer, wrongAnswers }) => {
    if (!currentPlayer) {
        return null;
    }

    const itemStyle = "py-3 border-b-2 border-red-900/50";

    return (
        <div className="w-full text-white mb-6">
            <div className="flex flex-col text-center space-y-3">
                <div className={itemStyle}>
                    <p className="text-sm sm:text-base uppercase text-gray-300">Lượt Của</p>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-300 truncate">{currentPlayer.name}</p>
                </div>
                <div className={itemStyle}>
                    <p className="text-sm sm:text-base uppercase text-gray-300">Điểm Của Bạn</p>
                    <p className="text-2xl sm:text-3xl font-bold">{currentPlayer.score}</p>
                </div>
                <div className="pt-3">
                    <p className="text-sm sm:text-base uppercase text-gray-300">Tổng Lượt Sai</p>
                    <p className="text-2xl sm:text-3xl font-bold">{wrongAnswers}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;