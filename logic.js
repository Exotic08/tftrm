import { CHAMPS, SYNERGIES, XP_TO_LEVEL, SHOP_ODDS, MONSTERS, PVE_ROUNDS, ITEMS, RECIPES, AUGMENTS, AUGMENT_ROUNDS, TIMERS } from './shared.js';
import { Unit, ViewManager } from './engine.js';
import { UnitFactory } from './3d.js'; 
import { ref, update, onValue, set, off, get } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

function createIconTexture(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 30, 40, 0.9)'; 
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = color; 
    ctx.stroke();
    ctx.font = '80px Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 70); 
    return new THREE.CanvasTexture(canvas);
}

const originalUpdateStats = Unit.prototype.updateStats;
Unit.prototype.updateStats = function() {
    originalUpdateStats.call(this); 
    if (this.team === 'player' && this.gm && this.gm.augments) {
        this.gm.augments.forEach(aug => {
            const s = aug.stats;
            if (!s) return;
            if (s.dmgPct) this.currStats.dmg = Math.floor(this.currStats.dmg * (1 + s.dmgPct/100));
            if (s.as) this.currStats.as += s.as;
            if (s.hp) this.maxHp += s.hp;
            if (s.hpPct) this.maxHp = Math.floor(this.maxHp * (1 + s.hpPct/100));
            if (s.armor) this.currStats.armor += s.armor;
            if (this.currStats.type === 'range') {
                if (s.rangeBoost) this.currStats.range += s.rangeBoost;
                if (s.rangeDmg) this.currStats.dmg = Math.floor(this.currStats.dmg * (1 + s.rangeDmg/100));
            }
            if (s.cost1Hp && this.data.cost === 1) this.maxHp += s.cost1Hp;
        });
        if (this.gm.phase !== 'combat' && !this.isDead) this.hp = this.maxHp;
    }
    this.updateBar();
};

export class GameManager {
    constructor(settings) {
        this.settings = settings || {};
        this.mode = this.settings.mode || 'pve'; 
        this.db = this.settings.db;
        this.matchId = this.settings.matchId;
        this.myId = this.settings.myId;
        this.opponentId = this.settings.opponentId;

        this.units = []; this.hexes = []; this.interestOrbs = [];
        this.vfxList = []; this.projList = [];
        this.isGameStarted = false;
        
        this.gold = 4; this.lvl = 1; this.xp = 0; this.php = 100; this.ehp = 100; 
        this.stage = 1; this.subRound = 1; this.phase = 'prep';
        this.timer = TIMERS.PREP; 
        this.lastTime = 0; 
        
        // Trạng thái chờ đồng bộ PvP
        this.isWaiting = false;
        this.pendingResult = null;

        const components = Object.keys(ITEMS).filter(key => ITEMS[key].isComponent);
        const randomStartItem = components[Math.floor(Math.random() * components.length)];
        this.inventory = [randomStartItem];

        this.augments = []; this.augmentPool = [...AUGMENTS]; 
        this.pillarGroup = null; this.pillarIcons = [];

        this.isShopLocked = false;
        this.isDragging = false; this.clickStart = {x:0, y:0};
        this.dragged = null; this.dragGroup = null; this.hoveredHex = null;
        this.dragItem = null; this.dragItemEl = null;
        this.ray = new THREE.Raycaster(); this.mouse = new THREE.Vector2();

        this.view = new ViewManager(this);

        try { 
            this.view.init(); 
            this.createAugmentPillar3D(); 
            this.initInput();
            this.view.renderInventory(); 
            
            if(this.mode === 'pvp') {
                this.listenMatchState();
                this.view.toast("PVP MODE CONNECTED!");
            }

            this.lastTime = performance.now();
            this.loop(); 
        } catch(e) { console.error("Game Init Error:", e); alert("Lỗi: " + e.message); }
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        const now = performance.now();
        const dt = (now - this.lastTime) / 1000; 
        this.lastTime = now;

        if (this.isGameStarted && !this.isWaiting) {
            this.updateTimer(dt);
        }

        this.view.updateCamera();
        this.units.forEach(u => u.update(now * 0.001, this.units)); 
        
        if(this.phase === 'combat' && !this.isWaiting) {
            const playerLive = this.units.filter(u => u.team === 'player' && !u.isDead && !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench).length;
            const enemyLive = this.units.filter(u => u.team === 'enemy' && !u.isDead).length;
            if (playerLive === 0) this.endCombat(false); 
            else if (enemyLive === 0) this.endCombat(true); 
        }

        for(let i=this.vfxList.length-1; i>=0; i--) { if(!this.vfxList[i].update()) { this.vfxList.splice(i, 1); } }
        for(let i=this.projList.length-1; i>=0; i--) { if(!this.projList[i].update()) { this.projList.splice(i, 1); } }
        
        const maxInterest = this.augments.find(a => a.id === 'rich_get_richer') ? 7 : 5;
        const interest = Math.min(Math.floor(this.gold / 10), maxInterest);
        this.interestOrbs.forEach((orb, i) => { 
            orb.visible = i < interest;
            if(orb.visible) { orb.position.y = orb.userData.baseY + Math.sin(now * 0.003 + orb.userData.offset)*0.2; } 
        });

        if (this.pillarIcons) {
            this.pillarIcons.forEach((icon, i) => {
                if(icon.visible) {
                    icon.position.y = icon.userData.baseY + Math.sin(now * 0.002 + i) * 0.15;
                    icon.lookAt(this.view.camera.position); 
                }
            });
        }
        
        if(this.view.scene && this.view.camera) this.view.renderer.render(this.view.scene, this.view.camera);
    }

