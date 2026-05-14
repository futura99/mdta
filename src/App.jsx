import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar, 
  CheckSquare, FileText, CreditCard, MessageSquare, Settings, 
  LogOut, Menu, X, Plus, Search, Edit, Trash2, Moon, Sun, Bell, UserCircle,
  ArrowRight, MapPin, Phone, Mail, Globe, ImageIcon, Newspaper, Megaphone, Info, ArrowLeft,
  School, Save, Eye, PenSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ⬇️ SILAKAN GANTI ISI OBJECT INI DENGAN FIREBASE CONFIG MILIK ANDA ⬇️
const firebaseConfig = {
  apiKey: "AIzaSyAhkYsSFfqVwFXy_udrQgTZuuYQtZX6-mM",
  authDomain: "mdta-d02bd.firebaseapp.com",
  projectId: "mdta-d02bd",
  storageBucket: "mdta-d02bd.firebasestorage.app",
  messagingSenderId: "469654960740",
  appId: "1:469654960740:web:9d832e6ee044cf6b13fd71",
  measurementId: "G-P3P6214JCH"
};

// 1. Inisialisasi Firebase Utama
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 2. Inisialisasi Firebase Kedua (KHUSUS UNTUK ADMIN MEMBUAT AKUN GURU)
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

// --- KOMPONEN UI ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", icon: Icon, type = "button", disabled = false }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder, required = false }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors text-sm"
    />
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, required = false, rows = 4 }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={rows}
      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors text-sm resize-y"
    />
  </div>
);

// --- HALAMAN LOGIN ---
const LoginView = ({ onLogin, errorMsg, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Web Utama
      </button>

      <Card className="w-full max-w-md p-8 mt-12 sm:mt-0">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">Login EduCore</h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-6">Sistem Informasi Manajemen Sekolah</p>

        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full py-3 mt-4" disabled={loading}>
            {loading ? 'Memeriksa Kredensial...' : 'Masuk ke Sistem'}
          </Button>
        </form>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 text-center">
          <strong>Info Keamanan:</strong> Akun Admin hanya dapat didaftarkan melalui Firebase Console.
        </div>
      </Card>
    </div>
  );
};

