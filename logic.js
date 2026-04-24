// ===== GAME STATE =====
const G = {
  gold: 0,
  gems: 0,
  wave: 1,
  prestigeCount: 0,
  prestigeBonus: 1,
  gameSpeed: 1,

  hero: {
    name: 'Arno',
    level: 1,
    hp: 100, maxHp: 100,
    mp: 50, maxMp: 100,
    atk: 10, def: 5,
    speed: 1.0, crit: 5,
    exp: 0, expNeeded: 100,
    alive: true,
    respawnTimer: 0,
  },

  equippedSkills: [],
  activeSkills: [
    { id: 'slash', name: 'Heavy Slash', desc: 'Powerful vertical strike', dmgMult: 2.5, mpCost: 15, cooldown: 4000, lastUsed: 0, unlocked: true, icon: '⚔️', color: '#ff4d4d' },
    { id: 'spin', name: 'Whirlwind', desc: 'Spinning attack hits all enemies', dmgMult: 1.8, mpCost: 25, cooldown: 7000, lastUsed: 0, unlocked: false, cost: 5, icon: '🌪️', color: '#4dffdb' },
    { id: 'burn', name: 'Inferno', desc: 'Burn enemies with fire magic', dmgMult: 3.0, mpCost: 40, cooldown: 10000, lastUsed: 0, unlocked: false, cost: 10, icon: '🔥', color: '#ff944d' },
    { id: 'quake', name: 'Earthquake', desc: 'Stun and damage everyone', dmgMult: 4.5, mpCost: 60, cooldown: 15000, lastUsed: 0, unlocked: false, cost: 20, icon: '⛰️', color: '#a64dff' },
  ],

  upgrades: [
    { id:'atk', name:'Sword Mastery', desc:'Increase attack power', stat:'atk', base:10, inc:8, cost:10, costMult:1.6, level:0, max:50, color:'#ef4444', icon:'sword' },
    { id:'def', name:'Iron Skin', desc:'Increase defense points', stat:'def', base:5, inc:4, cost:10, costMult:1.5, level:0, max:50, color:'#3b82f6', icon:'shield' },
    { id:'hp', name:'Vitality', desc:'Increase max HP', stat:'maxHp', base:100, inc:50, cost:10, costMult:1.55, level:0, max:50, color:'#22c55e', icon:'heart' },
    { id:'mp', name:'Mana Meditation', desc:'Increase mana regeneration', stat:'mpRegen', base:5, inc:1.5, cost:15, costMult:1.45, level:0, max:50, color:'#60a5fa', icon:'droplet' },
    { id:'spd', name:'Swift Steps', desc:'Increase attack speed (DPS)', stat:'speed', base:1.0, inc:0.15, cost:80, costMult:1.7, level:0, max:30, color:'#fbbf24', icon:'zap' },
    { id:'crit', name:'Eagle Eye', desc:'Increase critical chance', stat:'crit', base:5, inc:3, cost:10, costMult:1.65, level:0, max:30, color:'#f87171', icon:'target' },
    { id:'gold', name:'Merchant Luck', desc:'Increase gold drop from enemies', stat:'goldMult', base:1, inc:0.3, cost:5, costMult:1.5, level:0, max:40, color:'#f0c040', icon:'coins', extra:true },
    { id:'regen', name:'Life Regen', desc:'Auto-recover HP each second', stat:'regen', base:0, inc:2, cost:10, costMult:1.6, level:0, max:30, color:'#4ade80', icon:'plus', extra:true },
  ],

  skills: [
    { id:'berserker', name:'Berserker Rage', desc:'+30% ATK when HP < 40%', cost:5, costType:'gem', unlocked:false, passive:true },
    { id:'vampiric', name:'Vampiric Strike', desc:'Heal 15% of damage dealt', cost:8, costType:'gem', unlocked:false, passive:true },
    { id:'doubleHit', name:'Double Strike', desc:'20% chance to hit twice', cost:10, costType:'gem', unlocked:false, passive:true },
    { id:'goldRush', name:'Gold Rush', desc:'+50% gold from kills', cost:6, costType:'gem', unlocked:false, passive:true },
    { id:'multiWave', name:'Wave Mastery', desc:'Start each wave with +10% bonus stats', cost:12, costType:'gem', unlocked:false, passive:true },
  ],

  goldMult: 1,
  regen: 0,
  waveBonus: 1,

  enemies: [],
  currentEnemies: [],
  battleTimer: 0,
  enemyAttackTimer: 0,
  attackInterval: 1000,
  waveTransition: false,
  waveTransitionTimer: 0,

  classes: ['WANDERER','KNIGHT','WARLORD','CHAMPION','LEGEND','MYTHIC','DIVINE'],
};

