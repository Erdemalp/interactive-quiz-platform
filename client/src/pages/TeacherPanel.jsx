import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { API_URL, SOCKET_URL, CLIENT_URL } from '../config';

const socket = io(SOCKET_URL);

function TeacherPanel() {
  const { sessionCode } = useParams();
  const [session, setSession] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [participants, setParticipants] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [results, setResults] = useState(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  
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
        setNewQuestion({
          question: '',
          type: 'multiple-choice',
          options: ['', '', '', ''],
          correctAnswer: '',
          timeLimit: 20
        });
        setShowAddQuestion(false);
      }
    } catch (error) {
      console.error('Soru eklenemedi:', error);
    }
  };
  
  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/session/${sessionCode}/leaderboard`);
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
        setShowLeaderboard(true);
      }
    } catch (error) {
      console.error('Leaderboard yüklenemedi:', error);
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
      const response = await fetch(`${API_URL}/api/session/${sessionCode}/end-question`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setResults(data.results);
        setCurrentQuestion(null);
      }
    } catch (error) {
      console.error('Soru sonlandırılamadı:', error);
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
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Sonuçlar ({results.totalResponses} cevap)
                </h3>
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

              {/* Soru Ekleme Formu */}
              {showAddQuestion && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
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
                      Soruyu Ekle
                    </button>
                    <button
                      onClick={() => setShowAddQuestion(false)}
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
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-2">
                          {idx + 1}. {q.question}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt, i) => (
                            <span key={i} className="text-xs bg-white px-2 py-1 rounded">
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => startQuestion(q.id)}
                        disabled={currentQuestion?.id === q.id}
                        className="btn-primary ml-4 disabled:opacity-50"
                      >
                        {currentQuestion?.id === q.id ? 'Aktif' : 'Başlat'}
                      </button>
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
    </div>
  );
}

export default TeacherPanel;

