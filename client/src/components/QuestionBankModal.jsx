import { useState, useRef } from 'react';
import { getQuestionBanks, saveQuestionBank, deleteQuestionBank, exportQuestionBank, importQuestionBank } from '../utils/questionBank';

function QuestionBankModal({ questions, onLoad, onClose }) {
  const [banks, setBanks] = useState(getQuestionBanks());
  const [bankName, setBankName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = () => {
    if (!bankName.trim()) {
      alert('Lütfen soru seti adı girin');
      return;
    }
    
    if (questions.length === 0) {
      alert('Kaydedilecek soru yok');
      return;
    }

    const result = saveQuestionBank(bankName, questions);
    if (result.success) {
      alert('Soru seti kaydedildi!');
      setBanks(getQuestionBanks());
      setBankName('');
      setShowSave(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu soru setini silmek istediğinizden emin misiniz?')) {
      deleteQuestionBank(id);
      setBanks(getQuestionBanks());
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await importQuestionBank(file);
      if (result.success) {
        setBanks(getQuestionBanks());
        alert(`✅ "${result.bank.name}" başarıyla içe aktarıldı! (${result.bank.questionCount} soru)`);
      }
    } catch (error) {
      alert('❌ Dosya içe aktarılamadı: ' + error.error);
    }

    // Input'u temizle
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Soru Bankası</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {/* Kaydet */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <button
            onClick={() => setShowSave(!showSave)}
            className="btn-primary w-full"
          >
            {showSave ? 'İptal' : `💾 Mevcut Soruları Kaydet (${questions.length} soru)`}
          </button>
          
          {showSave && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Soru seti adı (örn: Hafta 3 - Python)"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="input-field flex-1"
              />
              <button onClick={handleSave} className="btn-primary">Kaydet</button>
            </div>
          )}
        </div>

        {/* Import */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="file-import"
          />
          <label htmlFor="file-import" className="btn-primary w-full bg-green-600 hover:bg-green-700 cursor-pointer text-center block">
            📥 JSON Dosyasından İçe Aktar
          </label>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Daha önce export ettiğiniz .json dosyasını yükleyin
          </p>
        </div>

        {/* Kayıtlı Setler */}
        <div>
          <h3 className="font-bold mb-3">Kayıtlı Soru Setleri ({banks.length})</h3>
          <div className="space-y-2">
            {banks.map(bank => (
              <div key={bank.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold">{bank.name}</p>
                  <p className="text-sm text-gray-600">
                    {bank.questionCount} soru • {new Date(bank.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      onClose(); // Modal'ı hemen kapat
                      await onLoad(bank.questions); // Soruları yükle (alert fonksiyon içinde)
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Yükle
                  </button>
                  <button
                    onClick={() => exportQuestionBank(bank)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => handleDelete(bank.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
            {banks.length === 0 && (
              <p className="text-center text-gray-400 py-8">Henüz kayıtlı soru seti yok</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionBankModal;

