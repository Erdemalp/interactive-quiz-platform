import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

const app = express();
const server = createServer(app);

// CORS ayarları
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Session storage
const sessions = new Map();
const participantScores = new Map(); // Her session için participant skorları
const questionStartTimes = new Map(); // Her session için soru başlangıç zamanları

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    sessions: sessions.size,
    participants: Array.from(participantScores.values()).reduce((total, scores) => total + scores.size, 0)
  });
});

// Session oluştur
app.post('/api/session/create', async (req, res) => {
  try {
    const { teacherName, title } = req.body;
    const sessionCode = nanoid(6).toUpperCase();
    
    // QR kod oluştur
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const joinUrl = `${clientUrl}/join/${sessionCode}`;
    const qrCode = await QRCode.toDataURL(joinUrl);
    
    const session = {
      code: sessionCode,
      teacherName,
      title,
      qrCode, // QR kod'u session'a kaydet
      questions: [],
      participants: [],
      currentQuestionIndex: null,
      createdAt: new Date()
    };
    
    sessions.set(sessionCode, session);
    participantScores.set(sessionCode, new Map());
    questionStartTimes.set(sessionCode, new Map());
    
    res.json({ success: true, session });
  } catch (error) {
    console.error('Session oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'Oturum oluşturulamadı' });
  }
});

// Session bilgilerini getir
app.get('/api/session/:code', (req, res) => {
  const { code } = req.params;
  const session = sessions.get(code);
  
  if (!session) {
    return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
  }
  
  res.json({ success: true, session });
});

// Soru ekle
app.post('/api/session/:code/question', (req, res) => {
  const { code } = req.params;
  const { question, type, options, correctAnswer, timeLimit } = req.body;
  
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
  }
  
  const newQuestion = {
    id: nanoid(),
    question,
    type,
    options,
    correctAnswer,
    timeLimit: timeLimit || 20
  };
  
  session.questions.push(newQuestion);
  sessions.set(code, session);
  
  res.json({ success: true, question: newQuestion });
});

// Soru güncelle
app.put('/api/session/:code/question/:questionId', (req, res) => {
  const { code, questionId } = req.params;
  const { question, type, options, correctAnswer, timeLimit } = req.body;
  
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
  }
  
  const questionIndex = session.questions.findIndex(q => q.id === questionId);
  if (questionIndex === -1) {
    return res.status(404).json({ success: false, message: 'Soru bulunamadı' });
  }
  
  session.questions[questionIndex] = {
    ...session.questions[questionIndex],
    question,
    type,
    options,
    correctAnswer,
    timeLimit: timeLimit || 20
  };
  
  sessions.set(code, session);
  
  res.json({ success: true, question: session.questions[questionIndex] });
});

// Soru sil
app.delete('/api/session/:code/question/:questionId', (req, res) => {
  const { code, questionId } = req.params;
  
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
  }
  
  const questionIndex = session.questions.findIndex(q => q.id === questionId);
  if (questionIndex === -1) {
    return res.status(404).json({ success: false, message: 'Soru bulunamadı' });
  }
  
  session.questions.splice(questionIndex, 1);
  sessions.set(code, session);
  
  res.json({ success: true, message: 'Soru silindi' });
});

// Soruyu başlat
app.post('/api/session/:code/start-question', (req, res) => {
  const { code } = req.params;
  const { questionIndex } = req.body;
  const session = sessions.get(code);
  
  if (!session) {
    return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
  }
  
  if (questionIndex >= session.questions.length) {
    return res.status(400).json({ success: false, message: 'Geçersiz soru indeksi' });
  }
  
  session.currentQuestionIndex = questionIndex;
  sessions.set(code, session);
  
  // Soru başlangıç zamanını kaydet
  const startTimesForSession = questionStartTimes.get(code) || new Map();
  startTimesForSession.set(session.questions[questionIndex].id, new Date());
  questionStartTimes.set(code, startTimesForSession);
  
  // Öğrencilere soruyu gönder (doğru cevabı GÖNDERMEYİN!)
  const questionToSend = {
    id: session.questions[questionIndex].id,
    question: session.questions[questionIndex].question,
    type: session.questions[questionIndex].type,
    options: session.questions[questionIndex].options,
    timeLimit: session.questions[questionIndex].timeLimit,
    // correctAnswer GÖNDERMEYİN!
  };
  
  io.to(code).emit('question-started', {
    question: questionToSend,
    index: questionIndex
  });
  
  res.json({ success: true });
});

