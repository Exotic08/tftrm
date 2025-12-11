// logic.js
// CẬP NHẬT: TÍCH HỢP PVP REALTIME DATABASE

import { 
    CHAMPS, SYNERGIES, XP_TO_LEVEL, SHOP_ODDS, MONSTERS, PVE_ROUNDS, ITEMS 
} from './shared.js';
import { Unit, ViewManager } from './engine.js';
import { ref, update, onValue, set } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// ==========================================
// GAME MANAGER: LOGIC TRÒ CHƠI
// ==========================================
export class GameManager {
    constructor(settings) {
        this.settings = settings || {};
        
        // --- CONFIG PVP ---
        this.mode = this.settings.mode || 'pve'; // 'pve' hoặc 'pvp'
        this.db = this.settings.db;
        this.matchId = this.settings.matchId;
        this.myId = this.settings.myId;
        this.opponentId = this.settings.opponentId;

        this.units = []; this.hexes = []; this.interestOrbs = [];
        this.vfxList = []; this.projList = [];
        this.isGameStarted = false;
        
        // Game State
        this.gold = 4; this.lvl = 1; this.xp = 0; this.php = 100; this.ehp = 100; 
        this.stage = 1; this.subRound = 1; this.phase = 'prep';
        this.inventory = ['bf_sword', 'recurve_bow', 'giant_belt']; 

        // Trạng thái khóa shop
        this.isShopLocked = false;

        // Input State
        this.isDragging = false; this.clickStart = {x:0, y:0};
        this.dragged = null; this.dragGroup = null; this.hoveredHex = null;
        this.dragItem = null; this.dragItemEl = null;
        this.ray = new THREE.Raycaster(); this.mouse = new THREE.Vector2();

        // View
        this.view = new ViewManager(this);

        // Bind events
        this.handleGlobalMove = this.handleGlobalMove.bind(this);
        this.handleGlobalUp = this.handleGlobalUp.bind(this);

        try { 
            this.view.init(); 
            this.initInput();
            this.view.renderInventory(); 
            
            // --- PVP: LẮNG NGHE TRẠNG THÁI TRẬN ĐẤU ---
            if(this.mode === 'pvp') {
                this.listenMatchState();
                this.view.toast("PVP MODE CONNECTED!");
            }

            this.loop(); 
        } catch(e) { console.error("Game Init Error:", e); alert("Lỗi: " + e.message); }
    }

    initInput() {
        const handler = (e) => {
            if (!this.isGameStarted) return;
            if (this.dragged || this.dragItem !== null) { if (e.cancelable) e.preventDefault(); }
            let cx, cy; 
            if(e.changedTouches && e.changedTouches.length > 0) { cx = e.changedTouches[0].clientX; cy = e.changedTouches[0].clientY; } 
            else { cx = e.clientX; cy = e.clientY; }
            if (cx === undefined || isNaN(cx)) return;
            const fake = { clientX: cx, clientY: cy, target: e.target, touches: e.touches };
            if(e.type==='mousedown' || e.type==='touchstart') this.onDown(fake); 
            if(e.type==='mousemove' || e.type==='touchmove') this.onMove(fake); 
            if(e.type==='mouseup' || e.type==='touchend') this.onUp(fake);
        };
        ['mousedown','mousemove','mouseup','touchstart','touchmove','touchend'].forEach(t => window.addEventListener(t, handler, {passive: false}));
    }

    // --- PVP LOGIC: LẮNG NGHE ---
    listenMatchState() {
        // 1. Lắng nghe HP đối thủ
        onValue(ref(this.db, `matches/${this.matchId}/states/${this.opponentId}/hp`), (snap) => {
            const hp = snap.val();
            if (hp !== null) {
                this.ehp = hp; 
                this.view.updateUI();
                if(this.ehp <= 0) this.endCombat(true); // Địch chết -> Thắng
            }
        });
    }