    updateTimer(dt) {
        if (this.php <= 0 || this.ehp <= 0) return; 
        this.timer -= dt;
        const timerFill = document.getElementById('timer-bar-fill');
        const timerText = document.getElementById('timer-text');
        const phaseText = document.getElementById('phase-text');
        
        if (timerFill && timerText && phaseText) {
            const maxTime = this.phase === 'prep' ? TIMERS.PREP : TIMERS.COMBAT;
            const pct = Math.max(0, (this.timer / maxTime) * 100);
            timerFill.style.width = `${pct}%`;
            timerText.innerText = Math.ceil(this.timer);
            phaseText.innerText = this.phase === 'prep' ? "CHUẨN BỊ" : "CHIẾN ĐẤU";
            if (this.timer < 5) timerFill.classList.add('urgent');
            else timerFill.classList.remove('urgent');
        }

        if (this.timer <= 0) {
            if (this.phase === 'prep') {
                this.autoDeploy(); 
                this.startCombat();
            } else {
                this.view.toast("HẾT GIỜ! HÒA!");
                this.endCombat(false); 
            }
        }
    }

    autoDeploy() {
        const limitBonus = this.augments.find(a => a.id === 'new_recruit') ? 1 : 0;
        const limit = this.lvl + limitBonus;
        const activeUnits = this.units.filter(u => u.team === 'player' && !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench);
        let currentCount = activeUnits.length;
        if (currentCount >= limit) return;
        const benchUnits = this.units.filter(u => u.team === 'player' && u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench);
        if (benchUnits.length === 0) return;
        const emptyBoardHexes = this.hexes.filter(h => h.userData.isPlayer && !h.userData.isBench && !h.userData.occupied);
        benchUnits.forEach(u => {
            if (currentCount < limit && emptyBoardHexes.length > 0) {
                const targetHex = emptyBoardHexes.shift(); 
                const oldHex = u.group.children.find(c=>c.name==='hitbox').userData.hex;
                oldHex.userData.occupied = false;
                targetHex.userData.occupied = true;
                u.group.children.find(c=>c.name==='hitbox').userData.hex = targetHex;
                u.group.position.copy(targetHex.position);
                u.group.children.find(c=>c.name==='hitbox').userData.origPos = targetHex.position.clone();
                this.view.spawnVFX(targetHex.position, 'upgrade');
                currentCount++;
            }
        });
        if (currentCount > activeUnits.length) {
            this.view.toast("Tự động ra trận!");
            this.calcSyn();
            this.view.updateUI();
        }
    }

