// shared.js
// CẬP NHẬT: THÊM CẤU HÌNH THỜI GIAN ROUND ĐẤU

// ==========================================
// PHẦN 1: DATA & CONFIG
// ==========================================

export const SYNERGIES = {
    'warrior': { name: 'C.Binh', color: '#e74c3c', buff: {3:'+30 DMG', 5:'+80 DMG'}, breaks:[3,5] },
    'tank':    { name: 'Hộ Vệ',  color: '#2ecc71', buff: {3:'+250 HP', 5:'+600 HP'}, breaks:[3,5] },
    'ranger':  { name: 'Xạ Thủ', color: '#3498db', buff: {3:'+35% Tốc Đánh', 5:'+80% Tốc Đánh'}, breaks:[3,5] },
    'mage':    { name: 'Pháp Sư',color: '#9b59b6', buff: {3:'+40 AP', 5:'+100 AP'}, breaks:[3,5] },
    'assassin':{ name: 'Sát Thủ',color: '#c0392b', buff: {3:'+30% Crit', 5:'+60% Crit & +50% Crit Dmg'}, breaks:[3,5] }
};

export const CHAMPS = [
    { id: 'garen',  name: 'Garen',  cost: 1, color: 0x882222, trait: 'warrior', scale: 1.1 },
    { id: 'darius', name: 'Darius', cost: 1, color: 0xaa4444, trait: 'warrior', scale: 1.1 },
    { id: 'vi',     name: 'Vi',     cost: 2, color: 0xc71585, trait: 'warrior', scale: 1.0 },
    { id: 'riven',  name: 'Riven',  cost: 3, color: 0xe67e22, trait: 'warrior' },
    { id: 'yasuo',  name: 'Yasuo',  cost: 4, color: 0x34495e, trait: 'warrior' },
    { id: 'poppy',  name: 'Poppy',  cost: 1, color: 0xcd853f, trait: 'tank', scale: 0.9 },
    { id: 'malph',  name: 'Malphite',cost: 1, color: 0x8b4513, trait: 'tank', scale: 1.1 },
    { id: 'fiora',  name: 'Fiora',  cost: 2, color: 0x228822, trait: 'tank' },
    { id: 'leo',    name: 'Leona',  cost: 3, color: 0x44aa44, trait: 'tank', scale: 1.1 },
    { id: 'braum',  name: 'Braum',  cost: 4, color: 0x2c3e50, trait: 'tank', scale: 1.2 },
    { id: 'vayne',  name: 'Vayne',  cost: 1, color: 0x4444aa, trait: 'ranger' },
    { id: 'cait',   name: 'Caitlyn',cost: 1, color: 0x5f9ea0, trait: 'ranger' },
    { id: 'varus',  name: 'Varus',  cost: 2, color: 0x800080, trait: 'ranger' },
    { id: 'ashe',   name: 'Ashe',   cost: 3, color: 0x222288, trait: 'ranger' },
    { id: 'jhin',   name: 'Jhin',   cost: 4, color: 0x8b0000, trait: 'ranger' },
    { id: 'ziggs',  name: 'Ziggs',  cost: 1, color: 0xe056fd, trait: 'mage', scale: 0.9 },
    { id: 'tf',     name: 'T.Fate', cost: 1, color: 0x2980b9, trait: 'mage' },
    { id: 'annie',  name: 'Annie',  cost: 2, color: 0xd35400, trait: 'mage', scale: 0.9 },
    { id: 'lux',    name: 'Lux',    cost: 3, color: 0xf1c40f, trait: 'mage' },
    { id: 'velkoz', name: 'VelKoz', cost: 4, color: 0x8e44ad, trait: 'mage', scale: 1.1 },
    { id: 'khazix', name: 'KhaZix', cost: 1, color: 0x5e3c58, trait: 'assassin', scale: 1.0 },
    { id: 'noc',    name: 'Nocturne',cost: 1,color: 0x2c3e50, trait: 'assassin' },
    { id: 'zed',    name: 'Zed',    cost: 2, color: 0xffffff, trait: 'assassin' },
    { id: 'kat',    name: 'Katarina',cost: 3,color: 0xc0392b, trait: 'assassin' },
    { id: 'talon',  name: 'Talon',  cost: 4, color: 0x7f8c8d, trait: 'assassin' }
];

