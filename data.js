// js/data.js

export const SYNERGIES = {
    'warrior': { name: 'C.Binh', color: '#e74c3c', buff: {3:'+30 DMG', 5:'+80 DMG'}, breaks:[3,5] },
    'tank':    { name: 'Hộ Vệ',  color: '#2ecc71', buff: {3:'+250 HP', 5:'+600 HP'}, breaks:[3,5] },
    'ranger':  { name: 'Xạ Thủ', color: '#3498db', buff: {3:'+35% Tốc Đánh', 5:'+80% Tốc Đánh'}, breaks:[3,5] }
};

export const CHAMPS = [
    { id: 'garen',  name: 'Garen',  cost: 1, color: 0x882222, trait: 'warrior' },
    { id: 'darius', name: 'Darius', cost: 1, color: 0xaa4444, trait: 'warrior' },
    { id: 'vi',     name: 'Vi',     cost: 2, color: 0xc71585, trait: 'warrior' },
    { id: 'riven',  name: 'Riven',  cost: 3, color: 0xe67e22, trait: 'warrior' },
    { id: 'yasuo',  name: 'Yasuo',  cost: 4, color: 0x34495e, trait: 'warrior' },
    { id: 'poppy',  name: 'Poppy',  cost: 1, color: 0xcd853f, trait: 'tank' },
    { id: 'malph',  name: 'Malphite',cost: 1, color: 0x8b4513, trait: 'tank' },
    { id: 'fiora',  name: 'Fiora',  cost: 2, color: 0x228822, trait: 'tank' },
    { id: 'leo',    name: 'Leona',  cost: 3, color: 0x44aa44, trait: 'tank' },
    { id: 'braum',  name: 'Braum',  cost: 4, color: 0x2c3e50, trait: 'tank' },
    { id: 'vayne',  name: 'Vayne',  cost: 1, color: 0x4444aa, trait: 'ranger' },
    { id: 'cait',   name: 'Caitlyn',cost: 1, color: 0x5f9ea0, trait: 'ranger' },
    { id: 'varus',  name: 'Varus',  cost: 2, color: 0x800080, trait: 'ranger' },
    { id: 'ashe',   name: 'Ashe',   cost: 3, color: 0x222288, trait: 'ranger' },
    { id: 'jhin',   name: 'Jhin',   cost: 4, color: 0x8b0000, trait: 'ranger' }
];

// --- CẬP NHẬT: DỮ LIỆU QUÁI VẬT ---
// shape: 'box' (hộp), 'rock' (khối đá), 'cone' (nhọn)
export const MONSTERS = {
    'minion_melee': { id: 'minion_melee', name: "Lính Cận Chiến", isMonster: true, shape: 'box', color: 0x5555ff, scale: 0.8 },
    'minion_range': { id: 'minion_range', name: "Lính Đánh Xa", isMonster: true, shape: 'box', color: 0x8888ff, scale: 0.7 },
    'krug':         { id: 'krug',         name: "Người Đá",     isMonster: true, shape: 'rock', color: 0x8b4513, scale: 1.4 },
    'wolf':         { id: 'wolf',         name: "Sói Hắc Ám",   isMonster: true, shape: 'cone', color: 0x444444, scale: 1.0 }
};

