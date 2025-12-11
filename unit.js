// js/unit.js
import { STATS, ARENA_RADIUS, ITEMS } from './data.js';
import { SKILLS } from './skills.js';

export class Unit {
    constructor(group, data, team, gm) {
        this.group = group; this.data = data; this.team = team; this.gm = gm;
        this.star = 1; this.shield = 0; this.stunTime = 0;
        this.mana = 0; this.maxMana = 100;
        this.items = [];
        
        // Tạo thanh máu/mana
        this.bar = document.createElement('div');
        this.bar.className = `bar-wrap ${team} star-1`;
        this.bar.innerHTML = `<div class="item-badge-container"></div><div class="bar-hp"><div class="bar-fill"></div></div><div class="bar-mana"><div class="mana-fill"></div></div>`;
        document.getElementById('world-ui').appendChild(this.bar);
        
        this.meshBody = group.children.find(c=>c.name==='body');
        if(this.meshBody) this.origColor = this.meshBody.material.color.clone();
        
        this.isDead = false; this.target = null; this.lastAtk = 0;
        
        // Cập nhật chỉ số và thanh máu ngay lập tức
        this.updateStats();
        this.updateBar(); 
    }

    addItem(itemId) {
        if(this.items.length >= 3) return false; 
        this.items.push(itemId); this.updateStats(); this.renderItemBadges(); return true;
    }

    renderItemBadges() {
        if(!this.bar) return;
        const container = this.bar.querySelector('.item-badge-container'); container.innerHTML = '';
        this.items.forEach(id => { const item = ITEMS[id]; const div = document.createElement('div'); div.className = 'mini-item'; div.style.backgroundColor = item.color; container.appendChild(div); });
    }

    upgradeStar() {
        this.star++; this.updateStats();
        const scale = (this.data.scale || 1) + (this.star - 1) * 0.4; 
        this.group.scale.set(scale, scale, scale);
        this.bar.className = `bar-wrap ${this.team} star-${this.star}`;
        // Khi lên sao thì hồi đầy máu
        this.hp = this.maxHp; this.mana = 0; 
        this.updateBar();
    }

    updateStats() {
        const base = STATS[this.data.id];
        const multiplier = Math.pow(1.8, this.star - 1);
        
        // Lưu lại máu tối đa cũ để tính chênh lệch
        const oldMaxHp = this.maxHp || 0;

        let newMaxHp = Math.floor(base.hp * multiplier);
        let newDmg = Math.floor(base.dmg * multiplier);
        let newAs = base.as;
        let newArmor = base.armor || 0; 

        this.items.forEach(id => { 
            const stats = ITEMS[id].stats; 
            if(stats.hp) newMaxHp += stats.hp; 
            if(stats.dmg) newDmg += stats.dmg; 
            if(stats.as) newAs += stats.as; 
            if(stats.armor) newArmor += stats.armor; 
        });

        this.maxHp = newMaxHp;
        this.currStats = { ...base, dmg: newDmg, as: newAs, armor: newArmor };
        
        // --- SỬA LỖI MÁU: Cộng thêm lượng máu vừa được tăng ---
        if(this.hp === undefined) {
            // Tướng mới sinh ra -> Máu đầy
            this.hp = this.maxHp;
        } else {
            // Tướng đang sống -> Cộng thêm phần chênh lệch (nếu lắp đồ máu)
            const diff = newMaxHp - oldMaxHp;
            if (diff > 0) {
                this.hp += diff;
            }
            // Đảm bảo không vượt quá max (trường hợp đổi đồ hoặc lỗi logic khác)
            if (this.hp > this.maxHp) this.hp = this.maxHp;
        }
        
        if(this.hp <= 0 && !this.isDead) this.hp = this.maxHp;
        
        // Cập nhật lại giao diện ngay
        this.updateBar();
    }