export const MONSTERS = {
    'minion_melee': { id: 'minion_melee', name: "Lính Cận Chiến", isMonster: true, shape: 'box', color: 0x5555ff, scale: 0.7 },
    'minion_range': { id: 'minion_range', name: "Lính Đánh Xa", isMonster: true, shape: 'box', color: 0x8888ff, scale: 0.6 },
    'krug':         { id: 'krug',         name: "Người Đá",     isMonster: true, shape: 'rock', color: 0x8b4513, scale: 1.2 },
    'wolf':         { id: 'wolf',         name: "Sói Hắc Ám",   isMonster: true, shape: 'cone', color: 0x444444, scale: 0.9 },
    'raptor':       { id: 'raptor',       name: "Chim Biến Dị", isMonster: true, shape: 'cone', color: 0xe74c3c, scale: 0.8 },
    'herald':       { id: 'herald',       name: "Sứ Giả",       isMonster: true, shape: 'rock', color: 0x800080, scale: 1.4 },
    'dragon':       { id: 'dragon',       name: "Rồng Ngàn Tuổi",isMonster:true, shape: 'rock', color: 0xffd700, scale: 1.8 }
};

export const STATS = {
    'garen':  { hp: 650, dmg: 55, range: 1, as: 0.60, type: 'melee', skill: 'spin', armor: 35, skillInfo: { name: "Phán Quyết", desc: "Xoay kiếm trong 3s, gây sát thương vật lý liên tục lên kẻ địch lân cận." } },
    'darius': { hp: 700, dmg: 60, range: 1, as: 0.55, type: 'melee', skill: 'guillotine', armor: 35, skillInfo: { name: "Máy Chém Noxus", desc: "Bổ rìu gây sát thương lớn và hồi máu cho bản thân." } },
    'vi':     { hp: 750, dmg: 70, range: 1, as: 0.65, type: 'melee', skill: 'uppercut', armor: 40, skillInfo: { name: "Tả Xung Hữu Đột", desc: "Đấm xuyên mục tiêu, gây sát thương và làm choáng 1.5s." } },
    'riven':  { hp: 850, dmg: 80, range: 1, as: 0.70, type: 'melee', skill: 'wind_slash', armor: 40, skillInfo: { name: "Chém Gió", desc: "Phóng sóng năng lượng gây sát thương diện rộng phía trước." } },
    'yasuo':  { hp: 950, dmg: 95, range: 1, as: 0.80, type: 'melee', skill: 'tornado', armor: 35, skillInfo: { name: "Trăn Trối", desc: "Phóng lốc xoáy hất tung và gây sát thương lên kẻ địch." } },
    'poppy':  { hp: 700, dmg: 45, range: 1, as: 0.55, type: 'melee', skill: 'hammer_smash', armor: 50, skillInfo: { name: "Sứ Giả Phán Quyết", desc: "Dậm búa gây sát thương và làm choáng mục tiêu 2s." } },
    'malph':  { hp: 750, dmg: 50, range: 1, as: 0.50, type: 'melee', skill: 'ground_slam', armor: 55, skillInfo: { name: "Dậm Đất", desc: "Dậm mạnh xuống đất gây sát thương diện rộng." } },
    'fiora':  { hp: 600, dmg: 50, range: 1, as: 0.80, type: 'melee', skill: 'grand_challenge', armor: 35, skillInfo: { name: "Phản Đòn", desc: "Chặn sát thương, sau đó đâm trả gây choáng và hồi máu." } },
    'leo':    { hp: 900, dmg: 45, range: 1, as: 0.50, type: 'melee', skill: 'solar_flare', armor: 60, skillInfo: { name: "Thái Dương Hạ San", desc: "Gọi cột sáng làm choáng kẻ địch ở trung tâm vụ nổ." } },
    'braum':  { hp: 1150,dmg: 55, range: 1, as: 0.45, type: 'melee', skill: 'ice_fissure', armor: 70, skillInfo: { name: "Băng Địa Chấn", desc: "Tạo khe nứt băng giá hất tung kẻ địch theo đường thẳng." } },
    'vayne':  { hp: 500, dmg: 65, range: 5, as: 0.75, type: 'range', projColor: 0xaaaaaa, skill: 'silver_bolts', armor: 20, skillInfo: { name: "Mũi Tên Bạc", desc: "Mỗi đòn đánh thứ 3 gây thêm sát thương chuẩn." } },
    'cait':   { hp: 550, dmg: 60, range: 8, as: 0.65, type: 'range', projColor: 0x00ff00, skill: 'ace_shot', armor: 20, skillInfo: { name: "Bách Phát Bách Trúng", desc: "Ngắm bắn gây sát thương cực lớn cho kẻ địch xa nhất." } },
    'varus':  { hp: 600, dmg: 75, range: 6, as: 0.70, type: 'range', projColor: 0xaa00aa, skill: 'corruption', armor: 25, skillInfo: { name: "Sợi Xích Tội Lỗi", desc: "Bắn ra dây xích trói chân và gây sát thương phép." } },
    'ashe':   { hp: 550, dmg: 70, range: 6, as: 0.75, type: 'range', projColor: 0x00ffff, skill: 'crystal_arrow', armor: 20, skillInfo: { name: "Đại Băng Tiễn", desc: "Bắn mũi tên băng khổng lồ làm choáng mục tiêu." } },
    'jhin':   { hp: 650, dmg: 160,range: 7, as: 0.50, type: 'range', projColor: 0xff0000, skill: 'curtain_call', armor: 25, skillInfo: { name: "Sân Khấu Tử Thần", desc: "Viên đạn thứ 4 chắc chắn chí mạng với sát thương khủng." } },
    'ziggs':  { hp: 480, dmg: 45, range: 4, as: 0.65, type: 'range', projColor: 0xe056fd, skill: 'bouncing_bomb', armor: 20, skillInfo: { name: "Bom Nảy", desc: "Ném bom gây sát thương phép lan cho mục tiêu và kẻ địch cạnh bên." } },
    'tf':     { hp: 520, dmg: 50, range: 4, as: 0.70, type: 'range', projColor: 0xffff00, skill: 'wild_cards', armor: 20, skillInfo: { name: "Phi Bài", desc: "Phi 3 lá bài theo hình nón gây sát thương phép." } },
    'annie':  { hp: 650, dmg: 55, range: 3, as: 0.60, type: 'range', projColor: 0xd35400, skill: 'disintegrate', armor: 35, skillInfo: { name: "Khiên Lửa", desc: "Tạo khiên bảo vệ bản thân và thiêu đốt kẻ địch xung quanh." } },
    'lux':    { hp: 580, dmg: 60, range: 7, as: 0.70, type: 'range', projColor: 0xffffff, skill: 'final_spark', armor: 25, skillInfo: { name: "Cầu Vồng Tối Thượng", desc: "Bắn dải sáng xuyên thấu gây sát thương phép cực mạnh." } },
    'velkoz': { hp: 700, dmg: 75, range: 5, as: 0.65, type: 'range', projColor: 0x8e44ad, skill: 'life_form_ray', armor: 30, skillInfo: { name: "Tia Phân Hủy", desc: "Bắn tia laser gây sát thương phép liên tục theo thời gian." } },
    'khazix': { hp: 550, dmg: 60, range: 1, as: 0.75, type: 'melee', skill: 'taste_fear', armor: 25, skillInfo: { name: "Nếm Mùi Sợ Hãi", desc: "Gây sát thương vật lý. x2 Sát thương nếu mục tiêu bị cô lập." } },
    'noc':    { hp: 600, dmg: 65, range: 1, as: 0.80, type: 'melee', skill: 'umbra_blades', armor: 30, skillInfo: { name: "Lưỡi Dao Bóng Tối", desc: "Xoay người gây sát thương diện rộng và hồi máu." } },
    'zed':    { hp: 650, dmg: 75, range: 1, as: 0.85, type: 'melee', skill: 'razor_shuriken', armor: 30, skillInfo: { name: "Phi Tiêu Sắc Lẻm", desc: "Ném phi tiêu xuyên thấu gây sát thương vật lý." } },
    'kat':    { hp: 700, dmg: 70, range: 1, as: 0.80, type: 'melee', skill: 'death_lotus', armor: 30, skillInfo: { name: "Bông Sen Tử Thần", desc: "Xoay dao tại chỗ gây sát thương phép cực lớn lên kẻ địch lân cận." } },
    'talon':  { hp: 750, dmg: 95, range: 1, as: 0.90, type: 'melee', skill: 'noxian_diplomacy', armor: 35, skillInfo: { name: "Ngoại Giao Kiểu Noxus", desc: "Đâm mạnh vào mục tiêu gây sát thương chí mạng." } },
    'minion_melee': { hp: 200, dmg: 15, range: 1, as: 0.6, type: 'melee', armor: 0 }, 
    'minion_range': { hp: 120, dmg: 20, range: 4, as: 0.7, type: 'range', projColor: 0x5555ff, armor: 0 },
    'krug':         { hp: 1200, dmg: 80, range: 1, as: 0.5, type: 'melee', armor: 50 },
    'wolf':         { hp: 600,  dmg: 110, range: 1, as: 1.0, type: 'melee', armor: 20 },
    'raptor':       { hp: 800,  dmg: 130,range: 1, as: 1.2, type: 'melee', armor: 20 },
    'herald':       { hp: 3000, dmg: 200, range: 1, as: 0.6, type: 'melee', armor: 60 },
    'dragon':       { hp: 6000, dmg: 300,range: 2, as: 0.6, type: 'melee', armor: 100, skill: 'dragon_breath' }
};

