import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../config';

function StudentJoin() {
  const { sessionCode: urlSessionCode } = useParams();
  const [sessionCode, setSessionCode] = useState(urlSessionCode || '');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (urlSessionCode) {
      setSessionCode(urlSessionCode.toUpperCase());
    }
  }, [urlSessionCode]);

  const joinSession = async (e) => {
    e.preventDefault();
    
    if (!sessionCode.trim() || !studentName.trim()) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Oturum var mı kontrol et
      const response = await fetch(`${API_URL}/api/session/${sessionCode.toUpperCase()}`);
      const data = await response.json();

      if (data.success) {
        // Öğrenci bilgilerini localStorage'a kaydet
        localStorage.setItem('studentName', studentName);
        localStorage.setItem('sessionCode', sessionCode.toUpperCase());
        navigate(`/quiz/${sessionCode.toUpperCase()}`);
      } else {
        setError('Oturum bulunamadı. Lütfen kodu kontrol edin.');
      }
    } catch (error) {
      console.error('Katılım hatası:', error);
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Oturuma Katıl</h1>
            <p className="text-gray-600">Quiz'e katılmak için bilgilerinizi girin</p>
          </div>

          {/* Form */}
          <form onSubmit={joinSession} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adınız
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                className="input-field"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Oturum Kodu
              </label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="Örn: ABC123"
                className="input-field font-mono text-lg tracking-wider"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Katılınıyor...' : 'Katıl'}
            </button>
          </form>

          {/* QR Kod Bilgisi */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="text-sm">QR kod ile de katılabilirsiniz</span>
            </div>
          </div>

          {/* Ana Sayfaya Dön */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Ana sayfaya dön
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentJoin;

