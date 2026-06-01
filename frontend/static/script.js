// frontend/static/script.js
// VERSI FINAL - dengan tombol "📖 Cara Baca yang Benar" (Modal Popup)

import * as THREE from 'three';

// ==================== THREE.JS BINTANG BACKGROUND ====================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030b17);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Bintang utama
const starCount = 4500;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
    const radius = 40 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
    starPositions[i * 3 + 2] = radius * Math.cos(phi) - 10;

    const colorType = Math.random();
    if (colorType < 0.7) {
        starColors[i * 3] = 0.85 + Math.random() * 0.15;
        starColors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
        starColors[i * 3 + 2] = 1.0;
    } else if (colorType < 0.9) {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
        starColors[i * 3 + 2] = 0.7 + Math.random() * 0.25;
    } else {
        starColors[i * 3] = 0.7 + Math.random() * 0.3;
        starColors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
        starColors[i * 3 + 2] = 1.0;
    }
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starMaterial = new THREE.PointsMaterial({ size: 0.18, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Bintang jauh
const starCountFar = 3500;
const starGeoFar = new THREE.BufferGeometry();
const posFar = new Float32Array(starCountFar * 3);
for (let i = 0; i < starCountFar; i++) {
    const r = 90 + Math.random() * 100;
    const theta2 = Math.random() * Math.PI * 2;
    const phi2 = Math.acos(2 * Math.random() - 1);
    posFar[i * 3] = r * Math.sin(phi2) * Math.cos(theta2);
    posFar[i * 3 + 1] = r * Math.sin(phi2) * Math.sin(theta2) * 0.5;
    posFar[i * 3 + 2] = r * Math.cos(phi2) - 20;
}
starGeoFar.setAttribute('position', new THREE.BufferAttribute(posFar, 3));
const starMatFar = new THREE.PointsMaterial({ color: 0x88aaff, size: 0.09, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending });
const starsFar = new THREE.Points(starGeoFar, starMatFar);
scene.add(starsFar);

// Bintang berkedip
const twinkleCount = 1800;
const twinkleGeo = new THREE.BufferGeometry();
const twinklePos = new Float32Array(twinkleCount * 3);
for (let i = 0; i < twinkleCount; i++) {
    twinklePos[i * 3] = (Math.random() - 0.5) * 180;
    twinklePos[i * 3 + 1] = (Math.random() - 0.5) * 70;
    twinklePos[i * 3 + 2] = (Math.random() - 0.5) * 100 - 40;
}
twinkleGeo.setAttribute('position', new THREE.BufferAttribute(twinklePos, 3));
const twinkleMat = new THREE.PointsMaterial({ color: 0xffdd99, size: 0.12, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
const twinkleStars = new THREE.Points(twinkleGeo, twinkleMat);
scene.add(twinkleStars);

// Nebula
const nebulaCount = 1200;
const nebulaGeo = new THREE.BufferGeometry();
const nebulaPos = new Float32Array(nebulaCount * 3);
for (let i = 0; i < nebulaCount; i++) {
    nebulaPos[i * 3] = (Math.random() - 0.5) * 120;
    nebulaPos[i * 3 + 1] = (Math.random() - 0.5) * 40 + 5;
    nebulaPos[i * 3 + 2] = (Math.random() - 0.5) * 80 - 30;
}
nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
const nebulaMat = new THREE.PointsMaterial({ color: 0x6688aa, size: 0.07, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending });
const nebulaCloud = new THREE.Points(nebulaGeo, nebulaMat);
scene.add(nebulaCloud);

let time = 0;
function animateStars() {
    requestAnimationFrame(animateStars);
    time += 0.003;

    stars.rotation.y += 0.0002;
    stars.rotation.x = Math.sin(time * 0.1) * 0.05;
    starsFar.rotation.y -= 0.00015;
    starsFar.rotation.x += 0.0001;
    twinkleStars.rotation.y += 0.00025;
    nebulaCloud.rotation.y += 0.00008;

    twinkleMat.opacity = 0.55 + Math.sin(time * 1.8) * 0.15;
    starMaterial.opacity = 0.75 + Math.sin(time * 0.7) * 0.1;

    renderer.render(scene, camera);
}
animateStars();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== FITUR TOGGLE TEMA ====================
const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'light') {
        document.documentElement.removeAttribute('data-theme');
        scene.background.setHex(0x030b17);
        themeIcon.className = 'fas fa-sun';
        themeText.innerText = 'Mode Terang';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        scene.background.setHex(0xf4f7fc);
        themeIcon.className = 'fas fa-moon';
        themeText.innerText = 'Mode Gelap';
    }
});

// ==================== KONFIGURASI BACKEND ====================
const API_BASE = 'http://localhost:8000';
let currentSurahId = 1;
let currentSurahName = "";
let surahList = [];
let currentAyatsData = [];
let recordedBlob = null;
let mediaRecorderObj = null;
let audioChunks = [];
let isRecordingActive = false;

// ========== USER ID (localStorage) ==========
function getUserId() {
    let uid = localStorage.getItem('ngaji_user_id');
    if (!uid) {
        uid = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('ngaji_user_id', uid);
    }
    return uid;
}

function displayUserId() {
    const userId = getUserId();
    const shortId = userId.slice(-8);
    const userBadge = document.getElementById('userIdDisplay');
    if (userBadge) userBadge.innerText = `✨ ${shortId}`;
}

// ========== SAVE SESSION KE BACKEND ==========
async function saveSessionToBackend(accuracy, correct, wrong, tajwidResults) {
    const userId = getUserId();
    try {
        const response = await fetch(`${API_BASE}/user/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                surah: currentSurahId,
                surah_name: currentSurahName,
                accuracy: accuracy,
                correct: correct,
                wrong: wrong,
                errors: tajwidResults.filter(r => r.status !== 'correct')
            })
        });
        if (response.ok) console.log('✅ Session saved');
    } catch (err) {
        console.error('Failed to save session:', err);
    }
}

// ========== LOAD STATS & HISTORY ==========
async function loadStats() {
    const userId = getUserId();
    const statsContainer = document.getElementById('statsContainer');
    const historyContainer = document.getElementById('historyContainer');
    if (!statsContainer) return;

    try {
        const statsRes = await fetch(`${API_BASE}/user/${userId}/stats`);
        const statsData = await statsRes.json();
        const stats = statsData.stats;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.total_sessions || 0}</div>
                <div class="stat-label">Total Sesi Ngaji</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.avg_accuracy || 0}%</div>
                <div class="stat-label">Rata-rata Akurasi</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.best_accuracy || 0}%</div>
                <div class="stat-label">Akurasi Terbaik</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.total_checks || 0}</div>
                <div class="stat-label">Total Rule Dicek</div>
            </div>
        `;

        const historyRes = await fetch(`${API_BASE}/user/${userId}/history?limit=10`);
        const historyData = await historyRes.json();
        const history = historyData.history || [];

        if (history.length === 0) {
            historyContainer.innerHTML = '<p class="text-center opacity-70">Belum ada sesi ngaji. Yuk mulai ngaji!</p>';
            return;
        }

        historyContainer.innerHTML = history.map(h => `
            <div class="history-item">
                <div class="surah-name">📖 ${h.surah_name || `Surah ${h.surah}`}</div>
                <div class="accuracy">🎯 ${h.accuracy}%</div>
                <div class="stats">✅ ${h.correct_count || 0} | ❌ ${h.wrong_count || 0}</div>
                <div class="date">${new Date(h.created_at).toLocaleDateString('id-ID')}</div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Failed to load stats:', err);
        if (statsContainer) statsContainer.innerHTML = '<div class="loading">Gagal memuat statistik</div>';
        if (historyContainer) historyContainer.innerHTML = '<div class="loading">Gagal memuat riwayat</div>';
    }
}

// ========== TAB NAVIGASI ==========
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `tab-${tabId}`) content.classList.add('active');
            });
            if (tabId === 'progress') loadStats();
        });
    });
}

// ========== DATA MATERI TAJWID (UNTUK POPUP) ==========
const tajwidMateri = {
    "idzhar": {
        title: "Izhar Halqi",
        arabic_example: "مَنْ ءَامَنَ",
        explanation: "Nun sukun atau tanwin bertemu huruf halqi (ء ه ع ح غ خ), dibaca jelas tanpa dengung.",
        tips: "Baca huruf nun/tanwin dengan jelas, langsung ke huruf berikutnya. Jangan ada getaran dengung di hidung."
    },
    "ikhfa": {
        title: "Ikhfa Haqiqi",
        arabic_example: "مَنْ كَفَرَ",
        explanation: "Nun sukun atau tanwin bertemu 15 huruf ikhfa, dibaca samar antara izhar dan idgham.",
        tips: "Ucapkan nun/tanwin dengan samar (seperti 'ng'), tahan dengung 2-3 harakat."
    },
    "idgham_bighunnah": {
        title: "Idgham Bighunnah",
        arabic_example: "مِنْ نِعْمَةٍ",
        explanation: "Nun sukun atau tanwin bertemu huruf ي ن م و, nun sukun dilebur ke huruf berikutnya disertai dengung.",
        tips: "Langsung ke huruf berikutnya, tahan dengung 2 harakat di hidung."
    },
    "idgham_bilaghunnah": {
        title: "Idgham Bilaghunnah",
        arabic_example: "مِنْ رَبِّكَ",
        explanation: "Nun sukun atau tanwin bertemu huruf ل ر, nun sukun dilebur ke huruf berikutnya tanpa dengung.",
        tips: "Langsung ke huruf berikutnya, tanpa dengung. Rasakan getaran di lidah."
    },
    "iqlab": {
        title: "Iqlab",
        arabic_example: "أَنْبِئْهُم",
        explanation: "Nun sukun atau tanwin bertemu huruf ب, berubah menjadi mim disertai dengung.",
        tips: "Rapatkan kedua bibir seperti mengucap 'm', tahan dengung 2 harakat."
    },
    "qalqalah": {
        title: "Qalqalah",
        arabic_example: "يَلْبِسُونَ",
        explanation: "Huruf ق ط ب ج د dalam keadaan sukun atau waqaf, dipantulkan suaranya.",
        tips: "Rasakan pantulan ringan setelah mengucap huruf qalqalah yang mati."
    },
    "mad": {
        title: "Mad Thabi'i (Mad Asli)",
        arabic_example: "قَالَ",
        explanation: "Huruf alif, wau, atau ya yang tidak bertemu hamzah atau sukun, dibaca panjang 2 harakat.",
        tips: "Tahan bacaan selama 2 ketukan jari. Jangan terlalu pendek atau terlalu panjang."
    }
};

// ========== FUNGSI MODAL ==========
function showModal(ruleKey) {
    const materi = tajwidMateri[ruleKey];
    if (!materi) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="rule-title">📖 ${materi.title}</div>
        <div class="arabic-example">${materi.arabic_example}</div>
        <div class="explanation">
            <strong><i class="fas fa-info-circle"></i> Penjelasan:</strong><br>
            ${materi.explanation}
        </div>
        <div class="tips">
            <strong><i class="fas fa-lightbulb"></i> Tips Membaca:</strong><br>
            ${materi.tips}
        </div>
    `;

    document.getElementById('modalCaraBaca').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modalCaraBaca').style.display = 'none';
}

// Tutup modal kalo klik di luar content
window.onclick = function (event) {
    const modal = document.getElementById('modalCaraBaca');
    if (event.target === modal) {
        closeModal();
    }
};

// ========== INJECT KOREKSI INLINE PER AYAT (DENGAN TOMBOL MODAL) ==========
function injectInlineCorrections(tajwidResults) {
    console.log("Injecting inline corrections for", tajwidResults.length, "rules");
    
    document.querySelectorAll('.ayat-correction').forEach(el => {
        el.innerHTML = '';
        el.style.display = 'none';
    });

    const byAyat = {};
    tajwidResults.forEach(r => {
        const ayahNum = r.ayah?.replace('Ayat ', '') || '0';
        if (!byAyat[ayahNum]) byAyat[ayahNum] = [];
        byAyat[ayahNum].push(r);
    });

    for (const [ayatNum, errors] of Object.entries(byAyat)) {
        const correctionDiv = document.getElementById(`correction-ayat-${ayatNum}`);
        if (!correctionDiv) continue;

        const hasError = errors.some(e => e.status !== 'correct');
        const card = document.getElementById(`ayat-card-${ayatNum}`);
        if (card) {
            card.style.borderLeft = hasError ? '4px solid #f87171' : '4px solid #4ade80';
            card.style.backgroundColor = hasError ? 'rgba(248, 113, 113, 0.1)' : '';
        }

        let html = `<div class="inline-correction-header">${hasError ? '⚠️ Koreksi Tajwid' : '✅ Tajwid Benar'}</div>`;
        
        errors.forEach(e => {
            const icon = e.status === 'correct' ? '✅' : (e.status === 'warning' ? '⚠️' : '❌');
            const isError = e.status !== 'correct';
            
            // Mapping rule ke key materi
            let ruleKey = (e.rule || '').toLowerCase().replace(/ /g, '_');
            if (ruleKey.includes('idzhar')) ruleKey = 'idzhar';
            else if (ruleKey.includes('ikhfa')) ruleKey = 'ikhfa';
            else if (ruleKey.includes('idgham_bighunnah')) ruleKey = 'idgham_bighunnah';
            else if (ruleKey.includes('idgham_bilaghunnah')) ruleKey = 'idgham_bilaghunnah';
            else if (ruleKey.includes('iqlab')) ruleKey = 'iqlab';
            else if (ruleKey.includes('qalqalah')) ruleKey = 'qalqalah';
            else if (ruleKey.includes('mad')) ruleKey = 'mad';
            else ruleKey = 'idzhar';
            
            html += `<div class="inline-correction-item ${e.status}">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                    <div>
                        ${icon} <strong>${e.rule || 'Tajwid'}</strong>
                        pada kata <span class="arabic-inline">${e.matched_text || '-'}</span>
                    </div>`;
            
            // TOMBOL CARA BACA YANG BENAR (hanya untuk yang error/warning)
            if (isError) {
                html += `<button class="btn-example-audio" onclick="showModal('${ruleKey}')">
                            📖 Cara Baca yang Benar
                         </button>`;
            }
            
            html += `</div>
                    <div style="font-size:0.75rem; margin-top: 0.25rem;">${e.message}</div>
            </div>`;
        });
        
        correctionDiv.innerHTML = html;
        correctionDiv.style.display = 'block';
    }
}

// ========== LOAD AYAT ==========
async function loadAyat(surahNumber) {
    const container = document.getElementById('surahTextDisplay');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-pulse"></i> Memuat ayat...</div>';

    try {
        const response = await fetch(`${API_BASE}/ayat/${surahNumber}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const ayats = data.ayats || [];

        if (ayats.length === 0) {
            container.innerHTML = '<p>Tidak ada data ayat.</p>';
            return;
        }

        ayats.sort((a, b) => a.nomor - b.nomor);
        currentAyatsData = ayats;

        container.innerHTML = '';
        ayats.forEach(ayat => {
            const ayatCard = document.createElement('div');
            ayatCard.className = 'ayat-item-card';
            ayatCard.id = `ayat-card-${ayat.nomor}`;
            ayatCard.innerHTML = `
                <div class="ayat-header">
                    <span class="ayat-number">${ayat.nomor}</span>
                </div>
                <p class="arabic-text">${ayat.teks_arab}</p>
                <p class="latin-text">${ayat.transliterasi || ''}</p>
                <div class="ayat-correction" id="correction-ayat-${ayat.nomor}" style="display:none;"></div>
            `;
            container.appendChild(ayatCard);
        });
    } catch (error) {
        console.error('Gagal load ayat:', error);
        container.innerHTML = '<p class="loading">❌ Gagal memuat ayat.</p>';
    }
}

// ========== DISPLAY HASIL ANALISIS ==========
function displayResult(result) {
    const accuracy = result.accuracy || 0;
    const correct = result.correct || 0;
    const wrong = result.wrong || 0;
    const tajwidResults = result.tajwid_results || [];
    const ayahMatches = result.ayah_matches || [];

    injectInlineCorrections(tajwidResults);

    let feedbackHtml = `
        <div class="correction-item"><i class="fas fa-chart-line"></i> <strong>📊 Skor Kualitas Bacaan:</strong> ${accuracy}%</div>
        <div class="correction-item"><i class="fas fa-check-circle"></i> <strong>✅ Tajwid Benar:</strong> ${correct} | <strong>❌ Tajwid Salah:</strong> ${wrong}</div>
    `;

    if (ayahMatches.length > 0) {
        feedbackHtml += `<div class="correction-item"><strong><i class="fas fa-book"></i> Ayat terdeteksi:</strong> ${ayahMatches[0].ayah} (${ayahMatches[0].similarity}%)</div>`;
    }

    if (accuracy >= 85) feedbackHtml += `<div class="correction-item">🌟✨ Masha Allah! Bacaan sangat baik!</div>`;
    else if (accuracy >= 70) feedbackHtml += `<div class="correction-item">📖 Bacaan cukup baik. Perhatikan kesalahan di atas.</div>`;
    else feedbackHtml += `<div class="correction-item">💪 Tetap semangat! Coba ulangi pelan-pelan.</div>`;

    document.getElementById('correctionResult').innerHTML = feedbackHtml;
    document.getElementById('accuracyScore').innerHTML = `✨ Akurasi Tajwid: ${accuracy}% ✨`;
    document.getElementById('recordingStatus').innerHTML = '✅ Analisis selesai';

    saveSessionToBackend(accuracy, correct, wrong, tajwidResults);
}

// ========== REKAM & ANALISIS ==========
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderObj = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorderObj.ondataavailable = event => { if (event.data.size > 0) audioChunks.push(event.data); };
        mediaRecorderObj.onstop = () => {
            recordedBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(recordedBlob);
            document.getElementById('audioPlayback').src = audioUrl;
            document.getElementById('audioPlayback').style.display = 'block';
            document.getElementById('recordingStatus').innerHTML = '✅ Rekaman selesai! Mengirim ke AI...';
            sendToBackend(recordedBlob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderObj.start();
        isRecordingActive = true;
        document.getElementById('recordBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('recordingStatus').innerHTML = '🔴 Sedang merekam... bacalah surat dengan tartil';
    } catch (err) {
        document.getElementById('recordingStatus').innerHTML = '❌ Izin mikrofon diperlukan';
        console.error(err);
    }
}

function stopRecording() {
    if (mediaRecorderObj && isRecordingActive && mediaRecorderObj.state !== 'inactive') {
        mediaRecorderObj.stop();
        isRecordingActive = false;
        document.getElementById('recordBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
    }
}

async function sendToBackend(audioBlob) {
    document.getElementById('correctionResult').innerHTML = '<div class="loading"><i class="fas fa-spinner fa-pulse"></i> 🤖 AI sedang menganalisis bacaan...</div>';
    document.getElementById('accuracyScore').innerHTML = '';

    const formData = new FormData();
    formData.append('surah', currentSurahId);
    formData.append('file', audioBlob, 'recording.wav');

    try {
        const response = await fetch(`${API_BASE}/analyze`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        displayResult(result);
    } catch (error) {
        console.error('Analisis gagal:', error);
        document.getElementById('correctionResult').innerHTML = `<div class="correction-item">❌ Gagal terhubung ke AI backend</div><div class="correction-item">Error: ${error.message}</div>`;
        document.getElementById('recordingStatus').innerHTML = '⚠️ Gagal analisis';
    }
}

// ========== LOAD SURAH LIST ==========
async function loadSurahs() {
    const select = document.getElementById('surahSelect');
    select.innerHTML = '<option value="">Memuat...</option>';

    try {
        const response = await fetch(`${API_BASE}/surahs`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        surahList = data.surahs || [];
        surahList.sort((a, b) => a.number - b.number);

        select.innerHTML = '';
        surahList.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.number;
            option.textContent = `${surah.number}. ${surah.name} (${surah.total_verses || '?'} ayat)`;
            select.appendChild(option);
        });

        if (surahList.length > 0) {
            currentSurahId = surahList[0].number;
            currentSurahName = surahList[0].name;
            select.value = currentSurahId;
            loadAyat(currentSurahId);
        }
    } catch (error) {
        console.error('Gagal load surah:', error);
        select.innerHTML = '<option value="">Gagal memuat surat</option>';
    }
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', () => {
    displayUserId();
    initTabs();
    loadSurahs();

    const surahSelect = document.getElementById('surahSelect');
    surahSelect.addEventListener('change', (e) => {
        currentSurahId = parseInt(e.target.value);
        const selectedSurah = surahList.find(s => s.number === currentSurahId);
        currentSurahName = selectedSurah?.name || `Surah ${currentSurahId}`;
        if (currentSurahId) {
            loadAyat(currentSurahId);
            document.getElementById('correctionResult').innerHTML = '<p><i class="fas fa-microphone"></i> Surat berubah, silakan rekam/upload bacaan.</p>';
            document.getElementById('accuracyScore').innerHTML = '';
        }
    });

    document.getElementById('recordBtn').addEventListener('click', startRecording);
    document.getElementById('stopBtn').addEventListener('click', stopRecording);
    document.getElementById('uploadBtn').addEventListener('click', () => document.getElementById('audioFileInput').click());
    document.getElementById('audioFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            recordedBlob = file;
            const audioUrl = URL.createObjectURL(file);
            document.getElementById('audioPlayback').src = audioUrl;
            document.getElementById('audioPlayback').style.display = 'block';
            document.getElementById('recordingStatus').innerHTML = '📁 File diupload! Mengirim ke AI...';
            sendToBackend(file);
        }
    });
});
window.showModal = showModal;
window.closeModal = closeModal;
console.log("✨ AI NGAJI v2.0 | Tab navigasi + User ID + Koreksi inline + Modal Cara Baca ✨");