// --- CẤU HÌNH VÒNG ĐẤU ---
export const PVE_ROUNDS = {
    '1-1': ['minion_melee', 'minion_melee'],
    '1-2': ['minion_melee', 'minion_range', 'minion_melee'],
    '1-3': ['minion_melee', 'minion_melee', 'minion_range', 'minion_range'],
    '2-6': ['krug', 'krug', 'krug'],
    '3-6': ['wolf', 'wolf', 'wolf', 'wolf'],
    '4-6': ['raptor', 'raptor', 'raptor', 'raptor', 'raptor'],
    '5-6': ['herald'],
    '6-6': ['dragon']
};

// CẤU HÌNH THỜI GIAN
export const TIMERS = {
    PREP: 30, // Thời gian chuẩn bị (giây)
    COMBAT: 40 // Thời gian tối đa của 1 trận đấu (giây)
};

export const ITEMS = {
    'sword': { name: "Kiếm B.F", icon: "⚔️", color: "#e74c3c", isComponent: true, desc: "Tăng 10 Sát thương vật lý", stats: { dmg: 10 } },
    'bow':   { name: "Cung Gỗ", icon: "🏹", color: "#f1c40f", isComponent: true, desc: "Tăng 10% Tốc đánh", stats: { as: 0.10 } }, 
    'rod':   { name: "Gậy Quá Khổ", icon: "🪄", color: "#9b59b6", isComponent: true, desc: "Tăng 10 Sức mạnh phép thuật", stats: { dmg: 0 } }, 
    'tear':  { name: "Nước Mắt", icon: "💧", color: "#3498db", isComponent: true, desc: "Tăng 15 Mana khởi đầu", stats: { mana: 15 } },
    'vest':  { name: "Giáp Lưới", icon: "🛡️", color: "#95a5a6", isComponent: true, desc: "Tăng 20 Giáp", stats: { armor: 20 } },
    'belt':  { name: "Đai Khổng Lồ", icon: "🧣", color: "#e67e22", isComponent: true, desc: "Tăng 150 Máu", stats: { hp: 150 } },
    'deathblade': { name: "Kiếm Tử Thần", icon: "🗡️", color: "#c0392b", desc: "Tăng mạnh sát thương vật lý (+50 DMG).", stats: { dmg: 50 } },
    'giant_slayer': { name: "Diệt Khổng Lồ", icon: "🎸", color: "#e67e22", desc: "Tăng sát thương và tốc đánh (+20 DMG, +15% AS).", stats: { dmg: 20, as: 0.15 } },
    'gunblade': { name: "Kiếm Súng", icon: "🔫", color: "#9b59b6", desc: "Hồi máu dựa trên sát thương gây ra (+15 DMG).", stats: { dmg: 15 } },
    'shojin': { name: "Ngọn Giáo Shojin", icon: "🔱", color: "#3498db", desc: "Đòn đánh hồi thêm mana (+15 DMG, +15 Mana).", stats: { dmg: 15, mana: 15 } },
    'ga': { name: "Giáp Thiên Thần", icon: "👼", color: "#fff", desc: "Tăng giáp và sát thương (+10 DMG, +20 Armor).", stats: { dmg: 10, armor: 20 } },
    'zeke': { name: "Cờ Lệnh Zeke", icon: "🚩", color: "#d35400", desc: "Tăng máu và sát thương (+10 DMG, +150 HP).", stats: { dmg: 10, hp: 150 } },
    'guinsoo': { name: "Cuồng Đao", icon: "🪓", color: "#d35400", desc: "Tăng tốc đánh cộng dồn mỗi đòn đánh (+20% AS).", stats: { as: 0.20 } },
    'shiv': { name: "Dao Điện", icon: "⚡", color: "#f1c40f", desc: "Mỗi 3 đòn đánh giật sét gây sát thương phép (+20% AS, +15 Mana).", stats: { as: 0.20, mana: 15 } },
    'titan': { name: "Quyền Năng", icon: "🛡️", color: "#2ecc71", desc: "Tăng giáp và tốc đánh khi nhận sát thương (+15% AS, +20 Armor).", stats: { as: 0.15, armor: 20 } },
    'zzrot': { name: "Thông Đạo", icon: "👾", color: "#8e44ad", desc: "Triệu hồi bọ hư không khi chết (+15% AS, +150 HP).", stats: { as: 0.15, hp: 150 } },
    'rabadon': { name: "Mũ Phù Thủy", icon: "🎩", color: "#8e44ad", desc: "Tăng cực đại sức mạnh phép thuật.", stats: { dmg: 30 } },
    'archangel': { name: "Quyền Trượng", icon: "⚕️", color: "#3498db", desc: "Hồi mana theo thời gian (+20 Mana).", stats: { mana: 20 } },
    'ionic': { name: "Nỏ Sét", icon: "🌩️", color: "#f1c40f", desc: "Giật sét kẻ địch dùng kỹ năng (+20 Armor).", stats: { armor: 20 } },
    'morello': { name: "Quỷ Thư", icon: "📖", color: "#c0392b", desc: "Kỹ năng gây thiêu đốt (+150 HP).", stats: { hp: 150 } },
    'blue_buff': { name: "Bùa Xanh", icon: "🔵", color: "#3498db", desc: "Hồi 20 mana sau khi dùng kỹ năng (+30 Mana).", stats: { mana: 30 } },
    'frozen_heart': { name: "Tim Băng", icon: "❄️", color: "#bdc3c7", desc: "Giảm tốc đánh kẻ địch xung quanh (+15 Mana, +20 Armor).", stats: { mana: 15, armor: 20 } },
    'redemption': { name: "Dây Chuyền Chuộc Tội", icon: "💚", color: "#2ecc71", desc: "Hồi máu cho đồng minh khi chết (+15 Mana, +150 HP).", stats: { mana: 15, hp: 150 } },
    'bramble': { name: "Giáp Gai", icon: "🌵", color: "#e74c3c", desc: "Phản sát thương khi bị đánh (+40 Armor).", stats: { armor: 40 } },
    'sunfire': { name: "Áo Choàng Lửa", icon: "🔥", color: "#e67e22", desc: "Thiêu đốt kẻ địch xung quanh (+20 Armor, +150 HP).", stats: { armor: 20, hp: 150 } },
    'warmog': { name: "Giáp Máu", icon: "❤️", color: "#2ecc71", desc: "Tăng lượng máu khổng lồ (+600 HP).", stats: { hp: 600 } }
};

