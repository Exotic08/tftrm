// shared.js
// CẬP NHẬT: PROJECTILE PHÁT SÁNG (GLOW) & GIỮ NGUYÊN DATA ĐÃ UPDATE

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
    // Warrior
    { id: 'garen',  name: 'Garen',  cost: 1, color: 0x882222, trait: 'warrior' },
    { id: 'darius', name: 'Darius', cost: 1, color: 0xaa4444, trait: 'warrior' },
    { id: 'vi',     name: 'Vi',     cost: 2, color: 0xc71585, trait: 'warrior' },
    { id: 'riven',  name: 'Riven',  cost: 3, color: 0xe67e22, trait: 'warrior' },
    { id: 'yasuo',  name: 'Yasuo',  cost: 4, color: 0x34495e, trait: 'warrior' },
    // Tank
    { id: 'poppy',  name: 'Poppy',  cost: 1, color: 0xcd853f, trait: 'tank' },
    { id: 'malph',  name: 'Malphite',cost: 1, color: 0x8b4513, trait: 'tank' },
    { id: 'fiora',  name: 'Fiora',  cost: 2, color: 0x228822, trait: 'tank' },
    { id: 'leo',    name: 'Leona',  cost: 3, color: 0x44aa44, trait: 'tank' },
    { id: 'braum',  name: 'Braum',  cost: 4, color: 0x2c3e50, trait: 'tank' },
    // Ranger
    { id: 'vayne',  name: 'Vayne',  cost: 1, color: 0x4444aa, trait: 'ranger' },
    { id: 'cait',   name: 'Caitlyn',cost: 1, color: 0x5f9ea0, trait: 'ranger' },
    { id: 'varus',  name: 'Varus',  cost: 2, color: 0x800080, trait: 'ranger' },
    { id: 'ashe',   name: 'Ashe',   cost: 3, color: 0x222288, trait: 'ranger' },
    { id: 'jhin',   name: 'Jhin',   cost: 4, color: 0x8b0000, trait: 'ranger' },
    // Mage
    { id: 'ziggs',  name: 'Ziggs',  cost: 1, color: 0xe056fd, trait: 'mage' },
    { id: 'tf',     name: 'T.Fate', cost: 1, color: 0x2980b9, trait: 'mage' },
    { id: 'annie',  name: 'Annie',  cost: 2, color: 0xd35400, trait: 'mage' },
    { id: 'lux',    name: 'Lux',    cost: 3, color: 0xf1c40f, trait: 'mage' },
    { id: 'velkoz', name: 'VelKoz', cost: 4, color: 0x8e44ad, trait: 'mage' },
    // Assassin
    { id: 'khazix', name: 'KhaZix', cost: 1, color: 0x5e3c58, trait: 'assassin' },
    { id: 'noc',    name: 'Nocturne',cost: 1,color: 0x2c3e50, trait: 'assassin' },
    { id: 'zed',    name: 'Zed',    cost: 2, color: 0xffffff, trait: 'assassin' },
    { id: 'kat',    name: 'Katarina',cost: 3,color: 0xc0392b, trait: 'assassin' },
    { id: 'talon',  name: 'Talon',  cost: 4, color: 0x7f8c8d, trait: 'assassin' }
];

// --- NERF QUÁI ĐẦU GAME ---
export const MONSTERS = {
    'minion_melee': { id: 'minion_melee', name: "Lính Cận Chiến", isMonster: true, shape: 'box', color: 0x5555ff, scale: 0.8 },
    'minion_range': { id: 'minion_range', name: "Lính Đánh Xa", isMonster: true, shape: 'box', color: 0x8888ff, scale: 0.7 },
    'krug':         { id: 'krug',         name: "Người Đá",     isMonster: true, shape: 'rock', color: 0x8b4513, scale: 1.4 },
    'wolf':         { id: 'wolf',         name: "Sói Hắc Ám",   isMonster: true, shape: 'cone', color: 0x444444, scale: 1.0 },
    'raptor':       { id: 'raptor',       name: "Chim Biến Dị", isMonster: true, shape: 'cone', color: 0xe74c3c, scale: 0.9 },
    'dragon':       { id: 'dragon',       name: "Rồng Ngàn Tuổi",isMonster:true, shape: 'rock', color: 0xffd700, scale: 2.5 }
};