// --- CẬP NHẬT: CẤU HÌNH STATS CHO QUÁI ---
export const STATS = {
    // Tướng (Giữ nguyên)
    'garen':  { hp: 600, dmg: 50, range: 1, as: 0.60, type: 'melee', skill: 'spin', armor: 30, skillInfo: { name: "Phán Quyết", desc: "Xoay kiếm gây sát thương diện rộng liên tục." } },
    'darius': { hp: 650, dmg: 55, range: 1, as: 0.55, type: 'melee', skill: 'guillotine', armor: 30, skillInfo: { name: "Máy Chém", desc: "Bổ rìu gây sát thương lớn và hồi máu." } },
    'vi':     { hp: 700, dmg: 65, range: 1, as: 0.65, type: 'melee', skill: 'uppercut', armor: 35, skillInfo: { name: "Tả Xung Hữu Đột", desc: "Đấm xuyên mục tiêu gây choáng." } },
    'riven':  { hp: 800, dmg: 75, range: 1, as: 0.70, type: 'melee', skill: 'wind_slash', armor: 35, skillInfo: { name: "Chém Gió", desc: "Phóng sóng năng lượng gây sát thương diện rộng." } },
    'yasuo':  { hp: 900, dmg: 90, range: 1, as: 0.80, type: 'melee', skill: 'tornado', armor: 30, skillInfo: { name: "Bão Kiếm", desc: "Phóng lốc xoáy gây sát thương và hất tung." } },

    'poppy':  { hp: 650, dmg: 40, range: 1, as: 0.55, type: 'melee', skill: 'hammer_smash', armor: 45, skillInfo: { name: "Sứ Giả Phán Quyết", desc: "Dậm búa gây choáng mục tiêu." } },
    'malph':  { hp: 700, dmg: 45, range: 1, as: 0.50, type: 'melee', skill: 'ground_slam', armor: 50, skillInfo: { name: "Dậm Đất", desc: "Gây sát thương diện rộng và làm chậm tốc đánh." } },
    'fiora':  { hp: 550, dmg: 45, range: 1, as: 0.80, type: 'melee', skill: 'grand_challenge', armor: 30, skillInfo: { name: "Đại Thử Thách", desc: "Tấn công điểm yếu, gây sát thương chuẩn và hồi máu." } },
    'leo':    { hp: 850, dmg: 40, range: 1, as: 0.50, type: 'melee', skill: 'solar_flare', armor: 50, skillInfo: { name: "Thái Dương Hạ San", desc: "Gọi cột sáng làm choáng kẻ địch ở trung tâm." } },
    'braum':  { hp: 1100,dmg: 50, range: 1, as: 0.45, type: 'melee', skill: 'ice_fissure', armor: 60, skillInfo: { name: "Băng Địa Chấn", desc: "Hất tung kẻ địch theo đường thẳng." } },

    'vayne':  { hp: 450, dmg: 60, range: 3, as: 0.75, type: 'range', projColor: 0xaaaaaa, skill: 'silver_bolts', armor: 20, skillInfo: { name: "Mũi Tên Bạc", desc: "Gây thêm sát thương chuẩn mỗi đòn đánh." } },
    'cait':   { hp: 500, dmg: 55, range: 6, as: 0.65, type: 'range', projColor: 0x00ff00, skill: 'ace_shot', armor: 20, skillInfo: { name: "Bách Phát Bách Trúng", desc: "Ngắm bắn gây sát thương cực lớn cho kẻ địch xa nhất." } },
    'varus':  { hp: 550, dmg: 70, range: 4, as: 0.70, type: 'range', projColor: 0xaa00aa, skill: 'corruption', armor: 25, skillInfo: { name: "Sợi Xích Tội Lỗi", desc: "Trói chân kẻ địch và lan sang mục tiêu lân cận." } },
    'ashe':   { hp: 500, dmg: 65, range: 4, as: 0.75, type: 'range', projColor: 0x00ffff, skill: 'crystal_arrow', armor: 20, skillInfo: { name: "Đại Băng Tiễn", desc: "Bắn mũi tên băng khổng lồ gây choáng." } },
    'jhin':   { hp: 600, dmg: 150,range: 5, as: 0.40, type: 'range', projColor: 0xff0000, skill: 'curtain_call', armor: 25, skillInfo: { name: "Sân Khấu Tử Thần", desc: "Bắn viên đạn thứ 4 chí mạng." } },

    // --- Stats Quái ---
    'minion_melee': { hp: 250, dmg: 25, range: 1, as: 0.6, type: 'melee', armor: 0 },
    'minion_range': { hp: 150, dmg: 35, range: 3, as: 0.7, type: 'range', projColor: 0x5555ff, armor: 0 },
    'krug':         { hp: 1000, dmg: 60, range: 1, as: 0.4, type: 'melee', armor: 40 }, // Trâu bò
    'wolf':         { hp: 450,  dmg: 80, range: 1, as: 0.9, type: 'melee', armor: 10 }  // Đánh nhanh
};

// --- CẬP NHẬT: LỊCH THI ĐẤU PVE ---
// Format: 'Stage-SubRound': [Danh sách quái]
export const PVE_ROUNDS = {
    '1-1': ['minion_melee', 'minion_melee'],
    '1-2': ['minion_melee', 'minion_range', 'minion_melee'],
    '1-3': ['minion_melee', 'minion_melee', 'minion_range', 'minion_range'],
    '2-7': ['krug', 'krug'],
    '3-7': ['wolf', 'wolf', 'wolf', 'wolf']
};

export const ITEMS = {
    'bf_sword': { name: "Kiếm B.F", icon: "⚔️", color: "#e74c3c", stats: { dmg: 15 } },
    'recurve_bow': { name: "Cung Gỗ", icon: "🏹", color: "#f1c40f", stats: { as: 0.15 } }, 
    'chain_vest': { name: "Giáp Lưới", icon: "🛡️", color: "#95a5a6", stats: { armor: 20 } },
    'giant_belt': { name: "Đai Khổng Lồ", icon: "🧣", color: "#e67e22", stats: { hp: 150 } },
    'tear': { name: "Nước Mắt", icon: "💧", color: "#3498db", stats: { mana: 15 } }
};

export const ARENA_RADIUS = 7.5; 
export const XP_TO_LEVEL = [0, 2, 6, 10, 20, 36, 56, 80, 100];
export const SHOP_ODDS = {
    1: [100, 0,  0,  0], 2: [100, 0,  0,  0], 3: [75,  25, 0,  0],
    4: [55,  30, 15, 0], 5: [45,  33, 20, 2], 6: [30,  40, 25, 5],
    7: [19,  30, 35, 16], 8: [15,  20, 35, 30], 9: [10,  15, 30, 45]
};