    // --- UNIT DRAG LOGIC ---
    onDown(e) {
        if(e.target.closest('#sidebar-panel') || e.target.closest('.tab-btn')) return;
        if(this.phase==='combat') return; if(e.target.closest('button') || e.target.closest('.card') || e.target.closest('#unit-inspector')) return;
        this.clickStart.x = e.clientX; this.clickStart.y = e.clientY; this.isDragging = false; 
        this.updateRay(e.clientX, e.clientY);
        const hits = this.ray.intersectObjects(this.view.scene.children, true); 
        const hit = hits.find(h => h.object.name === 'hitbox' && h.object.userData.team === 'player');
        if(hit) { this.dragged = hit.object; this.dragGroup = hit.object.parent; this.dragGroup.position.y = 2; document.getElementById('sell-slot').classList.add('hover'); }
    }

    onMove(e) {
        this.updateRay(e.clientX, e.clientY);
        if(this.dragged) {
            const moveDist = Math.abs(e.clientX - this.clickStart.x) + Math.abs(e.clientY - this.clickStart.y);
            if(moveDist > 5) this.isDragging = true;
            const hits = this.ray.intersectObject(this.view.dragPlane); 
            if(hits.length) { this.dragGroup.position.x = hits[0].point.x; this.dragGroup.position.z = hits[0].point.z; }
            const sell = document.getElementById('sell-slot'); const el = document.elementFromPoint(e.clientX, e.clientY);
            if(el && el.closest('#sell-slot')) sell.style.borderColor = 'white'; else sell.style.borderColor = '#e74c3c';
            if(this.hoveredHex) { this.hoveredHex.material.emissive.setHex(0x000000); this.hoveredHex=null; }
            const hHits = this.ray.intersectObjects(this.hexes);
            if(hHits.length) { const h = hHits[0].object; if(h.userData.isPlayer) { this.hoveredHex = h; const ok = !h.userData.occupied || h===this.dragged.userData.hex; h.material.emissive.setHex(ok?0x00ff00:0xff0000); } }
        }
    }

    onUp(e) {
        this.view.hideTooltip();
        if (!this.isDragging) {
            if(e.target.closest('#unit-inspector') || e.target.closest('#sidebar-panel')) return;
            this.updateRay(e.clientX, e.clientY);
            const hits = this.ray.intersectObjects(this.view.scene.children, true);
            const unitHit = hits.find(h => h.object.name === 'hitbox');
            if (unitHit) { const realUnit = this.units.find(u => u.group === unitHit.object.parent); if (realUnit) this.view.showInspector(realUnit); } 
            else this.view.closeInspector();
        }
        if(this.dragged) {
            document.getElementById('sell-slot').classList.remove('hover'); document.getElementById('sell-slot').style.borderColor = '#e74c3c';
            const el = document.elementFromPoint(e.clientX, e.clientY);
            if(el && el.closest('#sell-slot')) { this.sellUnit(this.dragged); this.resetDrag(); return; }
            let target = this.hoveredHex; 
            if(!target) { let min=99; this.hexes.forEach(h=>{ const d=this.dragGroup.position.distanceTo(h.position); if(d<2 && d<min){min=d;target=h;} }); }
            const oldHex = this.dragged.userData.hex; 
            let valid = target && target.userData.isPlayer && (!target.userData.occupied || target===oldHex);
            if(valid && oldHex.userData.isBench && !target.userData.isBench) { 
                const count = this.units.filter(u=>u.team==='player' && !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench).length; 
                if(count >= this.lvl) { this.view.toast("Giới hạn tướng!"); valid = false; } 
            }
            if(valid) { 
                this.dragged.userData.hex.userData.occupied = false; 
                this.dragGroup.position.copy(target.position); target.userData.occupied = true; 
                this.dragged.userData.hex = target; this.dragged.userData.origPos = target.position.clone(); 
            } else { this.dragGroup.position.copy(oldHex.position); }
            this.dragGroup.position.y = 0; this.calcSyn(); this.view.updateUI(); 
            this.resetDrag();
        }
        this.isDragging = false;
    }

    resetDrag() {
        if(this.hoveredHex) { this.hoveredHex.material.emissive.setHex(0x000000); this.hoveredHex=null; }
        this.dragged = null; this.dragGroup = null;
    }