// Cấu hình chỉ số và MÔ TẢ KỸ NĂNG
export const STATS = {
    // --- WARRIORS ---
    'garen':  { hp: 600, dmg: 50, range: 1, as: 0.60, type: 'melee', skill: 'spin', armor: 30, skillInfo: { name: "Phán Quyết", desc: "Xoay kiếm trong 3s, gây sát thương vật lý liên tục lên kẻ địch lân cận." } },
    'darius': { hp: 650, dmg: 55, range: 1, as: 0.55, type: 'melee', skill: 'guillotine', armor: 30, skillInfo: { name: "Máy Chém Noxus", desc: "Bổ rìu gây sát thương lớn và hồi máu cho bản thân." } },
    'vi':     { hp: 700, dmg: 65, range: 1, as: 0.65, type: 'melee', skill: 'uppercut', armor: 35, skillInfo: { name: "Tả Xung Hữu Đột", desc: "Đấm xuyên mục tiêu, gây sát thương và làm choáng 1.5s." } },
    'riven':  { hp: 800, dmg: 75, range: 1, as: 0.70, type: 'melee', skill: 'wind_slash', armor: 35, skillInfo: { name: "Chém Gió", desc: "Phóng sóng năng lượng gây sát thương diện rộng phía trước." } },
    'yasuo':  { hp: 900, dmg: 90, range: 1, as: 0.80, type: 'melee', skill: 'tornado', armor: 30, skillInfo: { name: "Trăn Trối", desc: "Phóng lốc xoáy hất tung và gây sát thương lên kẻ địch." } },

    // --- TANKS ---
    'poppy':  { hp: 650, dmg: 40, range: 1, as: 0.55, type: 'melee', skill: 'hammer_smash', armor: 45, skillInfo: { name: "Sứ Giả Phán Quyết", desc: "Dậm búa gây sát thương và làm choáng mục tiêu 2s." } },
    'malph':  { hp: 700, dmg: 45, range: 1, as: 0.50, type: 'melee', skill: 'ground_slam', armor: 50, skillInfo: { name: "Dậm Đất", desc: "Dậm mạnh xuống đất gây sát thương diện rộng." } },
    'fiora':  { hp: 550, dmg: 45, range: 1, as: 0.80, type: 'melee', skill: 'grand_challenge', armor: 30, skillInfo: { name: "Phản Đòn", desc: "Chặn sát thương, sau đó đâm trả gây choáng và hồi máu." } },
    'leo':    { hp: 850, dmg: 40, range: 1, as: 0.50, type: 'melee', skill: 'solar_flare', armor: 50, skillInfo: { name: "Thái Dương Hạ San", desc: "Gọi cột sáng làm choáng kẻ địch ở trung tâm vụ nổ." } },
    'braum':  { hp: 1100,dmg: 50, range: 1, as: 0.45, type: 'melee', skill: 'ice_fissure', armor: 60, skillInfo: { name: "Băng Địa Chấn", desc: "Tạo khe nứt băng giá hất tung kẻ địch theo đường thẳng." } },

    // --- RANGERS ---
    'vayne':  { hp: 450, dmg: 60, range: 3, as: 0.75, type: 'range', projColor: 0xaaaaaa, skill: 'silver_bolts', armor: 20, skillInfo: { name: "Mũi Tên Bạc", desc: "Mỗi đòn đánh thứ 3 gây thêm sát thương chuẩn." } },
    'cait':   { hp: 500, dmg: 55, range: 6, as: 0.65, type: 'range', projColor: 0x00ff00, skill: 'ace_shot', armor: 20, skillInfo: { name: "Bách Phát Bách Trúng", desc: "Ngắm bắn gây sát thương cực lớn cho kẻ địch xa nhất." } },
    'varus':  { hp: 550, dmg: 70, range: 4, as: 0.70, type: 'range', projColor: 0xaa00aa, skill: 'corruption', armor: 25, skillInfo: { name: "Sợi Xích Tội Lỗi", desc: "Bắn ra dây xích trói chân và gây sát thương phép." } },
    'ashe':   { hp: 500, dmg: 65, range: 4, as: 0.75, type: 'range', projColor: 0x00ffff, skill: 'crystal_arrow', armor: 20, skillInfo: { name: "Đại Băng Tiễn", desc: "Bắn mũi tên băng khổng lồ làm choáng mục tiêu." } },
    'jhin':   { hp: 600, dmg: 150,range: 5, as: 0.40, type: 'range', projColor: 0xff0000, skill: 'curtain_call', armor: 25, skillInfo: { name: "Sân Khấu Tử Thần", desc: "Viên đạn thứ 4 chắc chắn chí mạng với sát thương khủng." } },

    // --- MAGES ---
    'ziggs':  { hp: 450, dmg: 40, range: 3, as: 0.65, type: 'range', projColor: 0xe056fd, skill: 'bouncing_bomb', armor: 20, skillInfo: { name: "Bom Nảy", desc: "Ném bom gây sát thương phép lan cho mục tiêu và kẻ địch cạnh bên." } },
    'tf':     { hp: 500, dmg: 45, range: 3, as: 0.70, type: 'range', projColor: 0xffff00, skill: 'wild_cards', armor: 20, skillInfo: { name: "Phi Bài", desc: "Phi 3 lá bài theo hình nón gây sát thương phép." } },
    'annie':  { hp: 600, dmg: 50, range: 2, as: 0.60, type: 'range', projColor: 0xd35400, skill: 'disintegrate', armor: 30, skillInfo: { name: "Khiên Lửa", desc: "Tạo khiên bảo vệ bản thân và thiêu đốt kẻ địch xung quanh." } },
    'lux':    { hp: 550, dmg: 55, range: 4, as: 0.70, type: 'range', projColor: 0xffffff, skill: 'final_spark', armor: 25, skillInfo: { name: "Cầu Vồng Tối Thượng", desc: "Bắn dải sáng xuyên thấu gây sát thương phép cực mạnh." } },
    'velkoz': { hp: 650, dmg: 70, range: 3, as: 0.65, type: 'range', projColor: 0x8e44ad, skill: 'life_form_ray', armor: 30, skillInfo: { name: "Tia Phân Hủy", desc: "Bắn tia laser gây sát thương phép liên tục theo thời gian." } },

    // --- ASSASSINS ---
    'khazix': { hp: 500, dmg: 55, range: 1, as: 0.75, type: 'melee', skill: 'taste_fear', armor: 25, skillInfo: { name: "Nếm Mùi Sợ Hãi", desc: "Gây sát thương vật lý. x2 Sát thương nếu mục tiêu bị cô lập." } },
    'noc':    { hp: 550, dmg: 60, range: 1, as: 0.80, type: 'melee', skill: 'umbra_blades', armor: 30, skillInfo: { name: "Lưỡi Dao Bóng Tối", desc: "Xoay người gây sát thương diện rộng và hồi máu." } },
    'zed':    { hp: 600, dmg: 70, range: 1, as: 0.85, type: 'melee', skill: 'razor_shuriken', armor: 30, skillInfo: { name: "Phi Tiêu Sắc Lẻm", desc: "Ném phi tiêu xuyên thấu gây sát thương vật lý." } },
    'kat':    { hp: 650, dmg: 65, range: 1, as: 0.80, type: 'melee', skill: 'death_lotus', armor: 30, skillInfo: { name: "Bông Sen Tử Thần", desc: "Xoay dao tại chỗ gây sát thương phép cực lớn lên kẻ địch lân cận." } },
    'talon':  { hp: 700, dmg: 90, range: 1, as: 0.90, type: 'melee', skill: 'noxian_diplomacy', armor: 35, skillInfo: { name: "Ngoại Giao Kiểu Noxus", desc: "Đâm mạnh vào mục tiêu gây sát thương chí mạng." } },

    // --- MONSTERS (NERFED) ---
    'minion_melee': { hp: 160, dmg: 12, range: 1, as: 0.6, type: 'melee', armor: 0 }, 
    'minion_range': { hp: 100, dmg: 15, range: 3, as: 0.7, type: 'range', projColor: 0x5555ff, armor: 0 },
    'krug':         { hp: 1000, dmg: 60, range: 1, as: 0.4, type: 'melee', armor: 40 },
    'wolf':         { hp: 450,  dmg: 80, range: 1, as: 0.9, type: 'melee', armor: 10 },
    'raptor':       { hp: 700,  dmg: 110,range: 1, as: 1.1, type: 'melee', armor: 10 },
    'dragon':       { hp: 5000, dmg: 250,range: 2, as: 0.5, type: 'melee', armor: 80, skill: 'dragon_breath' }
};

