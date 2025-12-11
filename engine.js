// engine.js
// GỘP: unit.js + viewManager.js
// CẬP NHẬT: ĐỒ HỌA MÔI TRƯỜNG ĐẸP HƠN & SỬA LỖI RESET TƯỚNG & KHẮC PHỤC CRASH

import { 
    CHAMPS, SYNERGIES, ITEMS, STATS, ARENA_RADIUS,
    VisualEffect, Projectile, SKILLS 
} from './shared.js';

// ==========================================
// CLASS UNIT: QUẢN LÝ TƯỚNG/QUÁI
// ==========================================
export class Unit {
    constructor(group, data, team, gm) {
        this.group = group; 
        this.data = data; 
        this.team = team; 
        this.gm = gm;
        
        this.star = 1; 
        this.shield = 0; 
        this.stunTime = 0;
        this.mana = 0; 
        this.maxMana = 100; 
        this.items = [];
        
        // Tạo thanh máu HTML
        this.bar = document.createElement('div'); 
        this.bar.className = `bar-wrap ${team} star-1`;
        this.bar.innerHTML = `<div class="item-badge-container"></div><div class="bar-hp"><div class="bar-fill"></div></div><div class="bar-mana"><div class="mana-fill"></div></div>`;
        const worldUI = document.getElementById('world-ui');
        if(worldUI) worldUI.appendChild(this.bar);
        
        this.meshBody = group.children.find(c=>c.name==='body');
        if(this.meshBody) this.origColor = this.meshBody.material.color.clone();
        
        this.isDead = false; 
        this.target = null; 
        this.lastAtk = 0;
        
        this.updateStats(); 
        this.updateBar(); 
    }

    // --- SỬA LỖI: HÀM RESET ĐẦY ĐỦ ---
    reset() {
        this.isDead = false;
        this.hp = this.maxHp; // Hồi đầy máu
        
        // Reset Mana
        let startMana = 0; 
        this.items.forEach(id => { if(ITEMS[id].stats.mana) startMana += ITEMS[id].stats.mana; });
        this.mana = Math.min(startMana, this.maxMana);
        
        this.shield = 0;
        this.stunTime = 0;
        this.group.visible = true; // Hiện hình lại
        this.target = null;
        
        // Trả về màu gốc
        if(this.meshBody) this.meshBody.material.color.copy(this.origColor);
        
        // Đưa về vị trí cũ trên bàn cờ
        const hitBox = this.group.children.find(c=>c.name==='hitbox');
        if(hitBox && hitBox.userData.origPos) {
            this.group.position.copy(hitBox.userData.origPos);
            this.group.rotation.set(0,0,0);
        }
        
        // Hiện lại thanh máu
        if(this.bar) {
            this.bar.style.display = 'flex';
            this.updateBar();
            this.updateBarPos();
        }
    }

    addItem(itemId) { 
        if(this.items.length >= 3) return false; 
        this.items.push(itemId); this.updateStats(); this.renderItemBadges(); return true; 
    }
    
    renderItemBadges() { 
        if(!this.bar) return; 
        const container = this.bar.querySelector('.item-badge-container'); 
        if(container) {
            container.innerHTML = ''; 
            this.items.forEach(id => { const item = ITEMS[id]; const div = document.createElement('div'); div.className = 'mini-item'; div.style.backgroundColor = item.color; container.appendChild(div); }); 
        }
    }

    upgradeStar() { 
        this.star++; this.updateStats(); 
        const scale = (this.data.scale || 1) + (this.star - 1) * 0.4; this.group.scale.set(scale, scale, scale); 
        this.bar.className = `bar-wrap ${this.team} star-${this.star}`; 
        this.hp = this.maxHp; this.mana = 0; this.updateBar(); 
    }

    updateStats() {
        const base = STATS[this.data.id]; 
        const multiplier = Math.pow(1.8, this.star - 1); 
        const oldMaxHp = this.maxHp || 0;
        
        let newMaxHp = Math.floor(base.hp * multiplier); 
        let newDmg = Math.floor(base.dmg * multiplier); 
        let newAs = base.as; 
        let newArmor = base.armor || 0; 
        
        this.items.forEach(id => { const stats = ITEMS[id].stats; if(stats.hp) newMaxHp += stats.hp; if(stats.dmg) newDmg += stats.dmg; if(stats.as) newAs += stats.as; if(stats.armor) newArmor += stats.armor; });
        
        this.maxHp = newMaxHp; this.currStats = { ...base, dmg: newDmg, as: newAs, armor: newArmor };
        
        if(this.hp === undefined) { this.hp = this.maxHp; } 
        else { 
            const diff = newMaxHp - oldMaxHp; 
            if (diff > 0) this.hp += diff; 
            if (this.hp > this.maxHp) this.hp = this.maxHp; 
        }
        
        if(this.hp <= 0 && !this.isDead) this.hp = this.maxHp; 
        this.updateBar();
    }