    handleItemStart(e, index, element) {
        if(this.phase === 'combat') return;
        e.stopPropagation(); if(e.cancelable) e.preventDefault();
        this.dragItem = index; this.dragItemEl = element;
        element.style.opacity = '0';
        this.view.showTooltip(e, index);
        const ghost = document.getElementById('drag-ghost');
        const item = ITEMS[this.inventory[index]];
        ghost.innerText = item.icon; ghost.style.borderColor = item.color; ghost.style.backgroundColor = '#333';
        ghost.classList.remove('hidden');
        this.updateGhostPos(e);
        window.addEventListener('touchmove', this.handleGlobalMove, {passive: false});
        window.addEventListener('touchend', this.handleGlobalUp, {passive: false});
        window.addEventListener('mousemove', this.handleGlobalMove);
        window.addEventListener('mouseup', this.handleGlobalUp);
    }

    handleGlobalMove(e) {
        if (this.dragItem === null) return;
        if (e.cancelable) e.preventDefault();
        this.updateGhostPos(e); this.view.hideTooltip();
    }

    handleGlobalUp(e) {
        if (this.dragItem === null) return;
        window.removeEventListener('touchmove', this.handleGlobalMove); window.removeEventListener('touchend', this.handleGlobalUp);
        window.removeEventListener('mousemove', this.handleGlobalMove); window.removeEventListener('mouseup', this.handleGlobalUp);
        document.getElementById('drag-ghost').classList.add('hidden');
        let cx, cy; if(e.changedTouches && e.changedTouches.length > 0) { cx = e.changedTouches[0].clientX; cy = e.changedTouches[0].clientY; } else { cx = e.clientX; cy = e.clientY; }
        this.updateRay(cx, cy);
        const hits = this.ray.intersectObjects(this.view.scene.children, true);
        const unitHit = hits.find(h => h.object.name === 'hitbox' && h.object.userData.team === 'player');
        if(unitHit) {
            const unit = this.units.find(u => u.group === unitHit.object.parent);
            const itemId = this.inventory[this.dragItem];
            if(unit && unit.addItem(itemId)) {
                this.inventory.splice(this.dragItem, 1);
                this.view.toast(`Đã trang bị: ${ITEMS[itemId].name}`);
            } else { this.view.toast("Túi đồ đầy!"); }
        }
        this.dragItem = null; this.dragItemEl = null; this.view.renderInventory();
    }

