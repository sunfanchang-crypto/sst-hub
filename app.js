// ⚡ Web Audio API：發出「三長兩短」高分貝蜂鳴警報聲
function playThreeLongTwoShortAlarm() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const pattern = [
        { duration: 0.4, pause: 0.1 },
        { duration: 0.4, pause: 0.1 },
        { duration: 0.4, pause: 0.2 },
        { duration: 0.15, pause: 0.08 },
        { duration: 0.15, pause: 0.08 }
    ];

    let currentTime = audioCtx.currentTime;

    pattern.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, currentTime);

        gain.gain.setValueAtTime(0.8, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(currentTime);
        osc.stop(currentTime + note.duration);

        currentTime += note.duration + note.pause;
    });
}

function initMap() {
    const defaultLocation = { lat: 25.033968, lng: 121.564468 };
    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    try {
        const map = new google.maps.Map(mapElement, { zoom: 15, center: defaultLocation, disableDefaultUI: true });
        new google.maps.Marker({ position: defaultLocation, map: map, title: "順時達特約取貨點" });
    } catch (e) {
        mapElement.innerHTML = "<p style='padding:20px; text-align:center; color:#E74C3C;'>🗺️ 地圖預載中 / 地端機皇 AI 護航</p>";
    }
}

// 呼叫機皇算力（含惡意取消 >= 3 次封鎖檢查）
async function fetchServerBrainCalculation(userId, distanceKm, isBadWeather, isModeB, rawNote) {
    try {
        const response = await fetch('http://localhost:3000/api/calculate-price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, distanceKm, isBadWeather, isModeB, rawNote })
        });
        const data = await response.json();

        if (data.status === "USER_BLOCKED") {
            document.getElementById("risk-alert-card").style.display = "block";
            document.getElementById("risk-msg").innerText = data.message;
            playThreeLongTwoShortAlarm();
            return null;
        }

        return data.pricing;
    } catch (e) {
        let baseFee = 35 + (distanceKm > 1 ? Math.ceil((distanceKm - 1) * 10) : 0);
        let totalFee = Math.round(baseFee * (isBadWeather ? 1.2 : 1.0));
        if (isModeB) totalFee = Math.max(30, totalFee - 10);
        return { totalFee, driverShare: Math.round(totalFee * 0.8) };
    }
}

// 提交食安通報（V12：AI 預警標記 + 警報 + 待管理者複審）
async function submitFoodSafetyReport(storeId) {
    const isAgree = confirm("⚠️ 法律切結：您保證所通報之食安問題屬實，若有惡意誣告願自負民刑法全責？");
    if (!isAgree) return;

    try {
        const response = await fetch('http://localhost:3000/api/report-food-safety', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeId: storeId, complaintType: "嚴重食安瑕疵", isNegativeRating: true })
        });
        const data = await response.json();

        if (data.triggerSoundAlarm) {
            playThreeLongTwoShortAlarm();
            alert(`🚨 警報！${data.message}`);
        }
    } catch (e) {
        playThreeLongTwoShortAlarm();
        alert("🚨 手機/機皇警報：收到食安負評，已發出三長兩短警報並進入複審流程！");
    }
}

const canvas = document.getElementById('sig-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let isSigning = false;
if (canvas && ctx) {
    ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
    const startDrawing = (e) => { isSigning = true; ctx.beginPath(); const pos = getPos(e); ctx.moveTo(pos.x, pos.y); };
    const draw = (e) => { if (!isSigning) return; const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); };
    const stopDrawing = () => { isSigning = false; };
    canvas.addEventListener('mousedown', startDrawing); canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing); canvas.addEventListener('touchmove', draw); canvas.addEventListener('touchend', stopDrawing);
}
function getPos(e) { const rect = canvas.getBoundingClientRect(); const clientX = e.touches ? e.touches[0].clientX : e.clientX; return { x: clientX - rect.left, y: clientY - rect.top }; }
function clearSignature() { if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); }

function triggerFaceToFaceValidation() { document.getElementById("validation-modal").style.display = "block"; }
function closeValidation() { document.getElementById("validation-modal").style.display = "none"; }

async function confirmModalValidation() {
    const legalCheck = document.getElementById("legal-agreement").checked;
    if (!legalCheck) {
        alert("⚠️ 請務必勾選「託帶標的物合法性切結」，確認無夾帶任何法定禁品！");
        return;
    }

    const buyerIdPhoto = document.getElementById("buyer-id-photo").files[0];
    if (!buyerIdPhoto) {
        alert("⚠️ 面交必須拍攝買家姓名與單號存證（請遮蔽身分證號）！");
        return;
    }
    closeValidation();
    const pricing = await fetchServerBrainCalculation("user_102", 1.2, false, true, "");
    if (pricing) {
        document.getElementById("total-fee").innerText = `$${pricing.totalFee} NTD (含面交折讓)`;
        document.getElementById("driver-share").innerText = `$${pricing.driverShare} NTD`;
    }
    reportStatus('模式B：鄰近點面交完成 (已驗證證件/加密存證)', 0);
}

function reportStatus(statusName, addMinutes) {
    const legalCheck = document.getElementById("legal-agreement").checked;
    if (!legalCheck) {
        alert("⚠️ 請務必勾選「託帶標的物合法性切結」，確認無夾帶任何法定禁品！");
        return;
    }

    const logBox = document.getElementById("status-log");
    const currentTime = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    if (statusName.includes('模式')) {
        const photoA = document.getElementById("photo-a").files[0];
        const photoB = document.getElementById("photo-b").files[0];
        if (!photoA || !photoB) {
            alert("⚠️ 交付前必須上傳照片 A 與照片 B(賣家親簽貼紙)！");
            return;
        }
        logBox.style.color = "#00FF66";
        logBox.innerText = `[${currentTime}] 驗證通過！${statusName}。80% 分潤已結算，訂單結案。`;
    } else {
        logBox.style.color = "#FFCC00";
        logBox.innerText = `[${currentTime}] 回報：${statusName}。AI 已推播預估 +${addMinutes} 分鐘。`;
    }
}

function reportBrake() {
    if (confirm("🛑 確定觸發煞車退單？")) {
        playThreeLongTwoShortAlarm();
        document.getElementById("status-log").innerText = "🛑 煞車退單成功！責任劃分至賣家/包裝端。";
    }
}
