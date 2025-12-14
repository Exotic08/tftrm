const createGlowTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
};
const particleTex = createGlowTexture();

const createShockwave = (color, size = 1) => {
    const geo = new THREE.RingGeometry(0.2 * size, 1 * size, 32);
    const mat = new THREE.MeshBasicMaterial({ 
        color: color, transparent: true, opacity: 0.9, 
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
};

export class VisualEffect {
    constructor(scene, pos, type) {
        this.scene = scene; 
        this.life = 0; 
        this.type = type;
        this.mesh = new THREE.Group(); 
        this.mesh.position.copy(pos);
        this.scene.add(this.mesh);
        
        this.particles = []; 
        this.lights = [];
        this.subMeshes = []; 

        const createParticles = (count, color, size, speed, spread=1, vertical=false) => {
            const mat = new THREE.SpriteMaterial({ 
                map: particleTex, color: color, transparent: true, opacity: 0.8,
                blending: THREE.AdditiveBlending, depthWrite: false
            });
            for(let i=0; i<count; i++) {
                const p = new THREE.Sprite(mat.clone());
                p.position.set((Math.random()-0.5)*spread, (Math.random())*spread*0.5 + 0.2, (Math.random()-0.5)*spread);
                p.scale.set(size, size, size);
                const vX = (Math.random()-0.5) * speed;
                const vY = vertical ? (Math.random() * speed) : (Math.random()-0.5) * speed;
                const vZ = (Math.random()-0.5) * speed;
                p.userData = { vel: new THREE.Vector3(vX, vY, vZ), gravity: vertical ? 0.02 : 0.01 };
                this.mesh.add(p); this.particles.push(p);
            }
        };

        const createLight = (color, intensity, dist) => { 
            const l = new THREE.PointLight(color, intensity, dist); 
            l.position.y = 1; this.mesh.add(l); this.lights.push(l); 
        };

        if (type === 'augment_select') {
            const beamGeo = new THREE.CylinderGeometry(0.5, 0.5, 20, 16);
            const beamMat = new THREE.MeshBasicMaterial({ color: 0x0acde3, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
            this.mainObj = new THREE.Mesh(beamGeo, beamMat);
            this.mainObj.position.y = 10;
            this.mesh.add(this.mainObj);
            this.shockwaves = [createShockwave(0x0acde3, 3), createShockwave(0xffffff, 1)];
            this.shockwaves.forEach(s => this.mesh.add(s));
            createParticles(20, 0x0acde3, 1.2, 0.8, 2, true);
            createParticles(15, 0xffd700, 0.8, 1.0, 2, true);
            createLight(0x0acde3, 5, 10);
            this.maxLife = 40;
        }
        else if (type === 'spin' || type === 'spin_gold') { 
            const geo = new THREE.TorusGeometry(3, 0.2, 2, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent:true, opacity:0.6, blending: THREE.AdditiveBlending });
            this.mainObj = new THREE.Group();
            this.mainObj.add(new THREE.Mesh(geo, mat));
            this.mainObj.children[0].rotation.x = Math.PI/2;
            this.mainObj.position.y = 1;
            this.mesh.add(this.mainObj);
            createParticles(20, 0xffaa00, 0.8, 0.2, 3.5, true);
            createLight(0xffaa00, 2, 6);
            this.maxLife = 45;
        } 
        else if (type === 'guillotine' || type === 'red_beam') { 
            const shape = new THREE.Shape(); shape.moveTo(0,0); shape.lineTo(1,3); shape.lineTo(2,4); shape.lineTo(3,3); shape.lineTo(0,0);
            const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
            const mat = new THREE.MeshBasicMaterial({ color: 0xaa0000, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mainObj.rotation.z = Math.PI; 
            this.mainObj.scale.set(1.5, 3, 1.5); this.mainObj.position.set(1.5, 10, 0);
            this.mesh.add(this.mainObj);
            this.shockwaves = [createShockwave(0x550000, 2)]; this.mesh.add(this.shockwaves[0]);
            createParticles(30, 0xff0000, 0.6, 1.0, 1.5); createLight(0xff0000, 4, 8); 
            this.maxLife = 20;
        }
        else if (type === 'uppercut' || type === 'pink_explosion') { 
            this.shockwaves = [createShockwave(0xff00ff, 1.5), createShockwave(0xffffff, 0.5)];
            this.shockwaves.forEach(s => this.mesh.add(s));
            createParticles(30, 0xff55ff, 1.0, 1.2, 1.0, true); createLight(0xff00ff, 3, 6); 
            this.maxLife = 20;
        }
        else if (type === 'wind_slash' || type === 'green_wave') { 
            const geo = new THREE.RingGeometry(3, 4, 32, 1, -Math.PI/2, Math.PI);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
            this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.rotation.x = -Math.PI/2; this.mainObj.position.y = 1;
            this.mesh.add(this.mainObj);
            createParticles(20, 0xccffcc, 0.5, 0.5, 3);
            this.maxLife = 20;
        }
        else if (type === 'tornado' || type === 'tornado_grey') { 
            for(let i=0; i<4; i++) {
                const geo = new THREE.ConeGeometry(1 + i*0.8, 3, 16, 1, true);
                const mat = new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent:true, opacity:0.3, side:THREE.DoubleSide, blending: THREE.AdditiveBlending });
                const m = new THREE.Mesh(geo, mat); m.position.y = i * 2; m.rotation.x = Math.PI; 
                m.userData = { rotSpeed: 0.8 - i*0.1 };
                this.mesh.add(m); this.subMeshes.push(m);
            }
            createParticles(30, 0xffffff, 0.4, 0.8, 2, true); 
            this.maxLife = 40;
        }
        else if (type === 'hammer_smash' || type === 'yellow_smash') {
            const head = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), new THREE.MeshStandardMaterial({color: 0xcd853f}));
            head.position.y = 1;
            this.mainObj = head; this.mesh.add(head);
            this.shockwaves = [createShockwave(0xffff00, 1.5)]; this.mesh.add(this.shockwaves[0]);
            createParticles(20, 0xffffaa, 0.8, 0.5, 2);
            this.maxLife = 20;
        }
        else if (type === 'ground_slam' || type === 'rock_explosion') {
            for(let i=0; i<6; i++) {
                const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), new THREE.MeshStandardMaterial({color: 0x8b4513}));
                rock.position.set((Math.random()-0.5)*3, 0, (Math.random()-0.5)*3);
                rock.userData = { targetY: 1 + Math.random() };
                this.mesh.add(rock); this.subMeshes.push(rock);
            }
            this.shockwaves = [createShockwave(0x8b4513, 2)]; this.mesh.add(this.shockwaves[0]);
            createParticles(30, 0x5c4033, 0.6, 0.8, 3);
            this.maxLife = 25;
        }
        else if (type === 'grand_challenge' || type === 'vital_break') {
            const geo = new THREE.PlaneGeometry(3, 3);
            const mat = new THREE.MeshBasicMaterial({color: 0xffffaa, transparent: true, opacity: 1, side: THREE.DoubleSide, blending: THREE.AdditiveBlending});
            const star = new THREE.Mesh(geo, mat); star.rotation.z = Math.PI/4;
            this.mainObj = star; this.mainObj.position.y = 1.5; this.mesh.add(this.mainObj);
            createParticles(20, 0xffff00, 0.5, 1.0, 1);
            this.maxLife = 15;
        }
        else if (type === 'solar_flare' || type === 'solar_beam') { 
            const beamGeo = new THREE.CylinderGeometry(2, 2, 20, 32);
            const beamMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent:true, opacity:0.6, blending: THREE.AdditiveBlending });
            this.mainObj = new THREE.Mesh(beamGeo, beamMat); this.mainObj.position.y = 10; this.mesh.add(this.mainObj);
            this.shockwaves = [createShockwave(0xffd700, 3)]; this.mesh.add(this.shockwaves[0]);
            createParticles(40, 0xffff00, 1.0, 1.5, 3); createLight(0xffaa00, 5, 12); 
            this.maxLife = 30;
        }
        else if (type === 'ice_fissure' || type === 'ice_spikes') { 
            for(let i=0; i<6; i++) {
                const s = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2+Math.random(), 4), new THREE.MeshStandardMaterial({color:0x00ffff, emissive: 0x0055ff}));
                s.position.set((Math.random()-0.5), -1, i*1.2); s.userData={targetY:0.5};
                this.mesh.add(s); this.subMeshes.push(s);
            }
            createParticles(25, 0xaaffff, 0.6, 0.5, 2); createLight(0x00ffff, 3, 8);
            this.maxLife = 35;
        }
        else if (type === 'silver_bolts' || type === 'silver_ring') {
            this.shockwaves = [createShockwave(0xffffff, 1.0)]; 
            this.mesh.add(this.shockwaves[0]);
            createParticles(15, 0xcccccc, 0.5, 0.8, 1);
            this.maxLife = 15;
        }
        else if (type === 'ace_shot') { 
            const sw = createShockwave(0xff0000, 1.5);
            this.mesh.add(sw); this.shockwaves = [sw];
            createParticles(20, 0xff0000, 0.8, 1.2, 1); createLight(0xff0000, 3, 5);
            this.maxLife = 20;
        }
        else if (type === 'corruption' || type === 'purple_root') {
            for(let i=0; i<5; i++) {
                const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 3, 8), new THREE.MeshStandardMaterial({color: 0x800080}));
                vine.position.set(Math.sin(i*1.5), -1, Math.cos(i*1.5)); 
                vine.rotation.x = Math.random()*0.5; vine.rotation.z = Math.random()*0.5;
                vine.userData = {targetY: 1};
                this.mesh.add(vine); this.subMeshes.push(vine);
            }
            createParticles(20, 0xaa00aa, 0.6, 0.5, 2);
            this.maxLife = 30;
        }
        else if (type === 'crystal_arrow') {
            this.shockwaves = [createShockwave(0x00ffff, 2)]; this.mesh.add(this.shockwaves[0]);
            createParticles(40, 0xaaffff, 0.8, 1.5, 3); createLight(0x00ffff, 4, 8);
            this.maxLife = 25;
        }
        else if (type === 'final_spark' || type === 'rainbow_laser') { 
            const coreGeo = new THREE.CylinderGeometry(0.4, 0.4, 40, 8);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent:true, opacity:1 });
            this.mainObj = new THREE.Mesh(coreGeo, coreMat);
            const glowMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent:true, opacity:0.3, blending: THREE.AdditiveBlending });
            this.mainObj.add(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 40, 16), glowMat));
            this.mainObj.rotation.x = Math.PI/2; this.mainObj.position.z = 20; this.mainObj.position.y = 1.5;
            this.mesh.add(this.mainObj);
            createParticles(40, 0xffeeff, 0.8, 1.0, 1); createLight(0xffffff, 3, 10);
            this.maxLife = 20; 
        }
        else if (type === 'curtain_call' || type === 'jhin_flower') {
            for(let i=0; i<4; i++) {
                const geo = new THREE.TorusGeometry(1.5, 0.1, 4, 20); 
                const mat = new THREE.MeshBasicMaterial({ color: 0xff0044, transparent:true, opacity:0.8 });
                const m = new THREE.Mesh(geo, mat); m.rotation.x = Math.PI/2; m.rotation.z = (Math.PI/2) * i;
                m.userData = { expand: true }; this.mesh.add(m); this.subMeshes.push(m);
            }
            createParticles(20, 0xff0000, 0.5, 0.5, 2); createLight(0xff0000, 3, 5);
            this.maxLife = 30;
        }
        else if (type === 'purple_bomb' || type === 'bouncing_bomb') {
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.2, 2, 8), new THREE.MeshBasicMaterial({color:0x555555})); stem.position.y = 1;
            const cap = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 8, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshBasicMaterial({color:0xaa00aa})); cap.position.y = 2;
            this.mainObj = new THREE.Group(); this.mainObj.add(stem, cap); this.mesh.add(this.mainObj);
            this.shockwaves = [createShockwave(0xff5500)]; this.mesh.add(this.shockwaves[0]);
            createParticles(30, 0xffaa00, 1.0, 1.5, 2.5); createLight(0xff5500, 4, 8);
            this.maxLife = 30;
        }
        else if (type === 'wild_cards' || type === 'card_throw') {
            const colors = [0xff0000, 0x0000ff, 0xffff00];
            colors.forEach((c, i) => {
                const card = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), new THREE.MeshBasicMaterial({color: c, side: THREE.DoubleSide}));
                card.rotation.x = -Math.PI/2; card.position.y = 1;
                card.userData = { angle: (i-1)*0.5 };
                this.mesh.add(card); this.subMeshes.push(card);
            });
            this.maxLife = 20;
        }
        else if (type === 'disintegrate' || type === 'fire_shield') {
             const geo = new THREE.SphereGeometry(2.5, 16, 16);
             const mat = new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
             this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.position.y = 1; this.mesh.add(this.mainObj);
             createParticles(20, 0xffaa00, 1.0, 0.5, 2.5); createLight(0xff5500, 3, 5);
             this.maxLife = 30;
        }
        else if (type === 'void_ray' || type === 'life_form_ray') {
             const geo = new THREE.CylinderGeometry(0.6, 0.8, 25, 16);
             const mat = new THREE.MeshBasicMaterial({ color: 0x8e44ad, transparent:true, opacity:0.8, blending: THREE.AdditiveBlending });
             this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.rotation.x = Math.PI/2; this.mainObj.position.z = 12.5; this.mainObj.position.y = 1.5;
             this.mesh.add(this.mainObj);
             createParticles(30, 0xda70d6, 0.8, 0.5, 1); createLight(0x8e44ad, 3, 8);
             this.maxLife = 30;
        }
        else if (type === 'void_slash' || type === 'noxus_stab') {
            const color = type === 'void_slash' ? 0x8800ff : 0xaa0000;
            const geo = new THREE.BoxGeometry(0.2, 0.2, 4);
            const mat = new THREE.MeshBasicMaterial({ color: color, transparent:true, opacity:0.8, blending: THREE.AdditiveBlending });
            const s1 = new THREE.Mesh(geo, mat); s1.rotation.y = Math.PI/4;
            const s2 = new THREE.Mesh(geo, mat); s2.rotation.y = -Math.PI/4;
            this.mainObj = new THREE.Group(); this.mainObj.add(s1, s2); this.mainObj.position.y = 1; this.mesh.add(this.mainObj);
            createParticles(15, color, 0.5, 0.8, 1.5);
            this.maxLife = 15;
        }
        else if (type === 'death_lotus' || type === 'shadow_spin' || type === 'umbra_blades') {
            const isNoc = type === 'umbra_blades';
            const color = isNoc ? 0x222222 : 0xff0000;
            const geo = new THREE.TorusGeometry(3, 0.2, 4, 8);
            const mat = new THREE.MeshBasicMaterial({ color: color, transparent:true, opacity:0.7 });
            this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.rotation.x = Math.PI/2; this.mainObj.position.y = 1;
            this.mesh.add(this.mainObj);
            createParticles(40, color, 0.6, 1.0, 3.5);
            this.maxLife = 40;
        }
        else if (type === 'razor_shuriken' || type === 'shuriken') {
            const geo = new THREE.CylinderGeometry(1, 1, 0.1, 4); 
            const mat = new THREE.MeshBasicMaterial({ color: 0x333333, emissive: 0xffffff, emissiveIntensity: 0.2 });
            this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.position.y = 1; this.mainObj.rotation.x = Math.PI/2;
            this.mesh.add(this.mainObj);
            createParticles(15, 0x000000, 0.5, 1.0, 1);
            this.maxLife = 20;
        }
        else if (type === 'upgrade') {
             const geo = new THREE.CylinderGeometry(2, 2, 10, 16, 1, true);
             const mat = new THREE.MeshBasicMaterial({ color: 0xffff88, transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });
             this.mainObj = new THREE.Mesh(geo, mat); this.mainObj.position.y = 5; this.mesh.add(this.mainObj);
             createParticles(30, 0xffffaa, 0.8, 0.8, 1, true); createLight(0xffff00, 2, 5);
             this.maxLife = 40;
        }
        else { 
            createParticles(5, 0xffffff, 0.3, 0.5, 0.5); 
            this.maxLife = 10;
        }
    }

    update() {
        this.life++; 
        const p = this.life / this.maxLife; 

        this.particles.forEach(pt => { 
            pt.userData.vel.y -= pt.userData.gravity; pt.position.add(pt.userData.vel); 
            pt.material.opacity = (1 - p); pt.scale.multiplyScalar(0.92);
        });
        this.lights.forEach(l => l.intensity *= 0.85);
        if(this.shockwaves) this.shockwaves.forEach(sw => {
            const s = 1 + p * 5; sw.scale.set(s, s, s); sw.material.opacity = (1 - p);
        });

        if (this.mainObj) {
            if (this.type.includes('spin') || this.type.includes('lotus') || this.type.includes('shuriken')) {
                this.mainObj.rotation.z += 0.8; this.mainObj.material ? (this.mainObj.material.opacity = 1-p) : null;
            }
            else if (this.type.includes('guillotine')) { if (p < 0.3) this.mainObj.position.y -= 1.5; this.mainObj.material.opacity = 1 - p; }
            else if (this.type.includes('wind_slash')) { this.mainObj.position.z += 0.8; this.mainObj.scale.multiplyScalar(1.05); this.mainObj.material.opacity = 1 - p; }
            else if (this.type.includes('void_ray')) { this.mainObj.scale.x = 1 + Math.sin(this.life)*0.2; this.mainObj.material.opacity = 1 - p; }
            else if (this.type.includes('augment')) { this.mainObj.material.opacity = 1 - p; this.mainObj.scale.x = 1 - p*0.5; this.mainObj.scale.z = 1 - p*0.5; }
            else if (this.type.includes('card_throw')) {
                this.mainObj.children.forEach(c => {
                    c.position.x += Math.sin(c.userData.angle) * 0.5;
                    c.position.z += Math.cos(c.userData.angle) * 0.5;
                });
            }
            else { 
                if(this.mainObj.material) this.mainObj.material.opacity = 1 - p;
                else this.mainObj.children.forEach(c=> { if(c.material) c.material.opacity = 1-p; });
            }
        }

        this.subMeshes.forEach(m => {
            if(this.type.includes('tornado')) { m.rotation.y += m.userData.rotSpeed; m.position.y += 0.15; }
            if(this.type.includes('curtain')) { m.scale.multiplyScalar(1.05); m.material.opacity = 1 - p; }
            if(this.type.includes('ice_spikes') || this.type.includes('purple_root') || this.type.includes('ground_slam')) {
                if(m.position.y < m.userData.targetY) m.position.y += 0.5;
            }
            if(this.type.includes('card_throw')) {
                 m.position.x += Math.sin(m.userData.angle) * 0.3;
                 m.position.z += Math.cos(m.userData.angle) * 0.3;
            }
        });

        if (this.life >= this.maxLife) { this.destroy(); return false; }
        return true;
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.mesh.traverse(c => { if(c.geometry) c.geometry.dispose(); if(c.material) c.material.dispose(); });
    }
}

