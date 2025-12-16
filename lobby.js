// lobby.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, get, child, update, remove, onDisconnect, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// 1. Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBFnjHG-5v3rKIS3hazIzZSKax-MTNva2I",
    authDomain: "tftremake.firebaseapp.com",
    databaseURL: "https://tftremake-default-rtdb.firebaseio.com",
    projectId: "tftremake",
    storageBucket: "tftremake.firebasestorage.app",
    messagingSenderId: "902964777984",
    appId: "1:902964777984:web:3fd95d6250dd508d5874e5",
    measurementId: "G-D910G0P87P"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 2. Quản lý User
let currentUserId = localStorage.getItem('tft_uid');
let currentUserName = "Kỳ Thủ Mới";
let userSettings = { uiScale: 1, zoomIdx: 1 }; 

if (!currentUserId) {
    currentUserId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('tft_uid', currentUserId);
}

// Hàm lưu settings (để logic.js gọi)
window.saveUserSettings = (newSettings) => {
    userSettings = { ...userSettings, ...newSettings };
    localStorage.setItem('tft_settings', JSON.stringify(userSettings));
};

// Hàm tải dữ liệu người dùng
function loadUserData() {
    const storedName = localStorage.getItem('tft_username');
    if (storedName) currentUserName = storedName;
    
    const storedSettings = localStorage.getItem('tft_settings');
    if (storedSettings) {
        try { userSettings = JSON.parse(storedSettings); } catch(e){}
    }
    
    document.getElementById('lobby-username').innerText = currentUserName;
    document.getElementById('input-player-name').value = currentUserName;

    // Apply settings UI ngay lập tức nếu cần
    if (userSettings.uiScale) {
        document.documentElement.style.setProperty('--ui-scale', userSettings.uiScale);
    }
}

// 3. Logic Ghép Trận (Matchmaking)
const MATCH_TIMEOUT = 30000; // 30s
let isSearching = false;
let searchInterval = null;

function showNameModal() {
    document.getElementById('name-input-modal').classList.remove('hidden');
}

function saveName(name) {
    if (!name || name.trim().length === 0) return;
    currentUserName = name.trim();
    localStorage.setItem('tft_username', currentUserName);
    document.getElementById('lobby-username').innerText = currentUserName;
    document.getElementById('name-input-modal').classList.add('hidden');
}

function findMatch() {
    if(isSearching) return;
    isSearching = true;
    
    const btnPvp = document.getElementById('btn-mode-pvp');
    const originalText = btnPvp.innerHTML;
    btnPvp.innerHTML = '<div class="mode-icon">⏳</div><h3>Đang Tìm...</h3>';
    btnPvp.classList.add('disabled');

    const queueRef = ref(db, 'queue');
    const matchRef = ref(db, 'matches');

    // Thêm mình vào hàng chờ
    const myEntry = { id: currentUserId, name: currentUserName, time: Date.now() };
    set(child(queueRef, currentUserId), myEntry);
    onDisconnect(child(queueRef, currentUserId)).remove();

    let checkCount = 0;
    searchInterval = setInterval(async () => {
        checkCount++;
        if(checkCount > 10) { // Timeout sau 10 lần check (khoảng 20s)
            stopSearching(originalText, "Không tìm thấy đối thủ!");
            return;
        }

        const snapshot = await get(queueRef);
        const queue = snapshot.val();
        
        if (queue) {
            const keys = Object.keys(queue);
            // Nếu có người khác trong hàng chờ (không phải mình)
            const opponentKey = keys.find(k => k !== currentUserId);
            
            if (opponentKey) {
                // TÌM THẤY!
                const opponent = queue[opponentKey];
                
                // Xóa cả 2 khỏi queue để tránh người khác ghép trùng
                await remove(child(queueRef, currentUserId));
                await remove(child(queueRef, opponentKey));
                
                createMatch(currentUserId, opponentKey, opponent.name);
                clearInterval(searchInterval);
            }
        }
    }, 2000);
}

function stopSearching(origText, msg) {
    clearInterval(searchInterval);
    isSearching = false;
    const btnPvp = document.getElementById('btn-mode-pvp');
    if(btnPvp) {
        btnPvp.innerHTML = origText;
        btnPvp.classList.remove('disabled');
    }
    remove(ref(db, `queue/${currentUserId}`));
    if(msg) alert(msg);
}

