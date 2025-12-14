// Hamburger Menu Toggle
const hamburgerMenu = document.getElementById('hamburgerMenu');
const navLinks = document.getElementById('navLinks');

// Overlay oluştur
let menuOverlay = document.querySelector('.menu-overlay');
if (!menuOverlay) {
  menuOverlay = document.createElement('div');
  menuOverlay.className = 'menu-overlay';
  document.body.appendChild(menuOverlay);
}

if (hamburgerMenu && navLinks) {
  // Hamburger menüye tıklandığında
  hamburgerMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = hamburgerMenu.classList.toggle('active');
    navLinks.classList.toggle('active');
    menuOverlay.classList.toggle('active');

    // Scroll'u engelle/serbest bırak
    document.body.style.overflow = isActive ? 'hidden' : '';
  });

  // Overlay'e tıklandığında menüyü kapat
  menuOverlay.addEventListener('click', () => {
    hamburgerMenu.classList.remove('active');
    navLinks.classList.remove('active');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = '';
  });

  // Menü linklerine tıklandığında menüyü kapat
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburgerMenu.classList.remove('active');
      navLinks.classList.remove('active');
      menuOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // ESC tuşuna basıldığında menüyü kapat
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('active')) {
      hamburgerMenu.classList.remove('active');
      navLinks.classList.remove('active');
      menuOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// QR Code Scanner Fonksiyonları
let isScanning = false;
let scanningStream = null;

const startScanBtn = document.getElementById('startScanBtn');
const stopScanBtn = document.getElementById('stopScanBtn');
const qrVideo = document.getElementById('qrVideo');
const qrCanvas = document.getElementById('qrCanvas');
const qrResult = document.getElementById('qrResult');

if (startScanBtn) {
  startScanBtn.addEventListener('click', startQRScan);
}

if (stopScanBtn) {
  stopScanBtn.addEventListener('click', stopQRScan);
}

function startQRScan() {
  isScanning = true;
  startScanBtn.style.display = 'none';
  stopScanBtn.style.display = 'block';
  qrVideo.classList.add('active');

  navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  }).then(stream => {
    scanningStream = stream;
    qrVideo.srcObject = stream;
    qrVideo.onloadedmetadata = () => {
      qrVideo.play();
      scanQRCode();
    };
  }).catch(err => {
    console.error('Kamera erişim hatası:', err);
    showQRResult('❌ Kamera erişim reddedildi. Lütfen tarayıcı ayarlarından izin verin.', 'error');
    isScanning = false;
    startScanBtn.style.display = 'block';
    stopScanBtn.style.display = 'none';
    qrVideo.classList.remove('active');
  });
}

function stopQRScan() {
  isScanning = false;
  if (scanningStream) {
    scanningStream.getTracks().forEach(track => track.stop());
  }
  qrVideo.srcObject = null;
  qrVideo.classList.remove('active');
  startScanBtn.style.display = 'block';
  stopScanBtn.style.display = 'none';
}

function scanQRCode() {
  if (!isScanning) return;

  const canvas = qrCanvas;
  const ctx = canvas.getContext('2d');

  if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
    canvas.width = qrVideo.videoWidth;
    canvas.height = qrVideo.videoHeight;
    ctx.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      console.log('QR Kod Bulundu:', code.data);
      handleQRCodeDetected(code.data);
      stopQRScan();
      return;
    }
  }

  requestAnimationFrame(scanQRCode);
}

function handleQRCodeDetected(qrData) {
  console.log('QR Kod Verisi:', qrData);

  // QR kodu analiz et
  if (qrData.includes('coffee=')) {
    const coffeeAmount = parseInt(qrData.split('coffee=')[1]);
    addCoffeeStamps(coffeeAmount);
    showQRResult(`✅ ${coffeeAmount} kahve eklendi!`, 'success');
  } else if (qrData.includes('reward=')) {
    const rewardType = qrData.split('reward=')[1];
    showQRResult(`🎁 ${rewardType} ödülü aktif hale getirildi!`, 'success');
  } else if (qrData.includes('login=')) {
    // Kullanıcı giriş sistemi
    const userId = qrData.split('login=')[1];
    performLogin(userId);
  } else if (qrData.includes('note=')) {
    // Ders notu ID'si ile giriş
    const noteId = qrData.split('note=')[1];
    redirectToNote(noteId);
  } else {
    showQRResult(`📱 Tarama Başarılı!\n\nQR Veri:\n${qrData}`, 'success');
  }
}