    createUnit(data, hex, team) {
        const group = UnitFactory.createUnitGroup(data, hex, team);
        this.view.scene.add(group);
        const unit = new Unit(group, data, team, this);
        this.units.push(unit);
        return unit;
    }

    buyUnit(data) {
        if(this.gold < data.cost) { this.view.toast("Không đủ vàng!"); return false; }
        const benchHex = this.hexes.find(h => h.userData.isPlayer && h.userData.isBench && !h.userData.occupied);
        if(!benchHex) { this.view.toast("Hàng chờ đầy!"); return false; }
        this.gold -= data.cost;
        const newUnit = this.createUnit(data, benchHex, 'player');
        this.checkTriple(newUnit);
        this.calcSyn();
        this.view.updateUI();
        return true;
    }

    sellUnit(mesh) {
        const unit = this.units.find(u => u.group === mesh.parent);
        if(unit) {
            const refund = unit.data.cost * Math.pow(3, unit.star - 1);
            this.gold += refund;
            if(unit.items.length > 0) {
                unit.items.forEach(item => {
                    if(this.inventory.length < 10) this.inventory.push(item);
                });
                this.view.renderInventory();
                this.view.toast("Đã thu hồi trang bị");
            }
            unit.destroy();
            this.units = this.units.filter(u => u !== unit);
            this.view.toast(`Bán +${refund}g`);
            this.calcSyn();
            this.view.updateUI();
        }
    }

    checkTriple(unit) {
        if(unit.star >= 3) return;
        const sameUnits = this.units.filter(u => u.team === 'player' && u.data.id === unit.data.id && u.star === unit.star && !u.isDead);
        if(sameUnits.length >= 3) {
            const u1 = sameUnits[0];
            const u2 = sameUnits[1];
            const u3 = sameUnits[2];
            const targetHex = u3.group.children.find(c=>c.name==='hitbox').userData.hex;
            const collectedItems = [...u1.items, ...u2.items, ...u3.items].slice(0, 3); 
            u1.destroy(); u2.destroy(); u3.destroy();
            this.units = this.units.filter(u => u !== u1 && u !== u2 && u !== u3);
            const newUnit = this.createUnit(unit.data, targetHex, 'player');
            newUnit.star = unit.star; 
            newUnit.upgradeStar();
            collectedItems.forEach(item => newUnit.addItem(item));
            newUnit.updateStats();
            this.view.spawnVFX(newUnit.group.position, 'upgrade');
            this.view.toast(`NÂNG CẤP: ${newUnit.data.name} ${newUnit.star} SAO!`);
            this.checkTriple(newUnit);
        }
    }
    
    handleItemStart(e, index, el) {
        e.stopPropagation();
        this.dragItem = index;
        this.dragItemEl = el;
        const ghost = document.getElementById('drag-ghost');
        if(ghost) {
            ghost.classList.remove('hidden');
            ghost.innerText = ITEMS[this.inventory[index]].icon;
            ghost.style.borderColor = ITEMS[this.inventory[index]].color;
            this.updateGhostPos(e);
        }
    }

    async startCombat() {
        if(this.phase === 'combat') return;
        const active = this.units.filter(u=>u.team==='player' && !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench);
        if(!active.length) { this.view.toast("Không có tướng! Tự động thua."); }
        this.phase = 'combat';
        this.timer = TIMERS.COMBAT; 
        this.updateUIPhase(true); 
        this.units.filter(u=>u.team==='enemy').forEach(u=>u.destroy()); 
        this.units = this.units.filter(u=>u.team==='player'); 
        const roundKey = `${this.stage}-${this.subRound}`;
        if (PVE_ROUNDS[roundKey]) {
            this.spawnPveEnemies(PVE_ROUNDS[roundKey]);
        } else {
            await this.spawnPvpOpponent(active);
        }
        this.view.closeInspector();
    }

