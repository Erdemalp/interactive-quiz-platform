import { useState } from 'react';
import { getQuizHistory, deleteQuizFromHistory, clearQuizHistory, downloadHistoricalReport, getStudentPerformanceHistory } from '../utils/questionBank';

function QuizHistoryModal({ onClose }) {
  const [history, setHistory] = useState(getQuizHistory());
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [searchStudent, setSearchStudent] = useState('');
  const [studentStats, setStudentStats] = useState(null);

  const handleDelete = (id) => {
    if (window.confirm('Bu quiz kaydını silmek istediğinizden emin misiniz?')) {
      deleteQuizFromHistory(id);
      setHistory(getQuizHistory());
    }
  };

  const handleClearAll = () => {
    if (window.confirm('TÜM quiz geçmişini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      clearQuizHistory();
      setHistory([]);
    }
  };

  const handleStudentSearch = () => {
    if (!searchStudent.trim()) {
      alert('Lütfen öğrenci adı girin');
      return;
    }
    const stats = getStudentPerformanceHistory(searchStudent.trim());
    if (stats && stats.totalQuizzes > 0) {
      setStudentStats(stats);
    } else {
      alert(`"${searchStudent}" adlı öğrenci hiçbir quiz'e katılmamış.`);
      setStudentStats(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">📜 Quiz Geçmişi</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {/* Öğrenci Arama */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold mb-3">🔍 Öğrenci Performans Arama</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Öğrenci adı girin (örn: Ahmet)"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleStudentSearch()}
              className="input-field flex-1"
            />
            <button onClick={handleStudentSearch} className="btn-primary">
              Ara
            </button>
          </div>

          {/* Öğrenci İstatistikleri */}
          {studentStats && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <h4 className="font-bold text-lg mb-3">📊 {searchStudent} - Genel İstatistikler</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-lg text-center">
                  <div className="text-2xl font-black">{studentStats.totalQuizzes}</div>
                  <div className="text-xs text-gray-600">Toplam Quiz</div>
                </div>
                <div className="bg-green-100 p-3 rounded-lg text-center">
                  <div className="text-2xl font-black">{studentStats.totalCorrect}</div>
                  <div className="text-xs text-gray-600">Toplam Doğru</div>
                </div>
                <div className="bg-red-100 p-3 rounded-lg text-center">
                  <div className="text-2xl font-black">{studentStats.totalAnswered - studentStats.totalCorrect}</div>
                  <div className="text-xs text-gray-600">Toplam Yanlış</div>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg text-center">
                  <div className="text-2xl font-black">⚡{studentStats.totalPoints}</div>
                  <div className="text-xs text-gray-600">Toplam Puan</div>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg text-center">
                  <div className="text-2xl font-black">%{studentStats.averagePercentage}</div>
                  <div className="text-xs text-gray-600">Ortalama</div>
                </div>
              </div>
              <div className="space-y-2">
                {studentStats.quizzes.map((quiz, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded text-sm">
                    <div>
                      <p className="font-semibold">{quiz.quizTitle}</p>
                      <p className="text-xs text-gray-600">{new Date(quiz.date).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">⚡{quiz.totalPoints} puan - #{quiz.rank}</p>
                      <p className="text-xs text-gray-600">{quiz.correctAnswers}/{quiz.totalAnswered} (%{quiz.percentage})</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quiz Listesi */}
        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-bold text-xl">Tüm Quiz'ler ({history.length})</h3>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-red-600 hover:text-red-800 text-sm font-semibold"
            >
              🗑️ Tümünü Temizle
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl mb-2">📭</p>
            <p>Henüz quiz geçmişi yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((quiz) => (
              <div key={quiz.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{quiz.title}</h4>
                    <p className="text-sm text-gray-600">
                      📅 {new Date(quiz.date).toLocaleString('tr-TR')} • 
                      👤 {quiz.teacherName} • 
                      📝 {quiz.totalQuestions} soru • 
                      👥 {quiz.totalParticipants} katılımcı
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Kod: {quiz.sessionCode}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedQuiz(selectedQuiz?.id === quiz.id ? null : quiz)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      {selectedQuiz?.id === quiz.id ? 'Kapat' : 'Detay'}
                    </button>
                    <button
                      onClick={() => downloadHistoricalReport(quiz)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                    >
                      📄 Rapor
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Top 3 Önizleme */}
                <div className="flex gap-2 flex-wrap">
                  {quiz.leaderboard?.slice(0, 3).map((student, idx) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div key={idx} className="bg-gray-50 px-3 py-1 rounded-full text-sm">
                        {medals[idx]} {student.name} - ⚡{student.totalPoints || 0}
                      </div>
                    );
                  })}
                </div>

                {/* Detaylı Görünüm */}
                {selectedQuiz?.id === quiz.id && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="font-bold mb-3">📊 Tüm Katılımcılar</h5>
                    <div className="space-y-2">
                      {quiz.participants
                        .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
                        .map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-500">#{idx + 1}</span>
                              <span className="font-semibold">{p.name}</span>
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-bold">⚡{p.totalPoints || 0} puan</p>
                              <p className="text-gray-600">
                                {p.correctAnswers} doğru / {p.totalAnswered} soru (%{p.percentage})
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={onClose} className="btn-secondary px-8">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizHistoryModal;