// Soruyu sonlandır
app.post('/api/session/:code/end-question', (req, res) => {
  const { code } = req.params;
  const { isLastQuestion } = req.body; // Frontend'den gelen bilgi
  const session = sessions.get(code);
  
  if (!session) {
    return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
  }
  
  const currentQuestion = session.questions[session.currentQuestionIndex];
  session.currentQuestionIndex = null;
  sessions.set(code, session);
  
  // Sonuçları hesapla ve gönder (session bilgisini de gönder)
  const results = calculateResults(currentQuestion, session);
  io.to(code).emit('question-ended', results);
  
  res.json({ success: true, results });
});

// Quiz sonuçlarını göster (öğretmen butonuna bastığında)
app.post('/api/session/:code/show-results', (req, res) => {
  const { code } = req.params;
  const session = sessions.get(code);
  
  if (!session) {
    return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
  }
  
  const sessionScores = participantScores.get(code);
  if (sessionScores) {
    const leaderboard = Array.from(sessionScores.values())
      .map(score => ({
        name: score.name,
        correctAnswers: score.correctAnswers,
        totalAnswered: score.totalAnswered,
        wrongAnswers: score.totalAnswered - score.correctAnswers,
        totalPoints: score.totalPoints || 0,
        percentage: score.totalAnswered > 0
          ? Math.round((score.correctAnswers / score.totalAnswered) * 100)
          : 0
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    session.participants.forEach(participant => {
      const playerScore = sessionScores.get(participant.id);
      if (playerScore) {
        io.to(participant.socketId).emit('quiz-ended', {
          myScore: {
            name: playerScore.name,
            correctAnswers: playerScore.correctAnswers,
            wrongAnswers: playerScore.totalAnswered - playerScore.correctAnswers,
            totalAnswered: playerScore.totalAnswered,
            totalPoints: playerScore.totalPoints || 0,
            percentage: playerScore.totalAnswered > 0
              ? Math.round((playerScore.correctAnswers / playerScore.totalAnswered) * 100)
              : 0
          },
          leaderboard: leaderboard.slice(0, 3),
          totalQuestions: session.questions.length
        });
      }
    });
  }
  res.json({ success: true, message: 'Quiz sonuçları gönderildi' });
});

// Leaderboard getir
app.get('/api/session/:code/leaderboard', (req, res) => {
  const { code } = req.params;
  const session = sessions.get(code);
  
  if (!session) {
    return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
  }
  
  const sessionScores = participantScores.get(code);
  if (!sessionScores) {
    return res.json({ success: true, leaderboard: [] });
  }
  
  const leaderboard = Array.from(sessionScores.values())
    .map(score => ({
      name: score.name,
      correctAnswers: score.correctAnswers,
      totalAnswered: score.totalAnswered,
      wrongAnswers: score.totalAnswered - score.correctAnswers,
      totalPoints: score.totalPoints || 0,
      percentage: score.totalAnswered > 0
        ? Math.round((score.correctAnswers / score.totalAnswered) * 100)
        : 0
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints); // Puana göre sıralama
  
  res.json({ success: true, leaderboard });
});

// Quiz raporu getir
app.get('/api/session/:code/report', (req, res) => {
  const { code } = req.params;
  const session = sessions.get(code);
  
  if (!session) {
    return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
  }
  
  const sessionScores = participantScores.get(code);
  if (!sessionScores) {
    return res.json({ success: true, report: null });
  }
  
  const report = {
    session: {
      code: session.code,
      title: session.title,
      teacherName: session.teacherName,
      createdAt: session.createdAt,
      totalQuestions: session.questions.length
    },
    participants: Array.from(sessionScores.values())
      .map(score => ({
        name: score.name,
        correctAnswers: score.correctAnswers,
        totalAnswered: score.totalAnswered,
        wrongAnswers: score.totalAnswered - score.correctAnswers,
        totalPoints: score.totalPoints || 0,
        percentage: score.totalAnswered > 0
          ? Math.round((score.correctAnswers / score.totalAnswered) * 100)
          : 0
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
  };
  
  res.json({ success: true, report });
});

// Sonuçları hesapla
function calculateResults(question, session) {
  const responses = [];
  const breakdown = {};
  
  // Her seçenek için başlangıç değeri
  question.options.forEach(option => {
    if (option.trim()) {
      breakdown[option] = 0;
    }
  });
  
  // Cevapları topla
  session.participants.forEach(participant => {
    if (participant.currentAnswer) {
      responses.push({
        name: participant.name,
        answer: participant.currentAnswer,
        isCorrect: participant.currentAnswer === question.correctAnswer
      });
      
      if (breakdown[participant.currentAnswer] !== undefined) {
        breakdown[participant.currentAnswer]++;
      }
    }
  });
  
  // Cevap vermeyen öğrencileri bul
  const notAnswered = session.participants
    .filter(participant => !participant.currentAnswer)
    .map(participant => participant.name);
  
  return {
    question: question.question,
    correctAnswer: question.correctAnswer,
    breakdown,
    responses,
    totalResponses: responses.length,
    notAnswered: notAnswered,
    totalParticipants: session.participants.length
  };
}

// Socket.io bağlantıları
io.on('connection', (socket) => {
  console.log('Yeni bağlantı:', socket.id);
  
  // Öğrenci oturuma katıl
  socket.on('join-session', ({ sessionCode, name }) => {
    const session = sessions.get(sessionCode);
    if (!session) {
      socket.emit('error', { message: 'Oturum bulunamadı' });
      return;
    }
    
    // Aynı isimde öğrenci var mı kontrol et
    const existingParticipant = session.participants.find(p => p.name === name);
    if (existingParticipant) {
      socket.emit('error', { message: 'Bu isimde bir öğrenci zaten var' });
      return;
    }
    
    const participant = {
      id: socket.id,
      socketId: socket.id,
      name,
      currentAnswer: null,
      joinedAt: new Date()
    };
    
    session.participants.push(participant);
    sessions.set(sessionCode, session);
    
    // Skor kaydı oluştur
    const sessionScores = participantScores.get(sessionCode) || new Map();
    sessionScores.set(socket.id, {
      name,
      correctAnswers: 0,
      totalAnswered: 0,
      totalPoints: 0,
      answers: []
    });
    participantScores.set(sessionCode, sessionScores);
    
    socket.join(sessionCode);
    socket.emit('joined', { sessionCode, name });
    
    console.log(`${name} ${sessionCode} oturumuna katıldı`);
  });
  
  // Cevap gönder
  socket.on('submit-answer', ({ sessionCode, questionId, answer }) => {
    const session = sessions.get(sessionCode);
    if (!session) return;
    
    const participant = session.participants.find(p => p.id === socket.id);
    if (!participant) return;
    
    participant.currentAnswer = answer;
    sessions.set(sessionCode, session);
    
    // Skor hesapla
    const question = session.questions.find(q => q.id === questionId);
    if (!question) return;
    
    const isCorrect = answer === question.correctAnswer;
    const sessionScores = participantScores.get(sessionCode);
    const score = sessionScores.get(socket.id);
    
    if (!score.answers.includes(questionId)) {
      score.totalAnswered++;
      score.answers.push(questionId);
      
      let points = 0;
      if (isCorrect) {
        score.correctAnswers++;
        
        const startTimesForSession = questionStartTimes.get(sessionCode);
        if (startTimesForSession && startTimesForSession.has(questionId)) {
          const startTime = startTimesForSession.get(questionId);
          const elapsedSeconds = Math.floor((new Date() - startTime) / 1000);
          
          // İlk 10 saniye = 2 puan, sonraki saniyeler = 1 puan
          if (elapsedSeconds <= 10) {
            points = 2; // Hızlı bonus!
          } else {
            points = 1; // Normal puan
          }
        } else {
          points = 1; // Başlangıç zamanı bulunamazsa normal puan
        }
        
        score.totalPoints += points;
      }
      sessionScores.set(socket.id, score);
    }
    
    console.log(`${participant.name} cevap verdi: ${answer} (${isCorrect ? 'Doğru' : 'Yanlış'}) - ${points} puan`);
  });
  
  // Bağlantı koptuğunda
  socket.on('disconnect', () => {
    console.log('Bağlantı koptu:', socket.id);
    
    // Tüm session'lardan bu katılımcıyı kaldır
    for (const [sessionCode, session] of sessions.entries()) {
      const participantIndex = session.participants.findIndex(p => p.id === socket.id);
      if (participantIndex !== -1) {
        const participant = session.participants[participantIndex];
        session.participants.splice(participantIndex, 1);
        sessions.set(sessionCode, session);
        
        // Skor kaydını da kaldır
        const sessionScores = participantScores.get(sessionCode);
        if (sessionScores) {
          sessionScores.delete(socket.id);
        }
        
        console.log(`${participant.name} ${sessionCode} oturumundan ayrıldı`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});