export class Projectile {
    constructor(scene, start, target, color, dmg, isStun = false) {
        this.scene = scene; this.target = target; this.dmg = dmg; this.isStun = isStun; this.speed = 1.2; this.isHit = false;
        this.mesh = new THREE.Group(); this.mesh.position.copy(start); this.mesh.position.y += 1.2;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshBasicMaterial({ color: color, blending: THREE.AdditiveBlending })); this.mesh.add(head);
        const tailGeo = new THREE.CylinderGeometry(0.05, 0, 2.0, 6); tailGeo.rotateX(-Math.PI / 2); tailGeo.translate(0, 0, -1.0); 
        const tail = new THREE.Mesh(tailGeo, new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })); this.mesh.add(tail);
        this.mesh.add(new THREE.PointLight(color, 1.5, 3)); this.scene.add(this.mesh);
    }
    update() {
        if (this.isHit || !this.target || this.target.isDead) { this.destroy(); return false; }
        const targetPos = this.target.group.position.clone().add(new THREE.Vector3(0,1,0));
        const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position).normalize();
        this.mesh.position.add(dir.multiplyScalar(this.speed)); this.mesh.lookAt(targetPos);
        if (this.mesh.position.distanceTo(targetPos) < 1.0) {
            this.target.takeDmg(this.dmg);
            if(this.target.gm.view) {
                if(this.isStun) { this.target.applyStun(2); this.target.gm.view.spawnVFX(this.target.group.position, 'ice_spikes'); } 
                else { this.target.gm.view.spawnVFX(this.target.group.position, 'default'); }
            }
            this.destroy(); return false;
        }
        return true;
    }
    destroy() { this.scene.remove(this.mesh); this.isHit = true; this.mesh.traverse((c) => { if(c.geometry) c.geometry.dispose(); if(c.material) c.material.dispose(); }); }
}

