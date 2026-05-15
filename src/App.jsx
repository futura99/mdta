import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot, 
  addDoc, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp 
} from 'firebase/firestore';
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar, 
  CheckSquare, FileText, CreditCard, MessageSquare, Settings, 
  LogOut, Menu, X, Plus, Search, Edit, Trash2, Moon, Sun, Bell, UserCircle,
  ArrowRight, MapPin, Phone, Mail, Globe, ImageIcon, Newspaper, Megaphone, Info, ArrowLeft,
  School, Save, Eye, PenSquare, ClipboardList, ChevronDown, Check, AlertCircle, Clock,
  Download, BarChart2, Upload, Link, Award
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ⬇️ FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAhkYsSFfqVwFXy_udrQgTZuuYQtZX6-mM",
  authDomain: "mdta-d02bd.firebaseapp.com",
  projectId: "mdta-d02bd",
  storageBucket: "mdta-d02bd.firebasestorage.app",
  messagingSenderId: "469654960740",
  appId: "1:469654960740:web:9d832e6ee044cf6b13fd71",
  measurementId: "G-P3P6214JCH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

// =============================================
// UTILITY: EXPORT PDF & EXCEL (tanpa library eksternal)
// =============================================
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename + '.csv'; a.click();
  URL.revokeObjectURL(url);
};

const exportToHTML = (htmlContent, filename) => {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename + '.html'; a.click();
  URL.revokeObjectURL(url);
};