export const PVE_ROUNDS = {
    '1-1': ['minion_melee', 'minion_melee'],
    '1-2': ['minion_melee', 'minion_range', 'minion_melee'],
    '1-3': ['minion_melee', 'minion_melee', 'minion_range', 'minion_range'],
    '2-7': ['krug', 'krug', 'krug'],
    '3-7': ['wolf', 'wolf', 'wolf', 'wolf'],
    '4-7': ['raptor', 'raptor', 'raptor', 'raptor', 'raptor'],
    '5-7': ['dragon']
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

// ==========================================
// PHẦN 2: VISUAL EFFECTS
// ==========================================
export class VisualEffect {
    constructor(scene, pos, type) {
        this.scene = scene; this.life = 0; this.type = type;
        this.mesh = new THREE.Group();
        this.mesh.position.copy(pos);
        this.scene.add(this.mesh);
        this.particles = [];

        const createParticles = (count, color, size, speed) => {
            const geo = new THREE.BoxGeometry(size, size, size);
            const mat = new THREE.MeshBasicMaterial({ color: color });
            for(let i=0; i<count; i++) {
                const p = new THREE.Mesh(geo, mat);
                p.position.set((Math.random()-0.5), (Math.random()), (Math.random()-0.5));
                p.userData.vel = new THREE.Vector3((Math.random()-0.5)*speed, (Math.random())*speed, (Math.random()-0.5)*speed);
                this.mesh.add(p);
                this.particles.push(p);
            }
        };

        if (type === 'spin_gold') {
            const geo = new THREE.CylinderGeometry(3, 2, 4, 16, 1, true);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent:true, opacity:0.6, side:THREE.DoubleSide });
            this.mainObj = new THREE.Mesh(geo, mat); this.mesh.add(this.mainObj); this.maxLife = 20;
        } else if (type === 'red_beam') {
            const geo = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent:true, opacity:0.8 });
            this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.position.y = 7; this.mesh.add(this.mainObj);
            createParticles(10, 0x880000, 0.3, 0.5); this.maxLife = 20;
        } else if (type === 'pink_explosion') {
            const geo = new THREE.SphereGeometry(2, 16, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent:true, opacity:0.5, wireframe:true });
            this.mainObj = new THREE.Mesh(geo, mat); this.mesh.add(this.mainObj);
            createParticles(15, 0x00ffff, 0.2, 0.8); this.maxLife = 20;
        } else if (type === 'green_wave') {
            const geo = new THREE.RingGeometry(1, 4, 32, 1, 0, Math.PI); 
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent:true, opacity:0.6, side:THREE.DoubleSide });
            this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.rotation.x = -Math.PI/2; this.mainObj.position.y = 0.5;
            this.mesh.add(this.mainObj); this.maxLife = 15;
        } else if (type === 'tornado_grey') {
            const geo = new THREE.ConeGeometry(1.5, 5, 8, 1, true);
            const mat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent:true, opacity:0.7 });
            this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.geometry.translate(0, 2.5, 0); 
            this.mainObj.rotation.x = Math.PI; this.mesh.add(this.mainObj); this.maxLife = 25;
        } else if (type === 'yellow_smash') {
            const geo = new THREE.CylinderGeometry(2, 2, 0.5, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            this.mainObj = new THREE.Mesh(geo, mat); this.mesh.add(this.mainObj);
            createParticles(8, 0xffffaa, 0.4, 0.4); this.maxLife = 15;
        } else if (type === 'rock_explosion') {
            createParticles(25, 0x8b4513, 0.6, 0.6); this.maxLife = 25;
        } else if (type === 'vital_break') {
            this.subGroup = new THREE.Group();
            const geo = new THREE.SphereGeometry(0.3); const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            for(let i=0; i<4; i++) {
                const m = new THREE.Mesh(geo, mat); m.position.set(Math.cos(i*Math.PI/2)*1.5, 1, Math.sin(i*Math.PI/2)*1.5);
                this.subGroup.add(m);
            }
            this.mesh.add(this.subGroup); this.maxLife = 20;
        } else if (type === 'solar_beam') {
            const geo = new THREE.CylinderGeometry(1.5, 1.5, 20, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent:true, opacity:0.5, blending: THREE.AdditiveBlending });
            this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.position.y = 10;
            this.mesh.add(this.mainObj); this.maxLife = 30;
        } else if (type === 'ice_spikes') {
            const geo = new THREE.ConeGeometry(1, 3, 4); const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
            for(let i=0; i<5; i++) {
                const spike = new THREE.Mesh(geo, mat); spike.position.set((Math.random()-0.5)*2, 0, (Math.random()-0.5)*2);
                spike.rotation.x = (Math.random()-0.5)*0.5; this.mesh.add(spike);
            }
            this.maxLife = 25;
        } else if (type === 'silver_ring') {
            const geo = new THREE.RingGeometry(0.5, 0.8, 32);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side:THREE.DoubleSide, transparent:true });
            this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.rotation.x = Math.PI/2; this.mainObj.position.y = 1;
            this.mesh.add(this.mainObj); this.maxLife = 15;
        } else if (type === 'purple_root') {
            const geo = new THREE.TorusKnotGeometry(1, 0.2, 64, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0x800080 });
            this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.position.y = 1; this.mesh.add(this.mainObj);
            this.maxLife = 30;
        } else if (type === 'jhin_flower') {
            const geo = new THREE.ConeGeometry(3, 5, 4, 1, true);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent:true, opacity:0.8, wireframe:true });
            this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.rotation.x = Math.PI; this.mainObj.position.y = 2;
            this.mesh.add(this.mainObj);
            createParticles(20, 0xff0000, 0.2, 0.8); this.maxLife = 35;
        } 
        
        else if (type === 'purple_bomb') { 
            const geo = new THREE.SphereGeometry(1.2, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xe056fd, wireframe:true });
            this.mainObj = new THREE.Mesh(geo, mat); this.mesh.add(this.mainObj);
            createParticles(10, 0xe056fd, 0.3, 0.7); this.maxLife = 20;
        } 
        else if (type === 'card_throw') { 
            this.subGroup = new THREE.Group();
            const geo = new THREE.BoxGeometry(0.4, 0.05, 0.6);
            const colors = [0xff0000, 0xffff00, 0x0000ff];
            for(let i=-1; i<=1; i++) {
                const c = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: colors[i+1] }));
                c.position.set(i*0.8, 1, 0); c.rotation.y = i*0.5;
                this.subGroup.add(c);
            }
            this.mesh.add(this.subGroup); this.maxLife = 20;
        }
        else if (type === 'fire_shield') { 
            const geo = new THREE.SphereGeometry(1.5, 16, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xd35400, transparent:true, opacity:0.5 });
            this.mainObj = new THREE.Mesh(geo, mat); this.mesh.add(this.mainObj);
            this.maxLife = 25;
        }
        else if (type === 'rainbow_laser') { 
            const geo = new THREE.CylinderGeometry(0.5, 0.5, 20, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent:true, opacity:0.8 });
            this.mainObj = new THREE.Mesh(geo, mat); 
            this.mainObj.rotation.x = Math.PI/2; 
            this.mainObj.position.z = 10; 
            this.mesh.add(this.mainObj); this.maxLife = 15;
        }
        else if (type === 'void_ray') { 
            const geo = new THREE.CylinderGeometry(0.3, 0.8, 15, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0x8e44ad, transparent:true, opacity:0.9 });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mainObj.rotation.x = Math.PI/2;
            this.mainObj.position.z = 7.5;
            this.mesh.add(this.mainObj); this.maxLife = 30;
        }
        else if (type === 'void_slash') { 
            const geo = new THREE.BoxGeometry(2, 0.1, 2);
            const mat = new THREE.MeshBasicMaterial({ color: 0x5e3c58 });
            this.mainObj = new THREE.Mesh(geo, mat); 
            this.mainObj.rotation.y = Math.PI/4;
            this.mesh.add(this.mainObj); this.maxLife = 15;
        }
        else if (type === 'shadow_spin') { 
            const geo = new THREE.RingGeometry(1, 3.5, 32);
            const mat = new THREE.MeshBasicMaterial({ color: 0xc0392b, side:THREE.DoubleSide, transparent:true, opacity:0.7 });
            this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.rotation.x = -Math.PI/2; this.mainObj.position.y=0.5;
            this.mesh.add(this.mainObj); this.maxLife = 20;
        }
        else if (type === 'shuriken') { 
            const geo = new THREE.ConeGeometry(0.5, 0.1, 4);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            this.mainObj = new THREE.Mesh(geo, mat); this.mesh.add(this.mainObj);
            this.maxLife = 15;
        }
        else if (type === 'noxus_stab') { 
            const geo = new THREE.ConeGeometry(0.3, 2, 4);
            const mat = new THREE.MeshBasicMaterial({ color: 0x7f8c8d });
            this.mainObj = new THREE.Mesh(geo, mat); 
            this.mainObj.rotation.x = -Math.PI/2;
            this.mesh.add(this.mainObj); this.maxLife = 10;
        }
        else if (type === 'upgrade') {
            const geo = new THREE.CylinderGeometry(0.1, 1.5, 6, 8, 1, true);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent:true, opacity:0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
            this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.position.y = 2; this.mesh.add(this.mainObj); this.maxLife = 30;
        } 
        else if (type === 'impact') {
            createParticles(5, 0xffaa00, 0.2, 0.3); this.maxLife = 10;
        } else { 
            createParticles(5, 0xffffff, 0.2, 0.3); this.maxLife = 10;
        }
    }
    update() {
        this.life++; const p = this.life / this.maxLife;
        this.particles.forEach(pt => { pt.position.add(pt.userData.vel); pt.rotation.x += 0.2; pt.rotation.y += 0.2; pt.scale.multiplyScalar(0.9); });
        
        if (this.mainObj) {
            if (this.type === 'spin_gold') { this.mainObj.rotation.y += 0.5; this.mainObj.scale.x += 0.1; this.mainObj.scale.z += 0.1; this.mainObj.material.opacity = 0.6 * (1-p); }
            else if (this.type === 'red_beam' || this.type === 'solar_beam') { this.mainObj.scale.x = 1 - p; this.mainObj.scale.z = 1 - p; this.mainObj.material.opacity = 1-p; }
            else if (this.type === 'pink_explosion' || this.type === 'green_wave' || this.type === 'shadow_spin') { this.mainObj.scale.multiplyScalar(1.1); this.mainObj.material.opacity = 0.5 * (1-p); }
            else if (this.type === 'tornado_grey') { this.mainObj.rotation.y += 0.5; this.mainObj.position.y += 0.1; this.mainObj.scale.multiplyScalar(1.05); this.mainObj.material.opacity = 0.7 * (1-p); }
            else if (this.type === 'vital_break') { this.subGroup.rotation.y += 0.2; this.subGroup.scale.multiplyScalar(0.9); }
            else if (this.type === 'silver_ring') { this.mainObj.scale.multiplyScalar(1.2); this.mainObj.material.opacity = 1-p; }
            else if (this.type === 'purple_root') { this.mainObj.rotation.x += 0.1; this.mainObj.rotation.y += 0.1; this.mainObj.scale.multiplyScalar(0.95); }
            else if (this.type === 'jhin_flower') { this.mainObj.rotation.y += 0.05; this.mainObj.scale.multiplyScalar(1.05); this.mainObj.material.opacity = 0.8 * (1-p); }
            else if (this.type === 'upgrade') { this.mainObj.scale.x += 0.1; this.mainObj.scale.z += 0.1; this.mainObj.material.opacity = 1 - p; }
            else if (this.type === 'purple_bomb') { this.mainObj.position.y += 0.3; this.mainObj.scale.multiplyScalar(0.95); }
            else if (this.type === 'card_throw') { this.subGroup.children.forEach(c => c.position.z += 0.5); }
            else if (this.type === 'fire_shield') { this.mainObj.scale.multiplyScalar(1.05); this.mainObj.material.opacity = 1-p; }
            else if (this.type === 'rainbow_laser' || this.type === 'void_ray') { this.mainObj.scale.x = 1-p; this.mainObj.scale.z = 1-p; this.mainObj.material.opacity = 1-p; }
            else if (this.type === 'void_slash') { this.mainObj.rotation.y += 0.5; }
            else if (this.type === 'shuriken') { this.mainObj.rotation.y += 0.5; this.mainObj.position.z += 0.5; }
            else if (this.type === 'noxus_stab') { this.mainObj.position.z += 0.3; }
        }
        
        if (this.type === 'ice_spikes') { this.mesh.children.forEach(c => c.position.y += 0.1); }
        if (this.life >= this.maxLife) { this.scene.remove(this.mesh); return false; }
        return true;
    }
}

