// lobby.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, get, child, update, remove, onDisconnect, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
// --- MỚI: IMPORT DỮ LIỆU ĐỂ HIỂN THỊ BỘ SƯU TẬP ---
import { CHAMPS, SYNERGIES, ITEMS } from './shared.js';

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
let userSettings = { uiScale: 1, zoomIdx: 1, pcMode: false };
// --- BIẾN LƯU BỘ SƯU TẬP ---
let userCollection = { champions: {}, items: {} };

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
// --- DOM CHO COLLECTION ---
const btnCollection = document.getElementById('lobby-collection-btn');
const collectionModal = document.getElementById('collection-modal');

// 3. Hàm Load dữ liệu
async function loadUserData() {
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, `users/${currentUserId}`));
        if (snapshot.exists()) {
            const data = snapshot.val();
            currentUserName = data.name || "Kỳ Thủ Mới";
            if (data.settings) userSettings = { ...userSettings, ...data.settings };
            
            // --- TẢI BỘ SƯU TẬP ---
            if (data.collection) {
                userCollection = data.collection; // Cấu trúc: { champions: {garen: true}, items: {sword: true} }
            } else {
                userCollection = { champions: {}, items: {} };
            }

            updateNameDisplay();
        } else {
            showNameModal();
        }
    } catch (error) {
        console.error("Lỗi lấy data:", error);
        showNameModal(); 
    }
}

function updateNameDisplay() {
    if(nameDisplay) nameDisplay.innerText = currentUserName;
}

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

window.saveUserSettings = (newSettings) => {
    userSettings = { ...userSettings, ...newSettings };
    window.userSettings = userSettings;
    update(ref(db, 'users/' + currentUserId + '/settings'), userSettings)
        .catch(err => console.error("Lỗi lưu settings:", err));
};

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

// --- LOGIC BỘ SƯU TẬP (MỚI) ---
function initCollectionUI() {
    // 1. Xử lý mở/đóng Modal
    if(btnCollection) {
        btnCollection.classList.remove('hidden');
        btnCollection.onclick = () => {
            renderChampionsCollection(); // Mặc định render tướng trước
            if(collectionModal) collectionModal.classList.remove('hidden');
        };
    }
    
    const closeBtn = document.getElementById('btn-close-collection');
    if(closeBtn) closeBtn.onclick = () => collectionModal.classList.add('hidden');

    // 2. Xử lý Tab chuyển đổi
    const tabChamps = document.getElementById('col-tab-champs');
    const tabItems = document.getElementById('col-tab-items');
    const viewChamps = document.getElementById('col-view-champs');
    const viewItems = document.getElementById('col-view-items');

    if(tabChamps && tabItems) {
        tabChamps.onclick = () => {
            tabChamps.classList.add('active');
            tabItems.classList.remove('active');
            viewChamps.classList.remove('hidden');
            viewItems.classList.add('hidden');
            renderChampionsCollection();
        };
        tabItems.onclick = () => {
            tabItems.classList.add('active');
            tabChamps.classList.remove('active');
            viewItems.classList.remove('hidden');
            viewChamps.classList.add('hidden');
            renderItemsCollection();
        };
    }
}

function renderChampionsCollection() {
    const container = document.getElementById('col-view-champs');
    if(!container) return;
    container.innerHTML = '';

    // Duyệt qua từng Tộc/Hệ trong SYNERGIES để gom nhóm
    Object.keys(SYNERGIES).forEach(traitKey => {
        const traitData = SYNERGIES[traitKey];
        
        // Tìm các tướng thuộc hệ này
        const traitChamps = CHAMPS.filter(c => c.trait === traitKey);
        
        if(traitChamps.length > 0) {
            // Tạo Header cho hệ
            const groupDiv = document.createElement('div');
            groupDiv.className = 'trait-group';
            
            const headerHtml = `
                <div class="trait-header" style="border-color:${traitData.color}">
                    <div class="trait-name" style="color:${traitData.color}">${traitData.name}</div>
                </div>
            `;
            
            // Tạo Grid chứa tướng
            const gridDiv = document.createElement('div');
            gridDiv.className = 'collection-grid';

            traitChamps.forEach(champ => {
                const isOwned = userCollection.champions && userCollection.champions[champ.id];
                
                const card = document.createElement('div');
                card.className = `col-card ${isOwned ? 'unlocked' : 'locked'}`;
                const colorHex = '#' + (champ.color ? champ.color.toString(16) : 'cccccc');
                
                card.innerHTML = `
                    <div class="col-img" style="background-color: ${colorHex}"></div>
                    <div class="col-name">${champ.name}</div>
                `;
                gridDiv.appendChild(card);
            });

            groupDiv.innerHTML = headerHtml;
            groupDiv.appendChild(gridDiv);
            container.appendChild(groupDiv);
        }
    });
}