    takeDmg(amt) {
        if (this.isDead || isNaN(amt)) return;
        const armor = this.currStats.armor || 0; let reducedAmt = amt * 100 / (100 + armor);
        if(this.shield > 0) { const absorb = Math.min(this.shield, reducedAmt); this.shield -= absorb; reducedAmt -= absorb; }
        
        if(reducedAmt > 0) {
            this.hp -= reducedAmt; this.gainMana(5); 
            if(this.meshBody && !this.isDead) { 
                this.meshBody.material.color.setHex(0xffffff); 
                setTimeout(()=>{ if(this.meshBody && !this.isDead && this.stunTime <= 0) this.meshBody.material.color.copy(this.origColor); }, 50); 
            }
            if(this.hp <= 0) { 
                this.hp = 0; this.isDead = true; this.group.visible = false; this.bar.style.display = 'none'; 
                if (this.data.isMonster) this.gm.onMonsterDeath(this); 
            }
        }
        this.updateBar();
    }

    update(t, units) {
        if(this.isDead) { this.bar.style.display='none'; return; }
        
        if(this.stunTime > 0) { 
            this.stunTime -= 0.016; 
            if(this.meshBody) this.meshBody.material.color.setHex(0x00a8ff); 
            if(this.stunTime <= 0 && this.meshBody) this.meshBody.material.color.copy(this.origColor); 
            this.updateBarPos(); return; 
        }
        this.updateBarPos();
        
        if(this.gm.phase !== 'combat') { 
            let startMana = 0; this.items.forEach(id => { if(ITEMS[id].stats.mana) startMana += ITEMS[id].stats.mana; }); 
            this.mana = Math.min(startMana, this.maxMana); this.shield = 0; this.updateBar(); return; 
        }

        const hitBox = this.group.children.find(c=>c.name==='hitbox'); 
        if(hitBox && hitBox.userData.hex && hitBox.userData.hex.userData.isBench) return;

        if(!this.target || this.target.isDead) this.findTarget(units);
        
        if(this.target) {
            const d = this.group.position.distanceTo(this.target.group.position);
            if(d <= this.currStats.range + 0.8) {
                this.group.lookAt(this.target.group.position.x, this.group.position.y, this.target.group.position.z);
                if(t - this.lastAtk > (1/this.currStats.as)) { 
                    this.lastAtk = t; 
                    if(this.mana >= this.maxMana) this.castSkill(units); else this.attack(); 
                }
            } else { this.move(this.target.group.position, units); }
        }
    }

    updateBarPos() {
        if (!this.gm.view || !this.gm.view.camera) return;
        const pos = this.group.position.clone(); pos.y += 2.5 * this.group.scale.y; 
        pos.project(this.gm.view.camera);
        const x = (pos.x*.5 + .5)*window.innerWidth; const y = (-(pos.y*.5) + .5)*window.innerHeight;
        this.bar.style.left = `${x}px`; this.bar.style.top = `${y}px`;
        this.bar.style.display = (pos.z<1 && this.group.visible && !this.isDead) ? 'flex' : 'none';
    }

    attack() {
        if (this.currStats.type === 'range') {
            const color = this.currStats.projColor || 0xffffff;
            this.gm.view.spawnProjectile(this.group.position, this.target, color, this.currStats.dmg);
        } else {
            this.group.position.y = 0.5; setTimeout(()=>this.group.position.y=0, 100);
            this.gm.view.spawnVFX(this.target.group.position, 'impact');
            this.target.takeDmg(this.currStats.dmg);
        }
        this.gainMana(10);
    }

    castSkill(units) { 
        this.mana = 0; this.updateBar(); 
        const skillId = this.currStats.skill || 'default'; 
        const skillFunc = SKILLS[skillId] || SKILLS['default']; 
        skillFunc(this, this.target, units); 
    }

    gainMana(amt) { if(this.mana < this.maxMana) { this.mana = Math.min(this.mana + amt, this.maxMana); this.updateBar(); } }
    