export const RECIPES = {
    'sword_sword': 'deathblade', 'bow_sword': 'giant_slayer', 'rod_sword': 'gunblade', 'sword_tear': 'shojin', 'sword_vest': 'ga', 'belt_sword': 'zeke',
    'bow_bow': 'guinsoo', 'bow_rod': 'guinsoo', 'bow_tear': 'shiv', 'bow_vest': 'titan', 'belt_bow': 'zzrot',
    'rod_rod': 'rabadon', 'rod_tear': 'archangel', 'rod_vest': 'ionic', 'belt_rod': 'morello',
    'tear_tear': 'blue_buff', 'tear_vest': 'frozen_heart', 'belt_tear': 'redemption',
    'vest_vest': 'bramble', 'belt_vest': 'sunfire',
    'belt_belt': 'warmog'
};

export const ARENA_RADIUS = 7.5; 
export const XP_TO_LEVEL = [0, 2, 6, 10, 20, 36, 56, 80, 100, 150];
export const SHOP_ODDS = {
    1: [100, 0,  0,  0], 2: [100, 0,  0,  0], 3: [75,  25, 0,  0],
    4: [55,  30, 15, 0], 5: [45,  33, 20, 2], 6: [30,  40, 25, 5],
    7: [19,  30, 35, 16], 8: [15,  20, 35, 30], 9: [10,  15, 30, 45]
};