const generateSiswaPDF = (siswas, filterKelas) => {
  const data = siswas.map((s, i) => ({
    'No': i + 1,
    'Nama Siswa': s.nama || '',
    'NIS': s.nis || '',
    'Kelas': s.kelas || '',
    'Jenis Kelamin': s.jenisKelamin || '',
    'Tempat Lahir': s.tempatLahir || '',
    'Tanggal Lahir': s.tanggalLahir || '',
    'Alamat': s.alamat || '',
    'Nama Orang Tua': s.namaOrtu || '',
    'No HP Orang Tua': s.noHpOrtu || '',
    'Foto': s.fotoUrl || '',
  }));
  const title = filterKelas ? `Data Siswa Kelas ${filterKelas}` : 'Data Seluruh Siswa';
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
  <style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px}h2{text-align:center;margin-bottom:16px;font-size:14px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:5px 7px;text-align:left}th{background:#2563eb;color:#fff}tr:nth-child(even){background:#f0f4ff}@media print{button{display:none}}</style></head>
  <body><h2>MDTA Al-Furqan</h2><h3 style="text-align:center">${title}</h3>
  <p style="text-align:center;margin-bottom:12px">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
  <button onclick="window.print()" style="margin-bottom:12px;padding:6px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨️ Cetak / Simpan PDF</button>
  <table><thead><tr>${Object.keys(data[0] || {}).filter(k=>k!=='Foto').map(h=>`<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${data.map(row=>`<tr>${Object.entries(row).filter(([k])=>k!=='Foto').map(([,v])=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>
  </body></html>`;
  exportToHTML(html, title);
};

const generateNilaiPDF = (siswaList, nilaiData, kelas, semester, mapel) => {
  const mapelLabel = mapel ? ` - ${mapel}` : '';
  const title = `Laporan Nilai Kelas ${kelas}${mapelLabel} - ${semester}`;
  const isKelas4 = kelas && kelas.toLowerCase().includes('4');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
  <style>body{font-family:Arial,sans-serif;font-size:10px;margin:20px}h2,h3{text-align:center;margin:4px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ccc;padding:4px 6px;text-align:center}th{background:#1d4ed8;color:#fff}tr:nth-child(even){background:#eff6ff}@media print{button{display:none}}</style></head>
  <body><h2>MDTA Al-Furqan</h2><h3>${title}</h3>
  <p style="text-align:center">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
  <button onclick="window.print()" style="margin:10px 0;padding:6px 16px;background:#1d4ed8;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨️ Cetak / Simpan PDF</button>
  <table><thead><tr><th>No</th><th>Nama Siswa</th><th>NIS</th><th>Nilai Harian</th><th>UTS</th><th>UAS</th>${isKelas4?'<th>UAM</th>':''}<th>Rata-rata</th></tr></thead>
  <tbody>${siswaList.map((s,i)=>{
    const n = nilaiData[s.id] || {};
    const nh = parseFloat(n.nilaiHarian)||0, uts = parseFloat(n.uts)||0, uas = parseFloat(n.uas)||0, uam = parseFloat(n.uam)||0;
    const count = isKelas4?4:3, total = isKelas4?(nh+uts+uas+uam):(nh+uts+uas), avg = count>0?(total/count).toFixed(1):'-';
    return `<tr><td>${i+1}</td><td style="text-align:left">${s.nama}</td><td>${s.nis||''}</td><td>${nh||'-'}</td><td>${uts||'-'}</td><td>${uas||'-'}</td>${isKelas4?`<td>${uam||'-'}</td>`:''}<td><b>${avg}</b></td></tr>`;
  }).join('')}</tbody></table></body></html>`;
  exportToHTML(html, title);
};

// =============================================
// KOMPONEN UI DASAR
// =============================================
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
    warning: "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500",
    outline: "border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder, required = false, readOnly = false }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} readOnly={readOnly}
      className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors text-sm ${readOnly ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed' : ''}`} />
  </div>
);

const Select = ({ label, value, onChange, children, required = false }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
    <select value={value} onChange={onChange} required={required}
      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors text-sm">
      {children}
    </select>
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, required = false, rows = 4 }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
    <textarea value={value} onChange={onChange} placeholder={placeholder} required={required} rows={rows}
      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors text-sm resize-y" />
  </div>
);

// Komponen Upload Foto (File atau URL) dengan pengaturan ukuran
const FotoUpload = ({ value, onChange, label = "Foto", contain = false, size, onSizeChange }) => {
  const [mode, setMode] = useState('url');
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  const imgSize = size || 100;
  const previewStyle = {
    objectFit: contain ? 'contain' : 'cover',
    transform: `scale(${imgSize / 100})`,
    transformOrigin: 'center center',
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <div className="flex gap-2 mb-2">
        <button type="button" onClick={() => setMode('url')}
          className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors flex items-center justify-center gap-1 ${mode === 'url' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
          <Link className="w-3 h-3" /> Link URL
        </button>
        <button type="button" onClick={() => setMode('file')}
          className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors flex items-center justify-center gap-1 ${mode === 'file' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
          <Upload className="w-3 h-3" /> Upload File
        </button>
      </div>
      {mode === 'url' ? (
        <input type="url" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="https://..."
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500" />
      ) : (
        <div>
          <input type="file" ref={fileRef} accept="image/*" onChange={handleFile} className="hidden" />
          <button type="button" onClick={() => fileRef.current.click()}
            className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" /> Pilih File Foto
          </button>
        </div>
      )}
      {value && (
        <div className="mt-2">
          <div className="relative overflow-hidden rounded-lg border bg-slate-100 dark:bg-slate-800" style={{ height: '112px' }}>
            <img src={value} alt="Preview" style={previewStyle} className="w-full h-full" onError={e => e.target.style.display='none'} />
            <button type="button" onClick={() => onChange('')}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 z-10"><X className="w-3 h-3" /></button>
          </div>
          {onSizeChange && (
            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Ukuran Foto
                </label>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{imgSize}%</span>
              </div>
              <input type="range" min="30" max="150" value={imgSize}
                onChange={e => onSizeChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full appearance-none cursor-pointer accent-blue-600" />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>30%</span><span>100%</span><span>150%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================
// HALAMAN LOGIN
// =============================================
const LoginView = ({ onLogin, errorMsg, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); await onLogin(email, password); setLoading(false); };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative">
      <button onClick={onBack} className="absolute top-6 left-6 flex items-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Web Utama
      </button>
      <Card className="w-full max-w-md p-8 mt-12 sm:mt-0">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">Login MDTA Al-Furqan</h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-6">Sistem Informasi Manajemen Sekolah</p>
        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMsg}</div>}
        <form onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full py-3 mt-4" disabled={loading}>{loading ? 'Memeriksa Kredensial...' : 'Masuk ke Sistem'}</Button>
        </form>
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 text-center">
          <strong>Info Keamanan:</strong> Akun Admin hanya dapat didaftarkan melalui Firebase Console.
        </div>
      </Card>
    </div>
  );
};

// =============================================
// LANDING PAGE
// =============================================
const LandingView = ({ onLoginClick, profilSekolah, pengumumans, galeris, beritas }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPengumuman, setSelectedPengumuman] = useState(null);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollTo = (id) => { setMobileMenuOpen(false); const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); };
  const navLinks = [{ id: 'beranda', label: 'Beranda' }, { id: 'profil', label: 'Profil Sekolah' }, { id: 'pengumuman', label: 'Pengumuman' }, { id: 'galeri', label: 'Galeri' }, { id: 'berita', label: 'Berita' }];
  const profil = profilSekolah || {};
  const namaSekolah = profil.namaSekolah || 'MDTA Al-Furqan';
  const tagline = profil.tagline || 'Membangun Generasi Cerdas & Berkarakter';
  const deskripsiHero = profil.deskripsiHero || 'MDTA Al-Furqan merupakan wujud komitmen kami dalam menyelenggarakan pendidikan berkualitas tinggi yang inovatif, inklusif, dan berwawasan global.';
  const sejarah = profil.sejarah || 'Didirikan dengan penuh semangat, MDTA Al-Furqan telah berkembang menjadi salah satu institusi pendidikan terkemuka.';
  const visi = profil.visi || 'Menjadi pusat pendidikan unggulan yang mencetak lulusan berdaya saing global, berakhlak mulia, dan berwawasan lingkungan.';
  const misi = profil.misi || 'Menyelenggarakan pembelajaran inovatif berbasis teknologi, serta menanamkan nilai-nilai karakter luhur kebangsaan.';
  const alamat = profil.alamat || 'Jl. Pendidikan No. 123, Kota Pelajar, Indonesia 12345';
  const telepon = profil.telepon || '+62 21 5555 1234';
  const email = profil.email || 'info@mdta-alfurqan.sch.id';
  const heroImageUrl = profil.heroImageUrl || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80';
  const profilImageUrl = profil.profilImageUrl || 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80';
  const logoUrl = profil.logoUrl || '';
  const defaultPengumuman = [{ id: 'def1', tanggal: "20 Mei 2026", judul: "Jadwal PAT 2026", tipe: "Akademik" }, { id: 'def2', tanggal: "01 Jun 2026", judul: "Informasi PPDB Gelombang 1", tipe: "PPDB" }, { id: 'def3', tanggal: "15 Mei 2026", judul: "Undangan Rapat Pleno Komite", tipe: "Umum" }];
  const displayPengumuman = pengumumans && pengumumans.length > 0 ? pengumumans.slice(0, 3) : defaultPengumuman;
  const defaultGaleri = [{ id: 'g1', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', keterangan: 'KBM' }, { id: 'g2', url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80', keterangan: 'Perpustakaan' }, { id: 'g3', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80', keterangan: 'Wisuda' }, { id: 'g4', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80', keterangan: 'Praktikum' }];
  const displayGaleri = galeris && galeris.length > 0 ? galeris : defaultGaleri;
  const defaultBeritas = [{ id: 'b1', imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80", judul: "Tim Robotik Raih Juara 1", tanggal: "10 Mei 2026", isi: "Prestasi gemilang." }];
  const displayBeritas = beritas && beritas.length > 0 ? beritas.slice(0, 3) : defaultBeritas;
  const tipeColors = { 'Akademik': 'text-blue-700 bg-blue-100', 'PPDB': 'text-emerald-700 bg-emerald-100', 'Umum': 'text-orange-700 bg-orange-100', 'Kegiatan': 'text-purple-700 bg-purple-100', 'Penting': 'text-red-700 bg-red-100' };
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 overflow-x-hidden">
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => scrollTo('beranda')}>
              {logoUrl
                ? <img src={logoUrl} alt="Logo Sekolah" className="w-10 h-10 rounded-xl object-contain bg-white shadow-lg p-0.5" onError={e => e.target.style.display='none'} />
                : <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><GraduationCap className="w-6 h-6 text-white" /></div>
              }
              <span className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-slate-900' : 'text-white drop-shadow-md'}`}>{namaSekolah}</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map(link => (<button key={link.id} onClick={() => scrollTo(link.id)} className={`text-sm font-medium hover:text-blue-500 transition-colors ${isScrolled ? 'text-slate-600' : 'text-white/90 drop-shadow'}`}>{link.label}</button>))}
              <Button onClick={onLoginClick} className="shadow-lg hover:shadow-xl transition-all rounded-full px-6">Login Sistem</Button>
            </div>
            <button className={`md:hidden p-2 rounded-lg ${isScrolled ? 'text-slate-900' : 'text-white'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t py-4 px-4 flex flex-col space-y-4">
            {navLinks.map(link => (<button key={link.id} onClick={() => scrollTo(link.id)} className="text-left py-2 px-4 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">{link.label}</button>))}
            <div className="pt-2"><Button onClick={onLoginClick} className="w-full justify-center">Login Sistem</Button></div>
          </div>
        )}
      </nav>
      <section id="beranda" className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <img src={heroImageUrl} alt="Gedung Sekolah" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold mb-6 border border-blue-500/30 backdrop-blur-sm">Selamat Datang di Portal Resmi</span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight max-w-4xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{tagline}</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">{deskripsiHero}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={onLoginClick} className="px-8 py-4 text-base rounded-2xl shadow-2xl">Login Sistem <ArrowRight className="w-5 h-5 ml-2" /></Button>
            <button onClick={() => scrollTo('profil')} className="px-8 py-4 text-base rounded-2xl border-2 border-white/40 text-white hover:bg-white/10 transition-colors font-medium">Pelajari Lebih Lanjut</button>
          </div>
        </div>
      </section>
      <section id="profil" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div><img src={profilImageUrl} alt="Profil Sekolah" className="rounded-2xl shadow-2xl w-full h-80 object-cover" onError={e => e.target.style.display='none'} /></div>
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Profil Sekolah</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">{sejarah}</p>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl"><h3 className="font-bold text-blue-800 mb-1">Visi</h3><p className="text-slate-600 text-sm">{visi}</p></div>
                <div className="p-4 bg-emerald-50 rounded-xl"><h3 className="font-bold text-emerald-800 mb-1">Misi</h3><p className="text-slate-600 text-sm">{misi}</p></div>
              </div>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{ icon: MapPin, label: 'Alamat', val: alamat }, { icon: Phone, label: 'Telepon', val: telepon }, { icon: Mail, label: 'Email', val: email }].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex items-start gap-4 p-5 bg-slate-50 rounded-xl">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Icon className="w-5 h-5" /></div>
                <div><p className="font-semibold text-slate-700">{label}</p><p className="text-slate-500 text-sm">{val}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="pengumuman" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">Pengumuman Terbaru</h2>
          <div className="space-y-4">
            {displayPengumuman.map(p => (
              <div key={p.id} onClick={() => setSelectedPengumuman(p)}
                className="bg-white rounded-xl p-5 shadow-sm border flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${tipeColors[p.tipe] || tipeColors['Umum']}`}>{p.tipe}</span>
                <div className="flex-1"><h3 className="font-semibold">{p.judul}</h3>
                  {p.isi && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.isi}</p>}
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{p.tanggal}</span>
                <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popup Pengumuman */}
      {selectedPengumuman && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPengumuman(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold mb-2 ${tipeColors[selectedPengumuman.tipe] || tipeColors['Umum']}`}>{selectedPengumuman.tipe}</span>
                <h2 className="text-xl font-bold text-slate-900">{selectedPengumuman.judul}</h2>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedPengumuman.tanggal}</p>
              </div>
              <button onClick={() => setSelectedPengumuman(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex-shrink-0"><X className="w-5 h-5" /></button>
            </div>
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap border-t pt-4">
              {selectedPengumuman.isi || 'Tidak ada isi pengumuman.'}
            </div>
          </div>
        </div>
      )}
      <section id="galeri" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">Galeri Sekolah</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayGaleri.map(g => (
              <div key={g.id} className="aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-sm">
                <img src={g.url} alt={g.keterangan} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" onError={e => { e.target.style.display='none'; }} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="berita" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">Berita Sekolah</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayBeritas.map(b => (
              <div key={b.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
                onClick={() => {
                  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${b.judul}</title>
                  <style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1e293b;line-height:1.7}
                  h1{font-size:2rem;font-weight:700;margin-bottom:8px}
                  .meta{color:#64748b;font-size:0.875rem;margin-bottom:24px}
                  img{width:100%;max-height:400px;object-fit:cover;border-radius:12px;margin-bottom:24px}
                  p{white-space:pre-wrap;font-size:1rem}</style></head>
                  <body>${b.imageUrl ? `<img src="${b.imageUrl}" alt="${b.judul}" onerror="this.style.display='none'" />` : ''}
                  <h1>${b.judul}</h1><p class="meta">${b.tanggal}</p><p>${b.isi || ''}</p></body></html>`;
                  const blob = new Blob([html], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                }}>
                {b.imageUrl && (
                  <div className="overflow-hidden h-48">
                    <img src={b.imageUrl} alt={b.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => e.target.style.display='none'} />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs text-slate-400 mb-2">{b.tanggal}</p>
                  <h3 className="font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{b.judul}</h3>
                  <p className="text-sm text-slate-500 line-clamp-3">{b.isi}</p>
                  <div className="mt-3 flex items-center gap-1 text-blue-500 text-xs font-medium">
                    <span>Baca selengkapnya</span><ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>© 2026 {namaSekolah}. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
};

// =============================================
// DASHBOARD VIEW
// =============================================
const DashboardView = ({ stats, absensiData }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayAbsensi = absensiData.filter(a => a.tanggal === today);
  const totalHadir = todayAbsensi.filter(a => a.status === 'Hadir').length;
  const pctHadir = todayAbsensi.length > 0 ? Math.round((totalHadir / todayAbsensi.length) * 100) : 0;
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayData = absensiData.filter(a => a.tanggal === dateStr);
    last7.push({ name: d.toLocaleDateString('id-ID', { weekday: 'short' }), Hadir: dayData.filter(a => a.status === 'Hadir').length, Izin: dayData.filter(a => a.status === 'Izin').length, Sakit: dayData.filter(a => a.status === 'Sakit').length, Alpha: dayData.filter(a => a.status === 'Alpha').length });
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Siswa', value: stats.siswaCount, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
          { title: 'Total Guru', value: stats.guruCount, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { title: 'Total Kelas', value: stats.kelasCount, icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/30' },
          { title: 'Kehadiran Hari Ini', value: todayAbsensi.length > 0 ? `${pctHadir}%` : 'Belum Absen', icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
        ].map((stat, i) => (
          <Card key={i} className="p-6 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}><stat.icon className="w-8 h-8" /></div>
            <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3></div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Grafik Kehadiran 7 Hari Terakhir</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }} />
                <Legend />
                <Bar dataKey="Hadir" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Izin" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sakit" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Alpha" fill="#6B7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Rekap Absensi Hari Ini</h3>
          {todayAbsensi.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <ClipboardList className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">Belum ada absensi hari ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[{ label: 'Hadir', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50 dark:bg-blue-900/20' }, { label: 'Izin', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50 dark:bg-amber-900/20' }, { label: 'Sakit', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50 dark:bg-red-900/20' }, { label: 'Alpha', color: 'bg-slate-500', textColor: 'text-slate-700', bgLight: 'bg-slate-50 dark:bg-slate-800' }].map(item => (
                <div key={item.label} className={`flex items-center justify-between p-3 rounded-lg ${item.bgLight}`}>
                  <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${item.color}`}></div><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span></div>
                  <span className={`text-lg font-bold ${item.textColor}`}>{todayAbsensi.filter(a => a.status === item.label).length} siswa</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// =============================================
// GURU VIEW
// =============================================
const GuruView = ({ gurus, onAdd, onEdit, onDelete, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nama: '', nip: '', mapel: '', hp: '', email: '', password: '', fotoUrl: '' });
  const [fotoSize, setFotoSize] = useState(100);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapelList, setMapelList] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'mataPelajaran'), snap => {
      if (snap.exists()) setMapelList(snap.data().list || []);
    });
    return () => unsub();
  }, []);
  const filtered = gurus.filter(g => g.nama.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (editId) await onEdit(editId, formData);
      else await onAdd(formData);
      setIsModalOpen(false);
      setFormData({ nama: '', nip: '', mapel: '', hp: '', email: '', password: '', fotoUrl: '' });
      setEditId(null);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const openEdit = (g) => { setFormData({ nama: g.nama, nip: g.nip, mapel: g.mapel, hp: g.hp, email: g.email || '', password: '', fotoUrl: g.fotoUrl || '' }); setEditId(g.id); setIsModalOpen(true); setError(''); };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Cari guru..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white" />
        </div>
        {userRole === 'operator' && (
          <Button icon={Plus} onClick={() => { setEditId(null); setFormData({ nama: '', nip: '', mapel: '', hp: '', email: '', password: '', fotoUrl: '' }); setIsModalOpen(true); }}>Tambah Akun Guru</Button>
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
                    {g.fotoUrl ? <img src={g.fotoUrl} alt={g.nama} className="w-8 h-8 rounded-full object-cover" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} /> : null}
                    <div className={`w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 items-center justify-center font-bold ${g.fotoUrl ? 'hidden' : 'flex'}`}>{g.nama.charAt(0)}</div>
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran</label>
                {mapelList.length > 0 ? (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {mapelList.map(mp => (
                        <button key={mp} type="button"
                          onClick={() => setFormData({...formData, mapel: mp === formData.mapel ? '' : mp})}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${formData.mapel === mp ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400'}`}>
                          {mp}
                        </button>
                      ))}
                    </div>
                    {formData.mapel && <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">✓ Dipilih: {formData.mapel}</p>}
                    <input type="text" value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} placeholder="Atau ketik mata pelajaran lain..."
                      className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                ) : (
                  <input type="text" value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} required placeholder="Ketik nama mata pelajaran..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500" />
                )}
              </div>
              <Input label="No. Handphone" value={formData.hp} onChange={e => setFormData({...formData, hp: e.target.value})} required />
              <FotoUpload label="Foto Guru" value={formData.fotoUrl} onChange={val => setFormData({...formData, fotoUrl: val})} size={fotoSize} onSizeChange={setFotoSize} />
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

// =============================================
// SISWA VIEW — dengan download PDF/Excel
// =============================================
const SiswaView = ({ siswas, kelass, onAdd, onEdit, onDelete, userRole, appUser, gurus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nama: '', nis: '', kelas: '', jenisKelamin: 'Laki-laki', tempatLahir: '', tanggalLahir: '', alamat: '', namaOrtu: '', noHpOrtu: '', fotoUrl: '' });
  const [siswaFotoSize, setSiswaFotoSize] = useState(100);
  const [editId, setEditId] = useState(null);

  const guruKelas = kelass.find(k => k.waliKelasId === appUser?.id);
  useEffect(() => { if (userRole === 'guru' && guruKelas) setFilterKelas(guruKelas.namaKelas); }, [guruKelas, userRole]);

  const filtered = siswas.filter(s => {
    const matchSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || (s.nis && s.nis.includes(searchTerm));
    const matchKelas = filterKelas ? s.kelas === filterKelas : true;
    return matchSearch && matchKelas;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    if (userRole === 'guru' && guruKelas) dataToSave.kelas = guruKelas.namaKelas;
    if (editId) onEdit(editId, dataToSave); else onAdd(dataToSave);
    setIsModalOpen(false);
    setFormData({ nama: '', nis: '', kelas: '', jenisKelamin: 'Laki-laki', tempatLahir: '', tanggalLahir: '', alamat: '', namaOrtu: '', noHpOrtu: '', fotoUrl: '' });
    setEditId(null);
  };

  const openEdit = (s) => {
    setFormData({ nama: s.nama||'', nis: s.nis||'', kelas: s.kelas||'', jenisKelamin: s.jenisKelamin||'Laki-laki', tempatLahir: s.tempatLahir||'', tanggalLahir: s.tanggalLahir||'', alamat: s.alamat||'', namaOrtu: s.namaOrtu||'', noHpOrtu: s.noHpOrtu||'', fotoUrl: s.fotoUrl||'' });
    setEditId(s.id); setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditId(null);
    const defaultKelas = userRole === 'guru' && guruKelas ? guruKelas.namaKelas : '';
    setFormData({ nama: '', nis: '', kelas: defaultKelas, jenisKelamin: 'Laki-laki', tempatLahir: '', tanggalLahir: '', alamat: '', namaOrtu: '', noHpOrtu: '', fotoUrl: '' });
    setIsModalOpen(true);
  };

  const canAdd = userRole === 'operator' || (userRole === 'guru' && guruKelas);

  const handleDownloadExcel = () => exportToCSV(filtered.map((s, i) => ({ 'No': i+1, 'Nama Siswa': s.nama||'', 'NIS': s.nis||'', 'Kelas': s.kelas||'', 'Jenis Kelamin': s.jenisKelamin||'', 'Tempat Lahir': s.tempatLahir||'', 'Tanggal Lahir': s.tanggalLahir||'', 'Alamat': s.alamat||'', 'Nama Orang Tua': s.namaOrtu||'', 'No HP Orang Tua': s.noHpOrtu||'' })), `Data_Siswa${filterKelas ? '_' + filterKelas : ''}`);

  return (
    <div className="space-y-6">
      {userRole === 'guru' && !guruKelas && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">Anda belum ditugaskan sebagai wali kelas. Hubungi operator.</p>
        </div>
      )}
      {userRole === 'guru' && guruKelas && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">Anda adalah wali kelas <strong>{guruKelas.namaKelas}</strong>.</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-3 flex-1 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Cari nama / NIS..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white" />
          </div>
          {userRole === 'operator' && (
            <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white text-sm">
              <option value="">Semua Kelas</option>
              {kelass.map(k => <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>)}
            </select>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" icon={Download} onClick={() => generateSiswaPDF(filtered, filterKelas)}>PDF</Button>
          <Button variant="outline" icon={Download} onClick={handleDownloadExcel}>Excel/CSV</Button>
          {canAdd && <Button icon={Plus} onClick={openAdd}>Tambah Siswa</Button>}
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 font-medium">Foto</th>
                <th className="p-4 font-medium">Nama Siswa</th>
                <th className="p-4 font-medium">NIS</th>
                <th className="p-4 font-medium">Kelas</th>
                <th className="p-4 font-medium">Jenis Kelamin</th>
                <th className="p-4 font-medium">Nama Orang Tua</th>
                <th className="p-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                  <td className="p-4">
                    {s.fotoUrl ? <img src={s.fotoUrl} alt={s.nama} className="w-9 h-9 rounded-full object-cover border" onError={e => e.target.style.display='none'} />
                      : <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-bold text-sm">{s.nama.charAt(0)}</div>}
                  </td>
                  <td className="p-4 font-medium">{s.nama}</td>
                  <td className="p-4 text-slate-500">{s.nis}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs">{s.kelas}</span></td>
                  <td className="p-4">{s.jenisKelamin || '-'}</td>
                  <td className="p-4">{s.namaOrtu || '-'}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1"><Edit className="w-4 h-4" /></button>
                    {userRole === 'operator' && <button onClick={() => onDelete(s.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-slate-500">Tidak ada data siswa.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 dark:text-white">{editId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-x-4">
                <div className="col-span-2"><Input label="Nama Lengkap *" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required /></div>
                <Input label="NIS *" value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} required />
                {userRole === 'operator' ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kelas *</label>
                    <select value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Pilih Kelas --</option>
                      {kelass.map(k => <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kelas</label>
                    <input value={guruKelas?.namaKelas || formData.kelas} readOnly className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white cursor-not-allowed" />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jenis Kelamin</label>
                  <select value={formData.jenisKelamin} onChange={e => setFormData({...formData, jenisKelamin: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500">
                    <option>Laki-laki</option><option>Perempuan</option>
                  </select>
                </div>
                <Input label="Tempat Lahir" value={formData.tempatLahir} onChange={e => setFormData({...formData, tempatLahir: e.target.value})} />
                <Input label="Tanggal Lahir" type="date" value={formData.tanggalLahir} onChange={e => setFormData({...formData, tanggalLahir: e.target.value})} />
                <div className="col-span-2"><Input label="Alamat" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} /></div>
                <Input label="Nama Orang Tua/Wali" value={formData.namaOrtu} onChange={e => setFormData({...formData, namaOrtu: e.target.value})} />
                <Input label="No. HP Orang Tua" value={formData.noHpOrtu} onChange={e => setFormData({...formData, noHpOrtu: e.target.value})} />
                <div className="col-span-2">
                  <FotoUpload label="Foto Siswa" value={formData.fotoUrl} onChange={val => setFormData({...formData, fotoUrl: val})} size={siswaFotoSize} onSizeChange={setSiswaFotoSize} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-2">
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit">Simpan Data</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// =============================================
// KELAS VIEW
// =============================================
const KelasView = ({ kelass, gurus, siswas, onAddKelas, onEditKelas, onDeleteKelas, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ namaKelas: '', tingkat: '', waliKelasId: '', ruangan: '', kapasitas: '' });
  const [viewKelasId, setViewKelasId] = useState(null);
  const openAdd = () => { setEditId(null); setFormData({ namaKelas: '', tingkat: '', waliKelasId: '', ruangan: '', kapasitas: '' }); setIsModalOpen(true); };
  const openEdit = (k) => { setEditId(k.id); setFormData({ namaKelas: k.namaKelas, tingkat: k.tingkat||'', waliKelasId: k.waliKelasId||'', ruangan: k.ruangan||'', kapasitas: k.kapasitas||'' }); setIsModalOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); if (editId) await onEditKelas(editId, formData); else await onAddKelas(formData); setIsModalOpen(false); };
  const getGuruName = (id) => gurus.find(g => g.id === id)?.nama || '-';
  const getSiswaCount = (namaKelas) => siswas.filter(s => s.kelas === namaKelas).length;
  if (viewKelasId) {
    const kelas = kelass.find(k => k.id === viewKelasId);
    const siswaKelas = siswas.filter(s => s.kelas === kelas?.namaKelas);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewKelasId(null)} className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"><ArrowLeft className="w-4 h-4 mr-1" /> Kembali</button>
          <h2 className="text-xl font-bold dark:text-white">Detail Kelas: {kelas?.namaKelas}</h2>
        </div>
        <Card className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-slate-500">Tingkat</p><p className="font-semibold dark:text-white">{kelas?.tingkat||'-'}</p></div>
            <div><p className="text-slate-500">Ruangan</p><p className="font-semibold dark:text-white">{kelas?.ruangan||'-'}</p></div>
            <div><p className="text-slate-500">Wali Kelas</p><p className="font-semibold dark:text-white">{getGuruName(kelas?.waliKelasId)}</p></div>
            <div><p className="text-slate-500">Jumlah Siswa</p><p className="font-semibold dark:text-white">{siswaKelas.length} siswa</p></div>
          </div>
        </Card>
        <Card>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700"><h3 className="font-semibold dark:text-white">Daftar Siswa</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr><th className="p-4 font-medium">No</th><th className="p-4 font-medium">Nama Siswa</th><th className="p-4 font-medium">NIS</th><th className="p-4 font-medium">Jenis Kelamin</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {siswaKelas.map((s, i) => (<tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"><td className="p-4">{i+1}</td><td className="p-4 font-medium">{s.nama}</td><td className="p-4">{s.nis}</td><td className="p-4">{s.jenisKelamin||'-'}</td></tr>))}
                {siswaKelas.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada siswa.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-xl font-bold dark:text-white">Manajemen Kelas</h2><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola kelas, wali kelas, dan ruangan</p></div>
        {userRole === 'operator' && <Button icon={Plus} onClick={openAdd}>Tambah Kelas</Button>}
      </div>
      {kelass.length === 0 ? (
        <Card className="p-12 text-center"><BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500 font-medium">Belum ada data kelas</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kelass.map(k => (
            <Card key={k.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="text-lg font-bold text-slate-800 dark:text-white">{k.namaKelas}</h3><p className="text-xs text-slate-500">{k.tingkat||''} {k.ruangan ? `· Ruang ${k.ruangan}` : ''}</p></div>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">{getSiswaCount(k.namaKelas)} siswa</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-4"><span className="font-medium">Wali Kelas:</span> {getGuruName(k.waliKelasId)}</div>
              <div className="flex gap-2">
                <button onClick={() => setViewKelasId(k.id)} className="flex-1 text-center py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"><Eye className="w-4 h-4 inline mr-1" /> Lihat Siswa</button>
                {userRole === 'operator' && (<><button onClick={() => openEdit(k)} className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Edit className="w-4 h-4" /></button><button onClick={() => onDeleteKelas(k.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button></>)}
              </div>
            </Card>
          ))}
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">{editId ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h2>
            <form onSubmit={handleSubmit}>
              <Input label="Nama Kelas *" value={formData.namaKelas} onChange={e => setFormData({...formData, namaKelas: e.target.value})} placeholder="Contoh: Kelas 1A" required />
              <Input label="Tingkat" value={formData.tingkat} onChange={e => setFormData({...formData, tingkat: e.target.value})} placeholder="Contoh: Kelas 4" />
              <Input label="Ruangan" value={formData.ruangan} onChange={e => setFormData({...formData, ruangan: e.target.value})} />
              <Input label="Kapasitas" type="number" value={formData.kapasitas} onChange={e => setFormData({...formData, kapasitas: e.target.value})} />
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Wali Kelas</label>
                <select value={formData.waliKelasId} onChange={e => setFormData({...formData, waliKelasId: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Belum Ditentukan --</option>
                  {gurus.map(g => <option key={g.id} value={g.id}>{g.nama} ({g.mapel})</option>)}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit">Simpan Kelas</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// =============================================
// ABSENSI VIEW — guru manapun bisa mengisi
// =============================================
const AbsensiView = ({ siswas, kelass, appUser, userRole, gurus }) => {
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedTanggal, setSelectedTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [absensiHariIni, setAbsensiHariIni] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [historyMode, setHistoryMode] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // PERUBAHAN: Semua guru bisa pilih kelas apapun, tidak terbatas wali kelas
  const allowedKelass = kelass; // semua kelas tersedia untuk semua role

  useEffect(() => {
    if (!selectedKelas || !selectedTanggal) return;
    const q = query(collection(db, 'absensi'), where('kelas', '==', selectedKelas), where('tanggal', '==', selectedTanggal));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAbsensiHariIni(data);
      const map = {};
      data.forEach(a => { map[a.siswaId] = a.status; });
      setStatusMap(map);
      setSaved(data.length > 0);
    });
    return () => unsub();
  }, [selectedKelas, selectedTanggal]);

  useEffect(() => {
    if (!historyMode || !selectedKelas) return;
    const q = query(collection(db, 'absensi'), where('kelas', '==', selectedKelas), orderBy('tanggal', 'desc'));
    const unsub = onSnapshot(q, snap => { setHistoryData(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => unsub();
  }, [historyMode, selectedKelas]);

  const siswaKelas = siswas.filter(s => s.kelas === selectedKelas);
  const setStatus = (siswaId, status) => { setStatusMap(prev => ({ ...prev, [siswaId]: status })); setSaved(false); };

  const handleSimpan = async () => {
    if (!selectedKelas || siswaKelas.length === 0) return;
    setLoading(true);
    try {
      for (const siswa of siswaKelas) {
        const status = statusMap[siswa.id] || 'Hadir';
        const existing = absensiHariIni.find(a => a.siswaId === siswa.id);
        const data = { siswaId: siswa.id, namaSiswa: siswa.nama, kelas: selectedKelas, tanggal: selectedTanggal, status, dicatatOleh: appUser?.name || '-', updatedAt: new Date().toISOString() };
        if (existing) await updateDoc(doc(db, 'absensi', existing.id), data);
        else await addDoc(collection(db, 'absensi'), { ...data, createdAt: serverTimestamp() });
      }
      setSaved(true);
    } catch (err) { alert('Gagal menyimpan: ' + err.message); } finally { setLoading(false); }
  };

  const statusConfig = {
    'Hadir': { color: 'bg-blue-500 text-white border-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', label: 'H' },
    'Izin': { color: 'bg-amber-500 text-white border-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20', label: 'I' },
    'Sakit': { color: 'bg-red-500 text-white border-red-500', light: 'bg-red-50 dark:bg-red-900/20', label: 'S' },
    'Alpha': { color: 'bg-slate-500 text-white border-slate-500', light: 'bg-slate-50 dark:bg-slate-800', label: 'A' },
  };
  const statusOptions = ['Hadir', 'Izin', 'Sakit', 'Alpha'];
  const summary = statusOptions.map(s => ({ status: s, count: Object.values(statusMap).filter(v => v === s).length }));

  const historyByTanggal = {};
  historyData.forEach(a => { if (!historyByTanggal[a.tanggal]) historyByTanggal[a.tanggal] = []; historyByTanggal[a.tanggal].push(a); });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Absensi Murid</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Semua guru dapat mengisi absensi kelas manapun</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setHistoryMode(false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!historyMode ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}><ClipboardList className="w-4 h-4 inline mr-1" /> Input Absensi</button>
          <button onClick={() => setHistoryMode(true)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${historyMode ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}><Calendar className="w-4 h-4 inline mr-1" /> Riwayat</button>
        </div>
      </div>

      {/* Info: Absensi bisa diisi siapa saja */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>Absensi dapat diisi oleh guru mana pun yang mengajar di kelas tersebut pada hari ini.</span>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Kelas</label>
            <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih Kelas --</option>
              {allowedKelass.map(k => <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal</label>
            <input type="date" value={selectedTanggal} onChange={e => setSelectedTanggal(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </Card>

      {!historyMode && (
        <>
          {!selectedKelas ? (
            <Card className="p-12 text-center"><ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Pilih kelas terlebih dahulu</p></Card>
          ) : siswaKelas.length === 0 ? (
            <Card className="p-12 text-center"><Users className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Belum ada siswa di kelas {selectedKelas}.</p></Card>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3">
                {summary.map(({ status, count }) => (
                  <Card key={status} className={`p-4 text-center ${statusConfig[status].light}`}>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{count}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{status}</p>
                  </Card>
                ))}
              </div>
              {saved && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm">
                  <Check className="w-4 h-4" /> Absensi tersimpan. Tercatat oleh: {absensiHariIni[0]?.dicatatOleh || appUser?.name}
                </div>
              )}
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-sm text-slate-500 dark:text-slate-400">Set semua:</span>
                {statusOptions.map(s => (
                  <button key={s} onClick={() => { const map = {}; siswaKelas.forEach(siswa => { map[siswa.id] = s; }); setStatusMap(map); setSaved(false); }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${statusConfig[s].color}`}>{s}</button>
                ))}
              </div>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr><th className="p-4 font-medium">No</th><th className="p-4 font-medium">Nama Siswa</th><th className="p-4 font-medium">NIS</th><th className="p-4 font-medium">Status Kehadiran</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {siswaKelas.map((siswa, i) => {
                        const currentStatus = statusMap[siswa.id] || 'Hadir';
                        return (
                          <tr key={siswa.id} className={`text-slate-700 dark:text-slate-300 ${statusConfig[currentStatus].light}`}>
                            <td className="p-4">{i+1}</td>
                            <td className="p-4 font-medium">{siswa.nama}</td>
                            <td className="p-4 text-slate-500">{siswa.nis||'-'}</td>
                            <td className="p-4">
                              <div className="flex gap-2 flex-wrap">
                                {statusOptions.map(s => (
                                  <button key={s} onClick={() => setStatus(siswa.id, s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${currentStatus === s ? statusConfig[s].color + ' scale-105 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-400'}`}>
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
              <div className="flex justify-end">
                <Button icon={Save} onClick={handleSimpan} disabled={loading} variant="success" className="px-8 py-3">
                  {loading ? 'Menyimpan...' : `Simpan Absensi (${siswaKelas.length} siswa)`}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {historyMode && (
        <div className="space-y-4">
          {!selectedKelas ? (
            <Card className="p-12 text-center"><p className="text-slate-500">Pilih kelas untuk melihat riwayat</p></Card>
          ) : Object.keys(historyByTanggal).length === 0 ? (
            <Card className="p-12 text-center"><Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Belum ada riwayat absensi</p></Card>
          ) : (
            Object.entries(historyByTanggal).map(([tanggal, records]) => {
              const hadir = records.filter(r => r.status === 'Hadir').length;
              const total = records.length;
              return (
                <Card key={tanggal} className="p-5">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold dark:text-white">{tanggal}</span>
                      <span className="text-sm text-slate-500">{records[0]?.dicatatOleh && `oleh ${records[0].dicatatOleh}`}</span>
                    </div>
                    <div className="flex gap-2 text-sm flex-wrap">
                      {statusOptions.map(s => (<span key={s} className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[s].light}`}>{s}: {records.filter(r => r.status === s).length}</span>))}
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${total > 0 ? (hadir/total)*100 : 0}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{hadir}/{total} siswa hadir ({total > 0 ? Math.round((hadir/total)*100) : 0}%)</p>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// =============================================
// NILAI VIEW — Input nilai harian, UTS, UAS, UAM (kelas 4), download PDF/Excel
// Aturan:
//   - List mata pelajaran: hanya operator (admin) yang bisa tambah/hapus
//   - Input nilai: hanya wali kelas (guru) yang bisa input/simpan
//   - Download semua nilai: tersedia dalam 1 file Excel/PDF
// =============================================

const NilaiView = ({ siswas, kelass, appUser, userRole, gurus }) => {
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('Semester 1');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [mapelInput, setMapelInput] = useState('');
  const [mapelList, setMapelList] = useState([]);
  const [nilaiData, setNilaiData] = useState({}); // { siswaId: { nilaiHarian, uts, uas, uam } }
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nilaiDocs, setNilaiDocs] = useState([]);
  const [allNilaiDocs, setAllNilaiDocs] = useState([]); // semua nilai dari semua mapel untuk download
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Cek apakah guru ini adalah wali kelas dari kelas yang dipilih
  const guruKelas = kelass.find(k => k.waliKelasId === appUser?.id);
  const isWaliKelasFromSelected = userRole === 'guru' && guruKelas && guruKelas.namaKelas === selectedKelas;
  const canInputNilai = userRole === 'operator' || isWaliKelasFromSelected;
  const isKelas4 = selectedKelas && selectedKelas.toLowerCase().includes('4');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'mataPelajaran'), snap => {
      if (snap.exists()) setMapelList(snap.data().list || []);
    });
    return () => unsub();
  }, []);

  // Load semua nilai dari kelas yang dipilih (semua mapel) untuk fitur download semua
  useEffect(() => {
    if (!selectedKelas || !selectedSemester) return;
    const q = query(collection(db, 'nilai'), where('kelas', '==', selectedKelas), where('semester', '==', selectedSemester));
    const unsub = onSnapshot(q, snap => {
      setAllNilaiDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedKelas, selectedSemester]);

  const handleTambahMapel = async () => {
    if (userRole !== 'operator') return;
    const trimmed = mapelInput.trim();
    if (!trimmed || mapelList.includes(trimmed)) { setMapelInput(''); return; }
    const newList = [...mapelList, trimmed];
    await setDoc(doc(db, 'settings', 'mataPelajaran'), { list: newList });
    setMapelInput('');
  };

  const handleHapusMapel = async (mp) => {
    if (userRole !== 'operator') return;
    const newList = mapelList.filter(m => m !== mp);
    await setDoc(doc(db, 'settings', 'mataPelajaran'), { list: newList });
    if (selectedMapel === mp) { setSelectedMapel(''); setNilaiData({}); setSaved(false); }
  };

  useEffect(() => {
    if (!selectedKelas || !selectedSemester || !selectedMapel) return;
    const q = query(collection(db, 'nilai'), where('kelas', '==', selectedKelas), where('semester', '==', selectedSemester), where('mataPelajaran', '==', selectedMapel));
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNilaiDocs(docs);
      const map = {};
      docs.forEach(n => { map[n.siswaId] = { nilaiHarian: n.nilaiHarian||'', uts: n.uts||'', uas: n.uas||'', uam: n.uam||'' }; });
      setNilaiData(map);
      setSaved(docs.length > 0);
    });
    return () => unsub();
  }, [selectedKelas, selectedSemester, selectedMapel]);

  const siswaKelas = siswas.filter(s => s.kelas === selectedKelas);

  const updateNilai = (siswaId, field, value) => {
    if (!canInputNilai) return;
    setNilaiData(prev => ({ ...prev, [siswaId]: { ...prev[siswaId], [field]: value } }));
    setSaved(false);
  };

  const handleSimpan = async () => {
    if (!canInputNilai) { alert('Hanya wali kelas yang dapat menyimpan nilai.'); return; }
    if (!selectedKelas || !selectedMapel || siswaKelas.length === 0) return;
    setLoading(true);
    try {
      for (const siswa of siswaKelas) {
        const n = nilaiData[siswa.id] || {};
        const existing = nilaiDocs.find(d => d.siswaId === siswa.id);
        const data = {
          siswaId: siswa.id, namaSiswa: siswa.nama, kelas: selectedKelas, semester: selectedSemester,
          mataPelajaran: selectedMapel,
          nilaiHarian: n.nilaiHarian||'', uts: n.uts||'', uas: n.uas||'', uam: isKelas4 ? (n.uam||'') : '',
          dicatatOleh: appUser?.name||'-', updatedAt: new Date().toISOString()
        };
        if (existing) await updateDoc(doc(db, 'nilai', existing.id), data);
        else await addDoc(collection(db, 'nilai'), { ...data, createdAt: serverTimestamp() });
      }
      setSaved(true);
    } catch (err) { alert('Gagal menyimpan: ' + err.message); } finally { setLoading(false); }
  };

  const hitungRataRata = (siswaId, nd, isK4) => {
    const n = nd[siswaId] || {};
    const nh = parseFloat(n.nilaiHarian)||0, uts = parseFloat(n.uts)||0, uas = parseFloat(n.uas)||0, uam = parseFloat(n.uam)||0;
    const count = isK4 ? 4 : 3;
    const total = isK4 ? (nh+uts+uas+uam) : (nh+uts+uas);
    if (nh===0 && uts===0 && uas===0) return '-';
    return (total/count).toFixed(1);
  };

  const getRataWarna = (avg) => {
    const v = parseFloat(avg);
    if (isNaN(v)) return 'text-slate-400';
    if (v >= 85) return 'text-emerald-600 font-bold';
    if (v >= 70) return 'text-blue-600 font-bold';
    if (v >= 60) return 'text-amber-600 font-bold';
    return 'text-red-600 font-bold';
  };

  // Download nilai 1 mapel (CSV)
  const handleDownloadExcel = () => {
    const data = siswaKelas.map((s, i) => {
      const n = nilaiData[s.id] || {};
      const avg = hitungRataRata(s.id, nilaiData, isKelas4);
      const row = { 'No': i+1, 'Nama Siswa': s.nama, 'NIS': s.nis||'', 'Mata Pelajaran': selectedMapel, 'Nilai Harian': n.nilaiHarian||'', 'UTS': n.uts||'', 'UAS': n.uas||'' };
      if (isKelas4) row['UAM'] = n.uam||'';
      row['Rata-rata'] = avg;
      return row;
    });
    exportToCSV(data, `Nilai_${selectedKelas}_${selectedMapel}_${selectedSemester}`);
  };

  // Download SEMUA nilai semua mapel dalam 1 file CSV
  const handleDownloadSemuaNilaiExcel = () => {
    if (!selectedKelas || siswaKelas.length === 0 || mapelList.length === 0) return;
    setDownloadingAll(true);
    try {
      const isK4 = isKelas4;
      const rows = siswaKelas.map((s, i) => {
        const row = { 'No': i+1, 'Nama Siswa': s.nama, 'NIS': s.nis||'' };
        mapelList.forEach(mp => {
          const nilaiDoc = allNilaiDocs.find(n => n.siswaId === s.id && n.mataPelajaran === mp);
          const nd = nilaiDoc ? { [s.id]: { nilaiHarian: nilaiDoc.nilaiHarian||'', uts: nilaiDoc.uts||'', uas: nilaiDoc.uas||'', uam: nilaiDoc.uam||'' } } : {};
          row[`${mp} - NH`] = nilaiDoc?.nilaiHarian || '-';
          row[`${mp} - UTS`] = nilaiDoc?.uts || '-';
          row[`${mp} - UAS`] = nilaiDoc?.uas || '-';
          if (isK4) row[`${mp} - UAM`] = nilaiDoc?.uam || '-';
          row[`${mp} - Rata`] = hitungRataRata(s.id, nd, isK4);
        });
        return row;
      });
      exportToCSV(rows, `Semua_Nilai_${selectedKelas}_${selectedSemester}`);
    } finally { setDownloadingAll(false); }
  };

  // Download SEMUA nilai semua mapel dalam 1 file PDF/HTML
  const handleDownloadSemuaNilaiPDF = () => {
    if (!selectedKelas || siswaKelas.length === 0 || mapelList.length === 0) return;
    const isK4 = isKelas4;
    const title = `Rekap Semua Nilai Kelas ${selectedKelas} - ${selectedSemester}`;

    const headerCols = mapelList.map(mp => {
      const cols = [`${mp}<br/>NH`, `${mp}<br/>UTS`, `${mp}<br/>UAS`];
      if (isK4) cols.push(`${mp}<br/>UAM`);
      cols.push(`${mp}<br/>Rata`);
      return cols;
    }).flat();

    const bodyRows = siswaKelas.map((s, i) => {
      const cells = mapelList.map(mp => {
        const nilaiDoc = allNilaiDocs.find(n => n.siswaId === s.id && n.mataPelajaran === mp);
        const nd = nilaiDoc ? { [s.id]: { nilaiHarian: nilaiDoc.nilaiHarian||'', uts: nilaiDoc.uts||'', uas: nilaiDoc.uas||'', uam: nilaiDoc.uam||'' } } : {};
        const cols = [nilaiDoc?.nilaiHarian||'-', nilaiDoc?.uts||'-', nilaiDoc?.uas||'-'];
        if (isK4) cols.push(nilaiDoc?.uam||'-');
        cols.push(`<b>${hitungRataRata(s.id, nd, isK4)}</b>`);
        return cols;
      }).flat();
      return `<tr><td>${i+1}</td><td style="text-align:left">${s.nama}</td><td>${s.nis||''}</td>${cells.map(c=>`<td>${c}</td>`).join('')}</tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;font-size:9px;margin:15px}h2,h3{text-align:center;margin:4px}
    table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ccc;padding:3px 5px;text-align:center}
    th{background:#1d4ed8;color:#fff;font-size:8px}tr:nth-child(even){background:#eff6ff}
    @media print{button{display:none}}</style></head>
    <body><h2>MDTA Al-Furqan</h2><h3>${title}</h3>
    <p style="text-align:center">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
    <button onclick="window.print()" style="margin:10px 0;padding:6px 16px;background:#1d4ed8;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨️ Cetak / Simpan PDF</button>
    <table><thead>
      <tr><th rowspan="2">No</th><th rowspan="2">Nama Siswa</th><th rowspan="2">NIS</th>
      ${mapelList.map(mp => `<th colspan="${isK4?5:4}">${mp}</th>`).join('')}</tr>
      <tr>${mapelList.map(mp => `<th>NH</th><th>UTS</th><th>UAS</th>${isK4?'<th>UAM</th>':''}<th>Rata</th>`).join('')}</tr>
    </thead><tbody>${bodyRows}</tbody></table></body></html>`;
    exportToHTML(html, title);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Input Nilai Siswa</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Nilai harian, UTS, UAS{isKelas4 ? ', UAM (Kelas 4)' : ''}{selectedMapel ? ` · ${selectedMapel}` : ''}</p>
        </div>
        {selectedKelas && siswaKelas.length > 0 && mapelList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 self-center font-medium">Download Semua Nilai:</div>
            <Button variant="success" icon={Download} onClick={handleDownloadSemuaNilaiPDF} disabled={downloadingAll}>PDF</Button>
            <Button variant="primary" icon={Download} onClick={handleDownloadSemuaNilaiExcel} disabled={downloadingAll}>Excel/CSV</Button>
            {selectedMapel && (
              <>
                <div className="text-xs text-slate-500 dark:text-slate-400 self-center font-medium ml-2">Per Mapel:</div>
                <Button variant="outline" icon={Download} onClick={() => generateNilaiPDF(siswaKelas, nilaiData, selectedKelas, selectedSemester, selectedMapel)}>PDF</Button>
                <Button variant="outline" icon={Download} onClick={handleDownloadExcel}>Excel/CSV</Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* INFO AKSES */}
      {userRole === 'guru' && !isWaliKelasFromSelected && selectedKelas && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Anda hanya bisa menginput nilai untuk kelas yang Anda ampu sebagai <strong>wali kelas</strong>. Kelas wali Anda: <strong>{guruKelas?.namaKelas || 'Belum ditetapkan'}</strong>.</span>
        </div>
      )}

      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kelas</label>
            <select value={selectedKelas} onChange={e => { setSelectedKelas(e.target.value); setNilaiData({}); setSaved(false); setSelectedMapel(''); }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih Kelas --</option>
              {kelass.map(k => <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mata Pelajaran</label>
              {userRole !== 'operator' && (
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">Hanya Admin yang bisa kelola daftar mapel</span>
              )}
            </div>
            {/* Input tambah mapel: hanya operator */}
            {userRole === 'operator' && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={mapelInput}
                  onChange={e => setMapelInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleTambahMapel(); } }}
                  placeholder="Ketik nama mata pelajaran, tekan Enter..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={handleTambahMapel}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1 flex-shrink-0">
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>
            )}
            {mapelList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">{userRole === 'operator' ? 'Belum ada mata pelajaran. Ketik nama lalu klik Tambah.' : 'Belum ada mata pelajaran. Minta admin untuk menambahkan.'}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mapelList.map(mp => (
                  <button key={mp} type="button"
                    onClick={() => { setSelectedMapel(mp === selectedMapel ? '' : mp); setNilaiData({}); setSaved(false); }}
                    className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedMapel === mp ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400'}`}>
                    {mp}
                    {/* Tombol hapus mapel: hanya operator */}
                    {userRole === 'operator' && (
                      <span onClick={e => { e.stopPropagation(); handleHapusMapel(mp); }}
                        className={`ml-0.5 rounded-full hover:bg-red-500 hover:text-white p-0.5 transition-colors ${selectedMapel === mp ? 'text-blue-200 hover:text-white' : 'text-slate-400'}`}>
                        <X className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {selectedMapel && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">✓ Dipilih: {selectedMapel}</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Semester</label>
          <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500">
            <option>Semester 1</option>
            <option>Semester 2</option>
          </select>
        </div>
        {isKelas4 && (
          <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center gap-2 text-purple-700 dark:text-purple-300 text-sm">
            <Award className="w-4 h-4 flex-shrink-0" />
            <span>Kelas 4 terdeteksi — kolom <strong>UAM (Ujian Akhir Madrasah)</strong> aktif.</span>
          </div>
        )}
      </Card>

      {(!selectedKelas || !selectedMapel) ? (
        <Card className="p-12 text-center"><BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Pilih kelas dan mata pelajaran untuk mulai input nilai</p></Card>
      ) : siswaKelas.length === 0 ? (
        <Card className="p-12 text-center"><Users className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Belum ada siswa di kelas {selectedKelas}</p></Card>
      ) : (
        <>
          {saved && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm">
              <Check className="w-4 h-4" /> Nilai tersimpan. Klik Simpan untuk memperbarui.
            </div>
          )}
          {/* Peringatan jika guru bukan wali kelas: mode view-only */}
          {userRole === 'guru' && !isWaliKelasFromSelected && (
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
              <Eye className="w-4 h-4 flex-shrink-0" />
              <span>Mode lihat saja — hanya wali kelas kelas ini yang dapat menginput nilai.</span>
            </div>
          )}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 font-medium">No</th>
                    <th className="p-3 font-medium">Nama Siswa</th>
                    <th className="p-3 font-medium">NIS</th>
                    <th className="p-3 font-medium">Nilai Harian</th>
                    <th className="p-3 font-medium">UTS</th>
                    <th className="p-3 font-medium">UAS</th>
                    {isKelas4 && <th className="p-3 font-medium text-purple-600">UAM</th>}
                    <th className="p-3 font-medium">Rata-rata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {siswaKelas.map((siswa, i) => {
                    const n = nilaiData[siswa.id] || {};
                    const avg = hitungRataRata(siswa.id, nilaiData, isKelas4);
                    return (
                      <tr key={siswa.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                        <td className="p-3">{i+1}</td>
                        <td className="p-3 font-medium">{siswa.nama}</td>
                        <td className="p-3 text-slate-500">{siswa.nis||'-'}</td>
                        {['nilaiHarian', 'uts', 'uas'].map(field => (
                          <td key={field} className="p-3">
                            {canInputNilai ? (
                              <input type="number" min="0" max="100" value={n[field]||''} onChange={e => updateNilai(siswa.id, field, e.target.value)} placeholder="-"
                                className="w-20 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500 text-center" />
                            ) : (
                              <span className="text-slate-700 dark:text-slate-300">{n[field]||'-'}</span>
                            )}
                          </td>
                        ))}
                        {isKelas4 && (
                          <td className="p-3">
                            {canInputNilai ? (
                              <input type="number" min="0" max="100" value={n.uam||''} onChange={e => updateNilai(siswa.id, 'uam', e.target.value)} placeholder="-"
                                className="w-20 px-2 py-1.5 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-purple-500 text-center" />
                            ) : (
                              <span>{n.uam||'-'}</span>
                            )}
                          </td>
                        )}
                        <td className="p-3"><span className={`text-base ${getRataWarna(avg)}`}>{avg}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          {canInputNilai && (
            <div className="flex justify-end">
              <Button icon={Save} onClick={handleSimpan} disabled={loading} variant="success" className="px-8 py-3">
                {loading ? 'Menyimpan...' : `Simpan Nilai (${siswaKelas.length} siswa)`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// =============================================
// JADWAL PELAJARAN VIEW
// =============================================
const JadwalView = ({ kelass, gurus, appUser, userRole }) => {
  const [selectedKelas, setSelectedKelas] = useState('');
  const [jadwalData, setJadwalData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ hari: 'Senin', jamMulai: '', jamSelesai: '', mataPelajaran: '', guruId: '', keterangan: '' });
  const [loading, setLoading] = useState(false);

  const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  // Hanya operator (admin) yang bisa mengelola jadwal; guru hanya bisa melihat
  const canManageJadwal = userRole === 'operator';

  useEffect(() => {
    if (!selectedKelas) { setJadwalData([]); return; }
    // Query tanpa orderBy untuk menghindari kebutuhan composite index Firestore
    // Sorting dilakukan di sisi client
    const q = query(collection(db, 'jadwal'), where('kelas', '==', selectedKelas));
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort di client: urutkan berdasarkan index hari lalu jam mulai
      docs.sort((a, b) => {
        const hiA = hariList.indexOf(a.hari);
        const hiB = hariList.indexOf(b.hari);
        if (hiA !== hiB) return hiA - hiB;
        return (a.jamMulai || '').localeCompare(b.jamMulai || '');
      });
      setJadwalData(docs);
    });
    return () => unsub();
  }, [selectedKelas]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const data = { ...formData, kelas: selectedKelas, hariIndex: hariList.indexOf(formData.hari), updatedAt: new Date().toISOString() };
      if (editId) await updateDoc(doc(db, 'jadwal', editId), data);
      else await addDoc(collection(db, 'jadwal'), { ...data, createdAt: serverTimestamp() });
      setIsModalOpen(false); setEditId(null);
      setFormData({ hari: 'Senin', jamMulai: '', jamSelesai: '', mataPelajaran: '', guruId: '', keterangan: '' });
    } catch (err) { alert('Gagal menyimpan: ' + err.message); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => { if (window.confirm('Hapus jadwal ini?')) await deleteDoc(doc(db, 'jadwal', id)); };

  const openEdit = (j) => {
    setFormData({ hari: j.hari, jamMulai: j.jamMulai, jamSelesai: j.jamSelesai, mataPelajaran: j.mataPelajaran, guruId: j.guruId||'', keterangan: j.keterangan||'' });
    setEditId(j.id); setIsModalOpen(true);
  };

  const getGuruName = (id) => gurus.find(g => g.id === id)?.nama || '-';

  // Group by hari
  const jadwalByHari = {};
  hariList.forEach(h => { jadwalByHari[h] = jadwalData.filter(j => j.hari === h); });

  const hariColors = { 'Senin': 'bg-blue-500', 'Selasa': 'bg-emerald-500', 'Rabu': 'bg-amber-500', 'Kamis': 'bg-purple-500', 'Jumat': 'bg-red-500', 'Sabtu': 'bg-slate-500' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Jadwal Pelajaran</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {canManageJadwal ? 'Atur jadwal mata pelajaran per kelas' : 'Lihat jadwal mata pelajaran Anda'}
          </p>
        </div>
        {selectedKelas && canManageJadwal && (
          <Button icon={Plus} onClick={() => { setEditId(null); setFormData({ hari: 'Senin', jamMulai: '', jamSelesai: '', mataPelajaran: '', guruId: '', keterangan: '' }); setIsModalOpen(true); }}>
            Tambah Jadwal
          </Button>
        )}
      </div>

      {/* Info banner untuk guru */}
      {userRole === 'guru' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
          <Eye className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">Mode <strong>Lihat Saja</strong> — Jadwal hanya dapat diubah oleh Admin.</p>
        </div>
      )}

      <Card className="p-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Kelas</label>
          <select value={selectedKelas} onChange={e => { setSelectedKelas(e.target.value); setJadwalData([]); }}
            className="w-full sm:w-72 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500">
            <option value="">-- Pilih Kelas --</option>
            {kelass.map(k => <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>)}
          </select>
        </div>
      </Card>

      {!selectedKelas ? (
        <Card className="p-12 text-center"><Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Pilih kelas untuk melihat jadwal pelajaran</p></Card>
      ) : (
        <div className="space-y-4">
          {hariList.map(hari => (
            <Card key={hari} className="overflow-hidden">
              <div className={`px-5 py-3 flex items-center gap-3 ${hariColors[hari]} text-white`}>
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">{hari}</span>
                <span className="text-sm opacity-80">({jadwalByHari[hari].length} pelajaran)</span>
              </div>
              {jadwalByHari[hari].length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">Belum ada jadwal hari ini</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {jadwalByHari[hari].map(j => (
                    <div key={j.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500 dark:text-slate-400 w-28 flex-shrink-0 font-mono">
                          <Clock className="w-3 h-3 inline mr-1" />{j.jamMulai} – {j.jamSelesai}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{j.mataPelajaran}</p>
                          <p className="text-xs text-slate-500">{getGuruName(j.guruId)}{j.keterangan ? ` · ${j.keterangan}` : ''}</p>
                        </div>
                      </div>
                      {canManageJadwal && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => openEdit(j)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Edit"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(j.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && canManageJadwal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white">{editId ? 'Edit Jadwal' : 'Tambah Jadwal'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditId(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hari</label>
                <select value={formData.hari} onChange={e => setFormData({...formData, hari: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500">
                  {hariList.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Jam Mulai" type="time" value={formData.jamMulai} onChange={e => setFormData({...formData, jamMulai: e.target.value})} required />
                <Input label="Jam Selesai" type="time" value={formData.jamSelesai} onChange={e => setFormData({...formData, jamSelesai: e.target.value})} required />
              </div>
              <Input label="Mata Pelajaran *" value={formData.mataPelajaran} onChange={e => setFormData({...formData, mataPelajaran: e.target.value})} required />
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Guru Pengajar</label>
                <select value={formData.guruId} onChange={e => setFormData({...formData, guruId: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Guru --</option>
                  {gurus.map(g => <option key={g.id} value={g.id}>{g.nama} ({g.mapel})</option>)}
                </select>
              </div>
              <Input label="Keterangan (opsional)" value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} placeholder="Contoh: Lab Komputer" />
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="secondary" type="button" onClick={() => { setIsModalOpen(false); setEditId(null); }}>Batal</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Jadwal'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// =============================================
// CHAT VIEW
// =============================================
const ChatView = ({ appUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  useEffect(() => {
    const q = query(collection(db, 'chats'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, snap => { setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
    return () => unsub();
  }, []);
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !appUser) return;
    await addDoc(collection(db, 'chats'), { text: newMessage, senderId: appUser.id, senderName: appUser.name, role: appUser.role, timestamp: serverTimestamp() });
    setNewMessage('');
  };
  return (
    <Card className="flex flex-col h-[600px]">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-blue-500" /> Diskusi Internal Guru & Operator</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100 dark:bg-slate-900/50">
        {messages.map(msg => {
          const isMe = msg.senderId === appUser.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-500 mb-1">{isMe ? 'Anda' : msg.senderName} ({msg.role})</span>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-bl-none shadow-sm'}`}>{msg.text}</div>
            </div>
          );
        })}
      </div>
      <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2">
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Ketik pesan..." className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-full dark:text-white" />
        <Button type="submit" className="rounded-full px-6">Kirim</Button>
      </form>
    </Card>
  );
};

// =============================================
// PROFIL SEKOLAH VIEW
// =============================================
const ProfilSekolahView = ({ profilSekolah }) => {
  const defaultProfil = { namaSekolah: '', tagline: '', deskripsiHero: '', sejarah: '', visi: '', misi: '', alamat: '', telepon: '', email: '', heroImageUrl: '', profilImageUrl: '', logoUrl: '' };
  const [formData, setFormData] = useState({ ...defaultProfil, ...profilSekolah });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  useEffect(() => { if (profilSekolah) setFormData({ ...defaultProfil, ...profilSekolah }); }, [profilSekolah]);
  const handleSave = async (e) => {
    e.preventDefault(); setLoading(true); setSuccessMsg('');
    try {
      await setDoc(doc(db, 'website', 'profil'), { ...formData, updatedAt: new Date().toISOString() });
      setSuccessMsg('Profil sekolah berhasil disimpan!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { alert('Gagal menyimpan: ' + err.message); } finally { setLoading(false); }
  };
  const f = (field) => ({ value: formData[field]||'', onChange: e => setFormData({ ...formData, [field]: e.target.value }) });
  return (
    <div className="space-y-6">
      {successMsg && <div className="p-4 bg-emerald-100 text-emerald-700 rounded-xl font-medium">{successMsg}</div>}
      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center"><School className="w-5 h-5 mr-2 text-blue-600" /> Identitas Sekolah</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input label="Nama Sekolah" {...f('namaSekolah')} /><Input label="Tagline / Slogan Hero" {...f('tagline')} />
            <Input label="Email Sekolah" type="email" {...f('email')} /><Input label="Nomor Telepon" {...f('telepon')} />
          </div>
          <Textarea label="Alamat Lengkap" {...f('alamat')} rows={2} />
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-blue-600" /> Konten Halaman Beranda</h3>
          <Textarea label="Deskripsi Hero" {...f('deskripsiHero')} rows={3} />
          <Textarea label="Sejarah Singkat Sekolah" {...f('sejarah')} rows={4} />
          <Textarea label="Visi Sekolah" {...f('visi')} rows={3} />
          <Textarea label="Misi Sekolah" {...f('misi')} rows={3} />
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center"><ImageIcon className="w-5 h-5 mr-2 text-blue-600" /> Gambar & Logo Website</h3>
          <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> Gunakan link URL gambar atau upload file. Semua gambar akan ditampilkan dengan proporsi yang benar di website.
          </div>
          <FotoUpload label="Logo Sekolah (tampil di navbar & header)" value={formData.logoUrl} onChange={val => setFormData({...formData, logoUrl: val})} contain={true} size={formData.logoSize||100} onSizeChange={val => setFormData({...formData, logoSize: val})} />
          <FotoUpload label="Foto Background Beranda (Hero)" value={formData.heroImageUrl} onChange={val => setFormData({...formData, heroImageUrl: val})} size={formData.heroSize||100} onSizeChange={val => setFormData({...formData, heroSize: val})} />
          <FotoUpload label="Foto Profil Sekolah (di halaman profil)" value={formData.profilImageUrl} onChange={val => setFormData({...formData, profilImageUrl: val})} size={formData.profilSize||100} onSizeChange={val => setFormData({...formData, profilSize: val})} />
        </Card>
        <div className="flex justify-end">
          <Button type="submit" icon={Save} disabled={loading} className="px-8 py-3">{loading ? 'Menyimpan...' : 'Simpan Profil Sekolah'}</Button>
        </div>
      </form>
    </div>
  );
};

// =============================================
// PENGUMUMAN ADMIN VIEW
// =============================================
const PengumumanAdminView = ({ pengumumans }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ judul: '', isi: '', tanggal: '', tipe: 'Umum' });
  const [loading, setLoading] = useState(false);
  const tipeOptions = ['Umum', 'Akademik', 'PPDB', 'Kegiatan', 'Penting'];
  const tipeColors = { 'Akademik': 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30', 'PPDB': 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30', 'Umum': 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30', 'Kegiatan': 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30', 'Penting': 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30' };
  const openAdd = () => { setEditId(null); setFormData({ judul: '', isi: '', tanggal: new Date().toISOString().split('T')[0], tipe: 'Umum' }); setIsModalOpen(true); };
  const openEdit = (p) => { setEditId(p.id); setFormData({ judul: p.judul, isi: p.isi||'', tanggal: p.tanggal, tipe: p.tipe }); setIsModalOpen(true); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const data = { ...formData, updatedAt: new Date().toISOString() };
      if (editId) await updateDoc(doc(db, 'pengumuman', editId), data);
      else await addDoc(collection(db, 'pengumuman'), { ...data, createdAt: serverTimestamp() });
      setIsModalOpen(false);
    } catch (err) { alert('Gagal: ' + err.message); } finally { setLoading(false); }
  };
  const handleDelete = async (id) => { if (window.confirm('Hapus pengumuman ini?')) await deleteDoc(doc(db, 'pengumuman', id)); };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manajemen Pengumuman</h2>
        <Button icon={Plus} onClick={openAdd}>Tambah Pengumuman</Button>
      </div>
      <div className="space-y-4">
        {pengumumans.length === 0 && (<Card className="p-12 text-center"><Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Belum ada pengumuman.</p></Card>)}
        {pengumumans.map(p => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${tipeColors[p.tipe]||tipeColors['Umum']}`}>{p.tipe}</span>
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
              <Input label="Judul Pengumuman" value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} required />
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                <select value={formData.tipe} onChange={e => setFormData({...formData, tipe: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500">
                  {tipeOptions.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <Input label="Tanggal" type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} required />
              <Textarea label="Isi Pengumuman" value={formData.isi} onChange={e => setFormData({...formData, isi: e.target.value})} rows={5} />
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

// =============================================
// GALERI ADMIN VIEW — upload file atau URL
// =============================================
const GaleriAdminView = ({ galeris }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ url: '', keterangan: '', featured: false });
  const [galFotoSize, setGalFotoSize] = useState(100);
  const [loading, setLoading] = useState(false);
  const openAdd = () => { setEditId(null); setFormData({ url: '', keterangan: '', featured: false }); setIsModalOpen(true); };
  const openEdit = (g) => { setEditId(g.id); setFormData({ url: g.url, keterangan: g.keterangan||'', featured: g.featured||false }); setIsModalOpen(true); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const data = { ...formData, updatedAt: new Date().toISOString() };
      if (editId) await updateDoc(doc(db, 'galeri', editId), data);
      else await addDoc(collection(db, 'galeri'), { ...data, createdAt: serverTimestamp() });
      setIsModalOpen(false);
    } catch (err) { alert('Gagal: ' + err.message); } finally { setLoading(false); }
  };
  const handleDelete = async (id) => { if (window.confirm('Hapus foto ini?')) await deleteDoc(doc(db, 'galeri', id)); };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manajemen Galeri</h2>
        <Button icon={Plus} onClick={openAdd}>Tambah Foto</Button>
      </div>
      {galeris.length === 0 && (<Card className="p-12 text-center"><ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Belum ada foto.</p></Card>)}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {galeris.map(g => (
          <div key={g.id} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
            <div className="aspect-square overflow-hidden">
              <img src={g.url} alt={g.keterangan} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" onError={e => { e.target.style.display='none'; }} />
            </div>
            {g.featured && <span className="absolute top-2 left-2 text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full">Featured</span>}
            <div className="p-2 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
              {g.keterangan && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1.5">{g.keterangan}</p>}
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(g)} className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors">
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleDelete(g.id)} className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors">
                  <Trash2 className="w-3 h-3" /> Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-5 dark:text-white">{editId ? 'Edit Foto' : 'Tambah Foto'}</h2>
            <form onSubmit={handleSubmit}>
              <FotoUpload label="Foto Galeri *" value={formData.url} onChange={val => setFormData({...formData, url: val})} size={galFotoSize} onSizeChange={setGalFotoSize} />
              <Input label="Keterangan Foto" value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} />
              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <input type="checkbox" id="featured" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} className="w-4 h-4 rounded" />
                <label htmlFor="featured" className="text-sm font-medium text-slate-700 dark:text-slate-300">Tampilkan sebagai foto utama (Featured)</label>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={loading || !formData.url}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// =============================================
// BERITA ADMIN VIEW — upload foto file/URL
// =============================================
const BeritaAdminView = ({ beritas }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ judul: '', isi: '', tanggal: '', imageUrl: '' });
  const [beritaFotoSize, setBeritaFotoSize] = useState(100);
  const [loading, setLoading] = useState(false);
  const openAdd = () => { setEditId(null); setFormData({ judul: '', isi: '', tanggal: new Date().toISOString().split('T')[0], imageUrl: '' }); setIsModalOpen(true); };
  const openEdit = (b) => { setEditId(b.id); setFormData({ judul: b.judul, isi: b.isi, tanggal: b.tanggal, imageUrl: b.imageUrl||'' }); setIsModalOpen(true); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const data = { ...formData, updatedAt: new Date().toISOString() };
      if (editId) await updateDoc(doc(db, 'berita', editId), data);
      else await addDoc(collection(db, 'berita'), { ...data, createdAt: serverTimestamp() });
      setIsModalOpen(false);
    } catch (err) { alert('Gagal: ' + err.message); } finally { setLoading(false); }
  };
  const handleDelete = async (id) => { if (window.confirm('Hapus berita ini?')) await deleteDoc(doc(db, 'berita', id)); };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manajemen Berita</h2>
        <Button icon={Plus} onClick={openAdd}>Tulis Berita</Button>
      </div>
      <div className="space-y-4">
        {beritas.length === 0 && (<Card className="p-12 text-center"><Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Belum ada berita.</p></Card>)}
        {beritas.map(b => (
          <Card key={b.id} className="p-5">
            <div className="flex items-start gap-4">
              {b.imageUrl && (<img src={b.imageUrl} alt={b.judul} className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border" onError={e => e.target.style.display='none'} />)}
              <div className="flex-1 min-w-0">
                <span className="text-xs text-slate-500"><Calendar className="w-3 h-3 inline mr-1" />{b.tanggal}</span>
                <h3 className="font-semibold text-slate-800 dark:text-white">{b.judul}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{b.isi}</p>
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
              <Input label="Judul Berita" value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} required />
              <Input label="Tanggal Publikasi" type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} required />
              <FotoUpload label="Foto Berita" value={formData.imageUrl} onChange={val => setFormData({...formData, imageUrl: val})} size={beritaFotoSize} onSizeChange={setBeritaFotoSize} />
              <Textarea label="Isi Berita" value={formData.isi} onChange={e => setFormData({...formData, isi: e.target.value})} required rows={8} />
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
  const [kelass, setKelass] = useState([]);
  const [absensiData, setAbsensiData] = useState([]);

  const [profilSekolah, setProfilSekolah] = useState(null);
  const [pengumumans, setPengumumans] = useState([]);
  const [galeris, setGaleris] = useState([]);
  const [beritas, setBeritas] = useState([]);

  useEffect(() => {
    const unsubProfil = onSnapshot(doc(db, 'website', 'profil'), snap => { if (snap.exists()) setProfilSekolah(snap.data()); });
    const unsubPengumuman = onSnapshot(query(collection(db, 'pengumuman'), orderBy('createdAt', 'desc')), snap => setPengumumans(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubGaleri = onSnapshot(query(collection(db, 'galeri'), orderBy('createdAt', 'desc')), snap => setGaleris(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBerita = onSnapshot(query(collection(db, 'berita'), orderBy('createdAt', 'desc')), snap => setBeritas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubProfil(); unsubPengumuman(); unsubGaleri(); unsubBerita(); };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) setAppUser({ id: user.uid, ...snap.data() });
      } else { setAppUser(null); }
      setLoadingBaseAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!appUser) return;
    const guruUnsub = onSnapshot(collection(db, 'guru'), snap => setGurus(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const siswaUnsub = onSnapshot(collection(db, 'siswa'), snap => setSiswas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const kelasUnsub = onSnapshot(collection(db, 'kelas'), snap => setKelass(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const absensiUnsub = onSnapshot(query(collection(db, 'absensi'), orderBy('tanggal', 'desc')), snap => setAbsensiData(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { guruUnsub(); siswaUnsub(); kelasUnsub(); absensiUnsub(); };
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
        const newAdminProfile = { role: 'operator', name: 'Administrator', email, createdAt: new Date().toISOString() };
        await setDoc(userDocRef, newAdminProfile);
        setAppUser({ id: user.uid, ...newAdminProfile });
      }
    } catch (error) { setLoginError('Login gagal: Periksa kembali Email dan Password Anda.'); }
  };

  const handleLogout = async () => { await signOut(auth); setAppUser(null); setActiveTab('dashboard'); };

  // CRUD Guru
  const addGuru = async (data) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      const uid = userCredential.user.uid;
      await signOut(secondaryAuth);
      await setDoc(doc(db, 'users', uid), { role: 'guru', name: data.nama, email: data.email, createdAt: new Date().toISOString() });
      const { password, ...guruData } = data;
      await setDoc(doc(db, 'guru', uid), { ...guruData, id: uid, createdAt: new Date().toISOString() });
    } catch (error) { throw new Error("Gagal membuat akun Guru: " + error.message); }
  };
  const editGuru = async (id, data) => {
    const { password, email, ...updateData } = data;
    await updateDoc(doc(db, 'guru', id), updateData);
    await updateDoc(doc(db, 'users', id), { name: data.nama });
  };
  const deleteGuru = async (id) => { await deleteDoc(doc(db, 'guru', id)); await deleteDoc(doc(db, 'users', id)); };

  // CRUD Siswa
  const addSiswa = async (data) => await addDoc(collection(db, 'siswa'), data);
  const editSiswa = async (id, data) => await updateDoc(doc(db, 'siswa', id), data);
  const deleteSiswa = async (id) => await deleteDoc(doc(db, 'siswa', id));

  // CRUD Kelas
  const addKelas = async (data) => await addDoc(collection(db, 'kelas'), { ...data, createdAt: serverTimestamp() });
  const editKelas = async (id, data) => await updateDoc(doc(db, 'kelas', id), data);
  const deleteKelas = async (id) => await deleteDoc(doc(db, 'kelas', id));

  if (loadingBaseAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white">Memuat Sistem...</div>;
  }

  if (!appUser) {
    if (showLogin) return <LoginView onLogin={handleLogin} errorMsg={loginError} onBack={() => setShowLogin(false)} />;
    return <LandingView onLoginClick={() => setShowLogin(true)} profilSekolah={profilSekolah} pengumumans={pengumumans} galeris={galeris} beritas={beritas} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['operator', 'guru'] },
    { id: 'guru', label: 'Data Guru', icon: Users, roles: ['operator'] },
    { id: 'siswa', label: 'Data Siswa', icon: GraduationCap, roles: ['operator', 'guru'] },
    { id: 'kelas', label: 'Data Kelas', icon: BookOpen, roles: ['operator', 'guru'] },
    { id: 'absensi', label: 'Absensi Murid', icon: ClipboardList, roles: ['operator', 'guru'] },
    { id: 'nilai', label: 'Input Nilai', icon: Award, roles: ['operator', 'guru'] },
    { id: 'jadwal', label: 'Jadwal Pelajaran', icon: Calendar, roles: ['operator', 'guru'] },
    { id: 'chat', label: 'Chat Internal', icon: MessageSquare, roles: ['operator', 'guru'] },
    { id: 'profil-sekolah', label: 'Profil Sekolah', icon: School, roles: ['operator'], group: 'Website' },
    { id: 'pengumuman-admin', label: 'Pengumuman', icon: Megaphone, roles: ['operator'], group: 'Website' },
    { id: 'galeri-admin', label: 'Galeri', icon: ImageIcon, roles: ['operator'], group: 'Website' },
    { id: 'berita-admin', label: 'Berita', icon: Newspaper, roles: ['operator'], group: 'Website' },
  ];

  const allowedMenus = appUser?.role ? menuItems.filter(m => m.roles.includes(appUser.role)) : [];
  const mainMenus = allowedMenus.filter(m => !m.group);
  const websiteMenus = allowedMenus.filter(m => m.group === 'Website');

  const stats = { siswaCount: siswas.length, guruCount: gurus.length, kelasCount: kelass.length };

  const headerLabels = {
    'dashboard': 'Dashboard', 'guru': 'Data Guru', 'siswa': 'Data Siswa',
    'kelas': 'Manajemen Kelas', 'absensi': 'Absensi Murid', 'nilai': 'Input Nilai Siswa',
    'jadwal': 'Jadwal Pelajaran', 'chat': 'Chat Internal',
    'profil-sekolah': 'Profil Sekolah', 'pengumuman-admin': 'Pengumuman',
    'galeri-admin': 'Galeri', 'berita-admin': 'Berita',
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center text-white">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg"><GraduationCap className="w-5 h-5" /></div>
            <span className="font-bold text-lg tracking-tight">MDTA Al-Furqan</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {mainMenus.map(menu => (
            <button key={menu.id} onClick={() => { setActiveTab(menu.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === menu.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <menu.icon className={`w-5 h-5 mr-3 ${activeTab === menu.id ? 'text-white' : 'text-slate-400'}`} /> {menu.label}
            </button>
          ))}
          {websiteMenus.length > 0 && (
            <>
              <div className="pt-4 pb-2 px-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center"><Globe className="w-3 h-3 mr-1.5" /> Konten Website</p>
              </div>
              {websiteMenus.map(menu => (
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
            <button onClick={() => { setAppUser(null); setShowLogin(false); }} title="Lihat Website Publik"
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <Eye className="w-4 h-4" /> Preview Website
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && <DashboardView stats={stats} absensiData={absensiData} />}
          {activeTab === 'guru' && <GuruView gurus={gurus} onAdd={addGuru} onEdit={editGuru} onDelete={deleteGuru} userRole={appUser.role} />}
          {activeTab === 'siswa' && <SiswaView siswas={siswas} kelass={kelass} onAdd={addSiswa} onEdit={editSiswa} onDelete={deleteSiswa} userRole={appUser.role} appUser={appUser} gurus={gurus} />}
          {activeTab === 'kelas' && <KelasView kelass={kelass} gurus={gurus} siswas={siswas} onAddKelas={addKelas} onEditKelas={editKelas} onDeleteKelas={deleteKelas} userRole={appUser.role} />}
          {activeTab === 'absensi' && <AbsensiView siswas={siswas} kelass={kelass} appUser={appUser} userRole={appUser.role} gurus={gurus} />}
          {activeTab === 'nilai' && <NilaiView siswas={siswas} kelass={kelass} appUser={appUser} userRole={appUser.role} gurus={gurus} />}
          {activeTab === 'jadwal' && <JadwalView kelass={kelass} gurus={gurus} appUser={appUser} userRole={appUser.role} />}
          {activeTab === 'chat' && <ChatView appUser={appUser} />}
          {activeTab === 'profil-sekolah' && <ProfilSekolahView profilSekolah={profilSekolah} />}
          {activeTab === 'pengumuman-admin' && <PengumumanAdminView pengumumans={pengumumans} />}
          {activeTab === 'galeri-admin' && <GaleriAdminView galeris={galeris} />}
          {activeTab === 'berita-admin' && <BeritaAdminView beritas={beritas} />}
        </div>
      </main>
    </div>
  );
}