    findTarget(units) { 
        let minD = 999; this.target = null; 
        units.forEach(u => { if(u.team !== this.team && !u.isDead) { const d = this.group.position.distanceTo(u.group.position); if(d < minD) { minD = d; this.target = u; } } }); 
    }
    
    move(dest, units) {
        const dir = new THREE.Vector3().subVectors(dest, this.group.position).normalize(); const sep = new THREE.Vector3(); let count = 0;
        units.forEach(u => { if(u !== this && !u.isDead) { const d = this.group.position.distanceTo(u.group.position); if(d < 1.0) { const push = new THREE.Vector3().subVectors(this.group.position, u.group.position).normalize().divideScalar(d); sep.add(push); count++; } } });
        if(count>0) sep.divideScalar(count).multiplyScalar(0.8); dir.add(sep).normalize(); this.group.position.add(dir.multiplyScalar(0.06)); this.group.lookAt(dest.x, this.group.position.y, dest.z);
        const distFromCenter = this.group.position.length(); if(distFromCenter > ARENA_RADIUS) { this.group.position.setLength(ARENA_RADIUS); }
    }

    applyStun(duration) { this.stunTime = duration; }
    updateBar() { if(!this.bar) return; let hpPct = (this.hp / this.maxHp)*100; let manaPct = (this.mana / this.maxMana)*100; hpPct = Math.max(0, hpPct); manaPct = Math.max(0, manaPct); this.bar.querySelector('.bar-fill').style.width = `${hpPct}%`; this.bar.querySelector('.mana-fill').style.width = `${manaPct}%`; }
    destroy() { if(this.bar) this.bar.remove(); if(this.gm.view.scene) this.gm.view.scene.remove(this.group); }
}

// ==========================================
// CLASS VIEW MANAGER (ĐÃ CẬP NHẬT MÔI TRƯỜNG 3D)
// ==========================================
export class ViewManager {
    constructor(gm) {
        this.gm = gm;
        this.scene = null; this.camera = null; this.renderer = null;
        this.dragPlane = null;
        this.zoomLevels = [ 
            { pos: new THREE.Vector3(0, 22, 16), look: new THREE.Vector3(0, 0, 2) }, 
            { pos: new THREE.Vector3(0, 16, 12), look: new THREE.Vector3(0, 0, 1) }, 
            { pos: new THREE.Vector3(0, 10, 8),  look: new THREE.Vector3(0, 0, 0) } 
        ];
        this.zoomIdx = 1;
        this.targetPos = this.zoomLevels[1].pos.clone();
        this.targetLook = this.zoomLevels[1].look.clone();
        this.currLook = this.targetLook.clone();
    }

    init() {
        this.scene = new THREE.Scene();
        
        // --- CẬP NHẬT: BẦU TRỜI TRONG SÁNG ---
        this.scene.background = new THREE.Color(0x87ceeb); // Sky Blue
        this.scene.fog = new THREE.Fog(0x87ceeb, 20, 80); // Sương mù

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
        
        // --- SỬA LỖI: KIỂM TRA SETTINGS AN TOÀN TRƯỚC KHI DÙNG ---
        if (this.gm.settings) {
            if (this.gm.settings.uiScale) {
                document.documentElement.style.setProperty('--ui-scale', this.gm.settings.uiScale);
                const slider = document.getElementById('ui-scale-slider');
                const text = document.getElementById('ui-scale-text');
                if(slider && text) {
                    const pct = Math.round(this.gm.settings.uiScale * 50);
                    slider.value = pct;
                    text.innerText = pct + "%";
                }
            }
            if (this.gm.settings.zoomIdx !== undefined) {
                this.zoomIdx = this.gm.settings.zoomIdx;
                this.targetPos = this.zoomLevels[this.zoomIdx].pos.clone();
                this.targetLook = this.zoomLevels[this.zoomIdx].look.clone();
            }
        }

        this.camera.position.copy(this.targetPos); 
        this.camera.lookAt(this.targetLook);
        
        this.renderer = new THREE.WebGLRenderer({antialias:true}); 
        this.renderer.setSize(window.innerWidth, window.innerHeight); 
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Bóng mềm
        
        // --- CHÚ Ý: style.css đã set canvas position:fixed để tránh vỡ layout
        document.body.appendChild(this.renderer.domElement);
        
        // --- CẬP NHẬT: ÁNH SÁNG RỰC RỠ ---
        // 1. Ánh sáng môi trường
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        this.scene.add(hemiLight);

        // 2. Ánh sáng mặt trời
        const dir = new THREE.DirectionalLight(0xffffff, 1.2); 
        dir.position.set(10, 20, 10); 
        dir.castShadow = true;
        dir.shadow.mapSize.width = 2048;
        dir.shadow.mapSize.height = 2048;
        this.scene.add(dir);
        
        // 3. Sàn đấu sáng sủa hơn
        const grGeo = new THREE.PlaneGeometry(60,60); 
        const grMat = new THREE.MeshStandardMaterial({color:0x556677, roughness: 0.8, metalness: 0.1}); 
        const ground = new THREE.Mesh(grGeo, grMat); 
        ground.rotation.x = -Math.PI/2; 
        ground.receiveShadow = true; 
        this.scene.add(ground);
        
        this.dragPlane = new THREE.Mesh(new THREE.PlaneGeometry(50,50), new THREE.MeshBasicMaterial({visible:false})); 
        this.dragPlane.rotation.x = -Math.PI/2; this.scene.add(this.dragPlane);

        this.createGrid();
        window.addEventListener('resize', () => { 
            this.camera.aspect = window.innerWidth/window.innerHeight; 
            this.camera.updateProjectionMatrix(); this.renderer.setSize(window.innerWidth, window.innerHeight); 
        });
        this.initUIListeners();
    }