// Extra stats not in hero
G.goldMult = 1;
G.regen = 0;
G.waveBonus = 1;
G.hero.regen = 0;
G.hero.goldMult = 1;

// ===== ENEMY TEMPLATES =====
const ENEMY_TYPES = [
  { name:'Forest Slime', type:'slime', hpMult:1, atkMult:1, defMult:0.5, goldMult:1, expMult:1, gem:false },
  { name:'Stone Golem', type:'orc', hpMult:2.5, atkMult:1.1, defMult:2, goldMult:2, expMult:2, gem:false },
  { name:'Shadow Wolf', type:'slime', hpMult:1.5, atkMult:1.3, defMult:0.8, goldMult:1.5, expMult:1.5, gem:false },
  { name:'Iron Orc', type:'orc', hpMult:3, atkMult:1.5, defMult:2.5, goldMult:3, expMult:2.5, gem:false },
  { name:'Fire Drake', type:'dragon', hpMult:4, atkMult:1.7, defMult:2, goldMult:4, expMult:3, gem:true },
  { name:'Chaos Knight', type:'orc', hpMult:5, atkMult:2.5, defMult:3, goldMult:5, expMult:4, gem:false },
  { name:'Void Wraith', type:'slime', hpMult:3, atkMult:3, defMult:1.5, goldMult:6, expMult:5, gem:true },
  { name:'Ancient Dragon', type:'dragon', hpMult:5, atkMult:4, defMult:3, goldMult:8, expMult:6, gem:true },
  { name:'Demon Lord', type:'dragon', hpMult:8, atkMult:4.5, defMult:4, goldMult:15, expMult:8, gem:true },
  { name:'OMEGA BEAST', type:'dragon', hpMult:10, atkMult:6, defMult:5, goldMult:30, expMult:12, gem:true },
];

// ===== WAVE SETUP =====
function getWaveEnemy() {
  const wave = G.wave;
  const typeIdx = Math.min(Math.floor((wave - 1) / 3), ENEMY_TYPES.length - 1);
  const tmpl = ENEMY_TYPES[typeIdx];
  const scale = 1 + (wave - 1) * 0.4;
  const count = Math.min(3 + Math.floor(wave / 3), 5);
  const presBonus = 1 + G.prestigeCount * 0.1;
  return {
    template: tmpl, count,
    hp: Math.floor(30 * scale * tmpl.hpMult * presBonus),
    atk: Math.floor(5 * scale * tmpl.atkMult * presBonus),
    def: Math.floor(2 * scale * tmpl.defMult * presBonus),
    gold: Math.floor(10 * scale * tmpl.goldMult * G.goldMult),
    exp: Math.floor(20 * scale * tmpl.expMult),
    gem: tmpl.gem && wave % 5 === 0,
  };
}

function setupWave() {
  const info = getWaveEnemy();
  G.currentEnemies = [];
  for (let i = 0; i < info.count; i++) {
    G.currentEnemies.push({
      id: i, name: info.template.name,
      type: info.template.type,
      hp: info.hp, maxHp: info.hp,
      atk: info.atk, def: info.def,
      gold: info.gold, exp: info.exp,
      gem: info.gem,
      alive: true,
      takingHit: false,
    });
  }
  renderArena();
  updateWaveInfo();
  addLog(`wave`, `[WAVE ${G.wave}] ${info.count}x ${info.template.name} appears!`);
}

// ===== RENDERING =====
function renderArena() {
  const container = document.getElementById('battle-entities');
  container.innerHTML = '';

  G.currentEnemies.forEach((enemy, idx) => {
    if (!enemy.alive) return;

    const el = document.createElement('div');
    el.className = 'pixel-enemy';
    el.id = `enemy-${idx}`;
    el.style.position = 'relative';

    const pct = (enemy.hp / enemy.maxHp) * 100;

    el.innerHTML = `
      <div class="enemy-hp-bar">
        <div class="enemy-hp-label">${enemy.name}</div>
        <div class="enemy-hp-track">
          <div class="enemy-hp-fill" id="ehp-${idx}" style="width:${pct}%"></div>
        </div>
      </div>
      ${getEnemyHTML(enemy.type)}
    `;
    container.appendChild(el);
  });
}

function getEnemyHTML(type) {
  if (type === 'slime') {
    return `<div class="slime-body"></div>`;
  } else if (type === 'orc') {
    return `<div class="orc-head"></div><div class="orc-body"></div>`;
  } else {
    return `<div class="dragon-head"></div><div class="dragon-body"></div>`;
  }
}

