import React from 'react';

interface InstructionsModalProps {
    onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#fdf6e3] p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl text-black border-4 border-black relative max-h-[90vh] overflow-y-auto">
                <h2 className="text-3xl font-bold mb-4 text-center text-[#c70000] uppercase">Hướng Dẫn Chơi</h2>
                
                <div className="space-y-6 text-left">
                    <div className="space-y-2">
                        <h3 className="font-bold text-xl">🎯 MỤC TIÊU</h3>
                        <p>
                            Lật các thẻ bài để xem nội dung của thẻ được chọn và <strong>trả lời câu hỏi tương ứng</strong>.
                        </p>
                        <p>
                            Trò chơi giúp người chơi <strong>ôn lại kiến thức, củng cố tinh thần</strong>, và chuẩn bị cho một
                            <strong> kỳ FA25 thật tốt đẹp</strong>.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-xl">🎮 CÁCH CHƠI</h3>
                        <div className="space-y-2">
                            <h4 className="font-semibold">🔹 1. Chọn thẻ</h4>
                            <p>Trò chơi sẽ <strong>random một người chơi</strong> để chọn 1 tấm thẻ bất kỳ trên bàn.</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold">🔹 2. Hiện nội dung thẻ</h4>
                            <p>Khi thẻ được mở, <strong>sau 3 giây</strong>, hệ thống sẽ hiển thị <strong>thử thách/câu hỏi</strong> của thẻ đó.</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold">🔹 3. Trả lời câu hỏi</h4>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Mỗi câu hỏi có <strong>20 giây</strong> để trả lời.</li>
                                <li>Mỗi thẻ có giá trị <strong>tối đa 100 điểm</strong>.</li>
                                <li>Điểm <strong>phụ thuộc vào tốc độ trả lời</strong> (càng nhanh → điểm càng cao).</li>
                                <li>Nếu trả lời sai, người chơi nhận <strong>0 điểm</strong> cho thẻ đó.</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold">🔹 4. Kết thúc trò chơi</h4>
                            <p>
                                Sau khi <strong>24 thẻ</strong> trên bàn được mở hết, hệ thống tổng hợp điểm và xếp hạng
                                <strong> Top 1 – Top 2 – Top 3</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-bold text-xl">🧩 CHẾ ĐỘ CHƠI</h3>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Người chơi có thể <strong>chơi đơn</strong>.</li>
                            <li>Hoặc <strong>mời bạn bè</strong> tham gia để thi đấu cùng nhau.</li>
                        </ul>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full max-w-xs mx-auto block px-6 py-3 bg-[#c70000] text-white font-semibold rounded-lg hover:bg-[#a60000] transition-colors duration-300 border-2 border-black"
                >
                    ĐÃ HIỂU
                </button>
            </div>
        </div>
    );
};

export default InstructionsModal;
