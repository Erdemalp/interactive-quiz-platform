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
    });

    socket.on('question-ended', (finalResults) => {
      setResults(finalResults);
      setCurrentQuestion(null);
      setWaitingMessage('Sonuçlar gösteriliyor...');
      
      // 5 saniye sonra bekleme ekranına dön
      setTimeout(() => {
        setResults(null);
        setWaitingMessage('Bir sonraki soru bekleniyor...');
      }, 5000);
    });

    socket.on('answer-submitted', () => {
      setHasAnswered(true);
    });

    socket.on('error', ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off('joined-session');
      socket.off('question-started');
      socket.off('question-ended');
      socket.off('answer-submitted');
      socket.off('error');
    };
  }, [sessionCode, navigate]);

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
            <div className="mb-6">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <svg className="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Soru aktif - Cevabınızı seçin</span>
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
                const percentage = getResultPercentage(option);
                const isMyAnswer = selectedAnswer === option;
                
                return (
                  <div key={option} className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-semibold ${isMyAnswer ? 'text-blue-600' : 'text-gray-700'}`}>
                        {option} {isMyAnswer && '(Sizin cevabınız)'}
                      </span>
                      <span className="text-sm text-gray-600">{count} kişi ({percentage}%)</span>
                    </div>
                    <div className="h-10 bg-gray-200 rounded-lg overflow-hidden">
                      <div
                        className={`h-full flex items-center px-3 text-white font-semibold transition-all duration-500 ${
                          isMyAnswer ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-400'
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
        {!currentQuestion && !results && (
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