function showQRResult(message, type = 'info') {
  if (qrResult) {
    qrResult.innerHTML = `<p class="result-${type}"><strong>${message}</strong></p>`;
    qrResult.style.backgroundColor = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1';
  }
}

function addCoffeeStamps(count) {
  // Toplam kahve sayısını güncelle
  let totalCoffees = parseInt(localStorage.getItem('totalCoffees') || '0');
  totalCoffees += count;
  localStorage.setItem('totalCoffees', totalCoffees.toString());

  for (let i = 0; i < count && coffeeCount < 5; i++) {
    coffeeStamps[coffeeCount].classList.add('filled');
    coffeeCount++;

    if (coffeeCount === 5) {
      // Ödül kahve sayısını artır
      let rewardCoffees = parseInt(localStorage.getItem('rewardCoffees') || '0');
      rewardCoffees++;
      localStorage.setItem('rewardCoffees', rewardCoffees.toString());

      // Ödül geçmişine ekle
      const history = JSON.parse(localStorage.getItem('rewardHistory') || '[]');
      const today = new Date();
      const dateStr = today.toLocaleDateString('tr-TR');
      history.unshift({
        date: dateStr,
        message: '🎉 Bedava Kahve kazandınız! (5 kahve tamamlandı)'
      });
      localStorage.setItem('rewardHistory', JSON.stringify(history));

      alert('Tebrikler! Bedava kahve kazandınız! 🎉');
      coffeeCount = 0;
      coffeeStamps.forEach(s => s.classList.remove('filled'));
    }
  }
}

// QR Code Redirect fonksiyonu
function handleQRRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  const qrCode = urlParams.get('qr');

  if (qrCode) {
    console.log('QR Code ile giriş yapıldı:', qrCode);
    // Burada QR kod ile ilgili işlemler yapılabilir
  }
}

// Kahve damgası ekleme
let coffeeCount = 0;
const coffeeStamps = document.querySelectorAll('.coffee-stamp');

coffeeStamps.forEach((stamp, index) => {
  stamp.addEventListener('click', () => {
    if (!stamp.classList.contains('filled') && index === coffeeCount) {
      stamp.classList.add('filled');
      coffeeCount++;

      if (coffeeCount === 5) {
        alert('Tebrikler! Bedava kahve kazandınız! 🎉');
        coffeeCount = 0;
        coffeeStamps.forEach(s => s.classList.remove('filled'));
      }
    }
  });
});

// Not Ekleme Fonksiyonları
const addNoteBtn = document.getElementById('addNoteBtn');
const noteForm = document.getElementById('noteForm');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const cancelNoteBtn = document.getElementById('cancelNoteBtn');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const notesGrid = document.querySelector('.notes-grid');

if (addNoteBtn) {
  addNoteBtn.addEventListener('click', () => {
    if (noteForm) {
      noteForm.style.display = noteForm.style.display === 'none' ? 'block' : 'none';
      if (noteForm.style.display === 'block') {
        noteTitle.focus();
      }
    }
  });
}

if (saveNoteBtn) {
  saveNoteBtn.addEventListener('click', () => {
    if (noteTitle.value.trim() && noteContent.value.trim()) {
      addNewNote(noteTitle.value, noteContent.value);
      noteTitle.value = '';
      noteContent.value = '';
      noteForm.style.display = 'none';
    } else {
      alert('Lütfen başlık ve içerik alanlarını doldurunuz!');
    }
  });
}

if (cancelNoteBtn) {
  cancelNoteBtn.addEventListener('click', () => {
    noteForm.style.display = 'none';
    noteTitle.value = '';
    noteContent.value = '';
  });
}

// Yeni Not Ekleme Fonksiyonu
function addNewNote(title, content) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('tr-TR');

  const noteCard = document.createElement('div');
  noteCard.className = 'note-card';
  noteCard.innerHTML = `
        <div class="note-header">
            <h3>${escapeHtml(title)}</h3>
            <button class="note-delete" onclick="deleteNote(this)">✕</button>
        </div>
        <p>${escapeHtml(content)}</p>
        <span class="note-date">${dateStr}</span>
    `;

  if (notesGrid) {
    notesGrid.insertBefore(noteCard, notesGrid.firstChild);
  }
}

// Not Silme Fonksiyonu
function deleteNote(btn) {
  if (confirm('Bu notu silmek istediğinizden emin misiniz?')) {
    btn.closest('.note-card').remove();
  }
}