function updateHeroVisuals() {
  const h = G.hero;
  document.getElementById('hp-text').textContent = `${Math.max(0,Math.floor(h.hp))}/${Math.floor(h.maxHp)}`;
  document.getElementById('mp-text').textContent = `${Math.floor(h.mp)}/${Math.floor(h.maxMp)}`;
  document.getElementById('exp-text').textContent = `${Math.floor(h.exp)}/${Math.floor(h.expNeeded)}`;
  document.getElementById('hp-bar').style.width = `${Math.max(0,(h.hp/h.maxHp)*100)}%`;
  document.getElementById('mp-bar').style.width = `${(h.mp/h.maxMp)*100}%`;
  document.getElementById('exp-bar').style.width = `${Math.min(100,(h.exp/h.expNeeded)*100)}%`;
  document.getElementById('stat-atk').textContent = Math.floor(h.atk);
  document.getElementById('stat-def').textContent = Math.floor(h.def);
  document.getElementById('stat-spd').textContent = h.speed.toFixed(1);
  document.getElementById('stat-crit').textContent = Math.floor(h.crit) + '%';
  document.getElementById('hero-level').textContent = `LV.${h.level}`;
  document.getElementById('hero-name').textContent = h.name;
  document.getElementById('hero-class').textContent = G.classes[Math.min(Math.floor((h.level-1)/10), G.classes.length-1)];
}

function updateWaveInfo() {
  const alive = G.currentEnemies.filter(e=>e.alive).length;
  const total = G.currentEnemies.length;
  document.getElementById('wave-title').textContent = `Wave ${G.wave} - ${G.currentEnemies[0]?.name || ''}`;
  document.getElementById('enemy-count').textContent = `Enemies: ${alive}/${total}`;
  document.getElementById('wave-display').textContent = G.wave;
}

function updateResources() {
  document.getElementById('gold-display').textContent = formatNum(G.gold);
  document.getElementById('gem-display').textContent = G.gems;
  document.getElementById('prestige-display').textContent = G.prestigeCount;
}

function formatNum(n) {
  if (n >= 1e9) return (n/1e9).toFixed(2)+'B';
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return Math.floor(n).toString();
}

// ===== BATTLE LOGIC =====
let lastTime = 0;
let heroAttackAccum = 0;
let enemyAttackAccum = 0;
let regenAccum = 0;
let paused = false;

function gameLoop(ts) {
  if (!lastTime) lastTime = ts;
  const rawDt = ts - lastTime;
  lastTime = ts;
  const dt = rawDt * G.gameSpeed;

  if (!paused) {
    if (!G.hero.alive) {
      heroRespawn(dt);
    } else if (G.waveTransition) {
      G.waveTransitionTimer -= dt;
      if (G.waveTransitionTimer <= 0) {
        G.waveTransition = false;
        G.wave++;
        setupWave();
      }
    } else {
      // Regen
      autoUseSkills(dt);

      regenAccum += dt;
      if (regenAccum >= 1000) {
        regenAccum -= 1000;
        if (G.hero.regen > 0 && G.hero.hp < G.hero.maxHp) {
          G.hero.hp = Math.min(G.hero.maxHp, G.hero.hp + G.hero.regen);
          updateHeroVisuals();
        }
        // Also regen MP slowly
        if (G.hero.mp < G.hero.maxMp) {
          G.hero.mp = Math.min(G.hero.maxMp, G.hero.mp + G.hero.maxMp * 0.02);
          updateHeroVisuals();
        }
      }

      const interval = 1000 / G.hero.speed;
      heroAttackAccum += dt;
      if (heroAttackAccum >= interval) {
        heroAttackAccum = 0;
        heroAttacks();
      }

      enemyAttackAccum += dt;
      if (enemyAttackAccum >= 1800) {
        enemyAttackAccum = 0;
        enemiesAttack();
      }
    }
  }

  requestAnimationFrame(gameLoop);
}