    spawnPveEnemies(monsterList) {
        this.view.toast("PVE ROUND START!");
        const enemyHexes = this.hexes.filter(h => !h.userData.isPlayer && !h.userData.occupied);
        monsterList.forEach((mid, i) => {
            if (enemyHexes[i]) {
                const mData = MONSTERS[mid];
                if(mData) {
                    const m = this.createUnit(mData, enemyHexes[i], 'enemy');
                    const stageBuff = 1 + (this.stage * 0.4); 
                    m.maxHp = Math.floor(m.maxHp * stageBuff);
                    m.currStats.dmg = Math.floor(m.currStats.dmg * stageBuff);
                    m.hp = m.maxHp;
                    m.updateBar();
                }
            }
        });
    }

    async spawnPvpOpponent(activeUnits) {
        if (this.mode === 'pvp') {
            this.view.toast("PVP: Đang chờ đối thủ...");
            const myBoardData = this.serializeBoard(activeUnits);
            await update(ref(this.db, `matches/${this.matchId}/boards/${this.myId}`), {
                units: myBoardData,
                ready: true
            });
            const enemyRef = ref(this.db, `matches/${this.matchId}/boards/${this.opponentId}`);
            let found = false;
            const onData = (snap) => {
                const data = snap.val();
                if (data && data.ready && !found) {
                    found = true;
                    off(enemyRef, 'value', onData); 
                    this.spawnEnemyFromData(data.units);
                }
            };
            onValue(enemyRef, onData);
            setTimeout(() => {
                if (!found) {
                    found = true;
                    off(enemyRef, 'value', onData);
                    this.view.toast("Đối thủ mất kết nối! Đấu với Bot.");
                    this.spawnBotFallback(); 
                }
            }, 8000);
        } else {
            this.spawnBotFallback();
        }
    }

    spawnBotFallback() {
        this.view.toast("PVP START (vs BOT)!");
        const enemyHexes = this.hexes.filter(h => !h.userData.isPlayer && !h.userData.occupied);
        const shuffledHexes = enemyHexes.sort(() => 0.5 - Math.random());
        let botLvl = Math.min(this.stage + 2, 9);
        for(let i=0; i < botLvl; i++) {
            if(shuffledHexes[i]) {
                const botUnitData = this.rollChamp(botLvl);
                const enemy = this.createUnit(botUnitData, shuffledHexes[i], 'enemy');
                const r = Math.random();
                let targetStar = 1;
                if (this.stage >= 3) { if (r < 0.3) targetStar = 2; }
                if (this.stage >= 5) { if (r < 0.6) targetStar = 2; else if (r > 0.9) targetStar = 3; }
                for(let s=1; s < targetStar; s++) enemy.upgradeStar();
                if (this.stage >= 3 && Math.random() > 0.5) {
                    const itemKeys = Object.keys(ITEMS);
                    enemy.addItem(itemKeys[Math.floor(Math.random()*itemKeys.length)]);
                }
                enemy.hp = enemy.maxHp; 
                enemy.updateBar();
            }
        }
    }

    // --- LOGIC KẾT THÚC VÒNG ĐẤU ĐÃ SỬA (SYNC PVP) ---
    endCombat(win) {
        if(win) { this.ehp-=10; this.view.toast("CHIẾN THẮNG!"); } 
        else { 
            this.php-=10; this.view.toast("THẤT BẠI!"); 
        }

        // Logic cũ được tách ra:
        if (this.mode === 'pvp') {
            // PvP: Bật cờ chờ, gửi kết quả lên server
            this.isWaiting = true;
            this.pendingResult = win;
            this.view.toast("Đang đợi đối thủ kết thúc...");
            update(ref(this.db, `matches/${this.matchId}/states/${this.myId}`), { 
                hp: this.php,
                finished: true 
            });
        } else {
            // PvE: Kết thúc ngay như bình thường
            this.finalizeRound(win);
        }
    }

