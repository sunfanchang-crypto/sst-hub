// ⚡ 順時達 SST-V14 核心業務與音訊腳本

const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new AudioCtxClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// 🔊 1. 購物者發起需求音效（叮咚雙音 587Hz -> 880Hz）
function playBuyerBroadcastSound() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.setValueAtTime(880, now + 0.2); // A5
    gain2.gain.setValueAtTime(0.5, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.6);
}

// 🔔 2. 運送者接單確認音效（清脆三連音 523Hz -> 659Hz -> 784Hz）
function playAcceptOrderSound() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.12;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.25);
    });
}

// 🚨 3. SOS 求救音效（880Hz Sawtooth 三長兩短）
function playSOSAlarm() {
    const ctx = getAudioContext();
    const pattern = [
        { duration: 0.35, pause: 0.1 },
        { duration: 0.35, pause: 0.1 },
        { duration: 0.35, pause: 0.2 },
        { duration: 0.12, pause: 0.08 },
        { duration: 0.12, pause: 0.08 }
    ];

    let currentTime = ctx.currentTime;
    pattern.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, currentTime);
        gain.gain.setValueAtTime(0.7, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(currentTime);
        osc.stop(currentTime + note.duration);
        currentTime += note.duration + note.pause;
    });
}

function triggerSOS() {
    playSOSAlarm();
    setTimeout(() => {
        alert("🚨【SOS 求救觸發】三長兩短警報已響起！已鎖定 GPS 坐標。");
    }, 100);
    logStatus("🚨 SOS 緊急求救已觸發！通報檢警中樞。", "#FF3333");
}

// 角色切換
function switchRole(role) {
    const buyerTab = document.getElementById("tab-buyer");
    const driverTab = document.getElementById("tab-driver");
    const buyerSec = document.getElementById("buyer-section");
    const driverSec = document.getElementById("driver-section");

    if (role === 'buyer') {
        buyerTab.classList.add("active");
        driverTab.classList.remove("active");
        buyerSec.style.display = "block";
        driverSec.style.display = "none";
    } else {
        driverTab.classList.add("active");
        buyerTab.classList.remove("active");
        driverSec.style.display = "block";
        buyerSec.style.display = "none";
    }
}

// 1. 購物者發起需求
function publishBuyerOrder() {
    playBuyerBroadcastSound();

    const pickup = document.getElementById("req-pickup").value;
    const item = document.getElementById("req-item").value;
    const dropoff = document.getElementById("req-dropoff").value;
    const fee = document.getElementById("req-fee").value;

    document.getElementById("lobby-item").innerText = item;
    document.getElementById("lobby-route").innerText = `${pickup} ➔ ${dropoff}`;
    document.getElementById("lobby-fee").innerText = `$${fee} NTD (實得 $${Math.round(fee * 0.8)})`;

    logStatus(`📢 [需求已上貼] 購物單廣播已送出！品項：${item}，等待順路者接單...`, "#FFCC00");
    alert("📢 需求已發布並發出廣播音訊！已上貼至運送者接單大廳。");

    // 自動切換到運送者分頁
    switchRole('driver');
}

// 2. 運送者接單
function acceptOrder() {
    playAcceptOrderSound();

    document.getElementById("delivery-flow-section").style.display = "block";
    logStatus("⚡ 接單成功！請查閱路線圖並依 SST 標準防禦流程執行取送。", "#00FF66");
    alert("⚡ 接單成功！已進入 SST 順時達標準送貨流程。");
    document.getElementById("delivery-flow-section").scrollIntoView({ behavior: 'smooth' });
}

// 3. 狀態回報
function reportStatus(statusName, addMin) {
    const legalCheck = document.getElementById("legal-agreement");
    if (legalCheck && !legalCheck.checked) {
        alert("⚠️ 請勾選法定禁品排除切結！");
        return;
    }
    const photoA = document.getElementById("photo-a");
    const photoB = document.getElementById("photo-b");
    if (photoA && photoB && (!photoA.files[0] || !photoB.files[0])) {
        alert("⚠️ 交付前必須上傳照片 A 與照片 B！");
        return;
    }

    const timeStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    logStatus(`[${timeStr}] 驗證通過：${statusName}。80% 收益已結算！`, "#00FF66");
    alert(`✅ ${statusName}！責任鏈存證完成。`);
}

function triggerWaitAndLeave() {
    if (confirm("⚠️ 買家失聯逾 10 分鐘？確認已拍照留置門口安全處。")) {
        logStatus("⏳ 買家失聯免責結案：已拍照留置，80% 收益照常結算。", "#FFA500");
    }
}

function reportBrake() {
    if (confirm("🛑 確定煞車退單？此動作將凍結出餐責任。")) {
        playSOSAlarm();
        logStatus("🛑 煞車退單已送出！責任凍結於出餐端。", "#FF3333");
    }
}

function submitFoodSafetyReport(storeId) {
    if (confirm("⚠️ 法律切結：保證通報屬實，若誣告願負全責？")) {
        playSOSAlarm();
        alert("🚨 重大瑕疵通報立案！機皇 AI 已啟動警報。");
    }
}

function logStatus(msg, color) {
    const box = document.getElementById("status-log");
    if (box) {
        box.style.color = color;
        box.innerText = msg;
    }
}

// 電子簽名畫布
const canvas = document.getElementById('sig-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let isSigning = false;

if (canvas && ctx) {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    const start = (e) => { isSigning = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); };
    const move = (e) => { if (!isSigning) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const stop = () => { isSigning = false; };
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', stop);
}

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
}

function clearSignature() {
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
}