function renderItemsCollection() {
    const container = document.getElementById('col-view-items');
    if(!container) return;
    container.innerHTML = '';

    const gridDiv = document.createElement('div');
    gridDiv.className = 'collection-grid';
    
    // Lọc ra item hiển thị (có tên và icon)
    Object.keys(ITEMS).forEach(itemId => {
        const item = ITEMS[itemId];
        if (!item.name) return;

        const isOwned = userCollection.items && userCollection.items[itemId];
        
        const card = document.createElement('div');
        card.className = `col-card ${isOwned ? 'unlocked' : 'locked'}`;
        card.style.height = "80px"; 
        
        card.innerHTML = `
            <div class="col-img" style="display:flex;justify-content:center;align-items:center;font-size:2rem;background:#222;">${item.icon}</div>
            <div class="col-name" style="color:${item.color}">${item.name}</div>
        `;
        gridDiv.appendChild(card);
    });
    
    container.appendChild(gridDiv);
}

// --- LOGIC PVP MATCHMAKING (GIỮ NGUYÊN) ---
let matchingListener = null;
async function findMatch() {
    const queueRef = ref(db, 'queue');
    const btnText = btnPvp.querySelector('h3');
    if(btnText) btnText.innerText = "Đang tìm...";
    
    const snapshot = await get(queueRef);
    let opponentFound = null;

    if (snapshot.exists()) {
        const queueData = snapshot.val();
        const opponentKey = Object.keys(queueData).find(k => k !== currentUserId);
        if (opponentKey) opponentFound = opponentKey;
    }

    if (opponentFound) {
        const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const opponentId = opponentFound;
        await remove(ref(db, `queue/${opponentId}`));
        const matchData = { host: currentUserId, guest: opponentId, status: 'prep', stage: 1, subRound: 1, lastUpdate: Date.now() };
        await set(ref(db, `matches/${matchId}`), matchData);
        update(ref(db, `users/${opponentId}`), { currentMatch: matchId });
        enterGame({ mode: 'pvp', matchId: matchId, role: 'host', opponentId: opponentId });
    } else {
        const myQueueRef = ref(db, `queue/${currentUserId}`);
        await set(myQueueRef, { name: currentUserName || "Unknown", time: Date.now() });
        onDisconnect(myQueueRef).remove();
        const myUserRef = ref(db, `users/${currentUserId}/currentMatch`);
        matchingListener = onValue(myUserRef, (snap) => {
            const matchId = snap.val();
            if (matchId) {
                remove(myQueueRef); 
                update(ref(db, `users/${currentUserId}`), { currentMatch: null }); 
                get(ref(db, `matches/${matchId}`)).then(mSnap => {
                    const mData = mSnap.val();
                    const opponentId = mData.host;
                    enterGame({ mode: 'pvp', matchId: matchId, role: 'guest', opponentId: opponentId });
                });
            }
        });
    }
}

function enterGame(gameConfig = { mode: 'pve' }) {
    if(matchingListener) { matchingListener(); matchingListener = null; }
    if(lobbyScreen) lobbyScreen.classList.add('fade-out');
    // Ẩn nút collection khi vào game
    if(btnCollection) btnCollection.classList.add('hidden');

    setTimeout(() => {
        if(lobbyScreen) lobbyScreen.classList.add('hidden');
        const gui = document.getElementById('game-ui');
        if(gui) gui.classList.remove('hidden');
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
    initCollectionUI(); // Khởi tạo UI Collection

    const profileBox = document.getElementById('user-profile-box');
    if(profileBox) profileBox.onclick = () => showNameModal();

    const btnConfirm = document.getElementById('btn-confirm-name');
    if(btnConfirm) btnConfirm.onclick = () => saveName(nameInput.value);

    const btnPlay = document.getElementById('btn-lobby-play');
    if(btnPlay) btnPlay.onclick = () => { if(modeSelectModal) modeSelectModal.classList.remove('hidden'); };

    if(modeSelectModal) { modeSelectModal.onclick = (e) => { if (e.target === modeSelectModal) modeSelectModal.classList.add('hidden'); }; }

    const btnPve = document.getElementById('btn-mode-pve');
    if(btnPve) btnPve.onclick = () => enterGame({ mode: 'pve' });

    if(btnPvp) { btnPvp.classList.remove('disabled'); btnPvp.onclick = () => findMatch(); }

    const btnFs = document.getElementById('btn-global-fullscreen');
    if (btnFs) {
        btnFs.onclick = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch((err) => console.error(err));
                btnFs.innerText = '✕';
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
                btnFs.innerText = '⛶';
            }
        };
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) btnFs.innerText = '⛶'; else btnFs.innerText = '✕';
        });
    }
});