function heroAttacks() {
  const alive = G.currentEnemies.filter(e => e.alive);
  if (!alive.length) return;

  const target = alive[0];
  let dmg = Math.max(1, G.hero.atk - target.def * 0.5);
  let isCrit = Math.random() * 100 < G.hero.crit;

  // Berserker
  if (G.skills.find(s=>s.id==='berserker')?.unlocked && G.hero.hp < G.hero.maxHp * 0.4) {
    dmg *= 1.3;
  }

  // Double Strike
  let hits = 1;
  if (G.skills.find(s=>s.id==='doubleHit')?.unlocked && Math.random() < 0.2) {
    hits = 2;
  }

  for (let h = 0; h < hits; h++) {
    let finalDmg = Math.floor(dmg * (0.85 + Math.random() * 0.3));
    if (isCrit) finalDmg = Math.floor(finalDmg * 2.2);
    finalDmg = Math.max(1, finalDmg);

    target.hp = Math.max(0, target.hp - finalDmg);
    showDmgNum(finalDmg, isCrit, false, target.id);

    // Vampiric
    if (G.skills.find(s=>s.id==='vampiric')?.unlocked) {
      const healAmt = Math.floor(finalDmg * 0.15);
      G.hero.hp = Math.min(G.hero.maxHp, G.hero.hp + healAmt);
    }

    // Animate hero
    const heroEl = document.getElementById('pixel-hero');
    if (heroEl) {
      heroEl.classList.add('attacking');
      setTimeout(() => heroEl.classList.remove('attacking'), 400);
    }

    // Animate enemy taking hit
    const enemyEl = document.getElementById(`enemy-${target.id}`);
    if (enemyEl) {
      enemyEl.classList.add('taking-hit');
      setTimeout(() => enemyEl.classList.remove('taking-hit'), 350);
    }

    // Update HP bar
    const fillEl = document.getElementById(`ehp-${target.id}`);
    if (fillEl) fillEl.style.width = `${(target.hp / target.maxHp) * 100}%`;

    if (isCrit) addLog('crit', `[CRIT!] Hero strikes ${target.name} for ${finalDmg}!`);
    else addLog('attack', `Hero attacks ${target.name} for ${finalDmg} DMG.`);

    if (target.hp <= 0) {
      killEnemy(target);
      break;
    }
  }

  updateHeroVisuals();
}

function autoUseSkills(dt) {
  if (!G.hero.alive || G.waveTransition) return;

  G.equippedSkills.forEach(skillId => {
    const skill = G.activeSkills.find(s => s.id === skillId);
    if (!skill) return;

    if (skill.lastUsed > 0) {
      skill.lastUsed -= dt;
    }

    const overlay = document.getElementById(`cd-overlay-${skill.id}`);
    const text = document.getElementById(`cd-text-${skill.id}`);
    if (overlay) {
      const pct = Math.max(0, (skill.lastUsed / skill.cooldown) * 100);
      overlay.style.height = `${pct}%`;
      if (text) text.textContent = skill.lastUsed > 0 ? Math.ceil(skill.lastUsed / 1000) : "";
    }

    if (skill.lastUsed <= 0 && G.hero.mp >= skill.mpCost) {
      executeSkill(skill);
      skill.lastUsed = skill.cooldown;
    }
  });
}

function executeSkill(skill) {
  const aliveEnemies = G.currentEnemies.filter(e => e.alive);
  if (!aliveEnemies.length) return;

  // Gunakan MP
  G.hero.mp -= skill.mpCost;
  
  // Efek visual Hero saat cast (Glow sesuai warna skill)
  const heroEl = document.getElementById('pixel-hero');
  if (heroEl) {
    heroEl.style.filter = `drop-shadow(0 0 15px ${skill.color}) brightness(1.5)`;
    heroEl.classList.add('attacking'); // Animasi gerak
    setTimeout(() => {
      heroEl.style.filter = '';
      heroEl.classList.remove('attacking');
    }, 500);
  }

  // Logika Target (Single vs AOE)
  const targets = (skill.id === 'spin' || skill.id === 'quake') ? aliveEnemies : [aliveEnemies[0]];

  targets.forEach(target => {
    // KALKULASI DAMAGE BERDASARKAN ATK
    // Rumus: (ATK Hero * Multiplier Skill) - (Setengah DEF Musuh)
    let baseDmg = (G.hero.atk * skill.dmgMult);
    
    // Variasi damage (90% - 110%) agar tidak kaku
    let finalDmg = Math.floor((baseDmg * (0.9 + Math.random() * 0.2)) - (target.def * 0.5));
    
    // Minimal damage adalah 1
    finalDmg = Math.max(1, finalDmg);
    
    target.hp = Math.max(0, target.hp - finalDmg);
    
    // Munculkan angka damage (Selalu kuning/crit style karena ini skill)
    showDmgNum(finalDmg, true, false, target.id);
    
    // Visual Feedback pada musuh (Flash warna skill)
    const enemyEl = document.getElementById(`enemy-${target.id}`);
    if (enemyEl) {
      enemyEl.style.filter = `sepia(1) saturate(5) hue-rotate(${getHue(skill.color)}deg)`;
      setTimeout(() => { enemyEl.style.filter = ''; }, 200);
    }

    // Update bar HP musuh
    const fillEl = document.getElementById(`ehp-${target.id}`);
    if (fillEl) fillEl.style.width = `${(target.hp / target.maxHp) * 100}%`;

    if (target.hp <= 0) killEnemy(target);
  });

  addLog('level', `[SKILL] ${skill.icon} ${skill.name} deals massive damage!`);
  updateHeroVisuals();
}

