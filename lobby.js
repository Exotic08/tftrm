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

// Hàm lưu settings
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
    
    const nameDisplay = document.getElementById('lobby-username');
    if(nameDisplay) nameDisplay.innerText = currentUserName;
    
    const inputName = document.getElementById('input-player-name');
    if(inputName) inputName.value = currentUserName;

    if (userSettings.uiScale) {
        document.documentElement.style.setProperty('--ui-scale', userSettings.uiScale);
    }
}

// 3. Logic Ghép Trận (Matchmaking)
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

    // Thêm mình vào hàng chờ
    const myEntry = { id: currentUserId, name: currentUserName, time: Date.now() };
    set(child(queueRef, currentUserId), myEntry);
    onDisconnect(child(queueRef, currentUserId)).remove();

    let checkCount = 0;
    searchInterval = setInterval(async () => {
        checkCount++;
        if(checkCount > 15) { // Tăng thời gian timeout lên chút (30s)
            stopSearching(originalText, "Không tìm thấy đối thủ!");
            return;
        }

        const snapshot = await get(queueRef);
        const queue = snapshot.val();
        
        if (queue) {
            const keys = Object.keys(queue);
            // Tìm đối thủ khác mình
            const opponentKey = keys.find(k => k !== currentUserId);
            
            if (opponentKey) {
                const opponent = queue[opponentKey];
                
                // Xóa cả 2 khỏi queue ngay lập tức
                await remove(child(queueRef, currentUserId));
                await remove(child(queueRef, opponentKey));
                
                // Gọi tạo trận
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

// UPDATE QUAN TRỌNG: Random Host để công bằng và tránh lỗi fix cứng
async function createMatch(playerA_Id, playerB_Id, playerB_Name) {
    const matchId = `match_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    
    // Tung đồng xu để chọn Host (người cầm cái)
    const isA_Host = Math.random() > 0.5;
    
    const hostId = isA_Host ? playerA_Id : playerB_Id;
    const guestId = isA_Host ? playerB_Id : playerA_Id;
    
    const hostName = isA_Host ? currentUserName : playerB_Name;
    const guestName = isA_Host ? playerB_Name : currentUserName;

    const matchData = {
        host: hostId,
        guest: guestId,
        hostName: hostName,
        guestName: guestName,
        status: 'active',
        created: Date.now(),
        // Khởi tạo trạng thái toàn cục để Logic.js dùng
        globalState: {
            phase: 'prep',
            stage: 1,
            subRound: 1,
            timerStart: Date.now() + 5000 // Buffer 5s để cả 2 load game
        }
    };
    
    // Tạo match
    await set(ref(db, `matches/${matchId}`), matchData);
    
    // Update trạng thái cho cả 2 user để trigger vào game
    update(ref(db, `users/${playerA_Id}`), { currentMatch: matchId, role: isA_Host ? 'host' : 'guest' });
    update(ref(db, `users/${playerB_Id}`), { currentMatch: matchId, role: isA_Host ? 'guest' : 'host' });

    // Vào game ngay cho người tạo (người kia sẽ listen)
    const myRole = isA_Host ? 'host' : 'guest';
    const oppId = isA_Host ? playerB_Id : playerA_Id;
    
    enterGame({ mode: 'pvp', matchId: matchId, role: myRole, opponentId: oppId, db: db });
}

function listenForMatch() {
    const userRef = ref(db, `users/${currentUserId}`);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.currentMatch) {
            update(userRef, { currentMatch: null }); // Clear signal
            
            // Tìm ID đối thủ (cần thiết để load board sau này)
            // Vì ta chưa biết đối thủ là ai ở client Guest, ta sẽ lấy từ Match Info sau trong logic.js
            // Hoặc truyền tạm 'unknown' và để logic.js fetch lại.
            // Để an toàn, ta sẽ fetch match info nhanh ở đây:
            get(ref(db, `matches/${data.currentMatch}`)).then(mSnap => {
                const mData = mSnap.val();
                if(mData) {
                    const opponentId = (data.role === 'host') ? mData.guest : mData.host;
                    enterGame({ 
                        mode: 'pvp', 
                        matchId: data.currentMatch, 
                        role: data.role, 
                        opponentId: opponentId, 
                        db: db 
                    });
                }
            });
        }
    });
}
listenForMatch();

function enterGame(gameConfig) {
    const lobby = document.getElementById('lobby-screen');
    const gameUI = document.getElementById('game-ui');
    
    lobby.classList.add('fade-out');
    setTimeout(() => {
        lobby.classList.add('hidden');
        gameUI.classList.remove('hidden');
        
        const sell = document.getElementById('sell-slot');
        if(sell) sell.classList.remove('hidden');
        
        if (window.initTFTGame) {
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

document.addEventListener('DOMContentLoaded', () => {
    loadUserData();

    const btnFs = document.getElementById('btn-global-fullscreen');
    if (btnFs) {
        btnFs.onclick = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => console.log(err));
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        };
    }

    const profileBox = document.getElementById('user-profile-box');
    const nameInput = document.getElementById('input-player-name');
    if(profileBox) profileBox.onclick = () => showNameModal();

    const btnConfirm = document.getElementById('btn-confirm-name');
    if(btnConfirm) btnConfirm.onclick = () => saveName(nameInput.value);

    const btnPlay = document.getElementById('btn-lobby-play');
    const modeSelectModal = document.getElementById('mode-select-modal');
    if(btnPlay) btnPlay.onclick = () => { if(modeSelectModal) modeSelectModal.classList.remove('hidden'); };

    if(modeSelectModal) {
        modeSelectModal.onclick = (e) => { if (e.target === modeSelectModal) modeSelectModal.classList.add('hidden'); };
    }

    const btnPve = document.getElementById('btn-mode-pve');
    if(btnPve) btnPve.onclick = () => enterGame({ mode: 'pve' });

    const btnPvp = document.getElementById('btn-mode-pvp');
    if(btnPvp) {
        btnPvp.classList.remove('disabled');
        btnPvp.onclick = () => findMatch();
    }
});
