// js/gameManager.js
import { CHAMPS, SYNERGIES, XP_TO_LEVEL, SHOP_ODDS, STATS, ITEMS, MONSTERS, PVE_ROUNDS } from './data.js';
import { Unit } from './unit.js';
import { VisualEffect, Projectile } from './vfx.js';

export class GameManager {
    constructor() {
        this.scene = null; this.camera = null; this.renderer = null;
        this.hexes = []; this.units = []; this.dragged = null; this.dragGroup = null; this.hoveredHex = null;
        this.isGameStarted = false;
        this.gold = 4; this.lvl = 1; this.xp = 0; this.php = 100; this.ehp = 100; 
        this.stage = 1; this.subRound = 1; this.phase = 'prep';
        this.interestOrbs = []; 
        this.ray = new THREE.Raycaster(); this.mouse = new THREE.Vector2();
        this.zoomLevels = [ { pos: new THREE.Vector3(0, 22, 16), look: new THREE.Vector3(0, 0, 2) }, { pos: new THREE.Vector3(0, 16, 12), look: new THREE.Vector3(0, 0, 1) }, { pos: new THREE.Vector3(0, 10, 8),  look: new THREE.Vector3(0, 0, 0) } ];
        this.zoomIdx = 1;
        this.targetPos = this.zoomLevels[1].pos.clone();
        this.targetLook = this.zoomLevels[1].look.clone();
        this.currLook = this.targetLook.clone();
        this.vfxList = []; this.projList = [];
        
        // Input state
        this.isDragging = false; 
        this.clickStart = {x:0, y:0};
        
        // Items
        this.inventory = ['bf_sword', 'recurve_bow', 'giant_belt']; 
        this.dragItem = null; 

        try { this.initWorld(); this.initUI(); this.renderInventory(); this.loop(); } catch(e) { alert("Lỗi: " + e.message); }
    }