    // Hàm mới: Chỉ chạy khi cả 2 người chơi đều xong (hoặc PvE)
    finalizeRound(win) {
        this.isWaiting = false; // Tắt trạng thái chờ
        
        // Reset cờ finished trên server để chuẩn bị vòng sau
        if(this.mode === 'pvp') {
            update(ref(this.db, `matches/${this.matchId}/states/${this.myId}`), { finished: false });
            update(ref(this.db, `matches/${this.matchId}/boards/${this.myId}`), { ready: false });
        }

        if(this.php<=0 || this.ehp<=0) { 
            document.getElementById('game-over').classList.remove('hidden'); 
            const result = this.php > this.ehp ? "THẮNG" : "THUA"; 
            document.getElementById('end-title').innerText = `${result} (HP: ${this.php} vs ${this.ehp})`; 
            this.isGameStarted = false; 
            return; 
        }

        this.phase = 'prep';
        this.timer = TIMERS.PREP; 
        this.updateUIPhase(false);
        this.view.targetPos = this.view.zoomLevels[1].pos.clone(); 

        this.subRound++; 
        if(this.subRound > 6) { this.subRound = 1; this.stage++; this.view.toast(`LÊN STAGE ${this.stage}!`); }
        this.checkAugmentRound();
        
        const maxInterest = this.augments.find(a => a.id === 'rich_get_richer') ? 7 : 5;
        const interest = Math.min(Math.floor(this.gold / 10), maxInterest); 
        this.gold += (5 + interest + (win?1:0)); this.xp += 2;
        
        this.units.forEach(u => { if(u.team==='player') u.reset(); else u.destroy(); }); 
        this.units = this.units.filter(u=>u.team==='player');
        
        if(this.xp >= this.getXpNeed()) { this.xp-=this.getXpNeed(); this.lvl++; }
        if(!this.isShopLocked) this.refreshShop();
        this.view.updateUI();
    }

    updateUIPhase(isCombat) {
        const els = ['shop-wrapper', 'sell-slot']; 
        els.forEach(id => { const el = document.getElementById(id); if(el) isCombat ? el.classList.add('hidden') : el.classList.remove('hidden'); });
        if(isCombat) { this.view.targetPos = this.view.zoomLevels[2].pos.clone(); this.view.targetLook = this.view.zoomLevels[2].look.clone(); }
    }