    createGrid() {
        const r=1, w=r*1.732, h=r*1.5; const hexGeo = new THREE.CylinderGeometry(r,r,0.2,6);
        for(let row=0; row<8; row++) { for(let col=0; col<7; col++) {
            const x = (col - 3)*w + (row%2 ? w/2 : 0); const z = (row - 3.5)*h; 
            const isPlayer = row >= 4; const isBench = row === 7;
            const mat = new THREE.MeshStandardMaterial({color: isBench ? 0x222 : (isPlayer ? 0x334466 : 0x553333), roughness: 0.5});
            const hex = new THREE.Mesh(hexGeo, mat); hex.position.set(x, 0.1, z); hex.receiveShadow = true;
            hex.userData = { isHex:true, occupied:false, isPlayer, isBench, origCol: mat.color.getHex() };
            const edges = new THREE.EdgesGeometry(hexGeo); 
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: isPlayer?0x66ccff:0xff6666, transparent:true, opacity:0.4}));
            hex.add(line); this.scene.add(hex); this.gm.hexes.push(hex);
        }}
        const slotGeo = new THREE.BoxGeometry(1.2, 0.2, 1.2); const slotMat = new THREE.MeshStandardMaterial({color: 0x222});
        const orbGeo = new THREE.SphereGeometry(0.4, 16, 16); const orbMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.6 }); 
        for(let i=0; i<5; i++) {
            const slot = new THREE.Mesh(slotGeo, slotMat); slot.position.set(9, 0.1, (i - 2) * 1.5); slot.receiveShadow = true; this.scene.add(slot);
            const orb = new THREE.Mesh(orbGeo, orbMat); orb.position.set(9, 1, (i - 2) * 1.5); orb.castShadow = true; orb.visible = false; orb.userData = { baseY: 1, offset: i }; this.scene.add(orb); this.gm.interestOrbs.push(orb);
        }
    }

    initUIListeners() {
        document.body.style.touchAction = 'none';
        const get = (id) => document.getElementById(id);
        const bind = (id, event, handler) => { const el = get(id); if (el) el[event] = handler; };

        bind('btn-start', 'onclick', () => { 
            const ui = get('ui-overlay'); if(ui) ui.classList.add('hidden'); 
            const gui = get('game-ui'); if(gui) gui.classList.remove('hidden'); 
            const sell = get('sell-slot'); if(sell) sell.classList.remove('hidden'); 
            this.gm.isGameStarted = true; this.gm.refreshShop(); this.updateUI(); 
        });

        bind('btn-battle', 'onclick', () => this.gm.startCombat());
        bind('btn-refresh', 'onclick', () => { if(this.gm.gold>=2){this.gm.gold-=2; this.gm.refreshShop(); this.updateUI();} });
        bind('btn-buy-xp', 'onclick', () => { if(this.gm.gold>=4 && this.gm.lvl<9) { this.gm.gold-=4; this.gm.xp+=4; if(this.gm.xp>=this.gm.getXpNeed()){this.gm.xp-=this.gm.getXpNeed();this.gm.lvl++} this.updateUI();} });
        bind('btn-shop-toggle', 'onclick', () => { const shp = get('shop-wrapper'); if(shp) shp.classList.toggle('hidden'); });
        bind('btn-restart', 'onclick', () => location.reload());
        bind('btn-close-inspector', 'onclick', () => this.closeInspector());
        bind('btn-lock', 'onclick', () => this.gm.toggleLock());
        bind('btn-settings', 'onclick', () => { const m = get('settings-modal'); if(m) m.classList.remove('hidden'); });
        bind('btn-close-settings', 'onclick', () => { const m = get('settings-modal'); if(m) m.classList.add('hidden'); });

        const slider = get('ui-scale-slider');
        const scaleText = get('ui-scale-text');
        if(slider && scaleText) {
            slider.oninput = (e) => {
                const val = e.target.value; 
                scaleText.innerText = val + '%';
                const scale = val / 50; 
                document.documentElement.style.setProperty('--ui-scale', scale);
                if(window.saveUserSettings) window.saveUserSettings({ uiScale: scale });
            };
        }

        const tabSyn = get('tab-btn-syn'); const tabInv = get('tab-btn-inv');
        if(tabSyn && tabInv) {
            tabSyn.onclick = () => { tabSyn.classList.add('active'); tabInv.classList.remove('active'); get('content-syn').classList.remove('hidden'); get('content-inv').classList.add('hidden'); };
            tabInv.onclick = () => { tabInv.classList.add('active'); tabSyn.classList.remove('active'); get('content-inv').classList.remove('hidden'); get('content-syn').classList.add('hidden'); };
        }
        
        const btnZoom = document.querySelector('.action-btn.zoom');
        if(btnZoom) { 
            const handler = (e) => { 
                e.stopPropagation(); 
                this.toggleZoom(); 
                if(window.saveUserSettings) window.saveUserSettings({ zoomIdx: this.zoomIdx });
            };
            btnZoom.onclick = handler; 
            btnZoom.ontouchstart = handler; 
        }
    }

    updateUI() {
        const elGold = document.getElementById('gold-text'); if(elGold) elGold.innerText = Math.floor(this.gm.gold);
        const elLvl = document.getElementById('lvl-text'); if(elLvl) elLvl.innerText = this.gm.lvl;
        const count = this.gm.units.filter(u => u.team==='player' && !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench).length;
        const elLim = document.getElementById('unit-limit-text'); if(elLim) elLim.innerText = `${count}/${this.gm.lvl}`;
        const xpNeed = this.gm.getXpNeed(); const xpPct = xpNeed > 0 ? (this.gm.xp / xpNeed)*100 : 0;
        const elXp = document.getElementById('xp-fill'); if(elXp) elXp.style.width = `${Math.min(100, xpPct)}%`;
        const php = document.getElementById('player-hp-text'); if(php) php.innerText = this.gm.php; 
        const phpf = document.getElementById('player-hp-fill'); if(phpf) phpf.style.width = `${Math.max(0, this.gm.php)}%`;
        const ehp = document.getElementById('enemy-hp-text'); if(ehp) ehp.innerText = this.gm.ehp; 
        const ehpf = document.getElementById('enemy-hp-fill'); if(ehpf) ehpf.style.width = `${Math.max(0, this.gm.ehp)}%`;
        const elRound = document.getElementById('round-display'); if(elRound) elRound.innerText = `${this.gm.stage}-${this.gm.subRound}`;
        const interest = Math.min(Math.floor(this.gm.gold / 10), 5);
        this.gm.interestOrbs.forEach((orb, i) => { orb.visible = i < interest; });
        const btnXp = document.getElementById('btn-buy-xp'); if(btnXp) { if(this.gm.gold < 4) btnXp.style.opacity = '0.5'; else btnXp.style.opacity = '1'; }
    }
    renderInventory() {
        const slots = document.querySelectorAll('.inv-slot');
        slots.forEach((slot, i) => {
            slot.innerHTML = '';
            if (i < this.gm.inventory.length) {
                const itemId = this.gm.inventory[i]; const item = ITEMS[itemId];
                const div = document.createElement('div'); div.className = 'item-icon'; div.style.borderColor = item.color; div.innerText = item.icon; div.style.touchAction = 'none'; div.style.userSelect = 'none';
                if (i === this.gm.dragItem) div.style.opacity = '0'; 
                div.onmouseenter = (e) => this.showTooltip(e, i); div.onmouseleave = () => this.hideTooltip();
                const startDrag = (e) => this.gm.handleItemStart(e, i, div); div.onmousedown = startDrag; div.addEventListener('touchstart', startDrag, {passive: false});
                slot.appendChild(div);
            }
        });
    }
    showTooltip(e, index) {
        const item = ITEMS[this.gm.inventory[index]]; if(!item) return;
        const tip = document.getElementById('item-tooltip'); if(!tip) return;
        const icon = document.getElementById('tooltip-icon'); if(icon) { icon.innerText = item.icon; icon.style.borderColor = item.color; }
        const name = document.getElementById('tooltip-name'); if(name) { name.innerText = item.name; name.style.color = item.color; }
        let str = ""; if(item.stats.dmg) str += `+${item.stats.dmg} Sát thương\n`; if(item.stats.hp) str += `+${item.stats.hp} Máu\n`; if(item.stats.as) str += `+${(item.stats.as*100).toFixed(0)}% Tốc đánh\n`; if(item.stats.mana) str += `+${item.stats.mana} Mana khởi đầu\n`;
        const stats = document.getElementById('tooltip-stats'); if(stats) stats.innerText = str;
        tip.classList.remove('hidden'); let cx, cy; if(e.touches && e.touches.length > 0) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; } else { cx = e.clientX; cy = e.clientY; } tip.style.left = (cx + 20) + 'px'; tip.style.top = (cy - 50) + 'px';
    }
    hideTooltip() { const tip = document.getElementById('item-tooltip'); if(tip) tip.classList.add('hidden'); }
    
    // --- LẤY MÔ TẢ TỪ STATS ---
    showInspector(unit) {
        const ui = document.getElementById('unit-inspector'); if(!ui) return; ui.classList.remove('hidden');
        document.getElementById('inspector-name').innerText = unit.data.name;
        document.getElementById('inspector-trait').innerText = SYNERGIES[unit.data.trait]?.name || '';
        document.getElementById('inspector-img').style.backgroundColor = '#'+unit.data.color.toString(16);
        document.getElementById('inspector-stars').innerText = '⭐'.repeat(unit.star);
        document.getElementById('insp-hp').innerText = `${Math.floor(unit.hp)}/${unit.maxHp}`;
        document.getElementById('insp-mana').innerText = `${Math.floor(unit.mana)}/${unit.maxMana}`;
        document.getElementById('insp-dmg').innerText = unit.currStats.dmg;
        document.getElementById('insp-as').innerText = unit.currStats.as.toFixed(2);
        document.getElementById('insp-range').innerText = unit.currStats.range;
        
        const skill = STATS[unit.data.id].skillInfo || {name: 'Đánh thường', desc: 'Không có kỹ năng đặc biệt'};
        document.getElementById('insp-skill-name').innerText = skill.name;
        document.getElementById('insp-skill-desc').innerText = skill.desc;
        
        const slots = ui.querySelectorAll('.insp-item-slot');
        slots.forEach((s, i) => { s.innerHTML = ''; if (i < unit.items.length) { const itemData = ITEMS[unit.items[i]]; if(itemData) { s.innerText = itemData.icon; s.style.color = itemData.color; s.style.borderColor = itemData.color; } } else { s.style.borderColor = '#444'; } });
    }
    
    closeInspector() { const ui = document.getElementById('unit-inspector'); if(ui) ui.classList.add('hidden'); }
    toast(msg) { const t = document.getElementById('toast'); if(t) { t.innerText = msg; t.classList.remove('hidden'); t.style.animation = 'none'; t.offsetHeight; t.style.animation = 'pop 1.5s forwards'; } }
    updateCamera() { this.camera.position.lerp(this.targetPos, 0.1); this.currLook.lerp(this.targetLook, 0.1); this.camera.lookAt(this.currLook); }
    toggleZoom() { this.zoomIdx = (this.zoomIdx + 1) % this.zoomLevels.length; this.targetPos = this.zoomLevels[this.zoomIdx].pos.clone(); this.targetLook = this.zoomLevels[this.zoomIdx].look.clone(); this.toast("Zoom: " + ["XA", "VỪA", "GẦN"][this.zoomIdx]); }
    spawnVFX(pos, type) { this.gm.vfxList.push(new VisualEffect(this.scene, pos, type)); }
    spawnProjectile(start, target, color, dmg, isStun=false) { this.gm.projList.push(new Projectile(this.scene, start, target, color, dmg, isStun)); }
}
