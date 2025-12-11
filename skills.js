// js/skills.js

export const SKILLS = {
    // --- WARRIORS ---
    'spin': (u, t, units) => { // Garen
        u.gm.spawnVFX(u.group.position, 'spin_gold');
        units.forEach(e => { if(e.team !== u.team && u.group.position.distanceTo(e.group.position) < 3) e.takeDmg(u.currStats.dmg * 2.5 * u.star); });
    },
    'guillotine': (u, t, units) => { // Darius
        if(t) { u.gm.spawnVFX(t.group.position, 'red_beam'); t.takeDmg(u.currStats.dmg * 3 * u.star); u.hp = Math.min(u.hp+150*u.star, u.maxHp); u.updateBar(); }
    },
    'uppercut': (u, t, units) => { // Vi
        if(t) { u.gm.spawnVFX(t.group.position, 'pink_explosion'); t.takeDmg(u.currStats.dmg * 2.5 * u.star); t.applyStun(1.5); }
    },
    'wind_slash': (u, t, units) => { // Riven
        u.gm.spawnVFX(u.group.position, 'green_wave');
        units.forEach(e => { if(e.team !== u.team && u.group.position.distanceTo(e.group.position) < 3) e.takeDmg(u.currStats.dmg * 2 * u.star); });
    },
    'tornado': (u, t, units) => { // Yasuo
        if(t) { 
            u.gm.spawnVFX(t.group.position, 'tornado_grey'); 
            units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(t.group.position) < 2) { e.takeDmg(u.currStats.dmg * 2 * u.star); e.applyStun(1.5); }});
        }
    },

    // --- TANKS ---
    'hammer_smash': (u, t, units) => { // Poppy
        if(t) { u.gm.spawnVFX(t.group.position, 'yellow_smash'); t.takeDmg(u.currStats.dmg * 2 * u.star); t.applyStun(2); }
    },
    'ground_slam': (u, t, units) => { // Malphite
        u.gm.spawnVFX(u.group.position, 'rock_explosion');
        units.forEach(e => { if(e.team !== u.team && u.group.position.distanceTo(e.group.position) < 3) { e.takeDmg(150 * u.star); e.applyStun(1.5); }});
    },
    'grand_challenge': (u, t, units) => { // Fiora
        if(t) { u.gm.spawnVFX(t.group.position, 'vital_break'); t.takeDmg(u.currStats.dmg * 3 * u.star); u.hp = Math.min(u.hp+200*u.star, u.maxHp); u.updateBar(); }
    },
    'solar_flare': (u, t, units) => { // Leona
        if(t) { u.gm.spawnVFX(t.group.position, 'solar_beam'); units.forEach(e => { if(e.team !== u.team && e.group.position.distanceTo(t.group.position) < 2.5) { e.takeDmg(100 * u.star); e.applyStun(2); }}); }
    },
    'ice_fissure': (u, t, units) => { // Braum
        if(t) { u.gm.spawnVFX(t.group.position, 'ice_spikes'); t.takeDmg(u.currStats.dmg * 1.5 * u.star); t.applyStun(2.5); }
    },

    // --- RANGERS ---
    'silver_bolts': (u, t, units) => { // Vayne
        if(t) { u.gm.spawnVFX(t.group.position, 'silver_ring'); t.takeDmg(u.currStats.dmg * 1.5 * u.star + 100*u.star); }
    },
    'ace_shot': (u, t, units) => { // Caitlyn
        if(t) { u.gm.spawnProjectile(u.group.position, t, 0xff0000, u.currStats.dmg * 4 * u.star, false); }
    },
    'corruption': (u, t, units) => { // Varus
        if(t) { u.gm.spawnVFX(t.group.position, 'purple_root'); t.takeDmg(u.currStats.dmg * 2 * u.star); t.applyStun(2); }
    },
    'crystal_arrow': (u, t, units) => { // Ashe
        if(t) { u.gm.spawnProjectile(u.group.position, t, 0x00ffff, u.currStats.dmg * 2.5 * u.star, true); }
    },
    'curtain_call': (u, t, units) => { // Jhin
        if(t) { u.gm.spawnVFX(t.group.position, 'jhin_flower'); t.takeDmg(u.currStats.dmg * 4 * u.star); }
    },
    
    'default': (u, t, units) => { if(t) { u.gm.spawnVFX(t.group.position, 'impact'); t.takeDmg(u.currStats.dmg * 1.5); } }
};
