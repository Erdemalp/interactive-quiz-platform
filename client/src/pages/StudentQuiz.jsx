import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { SOCKET_URL } from '../config';

const socket = io(SOCKET_URL);

function StudentQuiz() {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [results, setResults] = useState(null);
  const [waitingMessage, setWaitingMessage] = useState('Öğretmen bir soru başlatana kadar bekleyin...');
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);
  const [finalStats, setFinalStats] = useState(null);

  useEffect(() => {
    const name = localStorage.getItem('studentName');
    const code = localStorage.getItem('sessionCode');

    if (!name || code !== sessionCode) {
      navigate(`/join/${sessionCode}`);
      return;
    }

    setStudentName(name);

    // Oturuma katıl
    socket.emit('join-session', { sessionCode, studentName: name });

    socket.on('joined-session', ({ session }) => {
      setSession(session);
    });

    socket.on('question-started', ({ question }) => {
      setCurrentQuestion(question);
      setSelectedAnswer('');
      setHasAnswered(false);
      setResults(null);
      setTimeLeft(question.timeLimit || 20);
      setTimerActive(true);
    });

    socket.on('question-ended', (finalResults) => {
      setResults(finalResults);
      setCurrentQuestion(null);
      setTimerActive(false);
      setTimeLeft(null);
      setWaitingMessage('Sonuçlar gösteriliyor...');

      // Sonuçları göster, otomatik temizleme yok
      // Öğretmen sonraki soruya geçene kadar burada kalacak
    });

    socket.on('answer-submitted', ({ isCorrect }) => {
      setHasAnswered(true);
      setTimerActive(false);
    });

    socket.on('quiz-ended', ({ myScore, leaderboard, totalQuestions }) => {
      console.log('Quiz bitti!', { myScore, leaderboard });
      setQuizEnded(true);
      setFinalStats({ myScore, leaderboard, totalQuestions });
      setCurrentQuestion(null);
      setResults(null);
      setWaitingMessage('Quiz tamamlandı!');
    });

    socket.on('error', ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off('joined-session');
      socket.off('question-started');
      socket.off('question-ended');
      socket.off('answer-submitted');
      socket.off('quiz-ended');
      socket.off('error');
    };
  }, [sessionCode, navigate]);
  
  // Timer countdown
  useEffect(() => {
    if (!timerActive || timeLeft === null || timeLeft <= 0 || hasAnswered) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          // Süre bitti, otomatik submit
          if (!hasAnswered && selectedAnswer) {
            submitAnswer();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timerActive, timeLeft, hasAnswered, selectedAnswer]);

  const submitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;

    socket.emit('submit-answer', {
      sessionCode,
      questionId: currentQuestion.id,
      answer: selectedAnswer
    });
  };

  const getResultPercentage = (option) => {
    if (!results || !results.totalResponses) return 0;
    const count = results.breakdown[option] || 0;
    return Math.round((count / results.totalResponses) * 100);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Oturuma katılınıyor...</p>
        </div>
      </div>
    );
  }

  // Quiz bitti - Final Sonuçlar Ekranı
  if (quizEnded && finalStats) {
    const { myScore, leaderboard } = finalStats;
    const myRank = leaderboard.findIndex(p => p.name === myScore.name) + 1;
    
    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          {/* Başlık */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-5xl font-black mb-4">
              🏆 Quiz Tamamlandı!
            </h1>
            <p className="text-xl text-gray-600">{session.title}</p>
          </div>

          {/* Kendi İstatistiklerin */}
          <div className="card mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <h2 className="text-2xl font-bold mb-6 text-center">📊 Senin Performansın</h2>
            
            {/* Toplam Puan - Büyük Gösterim */}
            <div className="bg-white/30 rounded-2xl p-6 text-center backdrop-blur mb-6">
              <div className="text-6xl font-black mb-2">⚡ {myScore.totalPoints}</div>
              <div className="text-xl font-bold">TOPLAM PUAN</div>
              <div className="text-sm opacity-90 mt-2">
                {myScore.correctAnswers > 0 && myScore.totalPoints > myScore.correctAnswers && (
                  <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold">
                    🚀 Hızlı Cevap Bonusu Aldın!
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur">
                <div className="text-4xl font-black mb-2">{myScore.correctAnswers}</div>
                <div className="text-sm opacity-90">Doğru</div>
              </div>
              <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur">
                <div className="text-4xl font-black mb-2">{myScore.wrongAnswers}</div>
                <div className="text-sm opacity-90">Yanlış</div>
              </div>
              <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur">
                <div className="text-4xl font-black mb-2">{myScore.totalAnswered}</div>
                <div className="text-sm opacity-90">Toplam</div>
              </div>
              <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur">
                <div className="text-4xl font-black mb-2">%{myScore.percentage}</div>
                <div className="text-sm opacity-90">Başarı</div>
              </div>
            </div>

            {/* Başarı Mesajı */}
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur">
              <p className="text-2xl font-bold">
                {myScore.percentage >= 80 ? '🌟 Muhteşem! Harika bir performans!' :
                 myScore.percentage >= 60 ? '👏 Güzel! İyi bir sonuç aldın!' :
                 myScore.percentage >= 40 ? '👍 Fena değil! Daha iyisini yapabilirsin!' :
                 '💪 Çalışmaya devam et, başarırsın!'}
              </p>
              {myRank > 0 && myRank <= 3 && (
                <p className="text-xl mt-2 animate-pulse">
                  🎉 {myRank === 1 ? 'BİRİNCİ' : myRank === 2 ? 'İKİNCİ' : 'ÜÇÜNCÜ'} OLDUN!
                </p>
              )}
            </div>
          </div>

          {/* Leaderboard - Top 3 */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              🏅 En Başarılı 3 Öğrenci
            </h2>
            
            <div className="space-y-4">
              {leaderboard.map((player, idx) => {
                const medals = ['🥇', '🥈', '🥉'];
                const colors = [
                  'bg-gradient-to-r from-yellow-400 to-orange-500',
                  'bg-gradient-to-r from-gray-300 to-gray-400',
                  'bg-gradient-to-r from-orange-400 to-amber-600'
                ];
                
                return (
                  <div 
                    key={idx}
                    className={`${colors[idx]} text-white rounded-2xl p-6 transform transition hover:scale-[1.02] shadow-lg`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-5xl">{medals[idx]}</div>
                        <div>
                          <p className="text-2xl font-black">{player.name}</p>
                          <p className="text-sm opacity-90">
                            {player.correctAnswers} doğru / {player.totalAnswered} soru
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-5xl font-black">⚡{player.totalPoints || 0}</div>
                        <div className="text-sm opacity-90">Puan</div>
                        <div className="text-lg mt-1">%{player.percentage}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Çıkış Butonu */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                localStorage.removeItem('studentName');
                localStorage.removeItem('sessionCode');
                navigate('/');
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition"
            >
              🏠 Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{session.title}</h1>
              <p className="text-gray-600">Öğretmen: {session.teacherName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Hoş geldin,</p>
              <p className="font-semibold text-gray-800">{studentName}</p>
            </div>
          </div>
        </div>

        {/* Aktif Soru */}
        {currentQuestion && !hasAnswered && (
          <div className="card">
            {/* Timer */}
            {timeLeft !== null && (
              <div className={`text-center mb-6 p-4 rounded-xl ${
                timeLeft <= 5 ? 'bg-red-100 animate-pulse' : 'bg-blue-100'
              }`}>
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className={`text-4xl font-black ${
                    timeLeft <= 5 ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {timeLeft}
                  </span>
                  <span className="text-lg text-gray-600">saniye</span>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <span className="font-semibold">Cevabınızı seçin</span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {currentQuestion.question}
              </h2>

              <div className="grid gap-3">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAnswer(option)}
                    className={`p-4 rounded-xl text-left font-semibold transition-all transform hover:scale-[1.02] ${
                      selectedAnswer === option
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedAnswer === option
                          ? 'bg-white text-blue-600'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={submitAnswer}
                disabled={!selectedAnswer}
                className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cevabı Gönder
              </button>
            </div>
          </div>
        )}

        {/* Cevap Gönderildi */}
        {hasAnswered && !results && (
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Cevabınız Alındı!</h2>
            <p className="text-gray-600">Öğretmen soruyu bitirene kadar bekleyin</p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Cevabınız:</strong> {selectedAnswer}
              </p>
            </div>
          </div>
        )}

        {/* Sonuçlar */}
        {results && (
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Sonuçlar</h2>
            <p className="text-gray-600 mb-4">Toplam {results.totalResponses} cevap alındı</p>
            
            <div className="space-y-3">
              {Object.entries(results.breakdown).map(([option, count]) => {
                const percentage = results.percentages?.[option] || getResultPercentage(option);
                const isMyAnswer = selectedAnswer === option;
                const isCorrect = option === results.correctAnswer;
                
                return (
                  <div key={option} className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-semibold flex items-center gap-2 ${
                        isCorrect ? 'text-green-600' : isMyAnswer ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        {option}
                        {isCorrect && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                            ✓ DOĞRU CEVAP
                          </span>
                        )}
                        {isMyAnswer && !isCorrect && (
                          <span className="text-sm">(Sizin cevabınız)</span>
                        )}
                        {isMyAnswer && isCorrect && (
                          <span className="text-sm">(Sizin cevabınız - Doğru! 🎉)</span>
                        )}
                      </span>
                      <span className="text-sm text-gray-600">{count} kişi ({percentage}%)</span>
                    </div>
                    <div className="h-10 bg-gray-200 rounded-lg overflow-hidden">
                      <div
                        className={`h-full flex items-center px-3 text-white font-semibold transition-all duration-500 ${
                          isCorrect 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                            : isMyAnswer 
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                              : 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 10 && `${percentage}%`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bekleme Ekranı */}
        {!currentQuestion && !results && !quizEnded && (
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-blue-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Hazır mısınız?</h2>
            <p className="text-gray-600">{waitingMessage}</p>

            <div className="mt-8 flex justify-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>

            {/* Manuel Sonuçları Göster Butonu */}
            <div className="mt-6">
              <button
                onClick={() => {
                  // Tüm sorular sorulmuşsa sonuçları manuel göster
                  if (session && session.questions && session.questions.length > 0) {
                    socket.emit('request-quiz-results', { sessionCode });
                  }
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transform hover:scale-105 transition"
              >
                📊 Sonuçları Göster
              </button>
            </div>
          </div>
        )}

        {/* Çıkış Butonu */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              localStorage.removeItem('studentName');
              localStorage.removeItem('sessionCode');
              navigate('/');
            }}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Oturumdan Çık
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentQuiz;