    initWorld() {
        this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x1a1a2e);
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
        this.camera.position.copy(this.targetPos); this.camera.lookAt(this.targetLook);
        this.renderer = new THREE.WebGLRenderer({antialias:true}); this.renderer.setSize(window.innerWidth, window.innerHeight); this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        const amb = new THREE.AmbientLight(0xffffff, 0.6); const dir = new THREE.DirectionalLight(0xffd700, 1.2); dir.position.set(5,10,5); dir.castShadow = true;
        this.scene.add(amb, dir);
        const grGeo = new THREE.PlaneGeometry(30,30); const grMat = new THREE.MeshStandardMaterial({color:0x223322}); const ground = new THREE.Mesh(grGeo, grMat); ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; this.scene.add(ground);
        this.dragPlane = new THREE.Mesh(new THREE.PlaneGeometry(50,50), new THREE.MeshBasicMaterial({visible:false})); this.dragPlane.rotation.x = -Math.PI/2; this.scene.add(this.dragPlane);
        const r=1, w=r*1.732, h=r*1.5; const hexGeo = new THREE.CylinderGeometry(r,r,0.2,6);
        for(let row=0; row<8; row++) { for(let col=0; col<7; col++) {
                const x = (col - 3)*w + (row%2 ? w/2 : 0); const z = (row - 3.5)*h; const isPlayer = row >= 4; const isBench = row === 7;
                const mat = new THREE.MeshStandardMaterial({color: isBench ? 0x111 : (isPlayer ? 0x222244 : 0x442222)});
                const hex = new THREE.Mesh(hexGeo, mat); hex.position.set(x, 0.1, z); hex.receiveShadow = true;
                hex.userData = { isHex:true, occupied:false, isPlayer, isBench, origCol: mat.color.getHex() };
                const edges = new THREE.EdgesGeometry(hexGeo); const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: isPlayer?0x4488ff:0xff4444, transparent:true, opacity:0.3}));
                hex.add(line); this.scene.add(hex); this.hexes.push(hex);
        }}
        const slotGeo = new THREE.BoxGeometry(1.2, 0.2, 1.2); const slotMat = new THREE.MeshStandardMaterial({color: 0x111111});
        const orbGeo = new THREE.SphereGeometry(0.4, 16, 16); const orbMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.8 }); 
        for(let i=0; i<5; i++) {
            const slot = new THREE.Mesh(slotGeo, slotMat); const zPos = (i - 2) * 1.5; slot.position.set(9, 0.1, zPos); slot.receiveShadow = true; this.scene.add(slot);
            const orb = new THREE.Mesh(orbGeo, orbMat); orb.position.set(9, 1, zPos); orb.castShadow = true; orb.visible = false; orb.userData = { baseY: 1, offset: i }; this.scene.add(orb); this.interestOrbs.push(orb);
        }
    }
    spawnVFX(pos, type) { this.vfxList.push(new VisualEffect(this.scene, pos, type)); }
    spawnProjectile(start, target, color, dmg, isStun=false) { this.projList.push(new Projectile(this.scene, start, target, color, dmg, isStun)); }
    
    createUnit(data, hex, team) {
        const group = new THREE.Group(); 
        const mat = new THREE.MeshStandardMaterial({color: data.color});
        let body, head;

        if (data.isMonster) {
            if (data.shape === 'box') {
                body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat);
                body.position.y = 0.5;
            } else if (data.shape === 'rock') {
                body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6), mat);
                body.position.y = 0.6;
            } else if (data.shape === 'cone') {
                body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 4), mat);
                body.position.y = 0.6;
                body.rotation.x = -Math.PI/2; 
            }
            body.castShadow = true; 
            body.name = 'body'; 
            group.add(body);
            const scale = data.scale || 1;
            group.scale.set(scale, scale, scale);

        } else {
            body = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.5,1.2,8), mat); 
            body.position.y = 0.6; 
            body.castShadow = true; 
            body.name = 'body'; 
            group.add(body);
            
            head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3,1), new THREE.MeshStandardMaterial({color:0xffccaa})); 
            head.position.y = 1.4; 
            group.add(head);
        }

        const hit = new THREE.Mesh(new THREE.BoxGeometry(1,2,1), new THREE.MeshBasicMaterial({visible:false})); 
        hit.userData = { isUnit:true, data: data, hex: hex, team: team }; 
        hit.name = 'hitbox'; 
        group.add(hit);
        
        group.position.copy(hex.position); 
        hex.userData.occupied = true; 
        hit.userData.origPos = hex.position.clone();
        
        this.scene.add(group); 
        const u = new Unit(group, data, team, this); 
        this.units.push(u); 
        this.calcSyn(); 
        return u; 
    }

    buyUnit(data) {
        if(this.gold < data.cost) return this.toast("Thiếu vàng");
        const sameUnits = this.units.filter(u => u.data.id === data.id && u.star === 1 && u.team === 'player');
        const slot = this.hexes.find(h => h.userData.isBench && !h.userData.occupied);
        if (!slot && sameUnits.length < 2) return this.toast("Hàng chờ đầy");
        this.gold -= data.cost; const spawnHex = slot || sameUnits[0].group.children.find(c=>c.name==='hitbox').userData.hex;
        const newUnit = this.createUnit(data, spawnHex, 'player'); this.checkUpgrade(newUnit); this.uiUpdate();
    }
    
    checkUpgrade(unit) {
        if(unit.star >= 3) return;
        const same = this.units.filter(u => u !== unit && u.team === 'player' && u.data.id === unit.data.id && u.star === unit.star);
        if (same.length >= 2) {
            const u1 = same[0]; const u2 = same[1];
            
            const extraItems = [...u1.items, ...u2.items];
            extraItems.forEach(item => {
                if (!unit.addItem(item)) {
                    this.inventory.push(item);
                    this.toast("Túi tướng đầy, trả về kho!");
                }
            });
            this.renderInventory();

            const h1 = u1.group.children.find(c=>c.name==='hitbox').userData.hex; const h2 = u2.group.children.find(c=>c.name==='hitbox').userData.hex;
            if(h1) h1.userData.occupied = false; if(h2) h2.userData.occupied = false;
            u1.destroy(); u2.destroy(); this.units = this.units.filter(u => u !== u1 && u !== u2);
            unit.upgradeStar(); this.spawnVFX(unit.group.position, 'upgrade'); this.toast(`UPGRADE: ${unit.data.name} ${unit.star} SAO!`);
            this.checkUpgrade(unit); this.calcSyn();
        }
    }
    
    sellUnit(hitBox) {
        const idx = this.units.findIndex(u => u.group === hitBox.parent);
        if(idx > -1) {
            const u = this.units[idx]; const refund = u.data.cost * Math.pow(3, u.star - 1);
            this.gold += refund; 
            
            u.items.forEach(item => this.inventory.push(item));
            this.renderInventory();

            if(hitBox.userData.hex) hitBox.userData.hex.userData.occupied = false;
            u.destroy(); this.units.splice(idx, 1); this.uiUpdate(); this.calcSyn(); this.toast(`Bán +${refund}g`);
            this.closeInspector();
        }
    }
    
    toggleZoom() {
        this.zoomIdx = (this.zoomIdx + 1) % this.zoomLevels.length;
        this.targetPos = this.zoomLevels[this.zoomIdx].pos.clone(); this.targetLook = this.zoomLevels[this.zoomIdx].look.clone();
        this.toast("Zoom: " + ["XA", "VỪA", "GẦN"][this.zoomIdx]);
    }

    startCombat() {
        if(this.phase==='combat') return;
        const active = this.units.filter(u=>u.team==='player' && !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench);
        if(!active.length) return this.toast("Cho tướng vào sân!");
        
        this.phase = 'combat';
        document.getElementById('btn-battle').classList.add('hidden'); document.getElementById('shop-wrapper').classList.add('hidden'); document.getElementById('sell-slot').classList.add('hidden');
        this.targetPos = this.zoomLevels[2].pos.clone(); this.targetLook = this.zoomLevels[2].look.clone();
        
        this.units.filter(u=>u.team==='enemy').forEach(u=>u.destroy()); this.units = this.units.filter(u=>u.team==='player');
        
        const spots = this.hexes.filter(h=>!h.userData.isPlayer && !h.userData.occupied);
        
        const roundKey = `${this.stage}-${this.subRound}`;
        const pveMonsters = PVE_ROUNDS[roundKey];

        if (pveMonsters) {
            this.toast(`ROUND ${roundKey}: QUÁI VẬT!`);
            pveMonsters.forEach((monsterId, i) => {
                if (spots[i]) {
                    const monsterData = MONSTERS[monsterId];
                    const monster = this.createUnit(monsterData, spots[i], 'enemy');
                    const buffMult = 1 + (this.stage * 0.25); 
                    monster.maxHp = Math.floor(monster.maxHp * buffMult);
                    monster.hp = monster.maxHp;
                    monster.currStats.dmg = Math.floor(monster.currStats.dmg * buffMult);
                    monster.updateBar();
                }
            });
        } else {
            this.toast(`STAGE ${this.stage}-${this.subRound}: FIGHT!`);
            const enemyCount = Math.min(this.stage + 2, 9); const enemyLevel = Math.min(this.stage + 3, 9);
            for(let i=0; i<enemyCount; i++) {
                if(spots[i]) {
                    const r = this.rollChamp(enemyLevel); 
                    const enemy = this.createUnit(r, spots[i], 'enemy');
                    const rollStar = Math.random();
                    let targetStar = 1;
                    if (this.stage === 2 && rollStar < 0.5) targetStar = 2;
                    else if (this.stage === 3 && rollStar < 0.8) targetStar = 2;
                    else if (this.stage >= 4) { if (rollStar < 0.3) targetStar = 3; else targetStar = 2; }
                    else if (this.stage >= 5 && rollStar < 0.6) targetStar = 3;
                    for(let s=1; s<targetStar; s++) enemy.upgradeStar();
                    const itemSimulationBuff = 1.25; 
                    enemy.maxHp = Math.floor(enemy.maxHp * itemSimulationBuff);
                    enemy.hp = enemy.maxHp;
                    enemy.currStats.dmg = Math.floor(enemy.currStats.dmg * itemSimulationBuff);
                    enemy.currStats.as += 0.1; 
                    enemy.updateBar();
                }
            }
        }
        
        this.closeInspector();
    }

    onMonsterDeath(monster) {
        const rand = Math.random();
        if (rand < 0.3) {
            const itemKeys = Object.keys(ITEMS);
            const randomItem = itemKeys[Math.floor(Math.random() * itemKeys.length)];
            
            if (this.inventory.length < 8) {
                this.inventory.push(randomItem);
                this.renderInventory();
                this.toast(`Nhặt được: ${ITEMS[randomItem].name}`);
                this.spawnVFX(monster.group.position, 'upgrade');
            } else {
                this.gold += 2;
                this.toast("Túi đầy: +2 vàng");
            }
        } else {
            const goldDrop = Math.floor(Math.random() * 3) + 1;
            this.gold += goldDrop;
            this.uiUpdate();
            this.toast(`Nhặt được: ${goldDrop} vàng`);
            this.spawnVFX(monster.group.position, 'spin_gold');
        }
    }

    endCombat(win) {
        this.phase = 'prep';
        document.getElementById('btn-battle').classList.remove('hidden'); document.getElementById('shop-wrapper').classList.remove('hidden'); document.getElementById('sell-slot').classList.remove('hidden');
        this.targetPos = this.zoomLevels[1].pos.clone(); this.targetLook = this.zoomLevels[1].look.clone();
        if(win) { this.ehp-=10; this.toast("THẮNG!"); } else { this.php-=10; this.toast("THUA!"); }
        if(this.php<=10 || this.ehp<=10) { document.getElementById('game-over').classList.remove('hidden'); const result = this.php > this.ehp ? "THẮNG" : "THUA"; document.getElementById('end-title').innerText = `${result} (HP: ${this.php} vs ${this.ehp})`; return; }
        this.subRound++; if(this.subRound > 5) { this.subRound = 1; this.stage++; }
        const interest = Math.min(Math.floor(this.gold / 10), 5); const baseIncome = 5; const winBonus = win ? 1 : 0; const totalIncome = baseIncome + interest + winBonus;
        this.gold += totalIncome; this.xp += 2;
        this.units.forEach(u => { if(u.team==='player') u.reset(); else u.destroy(); }); this.units = this.units.filter(u=>u.team==='player');
        if(this.xp >= this.getXpNeed()) { this.xp-=this.getXpNeed(); this.lvl++; }
        this.refreshShop(); this.uiUpdate(); setTimeout(() => this.toast(`+${totalIncome}g (${interest}g Lãi)`), 1500);
    }
    
    calcSyn() {
        const counts = {}; 
        this.units.forEach(u => { 
            if(u.team==='player' && !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench) { 
                if (u.data.trait) { 
                    const t = u.data.trait; 
                    if(!counts[t]) counts[t] = new Set(); 
                    counts[t].add(u.data.id); 
                }
            } 
        });
        
        const p = document.getElementById('content-syn'); 
        if(!p) return; 
        p.innerHTML='';
        
        if(Object.keys(counts).length === 0) {
            p.innerHTML = '<div style="text-align:center;color:#666;font-size:0.75rem;padding:10px;">Chưa kích hoạt tộc hệ</div>';
            return;
        }

        for(let t in counts) {
            const n = counts[t].size; const data = SYNERGIES[t]; const div = document.createElement('div'); div.className = 'trait-box';
            let buffText = ""; 
            if(n >= data.breaks[0]) { 
                div.className += ' active'; 
                let activeTier = 0; 
                data.breaks.forEach(b => { if(n >= b) activeTier = b; }); 
                if(activeTier > 0) buffText = `<span style="font-size:0.6rem;color:#ddd;margin-left:auto;">(${data.buff[activeTier]})</span>`; 
            }
            div.innerHTML = `<div class="trait-count" style="background:${data.color}">${n}</div><div style="font-weight:bold;">${data.name}</div>${buffText}`; 
            p.appendChild(div);
        }
    }

    initUI() {
        const get = (id) => document.getElementById(id);
        get('btn-start').onclick = () => { get('ui-overlay').classList.add('hidden'); get('game-ui').classList.remove('hidden'); document.getElementById('sell-slot').classList.remove('hidden'); this.isGameStarted = true; this.refreshShop(); this.uiUpdate(); };
        get('btn-battle').onclick = () => this.startCombat();
        get('btn-refresh').onclick = () => { if(this.gold>=2){this.gold-=2; this.refreshShop(); this.uiUpdate();} };
        get('btn-buy-xp').onclick = () => { if(this.gold>=4 && this.lvl<9) { this.gold-=4; this.xp+=4; if(this.xp>=this.getXpNeed()){this.xp-=this.getXpNeed();this.lvl++} this.uiUpdate();} };
        get('btn-shop-toggle').onclick = () => get('shop-wrapper').classList.toggle('hidden');
        get('btn-restart').onclick = () => location.reload();
        
        get('btn-close-inspector').onclick = () => this.closeInspector();

        const tabSyn = get('tab-btn-syn');
        const tabInv = get('tab-btn-inv');
        const contentSyn = get('content-syn');
        const contentInv = get('content-inv');

        if(tabSyn && tabInv) {
            tabSyn.onclick = () => {
                tabSyn.classList.add('active'); tabInv.classList.remove('active');
                contentSyn.classList.remove('hidden'); contentInv.classList.add('hidden');
            };
            tabInv.onclick = () => {
                tabInv.classList.add('active'); tabSyn.classList.remove('active');
                contentInv.classList.remove('hidden'); contentSyn.classList.add('hidden');
            };
        }

        const btnZoom = document.querySelector('.action-btn.zoom');
        if(btnZoom) { btnZoom.onclick = (e) => { e.stopPropagation(); this.toggleZoom(); }; btnZoom.ontouchstart = (e) => { e.stopPropagation(); this.toggleZoom(); }; }
        
        const handler = (e) => {
            if (!this.isGameStarted) return;
            
            // Ngăn cuộn trang nếu đang kéo item hoặc unit
            if (this.dragged || this.dragItem !== null) {
                if(e.type === 'touchmove') e.preventDefault();
            }

            let cx, cy; 
            if(e.changedTouches && e.changedTouches.length > 0) { 
                cx = e.changedTouches[0].clientX; 
                cy = e.changedTouches[0].clientY; 
            } else { 
                cx = e.clientX; 
                cy = e.clientY; 
            }
            
            if (cx === undefined || isNaN(cx)) return;
            
            const fake = { clientX: cx, clientY: cy, target: e.target, touches: e.touches }; // Thêm touches để hỗ trợ tooltip
            
            if(e.type==='mousedown' || e.type==='touchstart') this.onDown(fake); 
            if(e.type==='mousemove' || e.type==='touchmove') this.onMove(fake); 
            if(e.type==='mouseup' || e.type==='touchend') this.onUp(fake);
        };
        
        // Thêm {passive: false} để cho phép preventDefault()
        ['mousedown','mousemove','mouseup','touchstart','touchmove','touchend'].forEach(t => window.addEventListener(t, handler, {passive: false}));
        window.addEventListener('resize', () => { this.camera.aspect = window.innerWidth/window.innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(window.innerWidth, window.innerHeight); });
    }

    renderInventory() {
        const slots = document.querySelectorAll('.inv-slot');
        slots.forEach((slot, i) => {
            slot.innerHTML = '';
            if (i < this.inventory.length) {
                const itemId = this.inventory[i];
                const item = ITEMS[itemId];
                const div = document.createElement('div');
                div.className = 'item-icon';
                div.style.borderColor = item.color;
                div.innerText = item.icon;
                
                if (i === this.dragItem) {
                    div.style.opacity = '0';
                }

                // Tooltip events
                div.onmouseenter = (e) => this.showTooltip(e, i);
                div.onmouseleave = () => this.hideTooltip();
                div.onmousemove = (e) => this.moveTooltip(e);
                
                // Mouse Down (PC)
                div.onmousedown = (e) => this.onItemDown(e, i);

                // --- FIX: MOBILE TOUCH START ---
                // Sử dụng addEventListener với {passive: false} để cho phép chặn hành vi mặc định (scroll)
                div.addEventListener('touchstart', (e) => this.onItemDown(e, i), {passive: false});
                
                slot.appendChild(div);
            }
        });
    }

    getStatStr(stats) {
        let str = "";
        if(stats.dmg) str += `+${stats.dmg} Sát thương\n`;
        if(stats.hp) str += `+${stats.hp} Máu\n`;
        if(stats.as) str += `+${(stats.as*100).toFixed(0)}% Tốc đánh\n`;
        if(stats.mana) str += `+${stats.mana} Mana khởi đầu\n`;
        if(stats.armor) str += `+${stats.armor} Giáp\n`;
        return str;
    }

    showTooltip(e, index) {
        const item = ITEMS[this.inventory[index]];
        if(!item) return;

        const tip = document.getElementById('item-tooltip');
        document.getElementById('tooltip-icon').innerText = item.icon;
        document.getElementById('tooltip-icon').style.borderColor = item.color;
        document.getElementById('tooltip-name').innerText = item.name;
        document.getElementById('tooltip-name').style.color = item.color;
        document.getElementById('tooltip-stats').innerText = this.getStatStr(item.stats);

        tip.classList.remove('hidden');
        this.moveTooltip(e);
    }

    hideTooltip() {
        document.getElementById('item-tooltip').classList.add('hidden');
    }

    moveTooltip(e) {
        const tip = document.getElementById('item-tooltip');
        if(tip.classList.contains('hidden')) return;

        let cx, cy;
        if(e.touches && e.touches.length > 0) {
            cx = e.touches[0].clientX;
            cy = e.touches[0].clientY;
        } else {
            cx = e.clientX;
            cy = e.clientY;
        }

        tip.style.left = (cx + 20) + 'px';
        tip.style.top = (cy - 50) + 'px';
    }

    onItemDown(e, index) {
        if(this.phase === 'combat') return;
        
        // --- FIX: LOGIC TOUCH ---
        // 1. Ngăn sự kiện nổi lên window (tránh trigger onDown của 3D scene)
        e.stopPropagation();
        
        // 2. Chặn hành vi mặc định của trình duyệt (scroll/zoom) khi chạm vào item
        if(e.cancelable && e.type === 'touchstart') {
            e.preventDefault();
        }
        
        this.dragItem = index;
        this.renderInventory(); 
        this.showTooltip(e, index);

        const ghost = document.getElementById('drag-ghost');
        const item = ITEMS[this.inventory[index]];
        ghost.innerText = item.icon;
        ghost.style.borderColor = item.color;
        ghost.style.backgroundColor = '#333';
        ghost.classList.remove('hidden');
        
        let cx, cy;
        // Lấy tọa độ chính xác cho cả Touch và Mouse
        if(e.touches && e.touches.length > 0) {
            cx = e.touches[0].clientX;
            cy = e.touches[0].clientY;
        } else {
            cx = e.clientX;
            cy = e.clientY;
        }
        
        ghost.style.left = (cx - 15) + 'px';
        ghost.style.top = (cy - 15) + 'px';
    }

    onDown(e) {
        if(e.target.closest('#sidebar-panel') || e.target.closest('.tab-btn')) return;
        if(this.phase==='combat') return; if(e.target.closest('button') || e.target.closest('.card') || e.target.closest('#unit-inspector')) return;
        this.clickStart.x = e.clientX; this.clickStart.y = e.clientY; this.isDragging = false; 
        this.mouse.x = (e.clientX/window.innerWidth)*2-1; this.mouse.y = -(e.clientY/window.innerHeight)*2+1; this.ray.setFromCamera(this.mouse, this.camera);
        const hits = this.ray.intersectObjects(this.scene.children, true); const hit = hits.find(h => h.object.name === 'hitbox' && h.object.userData.team === 'player');
        if(hit) { this.dragged = hit.object; this.dragGroup = hit.object.parent; this.dragGroup.position.y = 2; document.getElementById('sell-slot').classList.add('hover'); }
    }

    onMove(e) {
        // --- XỬ LÝ KÉO ITEM ---
        if (this.dragItem !== null) {
            this.hideTooltip();
            const ghost = document.getElementById('drag-ghost');
            
            // Cập nhật vị trí ghost
            const cx = e.clientX;
            const cy = e.clientY;
            
            ghost.style.left = (cx - 15) + 'px'; 
            ghost.style.top = (cy - 15) + 'px'; 
            return;
        }
        
        // --- XỬ LÝ KÉO UNIT ---
        this.mouse.x = (e.clientX/window.innerWidth)*2-1; this.mouse.y = -(e.clientY/window.innerHeight)*2+1; this.ray.setFromCamera(this.mouse, this.camera);
        if(this.dragged) {
            const moveDist = Math.abs(e.clientX - this.clickStart.x) + Math.abs(e.clientY - this.clickStart.y);
            if(moveDist > 5) this.isDragging = true;
            const hits = this.ray.intersectObject(this.dragPlane); if(hits.length) { this.dragGroup.position.x = hits[0].point.x; this.dragGroup.position.z = hits[0].point.z; }
            const sell = document.getElementById('sell-slot'); const el = document.elementFromPoint(e.clientX, e.clientY);
            if(el && el.closest('#sell-slot')) sell.style.borderColor = 'white'; else sell.style.borderColor = '#e74c3c';
            if(this.hoveredHex) { this.hoveredHex.material.emissive.setHex(0x000000); this.hoveredHex=null; }
            const hHits = this.ray.intersectObjects(this.hexes);
            if(hHits.length) { const h = hHits[0].object; if(h.userData.isPlayer) { this.hoveredHex = h; const ok = !h.userData.occupied || h===this.dragged.userData.hex; h.material.emissive.setHex(ok?0x00ff00:0xff0000); } }
        }
    }

    onUp(e) {
        this.hideTooltip();

        // --- XỬ LÝ THẢ ITEM ---
        if (this.dragItem !== null) {
            document.getElementById('drag-ghost').classList.add('hidden');
            this.mouse.x = (e.clientX/window.innerWidth)*2-1; this.mouse.y = -(e.clientY/window.innerHeight)*2+1; this.ray.setFromCamera(this.mouse, this.camera);
            const hits = this.ray.intersectObjects(this.scene.children, true);
            const unitHit = hits.find(h => h.object.name === 'hitbox' && h.object.userData.team === 'player');
            if(unitHit) {
                const unit = this.units.find(u => u.group === unitHit.object.parent);
                const itemId = this.inventory[this.dragItem];
                if(unit && unit.addItem(itemId)) {
                    this.inventory.splice(this.dragItem, 1); 
                    this.dragItem = null;
                    this.renderInventory(); 
                    this.toast(`Đã trang bị: ${ITEMS[itemId].name}`);
                    const inspectorName = document.getElementById('inspector-name').innerText;
                    if(!document.getElementById('unit-inspector').classList.contains('hidden') && inspectorName === unit.data.name) this.showInspector(unit);
                } else {
                    this.toast("Túi đồ đầy!");
                    this.dragItem = null;
                    this.renderInventory();
                }
            } else {
                this.dragItem = null;
                this.renderInventory();
            }
            return;
        }

        if (!this.isDragging) {
            if(e.target.closest('#unit-inspector') || e.target.closest('#sidebar-panel')) return;
            this.mouse.x = (e.clientX/window.innerWidth)*2-1; this.mouse.y = -(e.clientY/window.innerHeight)*2+1; this.ray.setFromCamera(this.mouse, this.camera);
            const hits = this.ray.intersectObjects(this.scene.children, true);
            const unitHit = hits.find(h => h.object.name === 'hitbox');
            if (unitHit) {
                const realUnit = this.units.find(u => u.group === unitHit.object.parent);
                if (realUnit) this.showInspector(realUnit);
            } else this.closeInspector();
        }

        if(this.dragged) {
            document.getElementById('sell-slot').classList.remove('hover'); document.getElementById('sell-slot').style.borderColor = '#e74c3c';
            const el = document.elementFromPoint(e.clientX, e.clientY);
            if(el && el.closest('#sell-slot')) { this.sellUnit(this.dragged); this.dragged = null; this.dragGroup = null; if(this.hoveredHex) this.hoveredHex.material.emissive.setHex(0x000000); return; }
            let target = this.hoveredHex; if(!target) { let min=99; this.hexes.forEach(h=>{ const d=this.dragGroup.position.distanceTo(h.position); if(d<2 && d<min){min=d;target=h;} }); }
            const oldHex = this.dragged.userData.hex; let valid = target && target.userData.isPlayer && (!target.userData.occupied || target===oldHex);
            if(valid && oldHex.userData.isBench && !target.userData.isBench) { const count = this.units.filter(u=>u.team==='player' && !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench).length; if(count >= this.lvl) { this.toast("Giới hạn tướng!"); valid = false; } }
            if(valid) { this.dragged.userData.hex.userData.occupied = false; this.dragGroup.position.copy(target.position); target.userData.occupied = true; this.dragged.userData.hex = target; this.dragged.userData.origPos = target.position.clone(); } else { this.dragGroup.position.copy(oldHex.position); }
            this.dragGroup.position.y = 0; this.calcSyn(); this.uiUpdate(); if(this.hoveredHex) { this.hoveredHex.material.emissive.setHex(0x000000); this.hoveredHex=null; } this.dragged = null; this.dragGroup = null;
        }
        this.isDragging = false;
    }

    loop() {
        requestAnimationFrame(() => this.loop());

        this.camera.position.lerp(this.targetPos, 0.1);
        this.currLook.lerp(this.targetLook, 0.1);
        this.camera.lookAt(this.currLook);

        const t = performance.now() * 0.001;
        this.units.forEach(u => u.update(t, this.units));

        // --- CẬP NHẬT: CHECK THẮNG THUA (Đã sửa lỗi tính cả bench) ---
        if(this.phase === 'combat') {
            // Lọc ra các unit sống VÀ không ở trên ghế dự bị (isBench)
            const playerLive = this.units.filter(u => 
                u.team === 'player' && 
                !u.isDead && 
                !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench
            ).length;
            
            const enemyLive = this.units.filter(u => u.team === 'enemy' && !u.isDead).length;

            if (playerLive === 0) {
                this.endCombat(false); // Thua ngay khi hết quân trên sàn
            } else if (enemyLive === 0) {
                this.endCombat(true); // Thắng
            }
        }

        for(let i=this.vfxList.length-1; i>=0; i--) {
            if(!this.vfxList[i].update()) { this.vfxList.splice(i, 1); }
        }

        for(let i=this.projList.length-1; i>=0; i--) {
            if(!this.projList[i].update()) { this.projList.splice(i, 1); }
        }

        this.interestOrbs.forEach((orb, i) => {
            if(orb.visible) {
                orb.position.y = orb.userData.baseY + Math.sin(t*3 + orb.userData.offset)*0.2;
            }
        });

        if(this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    uiUpdate() {
        document.getElementById('gold-text').innerText = Math.floor(this.gold);
        document.getElementById('lvl-text').innerText = this.lvl;
        const count = this.units.filter(u => u.team==='player' && !u.group.children.find(c=>c.name==='hitbox').userData.hex.userData.isBench).length;
        document.getElementById('unit-limit-text').innerText = `${count}/${this.lvl}`;

        const xpNeed = this.getXpNeed();
        const xpPct = xpNeed > 0 ? (this.xp / xpNeed)*100 : 0;
        document.getElementById('xp-fill').style.width = `${Math.min(100, xpPct)}%`;

        document.getElementById('player-hp-text').innerText = this.php;
        document.getElementById('player-hp-fill').style.width = `${Math.max(0, this.php)}%`;
        document.getElementById('enemy-hp-text').innerText = this.ehp;
        document.getElementById('enemy-hp-fill').style.width = `${Math.max(0, this.ehp)}%`;

        document.getElementById('round-display').innerText = `${this.stage}-${this.subRound}`;
        
        const interest = Math.min(Math.floor(this.gold / 10), 5);
        this.interestOrbs.forEach((orb, i) => { orb.visible = i < interest; });

        const btnXp = document.getElementById('btn-buy-xp');
        if(this.gold < 4) btnXp.style.opacity = '0.5'; else btnXp.style.opacity = '1';
    }

    refreshShop() {
        const wrapper = document.getElementById('shop-cards');
        wrapper.innerHTML = '';
        for(let i=0; i<5; i++) {
            const data = this.rollChamp(this.lvl);
            const card = document.createElement('div');
            card.className = `card c${data.cost}`;
            card.innerHTML = `<div class="card-img" style="background:${'#'+data.color.toString(16)}"></div><div class="card-name">${data.name}</div><div class="card-cost">${data.cost}g</div>`;
            card.onclick = () => { if(!card.classList.contains('empty')) { this.buyUnit(data); if(this.gold >= 0) card.classList.add('empty'); } };
            wrapper.appendChild(card);
        }
    }

    rollChamp(lvl) {
        const odds = SHOP_ODDS[lvl] || [100,0,0,0];
        const r = Math.random()*100;
        let cost=1; let sum=0;
        for(let i=0; i<4; i++) { sum+=odds[i]; if(r<=sum) { cost=i+1; break; } }
        const pool = CHAMPS.filter(c=>c.cost===cost);
        return pool.length ? pool[Math.floor(Math.random()*pool.length)] : CHAMPS[0];
    }

    getXpNeed() { return XP_TO_LEVEL[this.lvl] || 9999; }

    toast(msg) {
        const t = document.getElementById('toast');
        t.innerText = msg; t.classList.remove('hidden');
        t.style.animation = 'none'; t.offsetHeight; t.style.animation = 'pop 1.5s forwards';
    }

    showInspector(unit) {
        const ui = document.getElementById('unit-inspector'); ui.classList.remove('hidden');
        document.getElementById('inspector-name').innerText = unit.data.name;
        document.getElementById('inspector-trait').innerText = SYNERGIES[unit.data.trait]?.name || '';
        document.getElementById('inspector-img').style.backgroundColor = '#'+unit.data.color.toString(16);
        document.getElementById('inspector-stars').innerText = '⭐'.repeat(unit.star);

        document.getElementById('insp-hp').innerText = `${Math.floor(unit.hp)}/${unit.maxHp}`;
        document.getElementById('insp-mana').innerText = `${Math.floor(unit.mana)}/${unit.maxMana}`;
        document.getElementById('insp-dmg').innerText = unit.currStats.dmg;
        document.getElementById('insp-as').innerText = unit.currStats.as.toFixed(2);
        document.getElementById('insp-range').innerText = unit.currStats.range;

        const skill = unit.data.skillInfo || {name: 'Đánh thường', desc: 'Không có kỹ năng đặc biệt'};
        document.getElementById('insp-skill-name').innerText = skill.name;
        document.getElementById('insp-skill-desc').innerText = skill.desc;

        const slots = ui.querySelectorAll('.insp-item-slot');
        slots.forEach((s, i) => {
            s.innerHTML = '';
            if (i < unit.items.length) {
                const itemData = ITEMS[unit.items[i]];
                if(itemData) { s.innerText = itemData.icon; s.style.color = itemData.color; s.style.borderColor = itemData.color; }
            } else { s.style.borderColor = '#444'; }
        });
    }

    closeInspector() { document.getElementById('unit-inspector').classList.add('hidden'); }
}
