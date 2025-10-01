import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { API_URL, SOCKET_URL, CLIENT_URL } from '../config';
import QuestionBankModal from '../components/QuestionBankModal';
import LeaderboardModal from '../components/LeaderboardModal';
import QuizHistoryModal from '../components/QuizHistoryModal';
import { downloadReportAsMarkdown, saveQuizToHistory } from '../utils/questionBank';

const socket = io(SOCKET_URL);

function TeacherPanel() {
  const { sessionCode } = useParams();
  const [session, setSession] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [participants, setParticipants] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [results, setResults] = useState(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  
  // Yeni soru formu
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    timeLimit: 20
  });
  
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(null);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showQuizHistory, setShowQuizHistory] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);

  useEffect(() => {
    loadSession();
    socket.emit('join-teacher-panel', { sessionCode });

    socket.on('participant-joined', ({ participant, totalCount }) => {
      setParticipants(prev => [...prev, participant]);
    });

    socket.on('results-update', (newResults) => {
      setResults(newResults);
    });

    socket.on('question-ended', (finalResults) => {
      setResults(finalResults);
      setCurrentQuestion(null);
    });

    return () => {
      socket.off('participant-joined');
      socket.off('results-update');
      socket.off('question-ended');
    };
  }, [sessionCode]);

  const loadSession = async () => {
    try {
      console.log('Oturum bilgileri yükleniyor...');
      const response = await fetch(`${API_URL}/api/session/${sessionCode}`);
      const data = await response.json();

      console.log('Oturum bilgileri:', data);

      if (data.success) {
        setSession(data.session);
        setParticipants(data.session.participants);

        // QR kod'u session'dan al
        const qrCodeFromServer = data.session.qrCode;

        console.log('QR kod bilgisi:', {
          qrCodeFromServer,
          startsWithData: qrCodeFromServer?.startsWith('data:image')
        });

        setQrCode(qrCodeFromServer);

        if (qrCodeFromServer && qrCodeFromServer.startsWith('data:image')) {
          console.log('✅ QR kod başarıyla yüklendi');
        } else {
          console.log('⚠️ QR kod düzgün yüklenmedi');
        }
      } else {
        console.error('Oturum bilgileri alınamadı:', data);
      }
    } catch (error) {
      console.error('Oturum yüklenemedi:', error);
    }
  };

  const addQuestion = async () => {
    if (!newQuestion.question.trim()) {
      alert('Lütfen soru metnini girin');
      return;
    }

    const validOptions = newQuestion.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('En az 2 seçenek girmelisiniz');
      return;
    }
    
    if (!newQuestion.correctAnswer || !validOptions.includes(newQuestion.correctAnswer)) {
      alert('Lütfen doğru cevabı seçin');
      return;
    }

    try {
      if (editingQuestionId) {
        // Düzenleme modu
        await updateQuestion();
      } else {
        // Yeni soru ekleme
        const response = await fetch(`${API_URL}/api/session/${sessionCode}/question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newQuestion,
            options: validOptions
          })
        });

        const data = await response.json();
        if (data.success) {
          setSession(prev => ({
            ...prev,
            questions: [...prev.questions, data.question]
          }));
          resetQuestionForm();
        }
      }
    } catch (error) {
      console.error('Soru eklenemedi:', error);
    }
  };
  
  const updateQuestion = async () => {
    const validOptions = newQuestion.options.filter(opt => opt.trim());
    
    try {
      const response = await fetch(`${API_URL}/api/session/${sessionCode}/question/${editingQuestionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuestion,
          options: validOptions
        })
      });

      const data = await response.json();
      if (data.success) {
        setSession(prev => ({
          ...prev,
          questions: prev.questions.map(q => 
            q.id === editingQuestionId ? data.question : q
          )
        }));
        resetQuestionForm();
        alert('✅ Soru güncellendi!');
      }
    } catch (error) {
      console.error('Soru güncellenemedi:', error);
      alert('❌ Soru güncellenemedi!');
    }
  };
  
  const startEditing = (question) => {
    setEditingQuestionId(question.id);
    setNewQuestion({
      question: question.question,
      type: question.type,
      options: [...question.options, '', '', '', ''].slice(0, 4), // En az 4 seçenek
      correctAnswer: question.correctAnswer,
      timeLimit: question.timeLimit || 20
    });
    setShowAddQuestion(true);
  };
  
  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Bu soruyu silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/session/${sessionCode}/question/${questionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setSession(prev => ({
          ...prev,
          questions: prev.questions.filter(q => q.id !== questionId)
        }));
        alert('✅ Soru silindi!');
      }
    } catch (error) {
      console.error('Soru silinemedi:', error);
      alert('❌ Soru silinemedi!');
    }
  };
  
  const resetQuestionForm = () => {
    setNewQuestion({
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      timeLimit: 20
    });
    setShowAddQuestion(false);
    setEditingQuestionId(null);
  };

  const showQuizResults = async () => {
    try {
      // Tüm öğrencilere quiz sonuçlarını gönder
      const response = await fetch(`${API_URL}/api/session/${sessionCode}/show-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Quiz modunu kapat (artık sonuç gösteriliyor)
        setQuizMode(false);
        setCurrentQuizIndex(0);
        
        // Leaderboard'ı göster
        await loadLeaderboard();

        alert('✅ Quiz sonuçları tüm öğrencilere gönderildi!');
      } else {
        alert('❌ Quiz sonuçları gönderilemedi!');
      }
    } catch (error) {
      console.error('Quiz sonuçları gösterilemedi:', error);
      alert('❌ Quiz sonuçları gösterilemedi!');
    }
  };
  
  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/session/${sessionCode}/leaderboard`);
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
        setShowLeaderboard(true);
        
        // Quiz'i geçmişe kaydet
        await saveQuizToHistoryNow();
      }
    } catch (error) {
      console.error('Leaderboard yüklenemedi:', error);
    }
  };
  
  const saveQuizToHistoryNow = async () => {
    try {
      // Quiz raporunu al
      const reportResponse = await fetch(`${API_URL}/api/session/${sessionCode}/report`);
      const reportData = await reportResponse.json();
      
      if (reportData.success) {
        const quizData = {
          sessionCode: sessionCode,
          title: session.title,
          teacherName: session.teacherName,
          totalQuestions: session.questions.length,
          totalParticipants: session.participants.length,
          participants: reportData.report.participants,
          questions: session.questions,
          leaderboard: reportData.report.participants
            .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
            .slice(0, 3)
        };
        
        const result = saveQuizToHistory(quizData);
        if (result.success) {
          console.log('✅ Quiz geçmişe kaydedildi!');
        }
      }
    } catch (error) {
      console.error('Quiz geçmişe kaydedilemedi:', error);
    }
  };
  
  const loadReport = async () => {
    try {
      const response = await fetch(`${API_URL}/api/session/${sessionCode}/report`);
      const data = await response.json();
      if (data.success) {
        setReport(data.report);
        setShowReport(true);
      }
    } catch (error) {
      console.error('Rapor yüklenemedi:', error);
    }
  };

  const startQuestion = async (questionId) => {
    try {
      await fetch(`${API_URL}/api/session/${sessionCode}/start-question/${questionId}`, {
        method: 'POST'
      });
      
      const question = session.questions.find(q => q.id === questionId);
      setCurrentQuestion(question);
      setResults(null);
    } catch (error) {
      console.error('Soru başlatılamadı:', error);
    }
  };

  const endQuestion = async () => {
    try {
      // Quiz modunda son soru mu kontrol et
      const isLastQuestion = quizMode && currentQuizIndex >= session.questions.length - 1;
      
      const response = await fetch(`${API_URL}/api/session/${sessionCode}/end-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLastQuestion })
      });
      const data = await response.json();
      if (data.success) {
        setResults(data.results);
        setCurrentQuestion(null);
        
        // Quiz modunda ve son soru ise
        if (isLastQuestion) {
          // Quiz bitti, sadece quiz modunu kapat
          // Leaderboard'ı otomatik açma - sadece "Quiz Sonuçlarını Göster" butonuna tıklandığında açılsın
          console.log('🎯 Son soru bitti! Quiz modu aktif kalıyor, leaderboard otomatik açılmayacak');
        }
      }
    } catch (error) {
      console.error('Soru sonlandırılamadı:', error);
    }
  };
  
  const startQuizMode = async () => {
    console.log('🚀 Quiz Başlat butonuna tıklandı!');
    console.log('Soru sayısı:', session.questions.length);

    if (session.questions.length === 0) {
      alert('Önce soru eklemelisiniz!');
      return;
    }

    console.log('✅ Quiz modu aktifleştiriliyor...');
    setQuizMode(true);
    setCurrentQuizIndex(0);
    setResults(null);

    console.log('🎯 İlk soru başlatılıyor...');
    // İlk soruyu başlat
    await startQuestion(session.questions[0].id);
    console.log('✅ İlk soru başlatıldı!');
  };
  
  const nextQuestion = async () => {
    const nextIndex = currentQuizIndex + 1;
    console.log('➡️ Sonraki soru butonuna tıklandı!');
    console.log('Mevcut index:', currentQuizIndex, 'Sonraki index:', nextIndex);

    if (nextIndex >= session.questions.length) {
      console.log('❌ Tüm sorular bitti!');
      alert('Tüm sorular bitti!');
      return;
    }

    console.log('✅ Sonraki soruya geçiliyor...');
    setCurrentQuizIndex(nextIndex);
    setResults(null);
    await startQuestion(session.questions[nextIndex].id);
    console.log('✅ Sonraki soru başlatıldı!');
  };
  
  const loadQuestionBank = async (questions) => {
    // Önce tüm soruları backend'e gönder
    try {
      for (const question of questions) {
        await fetch(`${API_URL}/api/session/${sessionCode}/question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(question)
        });
      }
      
      // Sonra session'ı yeniden yükle
      await loadSession();
      
      alert(`✅ ${questions.length} soru başarıyla yüklendi!`);
    } catch (error) {
      console.error('Sorular yüklenirken hata:', error);
      alert('❌ Sorular yüklenirken bir hata oluştu!');
    }
  };
  
  const handleDownloadReport = async () => {
    if (!report) {
      await loadReport();
    }
    
    if (report) {
      downloadReportAsMarkdown(report);
    }
  };

  const getChartData = () => {
    if (!results || !results.breakdown) return [];
    
    return Object.entries(results.breakdown).map(([option, count]) => ({
      name: option,
      Cevaplar: count
    }));
  };

  const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{session.title}</h1>
              <p className="text-gray-600">Öğretmen: {session.teacherName}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-mono text-2xl font-bold">
                {sessionCode}
              </div>
              <p className="text-sm text-gray-600">
                👥 {participants.length} katılımcı
              </p>
            </div>
          </div>
          
          {/* Quiz Kontrol Butonları */}
          <div className="mt-4 pt-4 border-t flex gap-3 flex-wrap">
            <button
              onClick={() => setShowQuestionBank(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700"
            >
              📚 Soru Bankası
            </button>
            
            <button
              onClick={() => setShowQuizHistory(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              📜 Quiz Geçmişi
            </button>
            
            {!quizMode && session.questions.length > 0 && (
              <button
                onClick={startQuizMode}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                🚀 Quiz'i Başlat ({session.questions.length} soru)
              </button>
            )}
            
            {quizMode && (
              <div className="bg-green-100 text-green-800 px-6 py-3 rounded-lg font-bold">
                Quiz Aktif: Soru {currentQuizIndex + 1} / {session.questions.length}
              </div>
            )}

            {!quizMode && session.questions.length > 0 && (
              <button
                onClick={loadLeaderboard}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition"
              >
                📊 Leaderboard'ı Göster
              </button>
            )}
            
            <button
              onClick={handleDownloadReport}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              📄 Rapor İndir
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sol Panel - QR ve Katılımcılar */}
          <div className="space-y-6">
            {/* QR Kod */}
            <div className="card text-center">
              <h3 className="font-semibold text-gray-800 mb-4">Katılım için QR Kod</h3>

              {!session ? (
                <div className="flex items-center justify-center w-48 h-48 bg-gray-100 rounded-lg mx-auto">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : qrCode && qrCode.startsWith('data:image') ? (
                <img src={qrCode} alt="QR Kod" className="mx-auto w-48 h-48 border-2 border-gray-200 rounded-lg" />
              ) : qrCode && !qrCode.startsWith('data:image') ? (
                <div className="w-48 h-48 bg-gray-50 rounded-lg mx-auto border-2 border-gray-200 flex items-center justify-center p-4">
                  <div className="text-center">
                    <div className="text-6xl mb-2">📱</div>
                    <p className="text-sm text-gray-600 font-mono break-all">{qrCode}</p>
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">⚠️</div>
                    <p className="text-sm">QR kod yükleniyor...</p>
                  </div>
                </div>
              )}

              <p className="mt-4 text-sm text-gray-600">
                veya kodu girin: <span className="font-mono font-bold">{sessionCode}</span>
              </p>
              <a
                href={`${CLIENT_URL}/join/${sessionCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm hover:underline mt-2 inline-block"
              >
                Katılım linkini aç
              </a>
            </div>

            {/* Katılımcılar */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">
                Katılımcılar ({participants.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {participants.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      {idx + 1}
                    </div>
                    <span className="text-sm">{p.name}</span>
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-gray-400 text-center py-4">Henüz katılımcı yok</p>
                )}
              </div>
            </div>
          </div>

          {/* Orta ve Sağ Panel - Sorular ve Sonuçlar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Aktif Soru */}
            {currentQuestion && (
              <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Aktif Soru</h3>
                  <button
                    onClick={endQuestion}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                  >
                    Soruyu Bitir
                  </button>
                </div>
                <p className="text-lg mb-4">{currentQuestion.question}</p>
                <div className="grid grid-cols-2 gap-2">
                  {currentQuestion.options.map((opt, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg">
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sonuçlar */}
            {results && (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    Sonuçlar ({results.totalResponses} cevap)
                  </h3>
                  
                  {quizMode && currentQuizIndex < session.questions.length - 1 && (
                    <button
                      onClick={nextQuestion}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transform hover:scale-105 transition"
                    >
                      ➡️ Sonraki Soru ({currentQuizIndex + 2}/{session.questions.length})
                    </button>
                  )}

                  {quizMode && currentQuizIndex >= session.questions.length - 1 && (
                    <button
                      onClick={showQuizResults}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transform hover:scale-105 transition animate-pulse"
                    >
                      🎉 Quiz Sonuçlarını Göster!
                    </button>
                  )}

                  {/* Quiz Durum Debug */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-bold text-sm text-blue-800 mb-2">🔍 Quiz Durumu:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Quiz Modu:</strong> {quizMode ? '✅ AKTİF' : '❌ KAPALI'}</div>
                      <div><strong>Mevcut Soru:</strong> {currentQuizIndex + 1}</div>
                      <div><strong>Toplam Soru:</strong> {session?.questions?.length || 0}</div>
                      <div><strong>Son Soru?:</strong> {currentQuizIndex >= (session?.questions?.length || 0) - 1 ? '✅ EVET' : '❌ HAYIR'}</div>
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      <strong>Buton Görünür?:</strong> {quizMode && currentQuizIndex >= (session?.questions?.length || 0) - 1 ? '✅ Quiz Sonuçları Butonu Görünecek' : '❌ Henüz Son Soruda Değilsiniz'}
                    </div>

                    {/* Console durumu için ekstra bilgi */}
                    <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                      <div><strong>Debug Console:</strong></div>
                      <div>• Browser Console'u açın (F12)</div>
                      <div>• "🚀 Quiz Başlat butonuna tıklandı!" mesajını arayın</div>
                      <div>• "✅ Quiz modu aktifleştiriliyor..." mesajını arayın</div>
                    </div>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Cevaplar" radius={[8, 8, 0, 0]}>
                      {getChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                
                {results.correctAnswer && (
                  <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <p className="text-green-800 font-bold">
                      ✓ Doğru Cevap: {results.correctAnswer}
                    </p>
                  </div>
                )}
                
                {/* Cevap Vermeyen Öğrenciler */}
                {results.notAnswered && results.notAnswered.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                    <p className="text-yellow-900 font-bold mb-3">
                      ⚠️ Cevap Vermeyen Öğrenciler ({results.notAnswered.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {results.notAnswered.map((student, idx) => (
                        <span 
                          key={idx} 
                          className="bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold"
                        >
                          {student.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sorular Listesi */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Sorular</h3>
                <button
                  onClick={() => setShowAddQuestion(!showAddQuestion)}
                  className="btn-primary"
                >
                  + Yeni Soru
                </button>
              </div>

              {/* Soru Ekleme/Düzenleme Formu */}
              {showAddQuestion && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-lg mb-3">
                    {editingQuestionId ? '✏️ Soruyu Düzenle' : '➕ Yeni Soru Ekle'}
                  </h4>
                  <input
                    type="text"
                    placeholder="Soru metni"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    className="input-field mb-3"
                  />
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {newQuestion.options.map((opt, idx) => (
                      <input
                        key={idx}
                        type="text"
                        placeholder={`Seçenek ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options];
                          newOptions[idx] = e.target.value;
                          setNewQuestion({ ...newQuestion, options: newOptions });
                        }}
                        className="input-field"
                      />
                    ))}
                  </div>
                  
                  {/* Doğru Cevap Seçimi */}
                  <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Doğru Cevap (Zorunlu)
                    </label>
                    <select
                      value={newQuestion.correctAnswer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Doğru cevabı seçin...</option>
                      {newQuestion.options.filter(opt => opt.trim()).map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={addQuestion} className="btn-primary flex-1">
                      {editingQuestionId ? '✅ Güncelle' : '➕ Soruyu Ekle'}
                    </button>
                    <button
                      onClick={resetQuestionForm}
                      className="btn-secondary"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}

              {/* Sorular */}
              <div className="space-y-3">
                {session.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-2">
                          {idx + 1}. {q.question}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {q.options.map((opt, i) => (
                            <span 
                              key={i} 
                              className={`text-xs px-2 py-1 rounded ${
                                opt === q.correctAnswer 
                                  ? 'bg-green-100 text-green-800 font-bold' 
                                  : 'bg-white'
                              }`}
                            >
                              {opt === q.correctAnswer && '✓ '}
                              {opt}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          ⏱️ {q.timeLimit || 20} saniye
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(q)}
                          disabled={quizMode}
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Soruyu Düzenle"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          disabled={quizMode}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Soruyu Sil"
                        >
                          🗑️
                        </button>
                        <button
                          onClick={() => startQuestion(q.id)}
                          disabled={currentQuestion?.id === q.id}
                          className="btn-primary disabled:opacity-50"
                        >
                          {currentQuestion?.id === q.id ? 'Aktif' : 'Başlat'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {session.questions.length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    Henüz soru eklenmedi. Yukarıdaki butondan soru ekleyebilirsiniz.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showQuestionBank && (
        <QuestionBankModal
          questions={session.questions}
          onLoad={loadQuestionBank}
          onClose={() => setShowQuestionBank(false)}
        />
      )}
      
      {showLeaderboard && leaderboard.length > 0 && (
        <LeaderboardModal
          leaderboard={leaderboard}
          onClose={() => setShowLeaderboard(false)}
          onDownloadReport={handleDownloadReport}
        />
      )}
      
      {showQuizHistory && (
        <QuizHistoryModal
          onClose={() => setShowQuizHistory(false)}
        />
      )}
    </div>
  );
}

export default TeacherPanel;