// Helper untuk efek warna musuh
function getHue(hex) {
  if (hex === '#ff4d4d') return 0;   // Red
  if (hex === '#4dffdb') return 180; // Teal
  if (hex === '#ff944d') return 30;  // Orange
  if (hex === '#a64dff') return 280; // Purple
  return 0;
}

function killEnemy(enemy) {
  enemy.alive = false;

  const enemyEl = document.getElementById(`enemy-${enemy.id}`);
  if (enemyEl) {
    enemyEl.classList.add('dead');
    setTimeout(() => enemyEl.remove(), 500);
    spawnParticles(enemyEl);
  }

  // Gold
  const goldGain = Math.floor(enemy.gold * G.goldMult * (G.skills.find(s=>s.id==='goldRush')?.unlocked ? 1.5 : 1));
  G.gold += goldGain;

  // Gems
  if (enemy.gem && Math.random() < 0.5) {
    G.gems++;
    showNotif(`+1 GEM!`);
  }

  // EXP
  G.hero.exp += enemy.exp;
  checkLevelUp();

  addLog('kill', `${enemy.name} defeated! +${goldGain} Gold`);
  updateWaveInfo();
  updateResources();
  renderUpgrades();

  // Check all dead
  const aliveCount = G.currentEnemies.filter(e => e.alive).length;
  if (aliveCount === 0) {
    addLog('wave', `[WAVE ${G.wave} CLEARED!] Next wave in 3s...`);
    showNotif(`Wave ${G.wave} Cleared!`);
    G.gems += Math.floor(G.wave / 5);
    G.waveTransition = true;
    G.waveTransitionTimer = 3000;
    updateResources();
  }
}

function enemiesAttack() {
  const alive = G.currentEnemies.filter(e => e.alive);
  if (!alive.length || !G.hero.alive) return;

  alive.forEach(enemy => {
    const dmg = Math.max(1, enemy.atk - G.hero.def * 0.4);
    const finalDmg = Math.floor(dmg * (0.85 + Math.random() * 0.3));
    G.hero.hp = Math.max(0, G.hero.hp - finalDmg);

    showDmgNum(finalDmg, false, true, 0);
    addLog('', `${enemy.name} attacks Hero for ${finalDmg} DMG.`);

    if (G.hero.hp <= 0) {
      heroDies();
    }
  });

  updateHeroVisuals();
}

function heroDies() {
  G.hero.alive = false;
  G.hero.hp = 0;
  addLog('wave', '[HERO FALLEN] Respawning in 5 seconds...');
  updateHeroVisuals();
}

function heroRespawn(dt) {
  G.hero.respawnTimer = (G.hero.respawnTimer || 5000) - dt;
  if (G.hero.respawnTimer <= 0) {
    G.hero.alive = true;
    G.hero.hp = G.hero.maxHp;
    G.hero.mp = G.hero.maxMp;
    G.hero.respawnTimer = 0;
    addLog('heal', '[HERO REBORN] Ready for battle!');
    updateHeroVisuals();
    setupWave();
  }
}

function checkLevelUp() {
  while (G.hero.exp >= G.hero.expNeeded) {
    G.hero.exp -= G.hero.expNeeded;
    G.hero.level++;
    G.hero.expNeeded = Math.floor(100 * Math.pow(1.35, G.hero.level - 1));

    // Base stats grow with level
    G.hero.atk += 2;
    G.hero.def += 1;
    G.hero.maxHp += 20;
    G.hero.hp = G.hero.maxHp;

    addLog('level', `[LEVEL UP!] Hero reached LV.${G.hero.level}!`);
    showNotif(`Level Up! LV.${G.hero.level}`);
    updateHeroVisuals();
  }
  updateHeroVisuals();
}