// --- CẬP NHẬT: PROJECTILE GLOW ---
export class Projectile {
    constructor(scene, start, target, color, dmg, isStun = false) {
        this.scene = scene; this.target = target; this.dmg = dmg; this.isStun = isStun;
        this.speed = 0.6; this.isHit = false;
        
        // Thêm Emissive để phát sáng
        const geo = new THREE.SphereGeometry(0.25, 8, 8); 
        const mat = new THREE.MeshStandardMaterial({ 
            color: color, 
            emissive: color, // Tự phát sáng
            emissiveIntensity: 3.0 
        });
        
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.scale.set(1, 1, 3); // Kéo dài ra như tia đạn
        this.mesh.position.copy(start);
        this.mesh.position.y += 1.5;
        
        this.scene.add(this.mesh);
    }
    update() {
        if (this.isHit || !this.target || this.target.isDead) { this.destroy(); return false; }
        const gm = this.target.gm; 
        const targetPos = this.target.group.position.clone().add(new THREE.Vector3(0,1,0));
        const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position).normalize();
        this.mesh.position.add(dir.multiplyScalar(this.speed));
        this.mesh.lookAt(targetPos);
        
        if (this.mesh.position.distanceTo(targetPos) < 0.8) {
            this.target.takeDmg(this.dmg);
            if(this.isStun) {
                this.target.applyStun(2);
                if(gm && gm.view) gm.view.spawnVFX(this.target.group.position, 'ice_spikes');
            } else {
                if(gm && gm.view) gm.view.spawnVFX(this.target.group.position, 'impact');
            }
            this.destroy(); return false;
        }
        return true;
    }
    destroy() { this.scene.remove(this.mesh); this.isHit = true; }
}

