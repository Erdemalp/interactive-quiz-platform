import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

function Home() {
  const [teacherName, setTeacherName] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createSession = async () => {
    if (!teacherName.trim() || !title.trim()) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherName, title })
      });

      const data = await response.json();
      if (data.success) {
        navigate(`/teacher/${data.session.code}`);
      }
    } catch (error) {
      console.error('Oturum oluşturma hatası:', error);
      alert('Oturum oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-pattern">
      {/* Hero Section - Mentimeter Style */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16 pt-8">
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-black mb-6 leading-tight">
            <span className="gradient-text">Etkileşimli</span>
            <br />
            <span className="text-gray-900">Sunum Yap</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-600 font-medium max-w-3xl mx-auto">
            Öğrencilerinizi aktif kılın. Anlık sorular sorun, 
            gerçek zamanlı cevaplar alın.
          </p>
        </div>

        {/* Action Cards */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-20">
          {/* Öğretmen Kartı - Create */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative card hover:shadow-purple-500/20 transition-all duration-300">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl mb-6 transform group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-3">Sunum Oluştur</h2>
                <p className="text-gray-600 text-lg mb-8">Quiz başlat, soruları yönet</p>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Adınız Soyadınız"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Sunum Başlığı"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                  />
                  <button
                    onClick={createSession}
                    disabled={loading}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Oluşturuluyor...
                      </span>
                    ) : 'Hemen Başla'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Öğrenci Kartı - Join */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative card hover:shadow-cyan-500/20 transition-all duration-300">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl mb-6 transform group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-3">Sunuma Katıl</h2>
                <p className="text-gray-600 text-lg mb-8">QR kod tarat veya kod gir</p>
                
                <button
                  onClick={() => navigate('/join')}
                  className="btn-join w-full"
                >
                  Katıl
                </button>
                
                <div className="mt-8 pt-8 border-t-2 border-gray-100">
                  <div className="flex items-center justify-center gap-3 text-gray-500">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <div className="text-left">
                      <p className="font-bold text-gray-700">QR ile hızlı giriş</p>
                      <p className="text-sm">veya 6 haneli kod</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features - Mentimeter Style */}
        <div className="max-w-7xl mx-auto">
          <h3 className="text-center text-4xl md:text-5xl font-black text-gray-900 mb-16">
            Neden bu platform?
          </h3>
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="text-center p-8 rounded-3xl hover:bg-purple-50 transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl mb-6 group-hover:scale-110 transition-transform">
                <span className="text-5xl">⚡</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">Anlık Sonuçlar</h4>
              <p className="text-gray-600 text-lg">Cevapları saniyeler içinde görün ve sınıfınızın nabzını tutun</p>
            </div>
            
            <div className="text-center p-8 rounded-3xl hover:bg-blue-50 transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl mb-6 group-hover:scale-110 transition-transform">
                <span className="text-5xl">📱</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">Kolay Erişim</h4>
              <p className="text-gray-600 text-lg">QR kod taratın, saniyeler içinde katılın. Uygulama indirmeye gerek yok</p>
            </div>
            
            <div className="text-center p-8 rounded-3xl hover:bg-pink-50 transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 rounded-3xl mb-6 group-hover:scale-110 transition-transform">
                <span className="text-5xl">📊</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">Görsel Analiz</h4>
              <p className="text-gray-600 text-lg">Cevapları renkli grafikler ve istatistiklerle görselleştirin</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-20">
          <div className="inline-block p-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 rounded-full mb-8">
            <div className="bg-white rounded-full px-8 py-3">
              <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                🎉 Tamamen Ücretsiz
              </p>
            </div>
          </div>
          <h3 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
            Hazır mısınız?
          </h3>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Birkaç tıklamayla etkileşimli sunumunuzu oluşturun
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