export const UnitFactory = {
    createUnitGroup: function(data, hex, team) {
        const group = new THREE.Group();
        const color = data.color;
        const mBody = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, metalness: 0.3 });
        const mSkin = new THREE.MeshStandardMaterial({ color: 0xffdcb1, roughness: 0.6 });
        const mDark = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        const mMetal = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.8, roughness: 0.2 });
        const mGold = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.7, roughness: 0.3 });
        const addBox = (w, h, d, mat, x, y, z, rz=0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); m.position.set(x,y,z); m.rotation.z=rz; group.add(m); return m; };

        if (data.isMonster) {
            let body;
            if (data.id.includes('dragon')) { 
                body = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5), mGold); body.position.y=1.5;
                const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.2), mGold); head.position.set(0, 2.5, 1);
                const wingL = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1), mGold); wingL.position.set(-1.5, 2, 0); wingL.rotation.z=0.5;
                const wingR = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1), mGold); wingR.position.set(1.5, 2, 0); wingR.rotation.z=-0.5;
                group.add(body, head, wingL, wingR);
            } else if (data.shape === 'rock') { 
                body = new THREE.Mesh(new THREE.DodecahedronGeometry(1), mBody); body.position.y=1;
                addBox(0.4, 0.4, 0.4, mBody, -0.8, 1.2, 0); addBox(0.4, 0.4, 0.4, mBody, 0.8, 1.2, 0);
                group.add(body);
            } else { 
                body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mBody); body.position.y=0.6; group.add(body);
                const head = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 4), mBody); 
                head.rotation.x = -Math.PI/2; head.position.set(0, 0.8, 0.5); group.add(head);
            }
            body.name = 'body';
        } else {
            let tBody, tHead;
            if (['malph', 'krug'].includes(data.id)) {
                tBody = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), mBody); tBody.position.y = 0.8;
                const sL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), mBody); sL.position.set(-0.7, 1.2, 0);
                const sR = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), mBody); sR.position.set(0.7, 1.2, 0);
                group.add(tBody, sL, sR);
            } else if (['velkoz'].includes(data.id)) { 
                tBody = new THREE.Mesh(new THREE.SphereGeometry(0.6), mBody); tBody.position.y = 1.5;
                for(let i=0; i<3; i++) {
                    const tent = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.02, 1.5), mBody);
                    tent.position.set(Math.sin(i)*0.5, 0.8, Math.cos(i)*0.5); tent.rotation.x = 0.5; group.add(tent);
                }
                group.add(tBody);
            } else {
                const isBig = ['garen','darius','braum','leo'].includes(data.id);
                tBody = new THREE.Mesh(new THREE.CylinderGeometry(isBig?0.45:0.3, isBig?0.35:0.25, 0.7, 8), mBody);
                tBody.position.y = 0.75;
                tHead = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.35), mSkin); tHead.position.y = 1.35;
                group.add(tBody, tHead);
                addBox(0.15, 0.5, 0.15, mBody, -0.45, 0.8, 0, 0.2); 
                addBox(0.15, 0.5, 0.15, mBody, 0.45, 0.8, 0, -0.2); 
                addBox(0.18, 0.5, 0.18, mDark, -0.2, 0.25, 0); 
                addBox(0.18, 0.5, 0.18, mDark, 0.2, 0.25, 0); 
            }
            if(tBody) tBody.name = 'body';

            const wGroup = new THREE.Group();
            switch(data.id) {
                case 'garen': 
                    addBox(0.4, 0.4, 0.4, mMetal, -0.6, 1.1, 0); addBox(0.4, 0.4, 0.4, mMetal, 0.6, 1.1, 0); 
                    const gs = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 0.05), mMetal);
                    gs.position.set(0.7, 0.8, 0.3); gs.rotation.x=1.5; wGroup.add(gs);
                    break;
                case 'darius': 
                    const axeH = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8), mDark);
                    const axeB = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.1), mMetal); axeB.position.y=0.6;
                    wGroup.add(axeH, axeB); wGroup.position.set(0.6, 1, 0.2); wGroup.rotation.x=1.2;
                    break;
                case 'lux': 
                    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6), mGold);
                    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15), new THREE.MeshBasicMaterial({color:0xffffaa})); gem.position.y=0.8;
                    wGroup.add(staff, gem); wGroup.position.set(0.5, 0.8, 0.2); wGroup.rotation.z=-0.2;
                    break;
                case 'yasuo': 
                    if(tHead) { const hair = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), mDark); hair.position.set(0,0.3,-0.3); hair.rotation.x=0.5; tHead.add(hair); }
                    const kat = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.5, 0.03), mMetal);
                    wGroup.add(kat); wGroup.position.set(0.6, 0.8, 0.3); wGroup.rotation.x=1.5;
                    break;
                case 'vi': 
                    const gL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), mMetal); gL.position.set(-0.6, 0.6, 0.3);
                    const gR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), mMetal); gR.position.set(0.6, 0.6, 0.3);
                    group.add(gL, gR);
                    break;
                case 'ashe': 
                    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 4, 8, 3), new THREE.MeshStandardMaterial({color:0x00ffff}));
                    wGroup.add(bow); wGroup.position.set(0.5, 0.8, 0.3); wGroup.rotation.y=1.5;
                    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.05), mBody); cape.position.set(0, 0.8, -0.3); group.add(cape);
                    break;
                case 'braum': 
                    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.1), mBody);
                    wGroup.add(door); wGroup.position.set(0.4, 0.8, 0.5);
                    break;
                case 'zed': 
                    const cL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.02), mMetal); cL.position.set(-0.5, 0.6, 0.3); cL.rotation.x=1.5;
                    const cR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.02), mMetal); cR.position.set(0.5, 0.6, 0.3); cR.rotation.x=1.5;
                    group.add(cL, cR);
                    break;
                default: 
                    const defW = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), mMetal);
                    wGroup.add(defW); wGroup.position.set(0.6, 0.8, 0.2); wGroup.rotation.x=1.5;
            }
            group.add(wGroup);
        }

        const hit = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 1), 
            new THREE.MeshBasicMaterial({ 
                color: 0x000000, 
                visible: true, 
                transparent: true, 
                opacity: 0, 
                depthWrite: false, 
                side: THREE.DoubleSide 
            })
        );
        hit.userData = { isUnit:true, data: data, hex: hex, team: team }; hit.name = 'hitbox'; group.add(hit);
        
        const s = (data.scale || 1.3) * 1.1; 
        group.scale.set(s, s, s);

        if (hex) { group.position.copy(hex.position); hex.userData.occupied = true; hit.userData.origPos = hex.position.clone(); }
        return group;
    }
};