    createAugmentPillar3D() {
        this.pillarGroup = new THREE.Group();
        this.pillarGroup.position.set(-15, 0, 0); 
        this.pillarGroup.scale.set(0.8, 0.8, 0.8); 
        const geo = new THREE.CylinderGeometry(1.5, 2, 4, 8);
        const mat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.3, metalness: 0.8, emissive: 0x055861, emissiveIntensity: 0.2 });
        const body = new THREE.Mesh(geo, mat); body.position.y = 2; body.castShadow = true; this.pillarGroup.add(body);
        const ringGeo = new THREE.TorusGeometry(1.6, 0.1, 4, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x0acde3 });
        const ring = new THREE.Mesh(ringGeo, ringMat); ring.rotation.x = Math.PI/2; ring.position.y = 3.8; this.pillarGroup.add(ring);
        for(let i=0; i<3; i++) {
            const iconGeo = new THREE.PlaneGeometry(2.2, 2.2);
            const iconMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, visible: false, side: THREE.DoubleSide });
            const iconMesh = new THREE.Mesh(iconGeo, iconMat);
            iconMesh.position.set(0, 5.5 + (i * 2.8), 0);
            this.pillarIcons.push(iconMesh); this.pillarGroup.add(iconMesh);
        }
        const light = new THREE.PointLight(0x0acde3, 1, 10);
        light.position.set(0, 5, 2); this.pillarGroup.add(light);
        this.view.scene.add(this.pillarGroup);
    }

    updateAugmentPillar3D() {
        this.augments.forEach((aug, i) => {
            if (i < 3) {
                const iconMesh = this.pillarIcons[i];
                let iconChar = '💎'; let color = '#0acde3'; 
                if (aug.type === 'combat') { iconChar = '⚔️'; color = '#e74c3c'; }
                if (aug.type === 'def') { iconChar = '🛡️'; color = '#2ecc71'; }
                if (aug.type === 'eco') { iconChar = '💰'; color = '#f1c40f'; }
                if (aug.type === 'item') { iconChar = '🎁'; color = '#9b59b6'; }
                iconMesh.material.map = createIconTexture(iconChar, color);
                iconMesh.material.visible = true;
                iconMesh.userData = { baseY: 5.5 + (i * 2.8), speed: 2 + i };
            }
        });
    }

    checkAugmentRound() {
        const roundKey = `${this.stage}-${this.subRound}`;
        if (AUGMENT_ROUNDS.includes(roundKey)) { setTimeout(() => this.triggerAugmentSelection(), 800); }
    }

    triggerAugmentSelection() {
        const modal = document.getElementById('augment-modal');
        const container = document.getElementById('augment-cards-container');
        const closeBtn = document.getElementById('btn-close-aug');
        const title = document.getElementById('aug-modal-title');
        if (!modal || !container) return;
        closeBtn.classList.add('hidden'); 
        title.innerText = "LỰA CHỌN LÕI CÔNG NGHỆ";
        container.innerHTML = ''; 
        const choices = [];
        for (let i = 0; i < 3; i++) {
            if (this.augmentPool.length === 0) break;
            const idx = Math.floor(Math.random() * this.augmentPool.length);
            choices.push(this.augmentPool[idx]);
            this.augmentPool.splice(idx, 1);
        }
        choices.forEach(aug => {
            const card = this.createAugmentCard(aug);
            card.onclick = () => {
                if (card.classList.contains('selecting') || card.classList.contains('flying')) return;
                this.selectAugment(aug, card);
            };
            container.appendChild(card);
        });
        modal.classList.remove('hidden');
    }

    showAugmentInfo() {
        const modal = document.getElementById('augment-modal');
        const container = document.getElementById('augment-cards-container');
        const closeBtn = document.getElementById('btn-close-aug');
        const title = document.getElementById('aug-modal-title');
        if (!modal || !container || this.augments.length === 0) return;
        closeBtn.classList.remove('hidden'); 
        title.innerText = "LÕI CÔNG NGHỆ ĐÃ SỞ HỮU";
        container.innerHTML = '';
        this.augments.forEach(aug => {
            const card = this.createAugmentCard(aug);
            card.classList.add('info-only');
            container.appendChild(card);
        });
        modal.classList.remove('hidden');
    }

    createAugmentCard(aug) {
        const card = document.createElement('div');
        card.className = 'aug-card';
        let icon = '💎';
        if (aug.type === 'combat') icon = '⚔️';
        if (aug.type === 'def') icon = '🛡️';
        if (aug.type === 'eco') icon = '💰';
        if (aug.type === 'item') icon = '🎁';
        card.innerHTML = `<div class="aug-icon">${icon}</div><div class="aug-name">${aug.name}</div><div class="aug-desc">${aug.desc}</div>`;
        return card;
    }

    selectAugment(aug, cardElement) {
        cardElement.classList.add('selecting');
        setTimeout(() => {
            cardElement.classList.remove('selecting');
            cardElement.classList.add('flying');
            setTimeout(() => {
                this.augments.push(aug);
                this.view.toast(`Đã chọn: ${aug.name}`);
                if (aug.instant) {
                    if (aug.id === 'windfall') this.gold += 15;
                    if (aug.id === 'rich_get_richer') { this.gold += 10; }
                    if (aug.id === 'scholar') this.xp += 8;
                    if (aug.id === 'first_aid') { this.php = Math.min(100, this.php + 20); }
                    if (aug.type === 'item') {
                        const allItems = Object.keys(ITEMS);
                        const candidates = aug.id === 'secret_weapon' ? allItems.filter(k => ITEMS[k].isComponent) : allItems.filter(k => !ITEMS[k].isComponent);
                        const reward = candidates[Math.floor(Math.random() * candidates.length)];
                        if (this.inventory.length < 8) this.inventory.push(reward); else { this.gold += 5; this.view.toast("Túi đầy -> +5 vàng"); }
                        this.view.renderInventory();
                    }
                }
                this.updateAugmentPillar3D();
                this.units.forEach(u => u.updateStats());
                this.view.updateUI();
                if (this.xp >= this.getXpNeed()) { this.xp -= this.getXpNeed(); this.lvl++; }
                if (this.pillarGroup) { this.view.spawnVFX(this.pillarGroup.position, 'augment_select'); }
                document.getElementById('augment-modal').classList.add('hidden');
            }, 500); 
        }, 600); 
    }

    onMonsterDeath(monster) {
        if (Math.random() < 0.3) {
            const componentKeys = Object.keys(ITEMS).filter(k => ITEMS[k].isComponent);
            const randomItem = componentKeys[Math.floor(Math.random() * componentKeys.length)];
            if (this.inventory.length < 8) { 
                this.inventory.push(randomItem); 
                this.view.renderInventory(); 
                this.view.toast(`Nhặt được: ${ITEMS[randomItem].name}`); 
            } else { this.gold += 2; this.view.toast("Túi đầy: +2 vàng"); }
        } else {
            const goldDrop = Math.floor(Math.random() * 3) + 1; 
            this.gold += goldDrop; this.view.updateUI();
            this.view.toast(`Nhặt được: ${goldDrop} vàng`); 
        }
    }

    serializeBoard(units) { return units.map(u => { const hex = u.group.children.find(c=>c.name==='hitbox').userData.hex; const hexIdx = this.hexes.indexOf(hex); return { id: u.data.id, star: u.star, items: u.items, hexIdx: hexIdx }; }); }
    
    spawnEnemyFromData(unitsData) {
        if(!unitsData) return;
        this.view.toast("PVP START!");
        unitsData.forEach(ud => {
            const champData = CHAMPS.find(c => c.id === ud.id);
            if (champData) {
                const mirrorIdx = 55 - ud.hexIdx;
                const spawnHex = this.hexes[mirrorIdx];
                if (spawnHex) {
                    const enemy = this.createUnit(champData, spawnHex, 'enemy');
                    enemy.star = 1; for(let i=1; i<ud.star; i++) enemy.upgradeStar();
                    enemy.items = ud.items || []; enemy.updateStats();
                }
            }
        });
    }

    initInput() {
        const handler = (e) => this.handleInput(e);
        const opts = { passive: false }; 
        const canvas = this.view.renderer.domElement;
        canvas.addEventListener('mousedown', handler);
        window.addEventListener('mousemove', handler);
        window.addEventListener('mouseup', handler);
        canvas.addEventListener('touchstart', handler, opts);
        window.addEventListener('touchmove', handler, opts);
        window.addEventListener('touchend', handler, opts);
        const closeAug = document.getElementById('btn-close-aug');
        if(closeAug) closeAug.onclick = () => { document.getElementById('augment-modal').classList.add('hidden'); };
    }
    
    handleInput(e) {
        if (!this.isGameStarted) return;
        const isTouch = e.type.startsWith('touch');
        if (this.dragged || this.dragItem !== null || (isTouch && this.isDragging)) {
            if (e.cancelable) e.preventDefault(); 
        }
        let cx, cy;
        if (isTouch) {
            if (e.touches && e.touches.length > 0) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; } 
            else if (e.changedTouches && e.changedTouches.length > 0) { cx = e.changedTouches[0].clientX; cy = e.changedTouches[0].clientY; }
        } else { cx = e.clientX; cy = e.clientY; }
        if (cx === undefined || isNaN(cx)) return;
        const fakeEvent = { clientX: cx, clientY: cy, target: e.target };
        if(e.type === 'mousedown' || e.type === 'touchstart') this.onDown(fakeEvent);
        else if(e.type === 'mousemove' || type === 'touchmove') this.onMove(fakeEvent);
        else if(e.type === 'mouseup' || type === 'touchend') this.onUp(fakeEvent);
    }

    updateRay(cx, cy) { 
        if (!this.view.renderer || !this.view.renderer.domElement) return;
        const canvas = this.view.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const x = cx - rect.left;
        const y = cy - rect.top;
        this.mouse.x = (x / rect.width) * 2 - 1;
        this.mouse.y = -(y / rect.height) * 2 + 1;
        this.ray.setFromCamera(this.mouse, this.view.camera); 
    }

    listenMatchState() { 
        // Lắng nghe trạng thái (HP và cờ finished) của tất cả người chơi
        onValue(ref(this.db, `matches/${this.matchId}/states`), (snap) => {
            const states = snap.val();
            if (!states) return;

            // Cập nhật HP địch
            const oppState = states[this.opponentId];
            if (oppState && oppState.hp !== undefined) {
                this.ehp = oppState.hp;
                this.view.updateUI();
                if(this.ehp <= 0 && this.phase === 'combat') this.endCombat(true); 
            }

            // Logic đồng bộ kết thúc vòng
            const myState = states[this.myId];
            // Nếu cả 2 đều đã finished và mình đang ở trạng thái Waiting -> Vào vòng mới
            if (this.isWaiting && myState?.finished && oppState?.finished) {
                this.finalizeRound(this.pendingResult);
            }
        }); 
    }

    onDown(e) {
        if(e.target.closest('#augment-modal') || e.target.closest('#sidebar-panel') || e.target.closest('.tab-btn')) return;
        if(e.target.closest('button') || e.target.closest('.card') || e.target.closest('#unit-inspector')) return;
        this.clickStart.x = e.clientX; this.clickStart.y = e.clientY; this.isDragging = false; 
        this.updateRay(e.clientX, e.clientY);
        if (this.pillarGroup) {
            const pillarHits = this.ray.intersectObjects(this.pillarGroup.children, true);
            if (pillarHits.length > 0) { this.showAugmentInfo(); return; }
        }
        if(this.phase==='combat') return; 
        const hits = this.ray.intersectObjects(this.view.scene.children, true); 
        const hit = hits.find(h => h.object.name === 'hitbox' && h.object.userData.team === 'player');
        if(hit) { this.dragged = hit.object; this.dragGroup = hit.object.parent; this.dragGroup.position.y = 2; document.getElementById('sell-slot').classList.add('hover'); }
    }

    onMove(e) {
        this.updateRay(e.clientX, e.clientY);
        if(this.dragItem !== null) { this.updateGhostPos(e); return; }
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
        if(this.dragItem !== null) {
            const ghost = document.getElementById('drag-ghost');
            if(ghost) ghost.classList.add('hidden');
            this.updateRay(e.clientX, e.clientY);
            const hits = this.ray.intersectObjects(this.view.scene.children, true);
            const unitHit = hits.find(h => h.object.name === 'hitbox' && h.object.userData.team === 'player');
            if(unitHit) {
                const u = this.units.find(unit => unit.group === unitHit.object.parent);
                if(u) {
                    const itemId = this.inventory[this.dragItem];
                    if(u.addItem(itemId)) {
                         this.inventory.splice(this.dragItem, 1);
                         this.view.renderInventory();
                         this.view.toast(`Đã trang bị: ${ITEMS[itemId].name}`);
                    } else { this.view.toast("Tướng đã đầy đồ!"); }
                }
            }
            this.dragItem = null;
            return;
        }
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
                const limitBonus = this.augments.find(a => a.id === 'new_recruit') ? 1 : 0;
                if(count >= this.lvl + limitBonus) { this.view.toast("Giới hạn tướng!"); valid = false; } 
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
    
    updateGhostPos(e) { let cx, cy; if(e.touches && e.touches.length > 0) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; } else if (e.changedTouches && e.changedTouches.length > 0) { cx = e.changedTouches[0].clientX; cy = e.changedTouches[0].clientY; } else { cx = e.clientX; cy = e.clientY; } const ghost = document.getElementById('drag-ghost'); ghost.style.left = (cx - 20) + 'px'; ghost.style.top = (cy - 20) + 'px'; }
}

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
                if(slider && text) { const pct = Math.round(userSettings.uiScale * 50); slider.value = pct; text.innerText = pct + "%"; }
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