// ==========================================
// PHẦN 3: SKILLS
// ==========================================

export const SKILLS = {
    // --- WARRIORS ---
    'spin': (u, t, units) => { 
        u.gm.view.spawnVFX(u.group.position, 'spin_gold');
        units.forEach(e => { if(e.team !== u.team && u.group.position.distanceTo(e.group.position) < 3) e.takeDmg(u.currStats.dmg * 2.5 * u.star); });
    },
    'guillotine': (u, t, units) => { 
        if(t) { u.gm.view.spawnVFX(t.group.position, 'red_beam'); t.takeDmg(u.currStats.dmg * 3 * u.star); u.hp = Math.min(u.hp+150*u.star, u.maxHp); u.updateBar(); }
    },
    'uppercut': (u, t, units) => { 
        if(t) { u.gm.view.spawnVFX(t.group.position, 'pink_explosion'); t.takeDmg(u.currStats.dmg * 2.5 * u.star); t.applyStun(1.5); }
    },
    'wind_slash': (u, t, units) => { 
        u.gm.view.spawnVFX(u.group.position, 'green_wave');
        units.forEach(e => { if(e.team !== u.team && u.group.position.distanceTo(e.group.position) < 3) e.takeDmg(u.currStats.dmg * 2 * u.star); });
    },
    'tornado': (u, t, units) => { 
        if(t) { 
            u.gm.view.spawnVFX(t.group.position, 'tornado_grey'); 
            units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(t.group.position) < 2) { e.takeDmg(u.currStats.dmg * 2 * u.star); e.applyStun(1.5); }});
        }
    },

    // --- TANKS ---
    'hammer_smash': (u, t, units) => { 
        if(t) { u.gm.view.spawnVFX(t.group.position, 'yellow_smash'); t.takeDmg(u.currStats.dmg * 2 * u.star); t.applyStun(2); }
    },
    'ground_slam': (u, t, units) => { 
        u.gm.view.spawnVFX(u.group.position, 'rock_explosion');
        units.forEach(e => { if(e.team !== u.team && u.group.position.distanceTo(e.group.position) < 3) { e.takeDmg(150 * u.star); e.applyStun(1.5); }});
    },
    'grand_challenge': (u, t, units) => { 
        if(t) { u.gm.view.spawnVFX(t.group.position, 'vital_break'); t.takeDmg(u.currStats.dmg * 3 * u.star); u.hp = Math.min(u.hp+200*u.star, u.maxHp); u.updateBar(); }
    },
    'solar_flare': (u, t, units) => { 
        if(t) { u.gm.view.spawnVFX(t.group.position, 'solar_beam'); units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(t.group.position) < 2.5) { e.takeDmg(100 * u.star); e.applyStun(2); }}); }
    },
    'ice_fissure': (u, t, units) => { 
        if(t) { u.gm.view.spawnVFX(t.group.position, 'ice_spikes'); t.takeDmg(u.currStats.dmg * 1.5 * u.star); t.applyStun(2.5); }
    },

    // --- RANGERS ---
    'silver_bolts': (u, t, units) => { 
        if(t) { u.gm.view.spawnVFX(t.group.position, 'silver_ring'); t.takeDmg(u.currStats.dmg * 1.5 * u.star + 100*u.star); }
    },
    'ace_shot': (u, t, units) => { 
        if(t) { u.gm.view.spawnProjectile(u.group.position, t, 0xff0000, u.currStats.dmg * 4 * u.star, false); }
    },
    'corruption': (u, t, units) => { 
        if(t) { u.gm.view.spawnVFX(t.group.position, 'purple_root'); t.takeDmg(u.currStats.dmg * 2 * u.star); t.applyStun(2); }
    },
    'crystal_arrow': (u, t, units) => { 
        if(t) { u.gm.view.spawnProjectile(u.group.position, t, 0x00ffff, u.currStats.dmg * 2.5 * u.star, true); }
    },
    'curtain_call': (u, t, units) => { 
        if(t) { u.gm.view.spawnVFX(t.group.position, 'jhin_flower'); t.takeDmg(u.currStats.dmg * 4 * u.star); }
    },

    // --- MỚI: MAGES (PHÁP SƯ) ---
    'bouncing_bomb': (u, t, units) => { // Ziggs
        if(t) { 
            u.gm.view.spawnVFX(t.group.position, 'purple_bomb'); 
            // Nổ lan
            units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(t.group.position) < 2) e.takeDmg(u.currStats.dmg * 3 * u.star); });
        }
    },
    'wild_cards': (u, t, units) => { // TF
        if(t) {
            u.gm.view.spawnVFX(u.group.position, 'card_throw');
            // Bắn 3 hướng (giả lập bằng cách gây dmg cho kẻ địch phía trước)
            units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(u.group.position) < 4) e.takeDmg(u.currStats.dmg * 2.5 * u.star); });
        }
    },
    'disintegrate': (u, t, units) => { // Annie
        if(t) {
            u.gm.view.spawnVFX(u.group.position, 'fire_shield');
            u.shield += 250 * u.star; // Tạo khiên
            units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(u.group.position) < 2.5) e.takeDmg(u.currStats.dmg * 3 * u.star); });
        }
    },
    'final_spark': (u, t, units) => { // Lux
        if(t) {
            const start = u.group.position.clone();
            const end = t.group.position.clone();
            const dir = new THREE.Vector3().subVectors(end, start).normalize();
            
            // Xoay VFX về hướng mục tiêu (giả lập đơn giản bằng cách spawn tại chỗ)
            u.gm.view.spawnVFX(u.group.position, 'rainbow_laser');
            
            // Gây dmg đường thẳng
            units.forEach(e => { 
                if(e.team !== u.team) {
                    const v = new THREE.Vector3().subVectors(e.group.position, start);
                    const dist = v.dot(dir); // Hình chiếu
                    // Kẻ địch nằm trên đường thẳng và khoảng cách < 8
                    if (dist > 0 && dist < 10 && v.cross(dir).length() < 1.5) {
                        e.takeDmg(u.currStats.dmg * 4 * u.star);
                    }
                }
            });
        }
    },
    'life_form_ray': (u, t, units) => { // VelKoz
        if(t) {
            u.gm.view.spawnVFX(u.group.position, 'void_ray');
            units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(u.group.position) < 5) e.takeDmg(u.currStats.dmg * 5 * u.star); });
        }
    },

    // --- MỚI: ASSASSINS (SÁT THỦ) ---
    'taste_fear': (u, t, units) => { // KhaZix
        if(t) {
            u.gm.view.spawnVFX(t.group.position, 'void_slash');
            // Kiểm tra cô lập (không có đồng minh cạnh bên trong 1 ô)
            let isolated = true;
            units.forEach(e => { if(e !== t && e.team === t.team && e.group.position.distanceTo(t.group.position) < 1.5) isolated = false; });
            const dmg = u.currStats.dmg * 3 * u.star * (isolated ? 2 : 1);
            t.takeDmg(dmg);
        }
    },
    'umbra_blades': (u, t, units) => { // Nocturne
        u.gm.view.spawnVFX(u.group.position, 'shadow_spin');
        units.forEach(e => { 
            if(e.team !== u.team && e.group.position.distanceTo(u.group.position) < 2) {
                e.takeDmg(u.currStats.dmg * 2.5 * u.star);
            }
        });
        u.hp = Math.min(u.hp + 100 * u.star, u.maxHp); // Hồi máu
        u.updateBar();
    },
    'razor_shuriken': (u, t, units) => { // Zed
        if(t) {
            u.gm.view.spawnVFX(u.group.position, 'shuriken'); // Giả lập ném
            // Ném xuyên
            units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(t.group.position) < 2) e.takeDmg(u.currStats.dmg * 3 * u.star); });
        }
    },
    'death_lotus': (u, t, units) => { // Katarina
        u.gm.view.spawnVFX(u.group.position, 'shadow_spin'); // Dùng lại hiệu ứng xoay đỏ
        units.forEach(e => { 
            if(e.team !== u.team && e.group.position.distanceTo(u.group.position) < 2.5) {
                e.takeDmg(u.currStats.dmg * 4 * u.star); // Sát thương cực lớn
            }
        });
    },
    'noxian_diplomacy': (u, t, units) => { // Talon
        if(t) {
            u.gm.view.spawnVFX(t.group.position, 'noxus_stab');
            t.takeDmg(u.currStats.dmg * 5 * u.star); // Nhất kích tất sát
        }
    },
    
    // Skill của Boss
    'dragon_breath': (u, t, units) => { // Rồng Ngàn Tuổi
        if(t) {
            u.gm.view.spawnVFX(u.group.position, 'solar_beam');
            units.forEach(e => { if(e.team !== u.team) e.takeDmg(300); }); // Thổi cả bàn
        }
    },

    'default': (u, t, units) => { if(t) { u.gm.view.spawnVFX(t.group.position, 'impact'); t.takeDmg(u.currStats.dmg * 1.5); } }
};

