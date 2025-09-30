// Soru Bankası ve Quiz Geçmişi - LocalStorage Yönetimi

const QUESTION_BANKS_KEY = 'quiz_question_banks';
const QUIZ_HISTORY_KEY = 'quiz_history';

// Tüm soru setlerini getir
export const getQuestionBanks = () => {
  try {
    const data = localStorage.getItem(QUESTION_BANKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Soru setleri yüklenemedi:', error);
    return [];
  }
};

// Soru seti kaydet
export const saveQuestionBank = (name, questions) => {
  try {
    const banks = getQuestionBanks();
    
    const newBank = {
      id: Date.now().toString(),
      name,
      questions,
      createdAt: new Date().toISOString(),
      questionCount: questions.length
    };
    
    banks.push(newBank);
    localStorage.setItem(QUESTION_BANKS_KEY, JSON.stringify(banks));
    
    return { success: true, bank: newBank };
  } catch (error) {
    console.error('Soru seti kaydedilemedi:', error);
    return { success: false, error: error.message };
  }
};

// Soru seti sil
export const deleteQuestionBank = (id) => {
  try {
    const banks = getQuestionBanks();
    const filtered = banks.filter(bank => bank.id !== id);
    localStorage.setItem(QUESTION_BANKS_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('Soru seti silinemedi:', error);
    return { success: false, error: error.message };
  }
};

// Soru setini JSON olarak export et
export const exportQuestionBank = (bank) => {
  const dataStr = JSON.stringify(bank, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${bank.name.replace(/\s+/g, '-')}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
};

// JSON dosyasından soru seti import et
export const importQuestionBank = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const bank = JSON.parse(e.target.result);
        
        // Yeni ID ve tarih ekle
        bank.id = Date.now().toString();
        bank.createdAt = new Date().toISOString();
        
        const banks = getQuestionBanks();
        banks.push(bank);
        localStorage.setItem(QUESTION_BANKS_KEY, JSON.stringify(banks));
        
        resolve({ success: true, bank });
      } catch (error) {
        reject({ success: false, error: 'Geçersiz dosya formatı' });
      }
    };
    
    reader.onerror = () => {
      reject({ success: false, error: 'Dosya okunamadı' });
    };
    
    reader.readAsText(file);
  });
};

// Markdown rapor oluştur ve indir
export const downloadReportAsMarkdown = (report) => {
  const date = new Date(report.createdAt).toLocaleDateString('tr-TR');
  const time = new Date(report.createdAt).toLocaleTimeString('tr-TR');
  
  let markdown = `# Quiz Raporu: ${report.title}\n\n`;
  markdown += `**Öğretmen:** ${report.teacherName}  \n`;
  markdown += `**Tarih:** ${date} - ${time}  \n`;
  markdown += `**Oturum Kodu:** ${report.sessionCode}  \n`;
  markdown += `**Toplam Soru:** ${report.totalQuestions}  \n`;
  markdown += `**Toplam Katılımcı:** ${report.totalParticipants}  \n\n`;
  
  markdown += `---\n\n`;
  markdown += `## 🏆 Sıralama\n\n`;
  markdown += `| Sıra | İsim | Doğru | Yanlış | Puan | Başarı % |\n`;
  markdown += `|------|------|-------|--------|------|----------|\n`;
  
  report.participants.forEach((p, idx) => {
    markdown += `| ${idx + 1} | ${p.name} | ${p.correctAnswers} | ${p.wrongAnswers} | ⚡${p.totalPoints || 0} | %${p.percentage} |\n`;
  });
  
  markdown += `\n---\n\n`;
  markdown += `## 📊 Detaylı Sonuçlar\n\n`;
  
  report.participants.forEach((p, idx) => {
    const emoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤';
    markdown += `### ${emoji} ${p.name}\n\n`;
    markdown += `- **Doğru Cevaplar:** ${p.correctAnswers}  \n`;
    markdown += `- **Yanlış Cevaplar:** ${p.wrongAnswers}  \n`;
    markdown += `- **Toplam Puan:** ⚡${p.totalPoints || 0}  \n`;
    markdown += `- **Başarı Oranı:** %${p.percentage}  \n\n`;
  });
  
  markdown += `\n---\n\n`;
  markdown += `*Bu rapor ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.*\n`;
  
  // Markdown dosyasını indir
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `quiz-rapor-${report.sessionCode}-${Date.now()}.md`;
  link.click();
  
  URL.revokeObjectURL(url);
};

// ============================================
// QUIZ GEÇMİŞİ FONKSİYONLARI
// ============================================

// Tüm quiz geçmişini getir
export const getQuizHistory = () => {
  try {
    const data = localStorage.getItem(QUIZ_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Quiz geçmişi yüklenemedi:', error);
    return [];
  }
};

// Quiz'i geçmişe kaydet (quiz bittiğinde otomatik çağrılacak)
export const saveQuizToHistory = (quizData) => {
  try {
    const history = getQuizHistory();
    
    const quizRecord = {
      id: Date.now().toString(),
      sessionCode: quizData.sessionCode,
      title: quizData.title,
      teacherName: quizData.teacherName,
      date: new Date().toISOString(),
      totalQuestions: quizData.totalQuestions,
      totalParticipants: quizData.totalParticipants,
      participants: quizData.participants, // Tüm katılımcıların skorları
      questions: quizData.questions || [], // Soruların detayları (opsiyonel)
      leaderboard: quizData.leaderboard || [] // Top 3
    };
    
    // Yeni kaydı başa ekle (en yeni en üstte)
    history.unshift(quizRecord);
    
    // Son 50 quiz'i sakla (çok yer kaplamaması için)
    const limitedHistory = history.slice(0, 50);
    
    localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(limitedHistory));
    
    return { success: true, record: quizRecord };
  } catch (error) {
    console.error('Quiz geçmişe kaydedilemedi:', error);
    return { success: false, error: error.message };
  }
};

