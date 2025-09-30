// Soru Bankası - LocalStorage Yönetimi

const QUESTION_BANKS_KEY = 'quiz_question_banks';

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
  markdown += `| Sıra | İsim | Doğru | Yanlış | Toplam | Başarı % |\n`;
  markdown += `|------|------|-------|--------|--------|----------|\n`;
  
  report.participants.forEach((p, idx) => {
    markdown += `| ${idx + 1} | ${p.name} | ${p.correctAnswers} | ${p.wrongAnswers} | ${p.totalAnswered} | %${p.percentage} |\n`;
  });
  
  markdown += `\n---\n\n`;
  markdown += `## 📊 Detaylı Sonuçlar\n\n`;
  
  report.participants.forEach((p, idx) => {
    const emoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤';
    markdown += `### ${emoji} ${p.name}\n\n`;
    markdown += `- **Doğru Cevaplar:** ${p.correctAnswers}  \n`;
    markdown += `- **Yanlış Cevaplar:** ${p.wrongAnswers}  \n`;
    markdown += `- **Toplam:** ${p.totalAnswered}  \n`;
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