export const SKILLS = {
    'spin': (u, t, units) => { u.gm.view.spawnVFX(u.group.position, 'spin_gold'); units.forEach(e => { if(e.team !== u.team && u.group.position.distanceTo(e.group.position) < 3) e.takeDmg(u.currStats.dmg * 2.5 * u.star); }); },
    'guillotine': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'red_beam'); t.takeDmg(u.currStats.dmg * 3 * u.star); u.hp = Math.min(u.hp+150*u.star, u.maxHp); u.updateBar(); } },
    'uppercut': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'pink_explosion'); t.takeDmg(u.currStats.dmg * 2.5 * u.star); t.applyStun(1.5); } },
    'wind_slash': (u, t, units) => { u.gm.view.spawnVFX(u.group.position, 'green_wave'); units.forEach(e => { if(e.team !== u.team && u.group.position.distanceTo(e.group.position) < 3) e.takeDmg(u.currStats.dmg * 2 * u.star); }); },
    'tornado': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'tornado_grey'); units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(t.group.position) < 2) { e.takeDmg(u.currStats.dmg * 2 * u.star); e.applyStun(1.5); }}); } },
    'hammer_smash': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'yellow_smash'); t.takeDmg(u.currStats.dmg * 2 * u.star); t.applyStun(2); } },
    'ground_slam': (u, t, units) => { u.gm.view.spawnVFX(u.group.position, 'rock_explosion'); units.forEach(e => { if(e.team !== u.team && u.group.position.distanceTo(e.group.position) < 3) { e.takeDmg(150 * u.star); e.applyStun(1.5); }}); },
    'grand_challenge': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'vital_break'); t.takeDmg(u.currStats.dmg * 3 * u.star); u.hp = Math.min(u.hp+200*u.star, u.maxHp); u.updateBar(); } },
    'solar_flare': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'solar_beam'); units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(t.group.position) < 2.5) { e.takeDmg(100 * u.star); e.applyStun(2); }}); } },
    'ice_fissure': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'ice_spikes'); t.takeDmg(u.currStats.dmg * 1.5 * u.star); t.applyStun(2.5); } },
    'silver_bolts': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'silver_ring'); t.takeDmg(u.currStats.dmg * 1.5 * u.star + 100*u.star); } },
    'ace_shot': (u, t, units) => { if(t) { u.gm.view.spawnProjectile(u.group.position, t, 0xff0000, u.currStats.dmg * 4 * u.star, false); } },
    'corruption': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'purple_root'); t.takeDmg(u.currStats.dmg * 2 * u.star); t.applyStun(2); } },
    'crystal_arrow': (u, t, units) => { if(t) { u.gm.view.spawnProjectile(u.group.position, t, 0x00ffff, u.currStats.dmg * 2.5 * u.star, true); } },
    'curtain_call': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'jhin_flower'); t.takeDmg(u.currStats.dmg * 4 * u.star); } },
    'bouncing_bomb': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'purple_bomb'); units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(t.group.position) < 2) e.takeDmg(u.currStats.dmg * 3 * u.star); }); } },
    'wild_cards': (u, t, units) => { if(t) { u.gm.view.spawnVFX(u.group.position, 'card_throw'); units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(u.group.position) < 4) e.takeDmg(u.currStats.dmg * 2.5 * u.star); }); } },
    'disintegrate': (u, t, units) => { if(t) { u.gm.view.spawnVFX(u.group.position, 'fire_shield'); u.shield += 250 * u.star; units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(u.group.position) < 2.5) e.takeDmg(u.currStats.dmg * 3 * u.star); }); } },
    'final_spark': (u, t, units) => { if(t) { const start = u.group.position.clone(); const end = t.group.position.clone(); const dir = new THREE.Vector3().subVectors(end, start).normalize(); u.gm.view.spawnVFX(u.group.position, 'rainbow_laser'); units.forEach(e => { if(e.team !== u.team) { const v = new THREE.Vector3().subVectors(e.group.position, start); const dist = v.dot(dir); if (dist > 0 && dist < 12 && v.cross(dir).length() < 1.5) { e.takeDmg(u.currStats.dmg * 4 * u.star); } } }); } },
    'life_form_ray': (u, t, units) => { if(t) { u.gm.view.spawnVFX(u.group.position, 'void_ray'); units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(u.group.position) < 6) e.takeDmg(u.currStats.dmg * 5 * u.star); }); } },
    'taste_fear': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'void_slash'); let isolated = true; units.forEach(e => { if(e !== t && e.team === t.team && e.group.position.distanceTo(t.group.position) < 1.5) isolated = false; }); const dmg = u.currStats.dmg * 3 * u.star * (isolated ? 2 : 1); t.takeDmg(dmg); } },
    'umbra_blades': (u, t, units) => { u.gm.view.spawnVFX(u.group.position, 'shadow_spin'); units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(u.group.position) < 2) { e.takeDmg(u.currStats.dmg * 2.5 * u.star); } }); u.hp = Math.min(u.hp + 100 * u.star, u.maxHp); u.updateBar(); },
    'razor_shuriken': (u, t, units) => { if(t) { u.gm.view.spawnVFX(u.group.position, 'shuriken'); units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(t.group.position) < 2) e.takeDmg(u.currStats.dmg * 3 * u.star); }); } },
    'death_lotus': (u, t, units) => { u.gm.view.spawnVFX(u.group.position, 'shadow_spin'); units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(u.group.position) < 2.5) { e.takeDmg(u.currStats.dmg * 4 * u.star); } }); },
    'noxian_diplomacy': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'noxus_stab'); t.takeDmg(u.currStats.dmg * 5 * u.star); } },
    'dragon_breath': (u, t, units) => { if(t) { u.gm.view.spawnVFX(u.group.position, 'solar_beam'); units.forEach(e => { if(e.team !== u.team) e.takeDmg(400); }); } },
    'default': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'impact'); t.takeDmg(u.currStats.dmg * 1.5); } }
};