    takeDmg(amt) {
        if (this.isDead || isNaN(amt)) return;

        const armor = this.currStats.armor || 0;
        let reducedAmt = amt * 100 / (100 + armor);

        if(this.shield > 0) {
            const absorb = Math.min(this.shield, reducedAmt);
            this.shield -= absorb;
            reducedAmt -= absorb;
        }

        if(reducedAmt > 0) {
            this.hp -= reducedAmt;
            this.gainMana(5); 
            
            if(this.meshBody && !this.isDead) {
                this.meshBody.material.color.setHex(0xffffff);
                setTimeout(()=>{ if(this.meshBody && !this.isDead && this.stunTime <= 0) this.meshBody.material.color.copy(this.origColor); }, 50);
            }

            if(this.hp <= 0) {
                this.hp = 0;
                this.isDead = true;
                this.group.visible = false;
                this.bar.style.display = 'none';
                
                if (this.data.isMonster) {
                    this.gm.onMonsterDeath(this);
                }
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
            let startMana = 0; 
            this.items.forEach(id => { if(ITEMS[id].stats.mana) startMana += ITEMS[id].stats.mana; });
            this.mana = Math.min(startMana, this.maxMana); 
            this.shield = 0; 
            this.updateBar(); 
            return; 
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
        const pos = this.group.position.clone(); 
        const scaleY = this.group.scale.y;
        pos.y += 2.2 * scaleY; 
        
        pos.project(this.gm.camera);
        const x = (pos.x*.5 + .5)*window.innerWidth;
        const y = (-(pos.y*.5) + .5)*window.innerHeight;
        this.bar.style.left = `${x}px`; this.bar.style.top = `${y}px`;
        this.bar.style.display = (pos.z<1 && this.group.visible && !this.isDead) ? 'flex' : 'none';
    }

    attack() {
        if (this.currStats.type === 'range') {
            const color = this.currStats.projColor || 0xffffff;
            this.gm.spawnProjectile(this.group.position, this.target, color, this.currStats.dmg);
        } else {
            this.group.position.y = 0.5; setTimeout(()=>this.group.position.y=0, 100);
            this.gm.spawnVFX(this.target.group.position, 'impact');
            this.target.takeDmg(this.currStats.dmg);
        }
        this.gainMana(10);
    }

    castSkill(units) {
        this.mana = 0; this.updateBar();
        const skillId = this.currStats.skill || 'default';
        const skillFunc = SKILLS[skillId] || SKILLS['default'];
        this.toastMsg("ULTI!");
        skillFunc(this, this.target, units);
    }

    gainMana(amt) { if(this.mana < this.maxMana) { this.mana = Math.min(this.mana + amt, this.maxMana); this.updateBar(); } }

    findTarget(units) {
        let minD = 999; this.target = null;
        units.forEach(u => { if(u.team !== this.team && !u.isDead) { const d = this.group.position.distanceTo(u.group.position); if(d < minD) { minD = d; this.target = u; } } });
    }

    move(dest, units) {
        const dir = new THREE.Vector3().subVectors(dest, this.group.position).normalize();
        const sep = new THREE.Vector3(); let count = 0;
        units.forEach(u => { 
            if(u !== this && !u.isDead) { 
                const d = this.group.position.distanceTo(u.group.position); 
                if(d < 1.0) { 
                    const push = new THREE.Vector3().subVectors(this.group.position, u.group.position).normalize().divideScalar(d); 
                    sep.add(push); count++; 
                } 
            } 
        });
        if(count>0) sep.divideScalar(count).multiplyScalar(0.8);
        dir.add(sep).normalize();
        this.group.position.add(dir.multiplyScalar(0.06));
        this.group.lookAt(dest.x, this.group.position.y, dest.z);
        const distFromCenter = this.group.position.length();
        if(distFromCenter > ARENA_RADIUS) { this.group.position.setLength(ARENA_RADIUS); }
    }

    applyStun(duration) { this.stunTime = duration; }

    updateBar() {
        if(!this.bar) return;
        let hpPct = (this.hp / this.maxHp)*100;
        let manaPct = (this.mana / this.maxMana)*100;
        hpPct = Math.max(0, hpPct);
        manaPct = Math.max(0, manaPct);
        
        this.bar.querySelector('.bar-fill').style.width = `${hpPct}%`;
        this.bar.querySelector('.mana-fill').style.width = `${manaPct}%`;
    }

    toastMsg(msg) { }

    reset() {
        this.isDead=false; this.hp=this.maxHp; 
        let startMana = 0; 
        this.items.forEach(id => { if(ITEMS[id].stats.mana) startMana += ITEMS[id].stats.mana; });
        this.mana = Math.min(startMana, this.maxMana);
        this.shield=0; this.stunTime=0; this.group.visible=true; this.target=null; 
        this.updateBar();
        const hitBox = this.group.children.find(c=>c.name==='hitbox');
        if(hitBox && hitBox.userData.origPos) { this.group.position.copy(hitBox.userData.origPos); this.group.rotation.set(0,0,0); }
        if(this.meshBody) this.meshBody.material.color.copy(this.origColor);
    }

    destroy() { if(this.bar) this.bar.remove(); if(this.gm.scene) this.gm.scene.remove(this.group); }
}