    updateGhostPos(e) {
        let cx, cy; if(e.touches && e.touches.length > 0) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; } else { cx = e.clientX; cy = e.clientY; }
        const ghost = document.getElementById('drag-ghost'); ghost.style.left = (cx - 20) + 'px'; ghost.style.top = (cy - 20) + 'px';
    }

    updateRay(cx, cy) {
        this.mouse.x = (cx/window.innerWidth)*2-1; this.mouse.y = -(cy/window.innerHeight)*2+1;
        this.ray.setFromCamera(this.mouse, this.view.camera);
    }

    createUnit(data, hex, team) {
        const group = new THREE.Group(); 
        const mat = new THREE.MeshPhysicalMaterial({ color: data.color, roughness: 0.3, metalness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.1 }); 
        let body, head;

        if (data.isMonster) {
            if (data.shape === 'box') { body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat); body.position.y = 0.5; } 
            else if (data.shape === 'rock') { body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6), mat); body.position.y = 0.6; } 
            else if (data.shape === 'cone') { body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 4), mat); body.position.y = 0.6; body.rotation.x = -Math.PI/2; }
            body.castShadow = true; body.name = 'body'; group.add(body); 
            const scale = data.scale || 1; group.scale.set(scale, scale, scale);
        } else {
            body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8), mat); 
            body.position.y = 0.6; body.castShadow = true; body.name = 'body'; group.add(body);
            head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 1), new THREE.MeshStandardMaterial({color:0xffccaa, roughness:0.5})); 
            head.position.y = 1.35; group.add(head);
            const trait = data.trait;
            const equipMat = new THREE.MeshStandardMaterial({color: 0xcccccc, metalness: 0.8, roughness: 0.2});
            if (trait === 'warrior') {
                const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), equipMat); p1.position.set(0.4, 1.1, 0); group.add(p1);
                const p2 = p1.clone(); p2.position.set(-0.4, 1.1, 0); group.add(p2);
                const sword = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.05), equipMat); sword.position.set(0, 0.8, -0.35); sword.rotation.z = 0.5; group.add(sword);
            } else if (trait === 'tank') {
                const shield = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.1), equipMat); shield.position.set(0.3, 0.8, 0.35); shield.rotation.y = -0.3; group.add(shield);
            } else if (trait === 'ranger') {
                const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.0), equipMat); gun.position.set(0.35, 0.8, 0.2); group.add(gun);
            } else if (trait === 'mage') {
                const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2), equipMat); staff.position.set(0.4, 0.8, 0.2); group.add(staff);
                const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12), new THREE.MeshBasicMaterial({color: 0x00ffff})); orb.position.set(0.4, 1.45, 0.2); group.add(orb);
            } else if (trait === 'assassin') {
                const d1 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 4), equipMat); d1.rotation.x = Math.PI/2; d1.position.set(0.4, 0.7, 0.2); group.add(d1);
                const d2 = d1.clone(); d2.position.set(-0.4, 0.7, 0.2); group.add(d2);
            }
        }
        const hit = new THREE.Mesh(new THREE.BoxGeometry(1,2,1), new THREE.MeshBasicMaterial({visible:false})); 
        hit.userData = { isUnit:true, data: data, hex: hex, team: team }; hit.name = 'hitbox'; group.add(hit);
        group.position.copy(hex.position); hex.userData.occupied = true; hit.userData.origPos = hex.position.clone();
        this.view.scene.add(group); 
        const u = new Unit(group, data, team, this); this.units.push(u); this.calcSyn(); 
        return u; 
    }

    buyUnit(data) {
        if(this.gold < data.cost) { this.view.toast("Thiếu vàng"); return false; }
        const sameUnits = this.units.filter(u => u.data.id === data.id && u.star === 1 && u.team === 'player');
        const slot = this.hexes.find(h => h.userData.isBench && !h.userData.occupied);
        if (!slot && sameUnits.length < 2) { this.view.toast("Hàng chờ đầy"); return false; }
        this.gold -= data.cost; 
        const spawnHex = slot || sameUnits[0].group.children.find(c=>c.name==='hitbox').userData.hex;
        const newUnit = this.createUnit(data, spawnHex, 'player'); 
        this.checkUpgrade(newUnit); this.view.updateUI();
        return true;
    }
    
    checkUpgrade(unit) {
        if(unit.star >= 3) return;
        const same = this.units.filter(u => u !== unit && u.team === 'player' && u.data.id === unit.data.id && u.star === unit.star);
        if (same.length >= 2) {
            const u1 = same[0]; const u2 = same[1];
            const extraItems = [...u1.items, ...u2.items];
            extraItems.forEach(item => { if (!unit.addItem(item)) { this.inventory.push(item); this.view.toast("Túi tướng đầy, trả về kho!"); } });
            this.view.renderInventory();
            const h1 = u1.group.children.find(c=>c.name==='hitbox').userData.hex; const h2 = u2.group.children.find(c=>c.name==='hitbox').userData.hex;
            if(h1) h1.userData.occupied = false; if(h2) h2.userData.occupied = false;
            u1.destroy(); u2.destroy(); this.units = this.units.filter(u => u !== u1 && u !== u2);
            unit.upgradeStar(); this.view.spawnVFX(unit.group.position, 'upgrade'); this.view.toast(`UPGRADE: ${unit.data.name} ${unit.star} SAO!`);
            this.checkUpgrade(unit); this.calcSyn();
        }
    }
    
    sellUnit(hitBox) {
        const idx = this.units.findIndex(u => u.group === hitBox.parent);
        if(idx > -1) {
            const u = this.units[idx]; const refund = u.data.cost * Math.pow(3, u.star - 1);
            this.gold += refund; u.items.forEach(item => this.inventory.push(item)); this.view.renderInventory();
            if(hitBox.userData.hex) hitBox.userData.hex.userData.occupied = false;
            u.destroy(); this.units.splice(idx, 1); this.view.updateUI(); this.calcSyn(); this.view.toast(`Bán +${refund}g`);
            this.view.closeInspector();
        }
    }

    // --- LOGIC CHIẾN ĐẤU CẬP NHẬT (HỖ TRỢ PVP) ---
    async startCombat() {
        if(this.phase==='combat') return;
        const active = this.units.filter(u=>u.team==='player' && !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench);
        if(!active.length) return this.view.toast("Cho tướng vào sân!");
        
        this.phase = 'combat';
        this.updateUIPhase(true); 
        this.units.filter(u=>u.team==='enemy').forEach(u=>u.destroy()); 
        this.units = this.units.filter(u=>u.team==='player');

        if (this.mode === 'pvp') {
            this.view.toast("PVP: Đang đồng bộ...");
            // 1. Gửi đội hình lên Firebase
            const myBoardData = this.serializeBoard(active);
            await update(ref(this.db, `matches/${this.matchId}/boards/${this.myId}`), {
                units: myBoardData,
                ready: true
            });
            // 2. Lắng nghe địch
            const enemyRef = ref(this.db, `matches/${this.matchId}/boards/${this.opponentId}`);
            onValue(enemyRef, (snap) => {
                const data = snap.val();
                if (data && data.ready) {
                    this.spawnEnemyFromData(data.units);
                }
            }, { onlyOnce: true });
        } else {
            // Logic PVE cũ
            this.startPveRound();
        }
        this.view.closeInspector();
    }

    // PVE Logic
    startPveRound() {
        const spots = this.hexes.filter(h=>!h.userData.isPlayer && !h.userData.occupied);
        const roundKey = `${this.stage}-${this.subRound}`; 
        const pveMonsters = PVE_ROUNDS[roundKey];
        if (pveMonsters) {
            this.view.toast(`ROUND ${roundKey}: QUÁI VẬT!`);
            pveMonsters.forEach((mid, i) => { if (spots[i]) { const m = this.createUnit(MONSTERS[mid], spots[i], 'enemy'); const bm = 1 + (this.stage * 0.35); m.maxHp = Math.floor(m.maxHp * bm); m.hp = m.maxHp; m.currStats.dmg = Math.floor(m.currStats.dmg * bm); m.updateBar(); } });
        } else {
            this.view.toast(`STAGE ${this.stage}-${this.subRound}: FIGHT!`);
            let botLvl = Math.min(this.stage + 2, 9);
            for(let i=0; i<botLvl; i++) { if(spots[i]) { const enemy = this.createUnit(this.rollChamp(botLvl), spots[i], 'enemy'); const buff = 1 + (this.stage*0.1); enemy.maxHp *= buff; enemy.hp = enemy.maxHp; enemy.updateBar(); } }
        }
    }

    // PVP Helpers
    serializeBoard(units) {
        return units.map(u => {
            const hex = u.group.children.find(c=>c.name==='hitbox').userData.hex;
            const hexIdx = this.hexes.indexOf(hex);
            return { id: u.data.id, star: u.star, items: u.items, hexIdx: hexIdx };
        });
    }

    spawnEnemyFromData(unitsData) {
        if(!unitsData) return;
        this.view.toast("PVP START!");
        unitsData.forEach(ud => {
            const champData = CHAMPS.find(c => c.id === ud.id);
            if (champData) {
                // Đảo ngược vị trí: 55 - index
                const mirrorIdx = 55 - ud.hexIdx;
                const spawnHex = this.hexes[mirrorIdx];
                if (spawnHex) {
                    const enemy = this.createUnit(champData, spawnHex, 'enemy');
                    // Sync sao và đồ
                    enemy.star = 1; for(let i=1; i<ud.star; i++) enemy.upgradeStar();
                    enemy.items = ud.items || []; enemy.updateStats();
                }
            }
        });
    }

    endCombat(win) {
        this.phase = 'prep';
        this.updateUIPhase(false);
        this.view.targetPos = this.view.zoomLevels[1].pos.clone(); 
        
        if(win) { 
            this.ehp-=10; this.view.toast("THẮNG!"); 
        } else { 
            this.php-=10; this.view.toast("THUA!"); 
            // Nếu PvP thì báo cáo HP lên server
            if(this.mode === 'pvp') {
                update(ref(this.db, `matches/${this.matchId}/states/${this.myId}`), { hp: this.php });
            }
        }
        
        if(this.php<=0 || this.ehp<=0) { 
            document.getElementById('game-over').classList.remove('hidden'); 
            const result = this.php > this.ehp ? "THẮNG" : "THUA"; 
            document.getElementById('end-title').innerText = `${result} (HP: ${this.php} vs ${this.ehp})`; 
            return; 
        }
        
        this.subRound++; if(this.subRound > 5) { this.subRound = 1; this.stage++; }
        const interest = Math.min(Math.floor(this.gold / 10), 5); 
        this.gold += (5 + interest + (win?1:0)); this.xp += 2;
        
        this.units.forEach(u => { if(u.team==='player') u.reset(); else u.destroy(); }); 
        this.units = this.units.filter(u=>u.team==='player');
        if(this.xp >= this.getXpNeed()) { this.xp-=this.getXpNeed(); this.lvl++; }
        if(!this.isShopLocked) this.refreshShop();
        this.view.updateUI();

        // PvP: Reset ready
        if(this.mode === 'pvp') {
            update(ref(this.db, `matches/${this.matchId}/boards/${this.myId}`), { ready: false });
        }
    }

    updateUIPhase(isCombat) {
        const els = ['btn-battle', 'shop-wrapper', 'sell-slot'];
        els.forEach(id => { const el = document.getElementById(id); if(el) isCombat ? el.classList.add('hidden') : el.classList.remove('hidden'); });
        if(isCombat) { this.view.targetPos = this.view.zoomLevels[2].pos.clone(); this.view.targetLook = this.view.zoomLevels[2].look.clone(); }
    }

    onMonsterDeath(monster) {
        if (Math.random() < 0.3) {
            const itemKeys = Object.keys(ITEMS); const randomItem = itemKeys[Math.floor(Math.random() * itemKeys.length)];
            if (this.inventory.length < 8) { this.inventory.push(randomItem); this.view.renderInventory(); this.view.toast(`Nhặt được: ${ITEMS[randomItem].name}`); this.view.spawnVFX(monster.group.position, 'upgrade'); } 
            else { this.gold += 2; this.view.toast("Túi đầy: +2 vàng"); }
        } else {
            const goldDrop = Math.floor(Math.random() * 3) + 1; this.gold += goldDrop; this.view.updateUI();
            this.view.toast(`Nhặt được: ${goldDrop} vàng`); this.view.spawnVFX(monster.group.position, 'spin_gold');
        }
    }

    toggleLock() {
        this.isShopLocked = !this.isShopLocked;
        const btn = document.getElementById('btn-lock');
        if(btn) {
            btn.innerText = this.isShopLocked ? "🔒" : "🔓";
            btn.classList.toggle('active', this.isShopLocked);
            this.view.toast(this.isShopLocked ? "Đã Khóa Shop" : "Đã Mở Khóa");
        }
    }

    calcSyn() {
        const counts = {}; 
        this.units.forEach(u => { if(u.team==='player' && !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench) { if (u.data.trait) { const t = u.data.trait; if(!counts[t]) counts[t] = new Set(); counts[t].add(u.data.id); } } });
        const p = document.getElementById('content-syn'); if(!p) return; p.innerHTML='';
        if(Object.keys(counts).length === 0) { p.innerHTML = '<div style="text-align:center;color:#666;font-size:0.75rem;padding:10px;">Chưa kích hoạt tộc hệ</div>'; return; }
        for(let t in counts) {
            const n = counts[t].size; const data = SYNERGIES[t]; const div = document.createElement('div'); div.className = 'trait-box';
            let buffText = ""; if(n >= data.breaks[0]) { div.className += ' active'; let activeTier = 0; data.breaks.forEach(b => { if(n >= b) activeTier = b; }); if(activeTier > 0) buffText = `<span style="font-size:0.6rem;color:#ddd;margin-left:auto;">(${data.buff[activeTier]})</span>`; }
            div.innerHTML = `<div class="trait-count" style="background:${data.color}">${n}</div><div style="font-weight:bold;">${data.name}</div>${buffText}`; 
            p.appendChild(div);
        }
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        this.view.updateCamera();
        const t = performance.now() * 0.001;
        this.units.forEach(u => u.update(t, this.units));
        if(this.phase === 'combat') {
            const playerLive = this.units.filter(u => u.team === 'player' && !u.isDead && !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench).length;
            const enemyLive = this.units.filter(u => u.team === 'enemy' && !u.isDead).length;
            if (playerLive === 0) this.endCombat(false); else if (enemyLive === 0) this.endCombat(true); 
        }
        for(let i=this.vfxList.length-1; i>=0; i--) { if(!this.vfxList[i].update()) { this.vfxList.splice(i, 1); } }
        for(let i=this.projList.length-1; i>=0; i--) { if(!this.projList[i].update()) { this.projList.splice(i, 1); } }
        this.interestOrbs.forEach((orb, i) => { if(orb.visible) { orb.position.y = orb.userData.baseY + Math.sin(t*3 + orb.userData.offset)*0.2; } });
        if(this.view.scene && this.view.camera) this.view.renderer.render(this.view.scene, this.view.camera);
    }

    refreshShop() {
        const wrapper = document.getElementById('shop-cards'); wrapper.innerHTML = '';
        for(let i=0; i<5; i++) {
            const data = this.rollChamp(this.lvl);
            const card = document.createElement('div'); card.className = `card c${data.cost}`;
            card.innerHTML = `<div class="card-img" style="background:${'#'+data.color.toString(16)}"></div><div class="card-name">${data.name}</div><div class="card-cost">${data.cost}g</div>`;
            card.onclick = () => { if(!card.classList.contains('empty')) { if(this.buyUnit(data)) card.classList.add('empty'); } };
            wrapper.appendChild(card);
        }
    }

    rollChamp(lvl) {
        const odds = SHOP_ODDS[lvl] || [100,0,0,0]; const r = Math.random()*100;
        let cost=1; let sum=0; for(let i=0; i<4; i++) { sum+=odds[i]; if(r<=sum) { cost=i+1; break; } }
        const pool = CHAMPS.filter(c=>c.cost===cost); return pool.length ? pool[Math.floor(Math.random()*pool.length)] : CHAMPS[0];
    }
    getXpNeed() { return XP_TO_LEVEL[this.lvl] || 9999; }
}

// ==========================================
// EXPORT ĐỂ LOBBY GỌI
// ==========================================
window.initTFTGame = (userSettings) => {
    if (!window.gameInstance) {
        window.gameInstance = new GameManager(userSettings);
        window.gameInstance.isGameStarted = true;
        window.gameInstance.refreshShop();
        if (window.gameInstance.view && userSettings) {
             if (userSettings.uiScale) {
                document.documentElement.style.setProperty('--ui-scale', userSettings.uiScale);
                const slider = document.getElementById('ui-scale-slider');
                const text = document.getElementById('ui-scale-text');
                if(slider && text) {
                    const pct = Math.round(userSettings.uiScale * 50);
                    slider.value = pct; text.innerText = pct + "%";
                }
            }
            if (userSettings.zoomIdx !== undefined) {
                window.gameInstance.view.zoomIdx = userSettings.zoomIdx;
                window.gameInstance.view.targetPos = window.gameInstance.view.zoomLevels[userSettings.zoomIdx].pos.clone();
                window.gameInstance.view.targetLook = window.gameInstance.view.zoomLevels[userSettings.zoomIdx].look.clone();
            }
        }
        window.gameInstance.view.updateUI();
    }
};
