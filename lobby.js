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
// Mặc định settings
let userSettings = { uiScale: 1, zoomIdx: 1 }; 

if (!currentUserId) {
    currentUserId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('tft_uid', currentUserId);
}

// DOM Elements
const lobbyScreen = document.getElementById('lobby-screen');
const nameDisplay = document.getElementById('lobby-username');
const nameInputModal = document.getElementById('name-input-modal');
const nameInput = document.getElementById('input-player-name');
const modeSelectModal = document.getElementById('mode-select-modal');
const btnPvp = document.getElementById('btn-mode-pvp');

// 3. Hàm Load dữ liệu
async function loadUserData() {
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, `users/${currentUserId}`));
        if (snapshot.exists()) {
            const data = snapshot.val();
            currentUserName = data.name || "Kỳ Thủ Mới";
            // Load settings nếu có
            if (data.settings) {
                userSettings = data.settings;
            }
            updateNameDisplay();
        } else {
            showNameModal();
        }
    } catch (error) {
        console.error("Lỗi lấy data:", error);
        if (error.code === 'PERMISSION_DENIED') {
            alert("Lỗi quyền truy cập Firebase!");
        }
        showNameModal(); 
    }
}

function updateNameDisplay() {
    if(nameDisplay) nameDisplay.innerText = currentUserName;
}

// Lưu tên
function saveName(newName) {
    if (!newName.trim()) return;
    currentUserName = newName;
    updateNameDisplay();
    hideNameModal();

    update(ref(db, 'users/' + currentUserId), {
        name: newName,
        lastLogin: Date.now()
    }).catch(err => console.error(err));
}

// --- MỚI: HÀM LƯU SETTINGS ---
window.saveUserSettings = (newSettings) => {
    // Merge setting mới vào setting cũ
    userSettings = { ...userSettings, ...newSettings };
    // Update local variable for consistency
    window.userSettings = userSettings;
    
    update(ref(db, 'users/' + currentUserId + '/settings'), userSettings)
        .catch(err => console.error("Lỗi lưu settings:", err));
};

// Export settings để logic.js dùng
window.userSettings = userSettings;

// 4. UI Logic
function showNameModal() {
    if(nameInputModal) {
        nameInputModal.classList.remove('hidden');
        if(nameInput) nameInput.value = currentUserName;
    }
}
function hideNameModal() {
    if(nameInputModal) nameInputModal.classList.add('hidden');
}

// --- LOGIC PVP MATCHMAKING ---
let matchingListener = null;

async function findMatch() {
    const queueRef = ref(db, 'queue');
    const btnText = btnPvp.querySelector('h3');
    if(btnText) btnText.innerText = "Đang tìm...";
    
    // 1. Kiểm tra xem có ai trong hàng chờ không
    const snapshot = await get(queueRef);
    let opponentFound = null;

    if (snapshot.exists()) {
        const queueData = snapshot.val();
        // Tìm người khác mình
        const opponentKey = Object.keys(queueData).find(k => k !== currentUserId);
        if (opponentKey) {
            opponentFound = opponentKey;
        }
    }

    if (opponentFound) {
        // 2. FOUND: Tạo trận đấu
        const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const opponentId = opponentFound;
        
        // Xóa opponent khỏi queue để không ai khác bắt được
        await remove(ref(db, `queue/${opponentId}`));

        // Tạo dữ liệu trận đấu
        const matchData = {
            host: currentUserId,
            guest: opponentId,
            status: 'prep',
            stage: 1,
            subRound: 1,
            lastUpdate: Date.now()
        };
        
        await set(ref(db, `matches/${matchId}`), matchData);

        // Thông báo cho opponent (qua user node)
        update(ref(db, `users/${opponentId}`), { currentMatch: matchId });

        // Mình vào game ngay (Role: Host)
        enterGame({ mode: 'pvp', matchId: matchId, role: 'host', opponentId: opponentId });
        
    } else {
        // 3. NOT FOUND: Tự thêm mình vào queue
        const myQueueRef = ref(db, `queue/${currentUserId}`);
        await set(myQueueRef, {
            name: currentUserName || "Unknown",
            time: Date.now()
        });
        
        // Xóa khỏi queue khi disconnect (tránh rác)
        onDisconnect(myQueueRef).remove();

        // Lắng nghe xem có ai mời vào trận không
        const myUserRef = ref(db, `users/${currentUserId}/currentMatch`);
        matchingListener = onValue(myUserRef, (snap) => {
            const matchId = snap.val();
            if (matchId) {
                // Opponent đã tạo phòng -> Mình vào
                remove(myQueueRef); // Xóa mình khỏi queue
                update(ref(db, `users/${currentUserId}`), { currentMatch: null }); // Reset trigger
                
                // Lấy thông tin trận để biết opponent là ai (Host)
                get(ref(db, `matches/${matchId}`)).then(mSnap => {
                    const mData = mSnap.val();
                    const opponentId = mData.host;
                    enterGame({ mode: 'pvp', matchId: matchId, role: 'guest', opponentId: opponentId });
                });
            }
        });
    }
}

// 5. Vào Game (Cập nhật để nhận config)
function enterGame(gameConfig = { mode: 'pve' }) {
    if(matchingListener) {
        matchingListener(); // Tắt listener tìm trận
        matchingListener = null;
    }

    if(lobbyScreen) lobbyScreen.classList.add('fade-out');
    setTimeout(() => {
        if(lobbyScreen) lobbyScreen.classList.add('hidden');
        const gui = document.getElementById('game-ui');
        if(gui) gui.classList.remove('hidden');
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

    const profileBox = document.getElementById('user-profile-box');
    if(profileBox) profileBox.onclick = () => showNameModal();

    const btnConfirm = document.getElementById('btn-confirm-name');
    if(btnConfirm) btnConfirm.onclick = () => saveName(nameInput.value);

    const btnPlay = document.getElementById('btn-lobby-play');
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
    if(btnPvp) {
        btnPvp.classList.remove('disabled');
        btnPvp.onclick = () => findMatch();
    }

    // --- LOGIC FULLSCREEN GLOBAL ---
    const btnFs = document.getElementById('btn-global-fullscreen');
    if (btnFs) {
        btnFs.onclick = () => {
            if (!document.fullscreenElement) {
                // Xin quyền Fullscreen
                document.documentElement.requestFullscreen().catch((err) => {
                    console.error(`Lỗi khi bật Fullscreen: ${err.message}`);
                });
                btnFs.innerText = '✕';
            } else {
                // Thoát Fullscreen
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
                btnFs.innerText = '⛶';
            }
        };

        // Lắng nghe sự kiện thay đổi (ví dụ người dùng bấm ESC) để cập nhật icon
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                btnFs.innerText = '⛶';
            } else {
                btnFs.innerText = '✕';
            }
        });
    }
});