// ===== DAMAGE NUMBERS =====
function showDmgNum(dmg, isCrit, isEnemyHit, enemyId) {
  const arena = document.getElementById('battle-arena');
  const el = document.createElement('div');
  el.className = 'dmg-num' + (isCrit ? ' crit' : '') + (isEnemyHit ? ' enemy-dmg' : '');
  el.textContent = (isEnemyHit ? '-' : '') + dmg;
  el.style.left = (isEnemyHit ? '20%' : (50 + (enemyId - 1) * 25)) + '%';
  el.style.bottom = '100px';
  arena.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function spawnParticles(el) {
  const arena = document.getElementById('battle-arena');
  const rect = el.getBoundingClientRect();
  const arenaRect = arena.getBoundingClientRect();
  const cx = rect.left - arenaRect.left + rect.width / 2;
  const cy = rect.top - arenaRect.top + rect.height / 2;

  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (Math.PI * 2 * i) / 8;
    const dist = 30 + Math.random() * 30;
    p.style.cssText = `
      left:${cx}px; top:${cy}px;
      width:6px; height:6px;
      background:${['#f0c040','#f87171','#c084fc','#4ade80'][Math.floor(Math.random()*4)]};
      --tx:${Math.cos(angle)*dist}px;
      --ty:${Math.sin(angle)*dist}px;
      z-index:200;
    `;
    arena.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
}

// ===== BATTLE LOG =====
const logEl = document.getElementById('battle-log');
let logLines = 0;
function addLog(cls, msg) {
  const div = document.createElement('div');
  div.className = 'log-entry' + (cls ? ` ${cls}` : '');
  div.textContent = msg;
  logEl.appendChild(div);
  logLines++;
  if (logLines > 60) { logEl.firstChild?.remove(); logLines--; }
  logEl.scrollTop = logEl.scrollHeight;
}

// ===== UPGRADES =====
function renderUpgrades() {
  renderStatUpgrades();
  renderSkills();
  renderPrestige();
}

function getUpgradeStat(up) {
  const baseVal = up.extra ? (up.stat === 'goldMult' ? G.goldMult : G.regen) : G.hero[up.stat];
  return baseVal;
}

function renderStatUpgrades() {
  const container = document.getElementById('tab-stats');
  container.innerHTML = '';

  G.upgrades.forEach(up => {
    const cost = Math.floor(up.cost * Math.pow(up.costMult, up.level));
    const canAfford = G.gold >= cost;
    const isMax = up.level >= up.max;
    const pct = (up.level / up.max) * 100;
    const curVal = up.base + up.inc * up.level;

    const card = document.createElement('div');
    card.className = 'upgrade-card' + (isMax ? ' maxed' : '');
    card.innerHTML = `
      <div class="upgrade-header">
        <div class="upgrade-icon" style="background:${up.color}22; border-color:${up.color}44;">
          ${getSVGIcon(up.icon, up.color)}
        </div>
        <div class="upgrade-name">${up.name}</div>
        <div class="upgrade-level-badge">LV ${up.level}</div>
      </div>
      <div class="upgrade-body">
        <div class="upgrade-desc">${up.desc}</div>
        <div class="upgrade-current">Current: ${formatStatVal(up, curVal)}</div>
        <div class="upgrade-progress">
          <div class="upgrade-progress-fill" style="width:${pct}%;background:linear-gradient(90deg,${up.color}88,${up.color});"></div>
        </div>
        <button class="upgrade-btn" onclick="buyUpgrade('${up.id}')" ${isMax || !canAfford ? 'disabled' : ''}>
          ${isMax ? 'MAX LEVEL' : 'UPGRADE'}
        </button>
        ${!isMax ? `<div class="upgrade-cost">${formatNum(cost)} Gold</div>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

function formatStatVal(up, val) {
  if (up.id === 'spd') return val.toFixed(2) + ' atk/s';
  if (up.id === 'crit') return Math.floor(val) + '%';
  if (up.id === 'gold') return 'x' + val.toFixed(1);
  if (up.id === 'regen') return Math.floor(val) + ' HP/s';
  return Math.floor(val);
}

function buyUpgrade(id) {
  const up = G.upgrades.find(u => u.id === id);
  if (!up || up.level >= up.max) return;

  const cost = Math.floor(up.cost * Math.pow(up.costMult, up.level));
  if (G.gold < cost) { showNotif('Not enough Gold!'); return; }

  G.gold -= cost;
  up.level++;

  const newVal = up.base + up.inc * up.level;

  if (up.extra) {
    if (up.stat === 'goldMult') G.goldMult = newVal;
    else if (up.stat === 'regen') G.hero.regen = newVal;
  } else {
    G.hero[up.stat] = newVal;
  }

  // Keep HP valid
  if (up.stat === 'maxHp' && G.hero.hp > G.hero.maxHp) G.hero.hp = G.hero.maxHp;
  if (up.stat === 'maxMp' && G.hero.mp > G.hero.maxMp) G.hero.mp = G.hero.maxMp;

  addLog('heal', `[UPGRADE] ${up.name} -> LV.${up.level}!`);
  updateHeroVisuals();
  updateResources();
  renderUpgrades();
}

function renderSkills() {
  const container = document.getElementById('tab-skills');
  container.innerHTML = `
    <div class="equip-slots" style="display:flex; gap:10px; margin-bottom:20px; justify-content:center; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px;">
      ${[0,1,2].map(i => {
        const sId = G.equippedSkills[i];
        const s = G.activeSkills.find(sk => sk.id === sId);
        return `
          <div class="slot" onclick="unequipSkill(${i})" style="width:50px; height:50px; border:2px dashed #444; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative;">
            ${s ? `<span title="Click to Unequip">${s.icon}</span>` : '<span style="font-size:10px; color:#666;">EMPTY</span>'}
          </div>
        `;
      }).join('')}
    </div>
    <div id="skills-list"></div>
  `;

  const list = document.getElementById('skills-list');
  G.activeSkills.forEach(skill => {
    const isEquipped = G.equippedSkills.includes(skill.id);
    const card = document.createElement('div');
    card.className = 'skill-card' + (skill.unlocked ? ' unlocked' : '');
    
    card.innerHTML = `
      <div class="skill-icon" style="font-size:20px;">${skill.unlocked ? skill.icon : '🔒'}</div>
      <div class="skill-info">
        <div class="skill-name">${skill.name}</div>
        <div class="skill-desc">${skill.desc} (Cost: ${skill.mpCost} Mana)</div>
      </div>
      ${skill.unlocked 
        ? `<button onclick="toggleEquip('${skill.id}')" class="upgrade-btn" style="width:auto; font-size:10px;">
            ${isEquipped ? 'UNEQUIP' : 'EQUIP'}
           </button>`
        : `<button onclick="unlockSkill('${skill.id}')" class="upgrade-btn" style="width:auto; font-size:10px;">
            (${skill.cost} Gems)
           </button>`
      }
    `;
    list.appendChild(card);
  });
}

function renderEquippedSkills() {
  const container = document.getElementById('equipped-skills-slots');
  if (!container) return; // Guard clause jika ID tidak ditemukan
  
  container.innerHTML = '';

  for (let i = 0; i < 3; i++) {
    const skillId = G.equippedSkills[i];
    const skill = G.activeSkills.find(s => s.id === skillId);
    const slot = document.createElement('div');
    
    if (skill) {
      slot.className = 'skill-slot active';
      slot.id = `slot-${skill.id}`;
      slot.innerHTML = `
        <span class="skill-icon">${skill.icon}</span>
        <div class="cooldown-overlay" id="cd-overlay-${skill.id}"></div>
        <div class="cooldown-text" id="cd-text-${skill.id}"></div>
      `;
    } else {
      slot.className = 'skill-slot empty';
      slot.innerHTML = '<span style="font-size:8px; color:#444;">EMPTY</span>';
    }
    container.appendChild(slot);
  }
}

function toggleEquip(id) {
  const idx = G.equippedSkills.indexOf(id);
  if (idx > -1) {
    G.equippedSkills.splice(idx, 1);
  } else {
    if (G.equippedSkills.length >= 3) {
      showNotif("Max 3 Skills Equipped!");
      return;
    }
    G.equippedSkills.push(id);
  }
  renderSkills(); // Update tab skill
  renderEquippedSkills(); // Update panel hero
}

// EQUIP LOGC
function unequipSkill(index) {
  if (G.equippedSkills[index]) {
    G.equippedSkills.splice(index, 1);
    renderSkills();
  }
}

function unlockSkill(id) {
  const skill = G.activeSkills.find(s => s.id === id);
  if (G.gems >= skill.cost) {
    G.gems -= skill.cost;
    skill.unlocked = true;
    updateResources();
    renderSkills();
    showNotif(`${skill.name} Unlocked!`);
  } else {
    showNotif("Not enough Gems!");
  }
}

// END LOGIC

function buySkill(id) {
  const skill = G.skills.find(s => s.id === id);
  if (!skill || skill.unlocked) return;
  if (G.gems < skill.cost) { showNotif('Not enough Gems!'); return; }
  G.gems -= skill.cost;
  skill.unlocked = true;
  addLog('level', `[SKILL] ${skill.name} unlocked!`);
  showNotif(`${skill.name} Unlocked!`);
  updateResources();
  renderUpgrades();
}

function renderPrestige() {
  const container = document.getElementById('tab-prestige');
  container.innerHTML = '';

  const reqWave = 10 + G.prestigeCount * 5;
  const canPrestige = G.wave >= reqWave;

  const p = document.createElement('div');
  p.className = 'prestige-panel';
  p.innerHTML = `
    <div class="prestige-title">PRESTIGE</div>
    <div class="prestige-desc">
      Reset your progress and gain a permanent power bonus. All stats and upgrades reset, but you keep Gems.
    </div>
    <div class="prestige-bonus">
      Current Bonus: +${(G.prestigeCount * 30)}% All Stats<br><br>
      Next Bonus: +${((G.prestigeCount+1) * 30)}% All Stats<br><br>
      Required: Wave ${reqWave}
    </div>
    <button class="prestige-btn" onclick="doPrestige()" ${canPrestige ? '' : 'disabled'}>
      ${canPrestige ? 'PRESTIGE NOW' : 'Reach Wave ' + reqWave}
    </button>
  `;
  container.appendChild(p);

  if (G.prestigeCount > 0) {
    const info = document.createElement('div');
    info.style.padding = '10px 14px';
    info.innerHTML = `
      <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#60a5fa;margin-bottom:6px;">PRESTIGE HISTORY</div>
      <div style="font-size:12px;color:var(--text-dim);">
        Prestige count: <strong style="color:var(--gold);">${G.prestigeCount}</strong><br>
        Permanent stat bonus: <strong style="color:#60a5fa;">+${G.prestigeCount * 30}%</strong>
      </div>
    `;
    container.appendChild(info);
  }
}

function doPrestige() {
  const reqWave = 10 + G.prestigeCount * 5;
  if (G.wave < reqWave) return;

  G.prestigeCount++;
  G.prestigeBonus = 1 + G.prestigeCount * 0.30;

  // Reset
  G.gold = 0;
  G.wave = 1;
  G.goldMult = 1;

  // Reset upgrades
  G.upgrades.forEach(up => { up.level = 0; });
  G.skills.forEach(s => { s.unlocked = false; });

  // Reset hero with prestige bonus
  G.hero = {
    name: 'Arno Legend', level: 1,
    hp: Math.floor(100 * G.prestigeBonus),
    maxHp: Math.floor(100 * G.prestigeBonus),
    mp: 100, maxMp: 100,
    mpRegen: 5,
    atk: Math.floor(10 * G.prestigeBonus),
    def: Math.floor(5 * G.prestigeBonus),
    speed: 1.0, crit: 5,
    exp: 0, expNeeded: 100,
    alive: true, respawnTimer: 0,
    regen: 0, goldMult: 1,
  };

  G.upgrades.forEach(up => {
    up.level = 0; // Reset level upgrade ke 0
    
    // Kalikan base awal dengan prestige bonus
    // Atk: 10 * 1.3 = 13. Sekarang base upgrade-nya adalah 13.
    if (up.id === 'atk') up.base = Math.floor(10 * G.prestigeBonus);
    if (up.id === 'def') up.base = Math.floor(5 * G.prestigeBonus);
    if (up.id === 'hp')  up.base = Math.floor(100 * G.prestigeBonus);
    if (up.id === 'speed') up.base = Math.floor(1.0 * G.prestigeBonus);
    // if (up.id === 'speed') up.base = Math.floor(1.0 * G.prestigeBonus );
  });

  setupWave();
  updateHeroVisuals();
  updateResources();
  renderUpgrades();
  addLog('level', `[PRESTIGE ${G.prestigeCount}] Power reborn! Bonus: +${G.prestigeCount*10}%`);
  showNotif(`Prestige ${G.prestigeCount}! +${G.prestigeCount*30}% Stats`);
}

// ===== TABS =====
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', ['stats','skills','prestige'][i] === tab);
  });
  document.querySelectorAll('.tab-content').forEach((c) => {
    c.classList.remove('active');
  });
  document.getElementById(`tab-${tab}`).classList.add('active');
}

// ===== SPEED =====
function setSpeed(s) {
  G.gameSpeed = s;
  document.getElementById('speed-1x').classList.toggle('active', s===1);
  document.getElementById('speed-2x').classList.toggle('active', s===2);
  document.getElementById('speed-4x').classList.toggle('active', s===4);
}

// ===== NOTIFICATION =====
let notifTimer = null;
function showNotif(msg) {
  const el = document.getElementById('notification');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ===== SVG ICONS =====
function getSVGIcon(name, color='currentColor') {
  const icons = {
    sword: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M2 2l20 20"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    droplet: `<svg viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
    zap: `<svg viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    target: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    coins: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  };
  return icons[name] || icons['sword'];
}

// ===== INIT =====
function init() {
  setupWave();
  updateHeroVisuals();
  updateResources();
  renderUpgrades();
  renderEquippedSkills();
  requestAnimationFrame(gameLoop);
}

init();