async function createMatch(hostId, guestId, guestName) {
    const matchId = `match_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    
    const matchData = {
        host: hostId,
        guest: guestId,
        hostName: currentUserName,
        guestName: guestName,
        status: 'active',
        created: Date.now()
    };
    
    // Tạo match mới
    await set(ref(db, `matches/${matchId}`), matchData);
    
    // Gửi tín hiệu mời cho Guest (thông qua user-match-mapping hoặc listen queue cũ - ở đây làm đơn giản là Host tự vào, Guest listen ở đâu đó?)
    // Cách đơn giản: Host tự tạo record 'invite' cho Guest
    // Tuy nhiên để đơn giản hoá project này: Ta sẽ dùng cơ chế 'signal'
    // Hoặc Host update trạng thái 'matched' vào queue của Guest (phức tạp).
    
    // CÁCH TỐI ƯU CHO DEMO:
    // Host set matchId vào node 'active_games' cho cả 2 user
    update(ref(db, `users/${hostId}`), { currentMatch: matchId, role: 'host' });
    update(ref(db, `users/${guestId}`), { currentMatch: matchId, role: 'guest' });

    enterGame({ mode: 'pvp', matchId: matchId, role: 'host', opponentId: guestId, db: db });
}

// Lắng nghe xem mình có được ghép trận không (Dành cho người đến sau - Guest)
function listenForMatch() {
    const userRef = ref(db, `users/${currentUserId}`);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.currentMatch) {
            // Đã được ghép!
            // Xóa info để tránh trigger lại lần sau
            update(userRef, { currentMatch: null });
            
            // Vào game
            enterGame({ 
                mode: 'pvp', 
                matchId: data.currentMatch, 
                role: data.role, 
                opponentId: 'unknown', // Guest sẽ lấy ID đối thủ từ match info sau
                db: db 
            });
        }
    });
}
// Kích hoạt lắng nghe ngay khi vào lobby
listenForMatch();


function enterGame(gameConfig) {
    const lobby = document.getElementById('lobby-screen');
    const gameUI = document.getElementById('game-ui');
    
    lobby.classList.add('fade-out');
    setTimeout(() => {
        lobby.classList.add('hidden');
        gameUI.classList.remove('hidden');
        
        // Hiện nút bán khi vào game
        const sell = document.getElementById('sell-slot');
        if(sell) sell.classList.remove('hidden');
        
        // Gọi hàm start game và TRUYỀN SETTINGS + CONFIG PVP
        if (window.initTFTGame) {
            // Merge settings UI và config Game
            const fullConfig = { 
                ...window.userSettings, 
                ...gameConfig, 
                db: db, 
                myId: currentUserId 
            };
            window.initTFTGame(fullConfig); 
        }
    }, 500);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();

    // --- CẬP NHẬT: LOGIC NÚT GLOBAL FULLSCREEN ---
    // Vì nút này nằm ngoài lobby, ta gán sự kiện ngay tại đây để dùng được luôn
    const btnFs = document.getElementById('btn-global-fullscreen');
    if (btnFs) {
        btnFs.onclick = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log(`Error: ${err.message}`);
                });
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        };
    }
    // ---------------------------------------------

    const profileBox = document.getElementById('user-profile-box');
    const nameInput = document.getElementById('input-player-name');
    if(profileBox) profileBox.onclick = () => showNameModal();

    const btnConfirm = document.getElementById('btn-confirm-name');
    if(btnConfirm) btnConfirm.onclick = () => saveName(nameInput.value);

    const btnPlay = document.getElementById('btn-lobby-play');
    const modeSelectModal = document.getElementById('mode-select-modal');
    if(btnPlay) btnPlay.onclick = () => {
        if(modeSelectModal) modeSelectModal.classList.remove('hidden');
    };

    if(modeSelectModal) {
        modeSelectModal.onclick = (e) => {
            if (e.target === modeSelectModal) modeSelectModal.classList.add('hidden');
        };
    }

    const btnPve = document.getElementById('btn-mode-pve');
    if(btnPve) btnPve.onclick = () => enterGame({ mode: 'pve' });

    // Enable nút PvP
    const btnPvp = document.getElementById('btn-mode-pvp');
    if(btnPvp) {
        btnPvp.classList.remove('disabled');
        btnPvp.onclick = () => findMatch();
    }
});