export const AUGMENT_ROUNDS = ['1-5', '2-5', '3-5'];

export const AUGMENTS = [
    { id: 'glass_cannon', name: 'Chiến Binh Giấy', desc: 'Toàn đội +30% Sát thương, nhưng -15% Máu tối đa.', type: 'combat', stats: { dmgPct: 30, hpPct: -15 } },
    { id: 'hunter_instinct', name: 'Thợ Săn', desc: 'Toàn đội nhận +20% Tốc độ đánh.', type: 'combat', stats: { as: 0.20 } },
    { id: 'tiny_power', name: 'Sức Mạnh Tí Hon', desc: 'Toàn đội tăng 15% Sát thương và di chuyển nhanh hơn.', type: 'combat', stats: { dmgPct: 15 } },
    { id: 'sniper_nest', name: 'Tầm Xa', desc: 'Tướng đánh xa (Range) nhận +1 Tầm đánh và +10% Sát thương.', type: 'combat', stats: { rangeDmg: 10, rangeBoost: 1 } },
    { id: 'giant_growth', name: 'Khổng Lồ Hóa', desc: 'Toàn đội +300 Máu, nhưng bị giảm 10% Tốc đánh.', type: 'def', stats: { hp: 300, as: -0.10 } },
    { id: 'first_aid', name: 'Túi Cứu Thương', desc: 'Hồi 20 Máu Linh Thú ngay lập tức.', type: 'heal_player', instant: true },
    { id: 'vampirism', name: 'Ma Cà Rồng', desc: 'Toàn đội hồi máu bằng 15% sát thương gây ra.', type: 'combat', stats: { lifesteal: 15 } },
    { id: 'exoskeleton', name: 'Giáp Cốt', desc: 'Toàn đội nhận +30 Giáp.', type: 'def', stats: { armor: 30 } },
    { id: 'twins', name: 'Song Sinh', desc: 'Tướng 1 Vàng nhận thêm 300 Máu.', type: 'def', stats: { cost1Hp: 300 } },
    { id: 'windfall', name: 'Kho Báu', desc: 'Nhận ngay 15 vàng.', type: 'eco', instant: true },
    { id: 'rich_get_richer', name: 'Đại Gia', desc: 'Lợi tức tối đa tăng lên 7 (thay vì 5). Nhận ngay 10 vàng.', type: 'eco', instant: true },
    { id: 'secret_weapon', name: 'Vũ Khí Bí Mật', desc: 'Nhận ngay 1 mảnh trang bị ngẫu nhiên.', type: 'item', instant: true },
    { id: 'forge', name: 'Lò Rèn', desc: 'Nhận ngay 1 trang bị hoàn chỉnh ngẫu nhiên.', type: 'item', instant: true },
    { id: 'scholar', name: 'Học Giả', desc: 'Nhận ngay 8 Kinh nghiệm.', type: 'xp', instant: true },
    { id: 'new_recruit', name: 'Tuyển Quân', desc: 'Tăng sức chứa đội hình thêm +1.', type: 'utility', instant: true },
    { id: 'blue_battery', name: 'Năng Lượng Xanh', desc: 'Toàn đội hồi 10 Mana sau khi dùng kỹ năng.', type: 'mana', stats: { manaRefund: 10 } }
];