// --- HALAMAN UTAMA PUBLIK (LANDING PAGE) - Sekarang Dinamis ---
const LandingView = ({ onLoginClick, profilSekolah, pengumumans, galeris, beritas }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'profil', label: 'Profil Sekolah' },
    { id: 'pengumuman', label: 'Pengumuman' },
    { id: 'galeri', label: 'Galeri' },
    { id: 'berita', label: 'Berita' },
  ];

  // Data default jika Firestore belum diisi
  const profil = profilSekolah || {};
  const namaSekolah = profil.namaSekolah || 'EduCore';
  const tagline = profil.tagline || 'Membangun Generasi Cerdas & Berkarakter';
  const deskripsiHero = profil.deskripsiHero || 'EduCore merupakan wujud komitmen kami dalam menyelenggarakan pendidikan berkualitas tinggi yang inovatif, inklusif, dan berwawasan global.';
  const sejarah = profil.sejarah || 'Didirikan pada tahun 1990, EduCore telah berkembang menjadi salah satu institusi pendidikan terkemuka. Kami berdedikasi untuk menciptakan lingkungan belajar yang interaktif dan mendukung potensi maksimal setiap peserta didik.';
  const visi = profil.visi || 'Menjadi pusat pendidikan unggulan yang mencetak lulusan berdaya saing global, berakhlak mulia, dan berwawasan lingkungan.';
  const misi = profil.misi || 'Menyelenggarakan pembelajaran inovatif berbasis teknologi, serta menanamkan nilai-nilai karakter luhur kebangsaan.';
  const alamat = profil.alamat || 'Jl. Pendidikan No. 123, Kota Pelajar, Indonesia 12345';
  const telepon = profil.telepon || '+62 21 5555 1234';
  const email = profil.email || 'info@educore.sch.id';
  const heroImageUrl = profil.heroImageUrl || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80';
  const profilImageUrl = profil.profilImageUrl || 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80';

  // Default pengumuman jika kosong
  const defaultPengumumans = [
    { id: 'def1', tanggal: "20 Mei 2026", judul: "Jadwal Pelaksanaan Penilaian Akhir Tahun (PAT) 2026", tipe: "Akademik" },
    { id: 'def2', tanggal: "01 Jun 2026", judul: "Informasi Pendaftaran Peserta Didik Baru (PPDB) Gelombang 1", tipe: "PPDB" },
    { id: 'def3', tanggal: "15 Mei 2026", judul: "Undangan Rapat Pleno Komite Sekolah & Wali Murid", tipe: "Umum" },
  ];
  const displayPengumuman = pengumumans && pengumumans.length > 0 ? pengumumans.slice(0, 3) : defaultPengumumans;

  // Default galeri jika kosong
  const defaultGaleri = [
    { id: 'g1', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', keterangan: 'Kegiatan Belajar Mengajar', featured: true },
    { id: 'g2', url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80', keterangan: 'Perpustakaan' },
    { id: 'g3', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80', keterangan: 'Wisuda' },
    { id: 'g4', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80', keterangan: 'Praktikum Lab' },
  ];
  const displayGaleri = galeris && galeris.length > 0 ? galeris : defaultGaleri;

  // Default berita jika kosong
  const defaultBeritas = [
    { id: 'b1', imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80", judul: "Tim Robotik Sekolah Raih Juara 1 Tingkat Nasional", tanggal: "10 Mei 2026", isi: "Siswa/i kita kembali menorehkan prestasi gemilang dengan membawa pulang medali emas dalam ajang kompetisi robotik pelajar." },
    { id: 'b2', imageUrl: "https://images.unsplash.com/photo-1431576901794-e87dcbc45fec?auto=format&fit=crop&w=600&q=80", judul: "Seminar Kewirausahaan Muda untuk Generasi Z", tanggal: "05 Mei 2026", isi: "Sekolah mengadakan seminar untuk menumbuhkan jiwa entrepreneurship sejak dini dengan menghadirkan pengusaha muda sukses." },
    { id: 'b3', imageUrl: "https://images.unsplash.com/photo-1577896850165-24d6738c82eb?auto=format&fit=crop&w=600&q=80", judul: "Peringatan Hari Guru: Penghargaan untuk Pahlawan Tanpa Tanda Jasa", tanggal: "02 Mei 2026", isi: "Acara puncak peringatan hari guru berlangsung meriah dihiasi dengan berbagai penampilan seni dari siswa-siswi." },
  ];
  const displayBeritas = beritas && beritas.length > 0 ? beritas.slice(0, 3) : defaultBeritas;

  const tipeColors = {
    'Akademik': 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30',
    'PPDB': 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30',
    'Umum': 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30',
    'Kegiatan': 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30',
    'Penting': 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 overflow-x-hidden">
      
      {/* Navbar Utama */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => scrollTo('beranda')}>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-slate-900 dark:text-white' : 'text-white drop-shadow-md'}`}>{namaSekolah}</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map(link => (
                <button key={link.id} onClick={() => scrollTo(link.id)} className={`text-sm font-medium hover:text-blue-500 transition-colors ${isScrolled ? 'text-slate-600 dark:text-slate-300' : 'text-white/90 drop-shadow'}`}>
                  {link.label}
                </button>
              ))}
              <Button onClick={onLoginClick} className="shadow-lg hover:shadow-xl transition-all rounded-full px-6">
                Login Sistem
              </Button>
            </div>

            <button className={`md:hidden p-2 rounded-lg ${isScrolled ? 'text-slate-900 dark:text-white' : 'text-white'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-800 shadow-xl border-t border-slate-100 dark:border-slate-700 py-4 px-4 flex flex-col space-y-4">
            {navLinks.map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="text-left py-2 px-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                {link.label}
              </button>
            ))}
            <div className="pt-2">
              <Button onClick={onLoginClick} className="w-full justify-center">Login Sistem</Button>
            </div>
          </div>
        )}
      </nav>

      {/* 1. SECTION BERANDA (HERO) */}
      <section id="beranda" className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <img src={heroImageUrl} alt="Gedung Sekolah" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/70 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold mb-6 border border-blue-500/30 backdrop-blur-sm">
            Selamat Datang di Portal Resmi
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight max-w-4xl">
            {tagline.includes('&') ? (
              <>
                {tagline.split('&')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">& {tagline.split('&')[1]}</span>
              </>
            ) : (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{tagline}</span>
            )}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl font-light">{deskripsiHero}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => scrollTo('profil')} className="px-8 py-4 text-lg rounded-full shadow-blue-600/30 shadow-lg">
              Pelajari Lebih Lanjut
            </Button>
            <button onClick={() => scrollTo('pengumuman')} className="px-8 py-4 text-lg font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all border border-white/20">
              Lihat Pengumuman
            </button>
          </div>
        </div>
      </section>

      {/* 2. SECTION PROFIL SEKOLAH */}
      <section id="profil" className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center"><Info className="w-8 h-8 mr-3 text-blue-600" /> Profil Sekolah</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img src={profilImageUrl} alt="Siswa Belajar" className="rounded-2xl shadow-2xl w-full object-cover max-h-80 lg:max-h-full" />
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Sejarah Singkat</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{sejarah}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 dark:bg-slate-800 p-6 rounded-xl border border-blue-100 dark:border-slate-700">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4"><Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Visi Kami</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{visi}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-slate-800 p-6 rounded-xl border border-emerald-100 dark:border-slate-700">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4"><CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /></div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Misi Kami</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{misi}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION PENGUMUMAN */}
      <section id="pengumuman" className="py-24 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center"><Megaphone className="w-8 h-8 mr-3 text-blue-600" /> Pengumuman Resmi</h2>
              <div className="w-24 h-1 bg-blue-600 mt-4 rounded-full"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayPengumuman.map((item, i) => (
              <Card key={item.id || i} className="p-6 hover:shadow-md transition-shadow group cursor-pointer border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${tipeColors[item.tipe] || tipeColors['Umum']}`}>{item.tipe}</span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center"><Calendar className="w-4 h-4 mr-1" /> {item.tanggal}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors">{item.judul}</h3>
                {item.isi && <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{item.isi}</p>}
                <div className="flex items-center text-blue-600 text-sm font-medium mt-4">
                  Baca Selengkapnya <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SECTION GALERI */}
      <section id="galeri" className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center"><ImageIcon className="w-8 h-8 mr-3 text-blue-600" /> Galeri Kegiatan</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Potret aktivitas dan momen berharga civitas akademika.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayGaleri.slice(0,1).map((g, i) => (
              <div key={g.id || i} className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-2xl min-h-[200px]">
                <img src={g.url} alt={g.keterangan || 'Galeri'} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="text-white font-medium text-lg">{g.keterangan || ''}</span>
                </div>
              </div>
            ))}
            {displayGaleri.slice(1).map((g, i) => (
              <div key={g.id || i} className="relative group overflow-hidden rounded-2xl aspect-square">
                <img src={g.url} alt={g.keterangan || 'Galeri'} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-white text-sm font-medium">{g.keterangan || ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SECTION BERITA */}
      <section id="berita" className="py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center"><Newspaper className="w-8 h-8 mr-3 text-blue-600" /> Berita Terbaru</h2>
              <div className="w-24 h-1 bg-blue-600 mt-4 rounded-full"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayBeritas.map((berita, i) => (
              <Card key={berita.id || i} className="flex flex-col group cursor-pointer border-none shadow-md hover:shadow-xl transition-all">
                <div className="h-48 overflow-hidden">
                  <img src={berita.imageUrl} alt={berita.judul} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <span className="text-xs text-slate-500 mb-2 flex items-center"><Calendar className="w-3 h-3 mr-1" /> {berita.tanggal}</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 transition-colors">{berita.judul}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm flex-1 line-clamp-3">{berita.isi}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 pt-16 pb-8 border-t border-slate-800 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
                <span className="text-2xl font-bold text-white tracking-tight">{namaSekolah}</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-sm">
                Portal informasi resmi dan sistem manajemen {namaSekolah}. Mewujudkan tata kelola sekolah yang transparan, efektif, dan modern.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Kontak Kami</h4>
              <ul className="space-y-3">
                <li className="flex items-start"><MapPin className="w-5 h-5 mr-3 text-slate-500 flex-shrink-0 mt-0.5" /> <span className="text-sm">{alamat}</span></li>
                <li className="flex items-center"><Phone className="w-5 h-5 mr-3 text-slate-500 flex-shrink-0" /> <span className="text-sm">{telepon}</span></li>
                <li className="flex items-center"><Mail className="w-5 h-5 mr-3 text-slate-500 flex-shrink-0" /> <span className="text-sm">{email}</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Tautan Cepat</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollTo('beranda')} className="hover:text-white transition-colors">Beranda Utama</button></li>
                <li><button onClick={() => scrollTo('profil')} className="hover:text-white transition-colors">Profil Lengkap</button></li>
                <li><button onClick={() => scrollTo('pengumuman')} className="hover:text-white transition-colors">Pusat Informasi</button></li>
                <li><button onClick={onLoginClick} className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Login Ke Sistem e-School</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} {namaSekolah} Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- VIEW COMPONENTS LAINNYA ---
const DashboardView = ({ stats }) => {
  const chartData = [
    { name: 'Senin', Hadir: 400, Izin: 24, Sakit: 10 },
    { name: 'Selasa', Hadir: 390, Izin: 30, Sakit: 14 },
    { name: 'Rabu', Hadir: 410, Izin: 15, Sakit: 9 },
    { name: 'Kamis', Hadir: 420, Izin: 10, Sakit: 4 },
    { name: 'Jumat', Hadir: 380, Izin: 40, Sakit: 14 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Siswa', value: stats.siswaCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
          { title: 'Total Guru', value: stats.guruCount, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
          { title: 'Total Kelas', value: stats.kelasCount, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
          { title: 'Kehadiran Hari Ini', value: '94%', icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
        ].map((stat, i) => (
          <Card key={i} className="p-6 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Grafik Kehadiran Mingguan</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }} />
                <Legend />
                <Bar dataKey="Hadir" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Izin" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sakit" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

const GuruView = ({ gurus, onAdd, onEdit, onDelete, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nama: '', nip: '', mapel: '', hp: '', email: '', password: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = gurus.filter(g => g.nama.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editId) {
        await onEdit(editId, formData);
      } else {
        await onAdd(formData);
      }
      setIsModalOpen(false);
      setFormData({ nama: '', nip: '', mapel: '', hp: '', email: '', password: '' });
      setEditId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (g) => {
    setFormData({ nama: g.nama, nip: g.nip, mapel: g.mapel, hp: g.hp, email: g.email || '', password: '' });
    setEditId(g.id);
    setIsModalOpen(true);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Cari guru..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white" />
        </div>
        {userRole === 'operator' && (
          <Button icon={Plus} onClick={() => { setEditId(null); setFormData({ nama: '', nip: '', mapel: '', hp: '', email: '', password: '' }); setIsModalOpen(true); }}>
            Tambah Akun Guru
          </Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 font-medium">Nama Lengkap</th>
                <th className="p-4 font-medium">NIP</th>
                <th className="p-4 font-medium">Mata Pelajaran</th>
                <th className="p-4 font-medium">No. HP</th>
                {userRole === 'operator' && <th className="p-4 font-medium text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                  <td className="p-4 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                      {g.nama.charAt(0)}
                    </div>
                    <span>{g.nama}</span>
                  </td>
                  <td className="p-4">{g.nip}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-xs">{g.mapel}</span></td>
                  <td className="p-4">{g.hp}</td>
                  {userRole === 'operator' && (
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEdit(g)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(g.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">Tidak ada data guru.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 dark:text-white">{editId ? 'Edit Data Guru' : 'Pendaftaran Akun Guru'}</h2>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
            <form onSubmit={handleSubmit}>
              <Input label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required />
              <Input label="NIP" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} required />
              {!editId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4 border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">Buat Akses Login Guru</p>
                  <Input label="Email Akun" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                  <Input label="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                </div>
              )}
              <Input label="Mata Pelajaran" value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} required />
              <Input label="No. Handphone" value={formData.hp} onChange={e => setFormData({...formData, hp: e.target.value})} required />
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} disabled={loading}>Batal</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Memproses...' : 'Simpan Data'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

const SiswaView = ({ siswas, onAdd, onEdit, onDelete, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nama: '', nis: '', kelas: '', jurusan: '' });
  const [editId, setEditId] = useState(null);

  const filtered = siswas.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) onEdit(editId, formData);
    else onAdd(formData);
    setIsModalOpen(false);
    setFormData({ nama: '', nis: '', kelas: '', jurusan: '' });
    setEditId(null);
  };

  const openEdit = (s) => {
    setFormData({ nama: s.nama, nis: s.nis, kelas: s.kelas, jurusan: s.jurusan });
    setEditId(s.id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Cari siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white" />
        </div>
        {userRole === 'operator' && (
          <Button icon={Plus} onClick={() => { setEditId(null); setFormData({ nama: '', nis: '', kelas: '', jurusan: '' }); setIsModalOpen(true); }}>
            Tambah Siswa
          </Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 font-medium">Nama Siswa</th>
                <th className="p-4 font-medium">NIS</th>
                <th className="p-4 font-medium">Kelas</th>
                <th className="p-4 font-medium">Jurusan</th>
                {userRole === 'operator' && <th className="p-4 font-medium text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                  <td className="p-4 font-medium">{s.nama}</td>
                  <td className="p-4 text-slate-500">{s.nis}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs">{s.kelas}</span></td>
                  <td className="p-4">{s.jurusan}</td>
                  {userRole === 'operator' && (
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(s.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">{editId ? 'Edit Siswa' : 'Tambah Siswa'}</h2>
            <form onSubmit={handleSubmit}>
              <Input label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required />
              <Input label="NIS" value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} required />
              <Input label="Kelas" value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} required />
              <Input label="Jurusan" value={formData.jurusan} onChange={e => setFormData({...formData, jurusan: e.target.value})} required />
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit">Simpan Data</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

const ChatView = ({ appUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'chats'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !appUser) return;
    await addDoc(collection(db, 'chats'), {
      text: newMessage,
      senderId: appUser.id,
      senderName: appUser.name,
      role: appUser.role,
      timestamp: serverTimestamp()
    });
    setNewMessage('');
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-blue-500" /> Diskusi Internal Guru & Operator
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100 dark:bg-slate-900/50">
        {messages.map(msg => {
          const isMe = msg.senderId === appUser.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-500 mb-1">{isMe ? 'Anda' : msg.senderName} ({msg.role})</span>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-bl-none shadow-sm'}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Ketik pesan..." className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-full dark:text-white" />
        <Button type="submit" className="rounded-full px-6">Kirim</Button>
      </form>
    </Card>
  );
};

const ConstructionView = ({ title, icon: Icon, desc }) => (
  <Card className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
      <Icon className="w-10 h-10 text-blue-500" />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{title}</h2>
    <p className="text-slate-500 dark:text-slate-400 max-w-md">{desc}</p>
  </Card>
);

// =============================================
// FITUR BARU: MANAJEMEN KONTEN WEBSITE
// =============================================

// --- MANAJEMEN PROFIL SEKOLAH ---
const ProfilSekolahView = ({ profilSekolah }) => {
  const defaultProfil = {
    namaSekolah: '', tagline: '', deskripsiHero: '', sejarah: '',
    visi: '', misi: '', alamat: '', telepon: '', email: '',
    heroImageUrl: '', profilImageUrl: ''
  };
  const [formData, setFormData] = useState({ ...defaultProfil, ...profilSekolah });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Sync jika profilSekolah berubah dari luar
  useEffect(() => {
    if (profilSekolah) setFormData({ ...defaultProfil, ...profilSekolah });
  }, [profilSekolah]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      await setDoc(doc(db, 'website', 'profil'), { ...formData, updatedAt: new Date().toISOString() });
      setSuccessMsg('Profil sekolah berhasil disimpan!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({ value: formData[field] || '', onChange: e => setFormData({ ...formData, [field]: e.target.value }) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Profil Sekolah</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Data ini tampil di halaman utama website publik.</p>
        </div>
        <a href="#beranda" onClick={e => { e.preventDefault(); window.scrollTo(0,0); }} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
          <Eye className="w-4 h-4 mr-1" /> Lihat di Website
        </a>
      </div>

      {successMsg && <div className="p-4 bg-emerald-100 text-emerald-700 rounded-xl font-medium">{successMsg}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identitas Sekolah */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
            <School className="w-5 h-5 mr-2 text-blue-600" /> Identitas Sekolah
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input label="Nama Sekolah" {...f('namaSekolah')} placeholder="Contoh: SMA Negeri 1 Pekanbaru" />
            <Input label="Tagline / Slogan Hero" {...f('tagline')} placeholder="Contoh: Membangun Generasi Cerdas & Berkarakter" />
            <Input label="Email Sekolah" type="email" {...f('email')} placeholder="info@sekolah.sch.id" />
            <Input label="Nomor Telepon" {...f('telepon')} placeholder="+62 21 0000 0000" />
          </div>
          <Textarea label="Alamat Lengkap" {...f('alamat')} placeholder="Jl. Pendidikan No. 1, Kota, Provinsi" rows={2} />
        </Card>

        {/* Konten Halaman */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" /> Konten Halaman Beranda
          </h3>
          <Textarea label="Deskripsi Hero (Teks besar di bagian atas)" {...f('deskripsiHero')} placeholder="Kalimat pembuka yang singkat dan berkesan..." rows={3} />
          <Textarea label="Sejarah Singkat Sekolah" {...f('sejarah')} placeholder="Ceritakan sejarah berdirinya sekolah..." rows={4} />
          <Textarea label="Visi Sekolah" {...f('visi')} placeholder="Visi utama sekolah..." rows={3} />
          <Textarea label="Misi Sekolah" {...f('misi')} placeholder="Misi dan tujuan sekolah..." rows={3} />
        </Card>

        {/* URL Gambar */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-blue-600" /> URL Gambar (dari Google Drive / Unsplash / hosting lain)
          </h3>
          <div className="p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
            <strong>Petunjuk:</strong> Upload foto ke Google Drive (atur akses publik), lalu masukkan link langsung. Atau gunakan URL gambar dari Unsplash, Imgbb, dll.
          </div>
          <Input label="URL Gambar Hero (Latar belakang halaman beranda)" {...f('heroImageUrl')} placeholder="https://..." />
          {formData.heroImageUrl && <img src={formData.heroImageUrl} alt="Preview Hero" className="h-32 w-full object-cover rounded-lg mb-4 border" onError={e => e.target.style.display='none'} />}
          <Input label="URL Gambar Profil (Foto di section Profil Sekolah)" {...f('profilImageUrl')} placeholder="https://..." />
          {formData.profilImageUrl && <img src={formData.profilImageUrl} alt="Preview Profil" className="h-32 w-full object-cover rounded-lg border" onError={e => e.target.style.display='none'} />}
        </Card>

        <div className="flex justify-end">
          <Button type="submit" icon={Save} disabled={loading} className="px-8 py-3">
            {loading ? 'Menyimpan...' : 'Simpan Profil Sekolah'}
          </Button>
        </div>
      </form>
    </div>
  );
};

// --- MANAJEMEN PENGUMUMAN ---
const PengumumanAdminView = ({ pengumumans }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ judul: '', isi: '', tanggal: '', tipe: 'Umum' });
  const [loading, setLoading] = useState(false);

  const tipeOptions = ['Umum', 'Akademik', 'PPDB', 'Kegiatan', 'Penting'];
  const tipeColors = {
    'Akademik': 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30',
    'PPDB': 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30',
    'Umum': 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30',
    'Kegiatan': 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30',
    'Penting': 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30',
  };

  const openAdd = () => {
    setEditId(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({ judul: '', isi: '', tanggal: today, tipe: 'Umum' });
    setIsModalOpen(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setFormData({ judul: p.judul, isi: p.isi || '', tanggal: p.tanggal, tipe: p.tipe });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...formData, updatedAt: new Date().toISOString() };
      if (editId) {
        await updateDoc(doc(db, 'pengumuman', editId), data);
      } else {
        await addDoc(collection(db, 'pengumuman'), { ...data, createdAt: serverTimestamp() });
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus pengumuman ini?')) {
      await deleteDoc(doc(db, 'pengumuman', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manajemen Pengumuman</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pengumuman tampil di halaman publik website.</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Tambah Pengumuman</Button>
      </div>

      <div className="space-y-4">
        {pengumumans.length === 0 && (
          <Card className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Belum ada pengumuman. Klik "Tambah Pengumuman" untuk memulai.</p>
          </Card>
        )}
        {pengumumans.map(p => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${tipeColors[p.tipe] || tipeColors['Umum']}`}>{p.tipe}</span>
                  <span className="text-xs text-slate-500 flex items-center"><Calendar className="w-3 h-3 mr-1" />{p.tanggal}</span>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{p.judul}</h3>
                {p.isi && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.isi}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5 dark:text-white">{editId ? 'Edit Pengumuman' : 'Tambah Pengumuman'}</h2>
            <form onSubmit={handleSubmit}>
              <Input label="Judul Pengumuman" value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} required placeholder="Judul singkat dan jelas..." />
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                <select value={formData.tipe} onChange={e => setFormData({...formData, tipe: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500">
                  {tipeOptions.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <Input label="Tanggal" type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} required />
              <Textarea label="Isi / Keterangan Pengumuman" value={formData.isi} onChange={e => setFormData({...formData, isi: e.target.value})} placeholder="Detail pengumuman (opsional)..." rows={5} />
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- MANAJEMEN GALERI ---
const GaleriAdminView = ({ galeris }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ url: '', keterangan: '', featured: false });
  const [loading, setLoading] = useState(false);

  const openAdd = () => {
    setEditId(null);
    setFormData({ url: '', keterangan: '', featured: false });
    setIsModalOpen(true);
  };

  const openEdit = (g) => {
    setEditId(g.id);
    setFormData({ url: g.url, keterangan: g.keterangan || '', featured: g.featured || false });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...formData, updatedAt: new Date().toISOString() };
      if (editId) {
        await updateDoc(doc(db, 'galeri', editId), data);
      } else {
        await addDoc(collection(db, 'galeri'), { ...data, createdAt: serverTimestamp() });
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus foto ini dari galeri?')) {
      await deleteDoc(doc(db, 'galeri', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manajemen Galeri</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Foto galeri tampil di section galeri website publik.</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Tambah Foto</Button>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
        <strong>Tips:</strong> Gunakan URL gambar dari Google Drive (akses publik), Unsplash, Imgbb, atau hosting gambar lainnya. Foto pertama dengan "Featured" aktif akan ditampilkan lebih besar.
      </div>

      {galeris.length === 0 && (
        <Card className="p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Belum ada foto. Klik "Tambah Foto" untuk memulai.</p>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {galeris.map(g => (
          <div key={g.id} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square">
            <img src={g.url} alt={g.keterangan} className="w-full h-full object-cover" onError={e => { e.target.src=''; e.target.style.display='none'; }} />
            {g.featured && (
              <span className="absolute top-2 left-2 text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full">Featured</span>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
              <p className="text-white text-xs text-center line-clamp-2">{g.keterangan}</p>
              <div className="flex gap-2">
                <button onClick={() => openEdit(g)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(g.id)} className="p-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-5 dark:text-white">{editId ? 'Edit Foto Galeri' : 'Tambah Foto Galeri'}</h2>
            <form onSubmit={handleSubmit}>
              <Input label="URL Foto" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." required />
              {formData.url && (
                <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-40">
                  <img src={formData.url} alt="Preview" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                </div>
              )}
              <Input label="Keterangan Foto" value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} placeholder="Contoh: Kegiatan Pramuka 2025" />
              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <input type="checkbox" id="featured" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="featured" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tampilkan sebagai foto utama (Featured) — lebih besar di website
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- MANAJEMEN BERITA ---
const BeritaAdminView = ({ beritas }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ judul: '', isi: '', tanggal: '', imageUrl: '' });
  const [loading, setLoading] = useState(false);

  const openAdd = () => {
    setEditId(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({ judul: '', isi: '', tanggal: today, imageUrl: '' });
    setIsModalOpen(true);
  };

  const openEdit = (b) => {
    setEditId(b.id);
    setFormData({ judul: b.judul, isi: b.isi, tanggal: b.tanggal, imageUrl: b.imageUrl || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...formData, updatedAt: new Date().toISOString() };
      if (editId) {
        await updateDoc(doc(db, 'berita', editId), data);
      } else {
        await addDoc(collection(db, 'berita'), { ...data, createdAt: serverTimestamp() });
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus berita ini?')) {
      await deleteDoc(doc(db, 'berita', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manajemen Berita</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Berita tampil di section berita website publik.</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Tulis Berita</Button>
      </div>

      <div className="space-y-4">
        {beritas.length === 0 && (
          <Card className="p-12 text-center">
            <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Belum ada berita. Klik "Tulis Berita" untuk memulai.</p>
          </Card>
        )}
        {beritas.map(b => (
          <Card key={b.id} className="p-5">
            <div className="flex items-start gap-4">
              {b.imageUrl && (
                <img src={b.imageUrl} alt={b.judul} className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-slate-200 dark:border-slate-700" onError={e => e.target.style.display='none'} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500 flex items-center"><Calendar className="w-3 h-3 mr-1" />{b.tanggal}</span>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{b.judul}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{b.isi}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openEdit(b)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(b.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5 dark:text-white">{editId ? 'Edit Berita' : 'Tulis Berita Baru'}</h2>
            <form onSubmit={handleSubmit}>
              <Input label="Judul Berita" value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} required placeholder="Judul berita yang menarik..." />
              <Input label="Tanggal Publikasi" type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} required />
              <Input label="URL Gambar Berita" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
              {formData.imageUrl && (
                <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-40">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                </div>
              )}
              <Textarea label="Isi Berita" value={formData.isi} onChange={e => setFormData({...formData, isi: e.target.value})} required placeholder="Tuliskan isi berita lengkap di sini..." rows={8} />
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Publikasikan'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// =============================================
// KOMPONEN UTAMA (APP)
// =============================================
export default function App() {
  const [loadingBaseAuth, setLoadingBaseAuth] = useState(true);
  const [appUser, setAppUser] = useState(null); 
  const [loginError, setLoginError] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const [gurus, setGurus] = useState([]);
  const [siswas, setSiswas] = useState([]);

  // State untuk konten website
  const [profilSekolah, setProfilSekolah] = useState(null);
  const [pengumumans, setPengumumans] = useState([]);
  const [galeris, setGaleris] = useState([]);
  const [beritas, setBeritas] = useState([]);

  // Ambil data publik (profil, pengumuman, galeri, berita) selalu — tidak perlu login
  useEffect(() => {
    const unsubProfil = onSnapshot(doc(db, 'website', 'profil'), (snap) => {
      if (snap.exists()) setProfilSekolah(snap.data());
    });
    const unsubPengumuman = onSnapshot(
      query(collection(db, 'pengumuman'), orderBy('createdAt', 'desc')),
      (snap) => setPengumumans(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubGaleri = onSnapshot(
      query(collection(db, 'galeri'), orderBy('createdAt', 'desc')),
      (snap) => setGaleris(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubBerita = onSnapshot(
      query(collection(db, 'berita'), orderBy('createdAt', 'desc')),
      (snap) => setBeritas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubProfil(); unsubPengumuman(); unsubGaleri(); unsubBerita(); };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setAppUser({ id: user.uid, ...snap.data() });
        }
      } else {
        setAppUser(null);
      }
      setLoadingBaseAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!appUser) return;
    const guruUnsub = onSnapshot(collection(db, 'guru'), (snap) => setGurus(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const siswaUnsub = onSnapshot(collection(db, 'siswa'), (snap) => setSiswas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { guruUnsub(); siswaUnsub(); };
  }, [appUser]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleLogin = async (email, password) => {
    setLoginError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setAppUser({ id: user.uid, ...userDocSnap.data() });
      } else {
        const newAdminProfile = { role: 'operator', name: 'Administrator', email: email, createdAt: new Date().toISOString() };
        await setDoc(userDocRef, newAdminProfile);
        setAppUser({ id: user.uid, ...newAdminProfile });
      }
    } catch (error) {
      setLoginError('Login gagal: Periksa kembali Email dan Password Anda.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAppUser(null);
    setActiveTab('dashboard');
  };

  const addGuru = async (data) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      const uid = userCredential.user.uid;
      await signOut(secondaryAuth);
      const newUser = { role: 'guru', name: data.nama, email: data.email, createdAt: new Date().toISOString() };
      await setDoc(doc(db, 'users', uid), newUser);
      const { password, ...guruData } = data;
      await setDoc(doc(db, 'guru', uid), { ...guruData, id: uid, createdAt: new Date().toISOString() });
    } catch (error) {
      throw new Error("Gagal membuat akun Guru: " + error.message);
    }
  };

  const editGuru = async (id, data) => {
    const { password, email, ...updateData } = data; 
    await updateDoc(doc(db, 'guru', id), updateData);
    await updateDoc(doc(db, 'users', id), { name: data.nama });
  };

  const deleteGuru = async (id) => {
    await deleteDoc(doc(db, 'guru', id));
    await deleteDoc(doc(db, 'users', id)); 
  };

  const addSiswa = async (data) => await addDoc(collection(db, 'siswa'), data);
  const editSiswa = async (id, data) => await updateDoc(doc(db, 'siswa', id), data);
  const deleteSiswa = async (id) => await deleteDoc(doc(db, 'siswa', id));

  if (loadingBaseAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white">Memuat Sistem...</div>;
  }

  if (!appUser) {
    if (showLogin) {
      return <LoginView onLogin={handleLogin} errorMsg={loginError} onBack={() => setShowLogin(false)} />;
    }
    return <LandingView onLoginClick={() => setShowLogin(true)} profilSekolah={profilSekolah} pengumumans={pengumumans} galeris={galeris} beritas={beritas} />;
  }

  // Menu dashboard — tambah menu konten website untuk operator
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['operator', 'guru'] },
    { id: 'guru', label: 'Data Guru', icon: Users, roles: ['operator'] }, 
    { id: 'siswa', label: 'Data Siswa', icon: GraduationCap, roles: ['operator', 'guru'] },
    { id: 'kelas', label: 'Data Kelas', icon: BookOpen, roles: ['operator', 'guru'] },
    { id: 'chat', label: 'Chat Internal', icon: MessageSquare, roles: ['operator', 'guru'] },
    // Grup Konten Website (hanya operator/admin)
    { id: 'profil-sekolah', label: 'Profil Sekolah', icon: School, roles: ['operator'], group: 'Website' },
    { id: 'pengumuman-admin', label: 'Pengumuman', icon: Megaphone, roles: ['operator'], group: 'Website' },
    { id: 'galeri-admin', label: 'Galeri', icon: ImageIcon, roles: ['operator'], group: 'Website' },
    { id: 'berita-admin', label: 'Berita', icon: Newspaper, roles: ['operator'], group: 'Website' },
  ];

  const allowedMenus = appUser?.role ? menuItems.filter(m => m.roles.includes(appUser.role)) : [];
  const mainMenus = allowedMenus.filter(m => !m.group);
  const websiteMenus = allowedMenus.filter(m => m.group === 'Website');

  const stats = { siswaCount: siswas.length, guruCount: gurus.length, kelasCount: 12 };

  // Label header yang lebih rapi
  const headerLabels = {
    'dashboard': 'Dashboard',
    'guru': 'Data Guru',
    'siswa': 'Data Siswa',
    'kelas': 'Manajemen Kelas',
    'chat': 'Chat Internal',
    'profil-sekolah': 'Profil Sekolah',
    'pengumuman-admin': 'Pengumuman',
    'galeri-admin': 'Galeri',
    'berita-admin': 'Berita',
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center text-white">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg"><GraduationCap className="w-5 h-5" /></div>
            <span className="font-bold text-xl tracking-tight">EduCore</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* Menu Utama */}
          {mainMenus.map((menu) => (
            <button key={menu.id} onClick={() => { setActiveTab(menu.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === menu.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <menu.icon className={`w-5 h-5 mr-3 ${activeTab === menu.id ? 'text-white' : 'text-slate-400'}`} /> {menu.label}
            </button>
          ))}

          {/* Divider Konten Website */}
          {websiteMenus.length > 0 && (
            <>
              <div className="pt-4 pb-2 px-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                  <Globe className="w-3 h-3 mr-1.5" /> Konten Website
                </p>
              </div>
              {websiteMenus.map((menu) => (
                <button key={menu.id} onClick={() => { setActiveTab(menu.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === menu.id ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <menu.icon className={`w-5 h-5 mr-3 ${activeTab === menu.id ? 'text-white' : 'text-slate-400'}`} /> {menu.label}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center px-3 py-2">
            <UserCircle className="w-8 h-8 text-slate-400 mr-3" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{appUser.name}</p>
              <p className="text-xs text-slate-400 capitalize">{appUser.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-4 w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
          <div className="flex items-center">
            <button className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white mr-4" onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{headerLabels[activeTab] || activeTab}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Tombol preview website */}
            <button
              onClick={() => { setAppUser(null); setShowLogin(false); }}
              title="Lihat Website Publik"
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Eye className="w-4 h-4" /> Preview Website
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && <DashboardView stats={stats} />}
          {activeTab === 'guru' && <GuruView gurus={gurus} onAdd={addGuru} onEdit={editGuru} onDelete={deleteGuru} userRole={appUser.role} />}
          {activeTab === 'siswa' && <SiswaView siswas={siswas} onAdd={addSiswa} onEdit={editSiswa} onDelete={deleteSiswa} userRole={appUser.role} />}
          {activeTab === 'chat' && <ChatView appUser={appUser} />}
          {activeTab === 'kelas' && <ConstructionView title="Manajemen Kelas" icon={BookOpen} desc="Fitur ini mengelola pembagian kelas dan penetapan wali kelas." />}
          
          {/* Fitur Konten Website */}
          {activeTab === 'profil-sekolah' && <ProfilSekolahView profilSekolah={profilSekolah} />}
          {activeTab === 'pengumuman-admin' && <PengumumanAdminView pengumumans={pengumumans} />}
          {activeTab === 'galeri-admin' && <GaleriAdminView galeris={galeris} />}
          {activeTab === 'berita-admin' && <BeritaAdminView beritas={beritas} />}
        </div>
      </main>
    </div>
  );
}
