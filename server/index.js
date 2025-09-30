import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

const app = express();
const httpServer = createServer(app);

// Environment variables
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 3000;

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Oturum veritabanı (gerçek uygulamada MongoDB/PostgreSQL kullanılabilir)
const sessions = new Map();
const participants = new Map();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// QR kod oluştur endpoint'i (opsiyonel)
app.post('/api/qr/generate', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, message: 'URL gerekli' });
  }

  try {
    const qrCode = await QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    res.json({ success: true, qrCode });
  } catch (error) {
    console.error('QR kod oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'QR kod oluşturulamadı' });
  }
});

// Yeni oturum oluştur
app.post('/api/session/create', async (req, res) => {
  const { title, teacherName } = req.body;
  const sessionCode = nanoid(6).toUpperCase();
  
  const session = {
    code: sessionCode,
    title: title || 'Yeni Quiz',
    teacherName: teacherName || 'Öğretmen',
    questions: [],
    currentQuestionIndex: null,
    participants: [],
    createdAt: new Date()
  };
  
  sessions.set(sessionCode, session);

  // QR kod oluştur
  const joinUrl = `${CLIENT_URL}/join/${sessionCode}`;
  console.log('QR kod oluşturuluyor:', joinUrl);

  let qrCode;
  try {
    qrCode = await QRCode.toDataURL(joinUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    console.log('QR kod başarıyla oluşturuldu');
  } catch (error) {
    console.error('QR kod oluşturma hatası:', error);
    // QR kod oluşturma başarısız olursa, URL'yi döndür
    qrCode = joinUrl;
  }

  res.json({
    success: true,
    session: {
      code: sessionCode,
      title: session.title,
      qrCode
    }
  });
});

// Oturum bilgisi al
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
    type: type || 'multiple-choice',
    options: options || [],
    correctAnswer,
    timeLimit: timeLimit || 30,
    responses: []
  };
  
  session.questions.push(newQuestion);
  sessions.set(code, session);
  
  // Katılımcılara bildir
  io.to(code).emit('question-added', newQuestion);
  
  res.json({ success: true, question: newQuestion });
});

// Soruyu başlat
app.post('/api/session/:code/start-question/:questionId', (req, res) => {
  const { code, questionId } = req.params;
  const session = sessions.get(code);
  
  if (!session) {
    return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
  }
  
  const questionIndex = session.questions.findIndex(q => q.id === questionId);
  if (questionIndex === -1) {
    return res.status(404).json({ success: false, message: 'Soru bulunamadı' });
  }
  
  session.currentQuestionIndex = questionIndex;
  session.questions[questionIndex].responses = [];
  sessions.set(code, session);
  
  // Katılımcılara soruyu gönder
  io.to(code).emit('question-started', {
    question: session.questions[questionIndex],
    index: questionIndex
  });
  
  res.json({ success: true });
});

// Soruyu sonlandır
app.post('/api/session/:code/end-question', (req, res) => {
  const { code } = req.params;
  const session = sessions.get(code);
  
  if (!session) {
    return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
  }
  
  const currentQuestion = session.questions[session.currentQuestionIndex];
  session.currentQuestionIndex = null;
  sessions.set(code, session);
  
  // Sonuçları hesapla ve gönder
  const results = calculateResults(currentQuestion);
  io.to(code).emit('question-ended', results);
  
  res.json({ success: true, results });
});

function calculateResults(question) {
  const results = {
    questionId: question.id,
    totalResponses: question.responses.length,
    breakdown: {}
  };
  
  if (question.type === 'multiple-choice') {
    question.options.forEach(option => {
      results.breakdown[option] = 0;
    });
    
    question.responses.forEach(response => {
      if (results.breakdown[response.answer] !== undefined) {
        results.breakdown[response.answer]++;
      }
    });
  }
  
  return results;
}

// Socket.IO bağlantıları
io.on('connection', (socket) => {
  console.log('Yeni bağlantı:', socket.id);
  
  // Öğrenci katılımı
  socket.on('join-session', ({ sessionCode, studentName }) => {
    const session = sessions.get(sessionCode);
    
    if (!session) {
      socket.emit('error', { message: 'Oturum bulunamadı' });
      return;
    }
    
    socket.join(sessionCode);
    
    const participant = {
      id: socket.id,
      name: studentName,
      joinedAt: new Date()
    };
    
    session.participants.push(participant);
    participants.set(socket.id, { sessionCode, name: studentName });
    sessions.set(sessionCode, session);
    
    socket.emit('joined-session', {
      session: {
        code: sessionCode,
        title: session.title,
        teacherName: session.teacherName
      }
    });
    
    // Öğretmene yeni katılımı bildir
    io.to(sessionCode).emit('participant-joined', {
      participant,
      totalCount: session.participants.length
    });
    
    console.log(`${studentName} oturuma katıldı: ${sessionCode}`);
  });
  
  // Öğretmen paneline katıl
  socket.on('join-teacher-panel', ({ sessionCode }) => {
    socket.join(`teacher-${sessionCode}`);
    socket.join(sessionCode);
  });
  
  // Cevap gönder
  socket.on('submit-answer', ({ sessionCode, questionId, answer }) => {
    const session = sessions.get(sessionCode);
    const participant = participants.get(socket.id);
    
    if (!session || !participant) {
      socket.emit('error', { message: 'Geçersiz oturum veya katılımcı' });
      return;
    }
    
    const question = session.questions.find(q => q.id === questionId);
    if (!question) {
      socket.emit('error', { message: 'Soru bulunamadı' });
      return;
    }
    
    // Cevabı kaydet
    const existingResponseIndex = question.responses.findIndex(r => r.participantId === socket.id);
    
    if (existingResponseIndex !== -1) {
      question.responses[existingResponseIndex] = {
        participantId: socket.id,
        participantName: participant.name,
        answer,
        timestamp: new Date()
      };
    } else {
      question.responses.push({
        participantId: socket.id,
        participantName: participant.name,
        answer,
        timestamp: new Date()
      });
    }
    
    sessions.set(sessionCode, session);
    
    socket.emit('answer-submitted', { success: true });
    
    // Öğretmene anlık sonuçları gönder
    const results = calculateResults(question);
    io.to(`teacher-${sessionCode}`).emit('results-update', results);
    
    console.log(`Cevap alındı - ${participant.name}: ${answer}`);
  });
  
  // Bağlantı koptu
  socket.on('disconnect', () => {
    const participant = participants.get(socket.id);
    
    if (participant) {
      const session = sessions.get(participant.sessionCode);
      if (session) {
        session.participants = session.participants.filter(p => p.id !== socket.id);
        sessions.set(participant.sessionCode, session);
        
        io.to(participant.sessionCode).emit('participant-left', {
          participantId: socket.id,
          totalCount: session.participants.length
        });
      }
      
      participants.delete(socket.id);
    }
    
    console.log('Bağlantı koptu:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
  console.log(`📱 Client URL: ${CLIENT_URL}`);
});

