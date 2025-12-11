// js/vfx.js

export class VisualEffect {
    constructor(scene, pos, type) {
        this.scene = scene; this.life = 0; this.type = type;
        this.mesh = new THREE.Group();
        this.mesh.position.copy(pos);
        this.scene.add(this.mesh);
        this.particles = [];

        // Helper tạo hạt nổ
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

        // --- DEFINITION CÁC LOẠI VFX ---
        if (type === 'spin_gold') { // Garen
            const geo = new THREE.CylinderGeometry(3, 2, 4, 16, 1, true);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent:true, opacity:0.6, side:THREE.DoubleSide });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mesh.add(this.mainObj);
            this.maxLife = 20;

        } else if (type === 'red_beam') { // Darius
            const geo = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent:true, opacity:0.8 });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mainObj.position.y = 7;
            this.mesh.add(this.mainObj);
            createParticles(10, 0x880000, 0.3, 0.5);
            this.maxLife = 20;

        } else if (type === 'pink_explosion') { // Vi
            const geo = new THREE.SphereGeometry(2, 16, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent:true, opacity:0.5, wireframe:true });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mesh.add(this.mainObj);
            createParticles(15, 0x00ffff, 0.2, 0.8);
            this.maxLife = 20;

        } else if (type === 'green_wave') { // Riven
            const geo = new THREE.RingGeometry(1, 4, 32, 1, 0, Math.PI); // Bán nguyệt
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent:true, opacity:0.6, side:THREE.DoubleSide });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mainObj.rotation.x = -Math.PI/2;
            this.mainObj.position.y = 0.5;
            this.mesh.add(this.mainObj);
            this.maxLife = 15;

        } else if (type === 'tornado_grey') { // Yasuo
            const geo = new THREE.ConeGeometry(1.5, 5, 8, 1, true);
            const mat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent:true, opacity:0.7 });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mainObj.geometry.translate(0, 2.5, 0); // Pivot ở đáy
            this.mainObj.rotation.x = Math.PI; // Úp ngược
            this.mesh.add(this.mainObj);
            this.maxLife = 25;

        } else if (type === 'yellow_smash') { // Poppy
            const geo = new THREE.CylinderGeometry(2, 2, 0.5, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mesh.add(this.mainObj);
            createParticles(8, 0xffffaa, 0.4, 0.4);
            this.maxLife = 15;

        } else if (type === 'rock_explosion') { // Malphite
            createParticles(25, 0x8b4513, 0.6, 0.6); 
            this.maxLife = 25;

        } else if (type === 'vital_break') { // Fiora
            this.subGroup = new THREE.Group();
            const geo = new THREE.SphereGeometry(0.3);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            for(let i=0; i<4; i++) {
                const m = new THREE.Mesh(geo, mat);
                m.position.set(Math.cos(i*Math.PI/2)*1.5, 1, Math.sin(i*Math.PI/2)*1.5);
                this.subGroup.add(m);
            }
            this.mesh.add(this.subGroup);
            this.maxLife = 20;

        } else if (type === 'solar_beam') { // Leona
            const geo = new THREE.CylinderGeometry(1.5, 1.5, 20, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent:true, opacity:0.5, blending: THREE.AdditiveBlending });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mainObj.position.y = 10;
            this.mesh.add(this.mainObj);
            this.maxLife = 30;

        } else if (type === 'ice_spikes') { // Braum
            const geo = new THREE.ConeGeometry(1, 3, 4);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
            for(let i=0; i<5; i++) {
                const spike = new THREE.Mesh(geo, mat);
                spike.position.set((Math.random()-0.5)*2, 0, (Math.random()-0.5)*2);
                spike.rotation.x = (Math.random()-0.5)*0.5;
                this.mesh.add(spike);
            }
            this.maxLife = 25;

        } else if (type === 'silver_ring') { // Vayne
            const geo = new THREE.RingGeometry(0.5, 0.8, 32);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side:THREE.DoubleSide, transparent:true });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mainObj.rotation.x = Math.PI/2;
            this.mainObj.position.y = 1;
            this.mesh.add(this.mainObj);
            this.maxLife = 15;

        } else if (type === 'purple_root') { // Varus
            const geo = new THREE.TorusKnotGeometry(1, 0.2, 64, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0x800080 });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mainObj.position.y = 1;
            this.mesh.add(this.mainObj);
            this.maxLife = 30;

        } else if (type === 'jhin_flower') { // Jhin
            const geo = new THREE.ConeGeometry(3, 5, 4, 1, true);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent:true, opacity:0.8, wireframe:true });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mainObj.rotation.x = Math.PI;
            this.mainObj.position.y = 2;
            this.mesh.add(this.mainObj);
            createParticles(20, 0xff0000, 0.2, 0.8);
            this.maxLife = 35;

        } else if (type === 'upgrade') {
            const geo = new THREE.CylinderGeometry(0.1, 1.5, 6, 8, 1, true);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent:true, opacity:0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
            this.mainObj = new THREE.Mesh(geo, mat);
            this.mainObj.position.y = 2;
            this.mesh.add(this.mainObj);
            this.maxLife = 30;

        } else { // Impact/Slash
            createParticles(5, 0xffaa00, 0.2, 0.3);
            this.maxLife = 10;
        }
    }

    update() {
        this.life++;
        const p = this.life / this.maxLife;

        this.particles.forEach(pt => {
            pt.position.add(pt.userData.vel);
            pt.rotation.x += 0.2; pt.rotation.y += 0.2;
            pt.scale.multiplyScalar(0.9);
        });

        if (this.type === 'spin_gold') {
            this.mainObj.rotation.y += 0.5;
            this.mainObj.scale.x += 0.1; this.mainObj.scale.z += 0.1;
            this.mainObj.material.opacity = 0.6 * (1-p);
        } else if (this.type === 'red_beam' || this.type === 'solar_beam') {
            this.mainObj.scale.x = 1 - p; this.mainObj.scale.z = 1 - p;
            this.mainObj.material.opacity = 1-p;
        } else if (this.type === 'pink_explosion') {
            this.mainObj.scale.multiplyScalar(1.1);
            this.mainObj.material.opacity = 0.5 * (1-p);
        } else if (this.type === 'green_wave') {
            this.mainObj.scale.multiplyScalar(1.15);
            this.mainObj.material.opacity = 0.6 * (1-p);
        } else if (this.type === 'tornado_grey') {
            this.mainObj.rotation.y += 0.5;
            this.mainObj.position.y += 0.1;
            this.mainObj.scale.multiplyScalar(1.05);
            this.mainObj.material.opacity = 0.7 * (1-p);
        } else if (this.type === 'vital_break') {
            this.subGroup.rotation.y += 0.2;
            this.subGroup.scale.multiplyScalar(0.9);
        } else if (this.type === 'ice_spikes') {
            this.mesh.children.forEach(c => c.position.y += 0.1);
        } else if (this.type === 'silver_ring') {
            this.mainObj.scale.multiplyScalar(1.2);
            this.mainObj.material.opacity = 1-p;
        } else if (this.type === 'purple_root') {
            this.mainObj.rotation.x += 0.1; this.mainObj.rotation.y += 0.1;
            this.mainObj.scale.multiplyScalar(0.95);
        } else if (this.type === 'jhin_flower') {
            this.mainObj.rotation.y += 0.05;
            this.mainObj.scale.multiplyScalar(1.05);
            this.mainObj.material.opacity = 0.8 * (1-p);
        } else if (this.type === 'upgrade') {
            this.mainObj.scale.x += 0.1; this.mainObj.scale.z += 0.1;
            this.mainObj.material.opacity = 1 - p;
        }

        if (this.life >= this.maxLife) {
            this.scene.remove(this.mesh); return false;
        }
        return true;
    }
}

export class Projectile {
    constructor(scene, start, target, color, dmg, isStun = false) {
        this.scene = scene; this.target = target; this.dmg = dmg; this.isStun = isStun;
        this.speed = 0.6; this.isHit = false;
        const geo = new THREE.SphereGeometry(0.2, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.scale.z = 3; 
        this.mesh.position.copy(start);
        this.mesh.position.y += 1.5;
        this.scene.add(this.mesh);
    }
    update() {
        if (this.isHit || !this.target || this.target.isDead) { this.destroy(); return false; }
        const targetPos = this.target.group.position.clone().add(new THREE.Vector3(0,1,0));
        const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position).normalize();
        this.mesh.position.add(dir.multiplyScalar(this.speed));
        this.mesh.lookAt(targetPos);
        if (this.mesh.position.distanceTo(targetPos) < 0.8) {
            this.target.takeDmg(this.dmg);
            if(this.isStun) {
                this.target.applyStun(2);
                this.target.gm.spawnVFX(this.target.group.position, 'ice_spikes');
            } else {
                this.target.gm.spawnVFX(this.target.group.position, 'impact');
            }
            this.destroy(); return false;
        }
        return true;
    }
    destroy() { this.scene.remove(this.mesh); this.isHit = true; }
}