// XSS Saldırılarına Karşı Koruma
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Ödül Kullan Butonu
const rewardButtons = document.querySelectorAll('.btn-reward');
rewardButtons.forEach(btn => {
  if (btn.textContent.includes('Kullan')) {
    btn.addEventListener('click', () => {
      alert('Ödülünüz başarıyla kullanıldı! ✓');
      btn.disabled = true;
      btn.textContent = 'Kullanıldı';
      btn.style.opacity = '0.5';
    });
  }
});

// Like Sistemi
function addLike(button) {
  const likeCount = button.querySelector('.like-count');
  let currentCount = parseInt(likeCount.textContent);

  if (button.classList.contains('liked')) {
    // Beğeniyi geri al
    currentCount--;
    button.classList.remove('liked');
  } else {
    // Beğen
    currentCount++;
    button.classList.add('liked');
    // Her like 2 puan kazandırır
    const pointsGained = 2;
    showNotification(`+${pointsGained} Puan Kazandınız! (Ders Notu Beğenisi)`, 'success');
  }

  likeCount.textContent = currentCount;

  // Local storage'a kaydet
  const card = button.closest('.note-card');
  const noteTitle = card.querySelector('h3').textContent;
  const likes = JSON.parse(localStorage.getItem('noteLikes') || '{}');
  likes[noteTitle] = currentCount;
  localStorage.setItem('noteLikes', JSON.stringify(likes));
}

// Notification göster
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease;
    font-weight: bold;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// QR Kod İşlem Sistemi - Ana Sayfadaki Giriş
function handleQRCodeDetected(qrData) {
  console.log('QR Kod Verisi:', qrData);

  // QR kodu analiz et
  if (qrData.includes('coffee=')) {
    const coffeeAmount = parseInt(qrData.split('coffee=')[1]);
    addCoffeeStamps(coffeeAmount);
    showQRResult(`✅ ${coffeeAmount} kahve eklendi!`, 'success');
  } else if (qrData.includes('reward=')) {
    const rewardType = qrData.split('reward=')[1];
    showQRResult(`🎁 ${rewardType} ödülü aktif hale getirildi!`, 'success');
  } else if (qrData.includes('login=')) {
    // Öğrenci/Kullanıcı giriş sistemi
    const userId = qrData.split('login=')[1];
    performLogin(userId);
  } else if (qrData.includes('note=')) {
    // Ders notu ID'si ile giriş
    const noteId = qrData.split('note=')[1];
    redirectToNote(noteId);
  } else {
    showQRResult(`📱 Tarama Başarılı!\n\nQR Veri:\n${qrData}`, 'success');
  }
}

// Kullanıcı giriş sistemi
function performLogin(userId) {
  // localStorage'a kullanıcı bilgisini kaydet
  localStorage.setItem('currentUser', userId);
  localStorage.setItem('loginTime', new Date().toISOString());

  // Giriş saati ve ödül bilgisini güncelle
  const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
  loginHistory.push({
    userId: userId,
    timestamp: new Date().toISOString(),
    rewarded: false
  });
  localStorage.setItem('loginHistory', JSON.stringify(loginHistory));

  showQRResult(`✅ Hoş geldiniz ${userId}!`, 'success');
  showNotification('Sisteme başarıyla giriş yaptınız!', 'success');

  // 2 saniye sonra ana sayfaya yönlendir
  setTimeout(() => {
    if (window.location.pathname.includes('index.html')) {
      location.reload();
    } else {
      window.location.href = '../src/index.html';
    }
  }, 2000);
}

// Ders notuna yönlendir
function redirectToNote(noteId) {
  window.location.href = `notes.html#note-${noteId}`;
}

// Sayfa yüklendiğinde çalış
document.addEventListener('DOMContentLoaded', () => {
  handleQRRedirect();

  // Beğeni sayılarını localStorage'dan yükle
  const likes = JSON.parse(localStorage.getItem('noteLikes') || '{}');
  document.querySelectorAll('.note-like-btn').forEach(btn => {
    const noteTitle = btn.closest('.note-card').querySelector('h3').textContent;
    if (likes[noteTitle]) {
      btn.querySelector('.like-count').textContent = likes[noteTitle];
    }
  });

  // Kullanıcı bilgisini göster
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    const userDisplay = document.createElement('div');
    userDisplay.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      font-size: 0.9rem;
      z-index: 999;
    `;
    userDisplay.textContent = `📱 Giriş Yapan: ${currentUser}`;
    document.body.appendChild(userDisplay);
  }
});