// Belirli bir quiz'i sil
export const deleteQuizFromHistory = (id) => {
  try {
    const history = getQuizHistory();
    const filtered = history.filter(quiz => quiz.id !== id);
    localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('Quiz silinemedi:', error);
    return { success: false, error: error.message };
  }
};

// Tüm geçmişi temizle
export const clearQuizHistory = () => {
  try {
    localStorage.removeItem(QUIZ_HISTORY_KEY);
    return { success: true };
  } catch (error) {
    console.error('Quiz geçmişi temizlenemedi:', error);
    return { success: false, error: error.message };
  }
};

// Belirli bir öğrencinin tüm quiz performansını getir
export const getStudentPerformanceHistory = (studentName) => {
  try {
    const history = getQuizHistory();
    const studentQuizzes = [];
    
    history.forEach(quiz => {
      const studentData = quiz.participants.find(p => 
        p.name.toLowerCase() === studentName.toLowerCase()
      );
      
      if (studentData) {
        studentQuizzes.push({
          quizId: quiz.id,
          quizTitle: quiz.title,
          date: quiz.date,
          correctAnswers: studentData.correctAnswers,
          totalAnswered: studentData.totalAnswered,
          totalPoints: studentData.totalPoints || 0,
          percentage: studentData.percentage,
          rank: quiz.participants
            .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
            .findIndex(p => p.name === studentName) + 1
        });
      }
    });
    
    // İstatistikler hesapla
    const stats = {
      totalQuizzes: studentQuizzes.length,
      totalCorrect: studentQuizzes.reduce((sum, q) => sum + q.correctAnswers, 0),
      totalAnswered: studentQuizzes.reduce((sum, q) => sum + q.totalAnswered, 0),
      totalPoints: studentQuizzes.reduce((sum, q) => sum + q.totalPoints, 0),
      averagePercentage: studentQuizzes.length > 0
        ? Math.round(studentQuizzes.reduce((sum, q) => sum + q.percentage, 0) / studentQuizzes.length)
        : 0,
      quizzes: studentQuizzes
    };
    
    return stats;
  } catch (error) {
    console.error('Öğrenci geçmişi alınamadı:', error);
    return null;
  }
};

// Quiz raporunu geçmişten indir
export const downloadHistoricalReport = (quizRecord) => {
  const date = new Date(quizRecord.date).toLocaleDateString('tr-TR');
  const time = new Date(quizRecord.date).toLocaleTimeString('tr-TR');
  
  let markdown = `# Quiz Raporu: ${quizRecord.title}\n\n`;
  markdown += `**Öğretmen:** ${quizRecord.teacherName}  \n`;
  markdown += `**Tarih:** ${date} - ${time}  \n`;
  markdown += `**Oturum Kodu:** ${quizRecord.sessionCode}  \n`;
  markdown += `**Toplam Soru:** ${quizRecord.totalQuestions}  \n`;
  markdown += `**Toplam Katılımcı:** ${quizRecord.totalParticipants}  \n\n`;
  
  markdown += `---\n\n`;
  markdown += `## 🏆 Sıralama\n\n`;
  markdown += `| Sıra | İsim | Doğru | Yanlış | Puan | Başarı % |\n`;
  markdown += `|------|------|-------|--------|------|----------|\n`;
  
  // Puana göre sırala
  const sortedParticipants = [...quizRecord.participants].sort((a, b) => 
    (b.totalPoints || 0) - (a.totalPoints || 0)
  );
  
  sortedParticipants.forEach((p, idx) => {
    markdown += `| ${idx + 1} | ${p.name} | ${p.correctAnswers} | ${p.wrongAnswers || 0} | ${p.totalPoints || 0} | %${p.percentage} |\n`;
  });
  
  markdown += `\n---\n\n`;
  markdown += `## 📊 Detaylı Sonuçlar\n\n`;
  
  sortedParticipants.forEach((p, idx) => {
    const emoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤';
    markdown += `### ${emoji} ${p.name}\n\n`;
    markdown += `- **Doğru Cevaplar:** ${p.correctAnswers}  \n`;
    markdown += `- **Yanlış Cevaplar:** ${p.wrongAnswers || 0}  \n`;
    markdown += `- **Toplam Puan:** ⚡${p.totalPoints || 0}  \n`;
    markdown += `- **Başarı Oranı:** %${p.percentage}  \n\n`;
  });
  
  markdown += `\n---\n\n`;
  markdown += `*Bu rapor ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.*\n`;
  
  // Markdown dosyasını indir
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `quiz-rapor-${quizRecord.sessionCode}-${Date.now()}.md`;
  link.click();
  
  URL.revokeObjectURL(url);
};
