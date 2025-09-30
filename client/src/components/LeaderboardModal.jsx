function LeaderboardModal({ leaderboard, onClose, onDownloadReport }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black mb-2">🏆 Quiz Tamamlandı!</h2>
          <p className="text-xl text-gray-600">En Başarılı 3 Öğrenci</p>
        </div>

        <div className="space-y-4 mb-8">
          {leaderboard.map((student, idx) => {
            const colors = [
              'bg-gradient-to-r from-yellow-400 to-amber-500',
              'bg-gradient-to-r from-gray-300 to-gray-400',
              'bg-gradient-to-r from-orange-400 to-amber-600'
            ];
            const medals = ['🥇', '🥈', '🥉'];
            
            return (
              <div key={idx} className={`${colors[idx]} rounded-xl p-6 text-white shadow-xl`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">{medals[idx]}</span>
                    <div>
                      <p className="text-2xl font-bold">{student.name}</p>
                      <p className="text-white/80">
                        {student.correctAnswers} doğru / {student.totalAnswered} soru
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black">%{student.percentage}</p>
                    <p className="text-white/80">Başarı</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={onDownloadReport} className="btn-primary flex-1">
            📄 Raporu İndir (.md)
          </button>
          <button onClick={onClose} className="btn-secondary">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardModal;

