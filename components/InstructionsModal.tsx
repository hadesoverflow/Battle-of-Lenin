import React from 'react';

interface InstructionsModalProps {
    onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#fdf6e3] p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl text-black border-4 border-black relative max-h-[90vh] overflow-y-auto">
                <h2 className="text-3xl font-bold mb-4 text-center text-[#c70000] uppercase">Hướng Dẫn Chơi</h2>
                
                <div className="space-y-4 text-left">
                    <div>
                        <h3 className="font-bold text-xl mb-1">Mục Tiêu</h3>
                        <p>Lật các thẻ bài để tìm và ghép các cặp Câu Hỏi và Câu Trả Lời tương ứng về chủ nghĩa Mác-Lênin. Người chơi/đội có nhiều cặp nhất khi tất cả các thẻ đã được lật sẽ chiến thắng.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-xl mb-1">Cách Chơi</h3>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Tại lượt của mình, người chơi lật hai thẻ bài bất kỳ.</li>
                            <li><strong>Nếu trùng khớp:</strong> Hai thẻ tạo thành một cặp Câu Hỏi - Câu Trả Lời đúng, chúng sẽ được giữ nguyên và người chơi/đội nhận được 1 điểm.</li>
                            <li><strong>Nếu không khớp:</strong> Hai thẻ sẽ tự động bị lật úp lại sau một khoảng thời gian ngắn.</li>
                            <li>Hãy cố gắng ghi nhớ vị trí và nội dung của các thẻ đã lật để tìm các cặp ở lượt tiếp theo.</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-xl mb-1">Chế Độ Chơi</h3>
                         <ul className="list-disc list-inside space-y-1">
                            <li><strong>Chơi Đơn:</strong> Mọi người thi đấu với nhau. Người tìm được nhiều cặp nhất sẽ là người chiến thắng cuối cùng.</li>
                            <li><strong>Cặp Đôi Hoàn Hảo:</strong> Chơi theo đội (cặp 2 người). Các đội sẽ thay phiên nhau lật bài. Đội tìm được nhiều cặp nhất sẽ chiến thắng.</li>
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
