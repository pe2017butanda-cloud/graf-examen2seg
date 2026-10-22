/* =====================================================================
   TURNO DE NOCHE: CASA DE LA RISA — Videojuego 2D en canvas
   Reglas: 25 animatrónicos siempre presentes, 4 tipos de movimiento
   (arriba, abajo, diagonal, circular), aparecen/desaparecen al azar,
   velocidades distintas, rebote con animación de choque, clic para
   desactivarlos (se reinician en otra zona), contador, música y efectos.
   Estética: monitor de cámaras de seguridad (estática, scanlines, REC).
   ===================================================================== */
(() => {
  'use strict';

  /* ------------------------- CONFIGURACIÓN ------------------------- */
  const CFG = {
    TOTAL: 25,                  // objetos siempre presentes en el canvas
    W: 960, H: 600,            // resolución interna del canvas
    fondo: 'assets/background.jpg',
    // Personajes originales. "emoji" solo se usa si falta la imagen.
    // Puedes poner tus propias imágenes en assets/ con estos nombres.
    objetos: [
      { src: 'assets/freddy.png',        brillo: '#ff3b3b' },
      { src: 'assets/bonnie.png',        brillo: '#394dff' },
      { src: 'assets/chica.png',         brillo: '#ffb627' },
      { src: 'assets/puppet.png',        brillo: '#ff7ad9' },
      { src: 'assets/springtrap.png',    brillo: '#1d8846' },
      { src: 'assets/foxy.png',          brillo: '#ff2a2a' },
    ],
    sfx: { clic: 'assets/clic.mp3', choque: 'assets/choque.mp3' },
    velMin: 50, velMax: 190,   // px/s (cada objeto tiene la suya)
    tamMin: 54, tamMax: 88,    // tamaño en px
    colores: ['#ffb627', '#ffe066', '#39ff88', '#ff3b3b', '#ffffff'] // chispas eléctricas
  };

  /* ---------------------------- UTILIDADES ------------------------- */
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const listo = img => img && img.complete && img.naturalWidth > 0;
  const dos = n => String(n).padStart(2, '0');

  /* ------------------------------ DOM ------------------------------ */
  const lienzo = document.getElementById('lienzo');
  const ctx = lienzo.getContext('2d');
  const elContador = document.getElementById('contador');
  const pantallaInicio = document.getElementById('pantallaInicio');
  const btnIniciar = document.getElementById('btnIniciar');
  const btnSonido = document.getElementById('btnSonido');
  const rangoVolumen = document.getElementById('volumen');
  const musica = document.getElementById('musica');
  const { W, H } = CFG;

  /* ------------------------- CARGA DE IMÁGENES --------------------- */
  CFG.objetos.forEach(d => { d.img = new Image(); d.img.src = d.src; });
  const imgFondo = new Image();
  imgFondo.src = CFG.fondo;

  /* ------------------------------ AUDIO ---------------------------- */
  const sfx = {};
  Object.keys(CFG.sfx).forEach(k => {
    sfx[k] = new Audio(CFG.sfx[k]);
    sfx[k].preload = 'auto';
  });
  let silencio = false;
  let ultimoChoque = 0;

  function sonar(nombre, vol = 0.6, velocidad = 1) {
    if (silencio || !sfx[nombre]) return;
    const a = sfx[nombre].cloneNode();
    a.volume = Math.max(0, Math.min(1, vol));
    a.playbackRate = velocidad * rand(0.92, 1.08);
    a.play().catch(() => {});
  }

  musica.volume = parseFloat(rangoVolumen.value);
  rangoVolumen.addEventListener('input', () => { musica.volume = parseFloat(rangoVolumen.value); });

  btnSonido.addEventListener('click', () => {
    silencio = !silencio;
    musica.muted = silencio;
    btnSonido.textContent = silencio ? 'Activar sonido' : 'Silenciar';
  });

  document.addEventListener('visibilitychange', () => {
    if (!jugando) return;
    if (document.hidden) musica.pause();
    else if (!silencio) musica.play().catch(() => {});
  });

  /* ------------------------------ ESTADO --------------------------- */
  const objetos = [];
  const particulas = [];
  const anillos = [];
  const textos = [];
  let clics = 0;
  let jugando = false;
  let sacudida = 0;
  let apagon = 0;              // parpadeo de luz (antes: relámpago)
  let proxApagon = rand(5, 12);
  let tiempo = 0;
  let tiempoJuego = 0;         // segundos de turno (para el reloj)
  const raton = { x: -999, y: -999, dentro: false };
  let hover = null;

  /* ------------------------ CREACIÓN DE OBJETOS -------------------- */
  // modo 'azar'  -> aparece con fundido en un punto libre al azar
  // modo 'borde' -> entra por el borde del canvas siguiendo su dirección
  function asignar(o, opc = {}) {
    const modo = opc.modo || 'azar';
    o.def = pick(CFG.objetos);
    o.tam = rand(CFG.tamMin, CFG.tamMax);
    o.r = o.tam * 0.42;
    o.vel = rand(CFG.velMin, CFG.velMax);
    o.tipo = pick(['arriba', 'abajo', 'diagonal', 'circular']);

    let ang;
    switch (o.tipo) {
      case 'arriba':   ang = -Math.PI / 2 + rand(-0.12, 0.12); break;
      case 'abajo':    ang =  Math.PI / 2 + rand(-0.12, 0.12); break;
      case 'diagonal': ang = pick([1, 3, 5, 7]) * Math.PI / 4 + rand(-0.1, 0.1); break;
      default:         ang = rand(0, Math.PI * 2);
    }
    o.vx = Math.cos(ang) * o.vel;
    o.vy = Math.sin(ang) * o.vel;
    o.omega = o.tipo === 'circular' ? pick([-1, 1]) * rand(0.7, 1.8) : 0;
    o.vida = rand(7, 16);
    o.fase = rand(0, Math.PI * 2);
    o.bamb = rand(1.5, 3.5);

    if (modo === 'borde') {
      const pesoH = Math.abs(o.vx) / (Math.abs(o.vx) + Math.abs(o.vy));
      if (Math.random() < pesoH) {
        o.x = o.vx > 0 ? -o.r : W + o.r;
        o.y = rand(o.r, H - o.r);
      } else {
        o.y = o.vy > 0 ? -o.r : H + o.r;
        o.x = rand(o.r, W - o.r);
      }
      o.alpha = 1;
      o.estado = 'vivo';
    } else {
      let ok = false;
      for (let i = 0; i < 40 && !ok; i++) {
        o.x = rand(o.r, W - o.r);
        o.y = rand(o.r, H - o.r);
        ok = true;
        if (opc.evitar && Math.hypot(o.x - opc.evitar.x, o.y - opc.evitar.y) < 200) ok = false;
        for (const otro of objetos) {
          if (otro !== o && Math.hypot(o.x - otro.x, o.y - otro.y) < o.r + otro.r + 8) { ok = false; break; }
        }
      }
      o.alpha = 0;
      o.estado = 'entrando';
    }
  }

  function crearObjetos() {
    for (let i = 0; i < CFG.TOTAL; i++) {
      const o = {};
      asignar(o, { modo: 'azar' });
      o.alpha = rand(0, 1);
      o.estado = 'entrando';
      objetos.push(o);
    }
  }

  /* ----------------------------- EFECTOS --------------------------- */
  function chispas(x, y, n, vmax = 260) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(60, vmax);
      particulas.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        vida: rand(0.3, 0.8), max: 0.8,
        tam: rand(1.5, 4), color: pick(CFG.colores), grav: rand(0, 160)
      });
    }
  }
  const anillo = (x, y, color, rmax) => anillos.push({ x, y, t: 0, dur: 0.45, rmax, color });
  const texto = (x, y, txt, color, tam) => textos.push({ x, y, txt, color, tam, t: 0, dur: 0.8 });
  const sacudir = n => { sacudida = Math.min(10, Math.max(sacudida, n)); };

  function efectoChoque(x, y, fuerza) {
    anillo(x, y, '#ffb627', 28 + fuerza * 0.18);
    chispas(x, y, 12);
    if (Math.random() < 0.6) texto(x, y - 10, pick(['¡CLANG!', '¡ZAP!', '¡CRASH!', '¡BZZT!']), '#ffb627', rand(24, 34));
    sacudir(Math.min(5, fuerza * 0.025));
    const ahora = performance.now();
    if (ahora - ultimoChoque > 90) {
      ultimoChoque = ahora;
      sonar('choque', Math.min(1, 0.3 + fuerza / 300), rand(0.9, 1.15));
    }
  }

  function efectoCaptura(x, y, color) {
    chispas(x, y, 30, 340);
    anillo(x, y, color, 70);
    anillo(x, y, '#ffffff', 40);
    texto(x, y - 20, '+1', '#39ff88', 38);
    sacudir(4);
  }

  /* ---------------------------- COLISIONES ------------------------- */
  function colisiones() {
    for (let i = 0; i < objetos.length; i++) {
      const a = objetos[i];
      if (a.alpha < 0.7) continue;
      for (let j = i + 1; j < objetos.length; j++) {
        const b = objetos[j];
        if (b.alpha < 0.7) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const min = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) continue;

        const d = Math.sqrt(d2);
        const nx = dx / d, ny = dy / d;
        const sol = (min - d) / 2;
        a.x -= nx * sol; a.y -= ny * sol;
        b.x += nx * sol; b.y += ny * sol;
        const vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (vn > 0) {
          a.vx -= vn * nx; a.vy -= vn * ny;
          b.vx += vn * nx; b.vy += vn * ny;
          const cx = a.x + nx * a.r, cy = a.y + ny * a.r;
          if (cx > 0 && cx < W && cy > 0 && cy < H) efectoChoque(cx, cy, vn);
        }
      }
    }
  }

  /* ----------------------------- ACTUALIZAR ------------------------ */
  function actualizar(dt) {
    tiempo += dt;
    if (jugando) tiempoJuego += dt;

    for (const o of objetos) {
      if (o.estado === 'entrando') {
        o.alpha = Math.min(1, o.alpha + dt * 2.2);
        if (o.alpha >= 1) o.estado = 'vivo';
      } else if (o.estado === 'vivo') {
        o.vida -= dt;
        if (o.vida <= 0) o.estado = 'saliendo';
      } else {
        o.alpha -= dt * 2.2;
        if (o.alpha <= 0) { asignar(o, { modo: 'azar' }); continue; }
      }

      if (o.omega) {
        const c = Math.cos(o.omega * dt), s = Math.sin(o.omega * dt);
        const vx = o.vx * c - o.vy * s;
        o.vy = o.vx * s + o.vy * c;
        o.vx = vx;
      }
      o.x += o.vx * dt;
      o.y += o.vy * dt;

      if (o.tipo === 'circular') {
        if (o.x < o.r)     { o.x = o.r;     o.vx =  Math.abs(o.vx); }
        if (o.x > W - o.r) { o.x = W - o.r; o.vx = -Math.abs(o.vx); }
        if (o.y < o.r)     { o.y = o.r;     o.vy =  Math.abs(o.vy); }
        if (o.y > H - o.r) { o.y = H - o.r; o.vy = -Math.abs(o.vy); }
      } else {
        const m = o.tam;
        if ((o.y > H + m && o.vy > 0) || (o.y < -m && o.vy < 0) ||
            (o.x > W + m && o.vx > 0) || (o.x < -m && o.vx < 0)) {
          asignar(o, { modo: 'borde' });
        }
      }
    }

    colisiones();

    hover = null;
    if (jugando && raton.dentro) {
      for (let i = objetos.length - 1; i >= 0; i--) {
        const o = objetos[i];
        if (o.alpha > 0.3 && Math.hypot(raton.x - o.x, raton.y - o.y) < o.r * 1.15) { hover = o; break; }
      }
    }

    for (let i = particulas.length - 1; i >= 0; i--) {
      const p = particulas[i];
      p.vida -= dt;
      if (p.vida <= 0) { particulas.splice(i, 1); continue; }
      p.vy += p.grav * dt;
      p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (let i = anillos.length - 1; i >= 0; i--) {
      anillos[i].t += dt;
      if (anillos[i].t >= anillos[i].dur) anillos.splice(i, 1);
    }
    for (let i = textos.length - 1; i >= 0; i--) {
      textos[i].t += dt;
      textos[i].y -= 40 * dt;
      if (textos[i].t >= textos[i].dur) textos.splice(i, 1);
    }

    // fallos de luz ocasionales
    proxApagon -= dt;
    if (proxApagon <= 0) { apagon = 1; proxApagon = rand(6, 14); }
    apagon = Math.max(0, apagon - dt * 1.6);
    sacudida *= Math.exp(-dt * 8);
  }

  /* ------------------------------ DIBUJAR -------------------------- */
  // Viñeta de monitor
  const vineta = document.createElement('canvas');
  vineta.width = W; vineta.height = H;
  (() => {
    const c = vineta.getContext('2d');
    const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.8)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  })();

  // Líneas de escaneo precalculadas
  const lineas = document.createElement('canvas');
  lineas.width = W; lineas.height = H;
  (() => {
    const c = lineas.getContext('2d');
    c.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
  })();

  // Ruido de estática precalculado (se reutiliza con desplazamiento aleatorio)
  const ruido = document.createElement('canvas');
  ruido.width = 256; ruido.height = 256;
  (() => {
    const c = ruido.getContext('2d');
    const im = c.createImageData(256, 256);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = Math.random() * 255;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
      im.data[i + 3] = 255;
    }
    c.putImageData(im, 0, 0);
  })();

  function dibujarFondo() {
    ctx.fillStyle = '#050807';
    ctx.fillRect(-20, -20, W + 40, H + 40);
    if (listo(imgFondo)) {
      const s = Math.max(W / imgFondo.naturalWidth, H / imgFondo.naturalHeight);
      const w = imgFondo.naturalWidth * s, h = imgFondo.naturalHeight * s;
      ctx.drawImage(imgFondo, (W - w) / 2, (H - h) / 2, w, h);
    } else {
      // Respaldo: pared oscura y piso ajedrezado
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0a1410');
      g.addColorStop(1, '#16221c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const t = 60, yPiso = H * 0.62;
      for (let y = yPiso; y < H; y += t) {
        for (let x = 0; x < W; x += t) {
          if (((x / t) + ((y - yPiso) / t)) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(x, y, t, t);
          }
        }
      }
    }
    // haz de luz de emergencia que oscila
    const x = (Math.sin(tiempo * 0.35) * 0.5 + 0.5) * W;
    const g = ctx.createRadialGradient(x, H * 0.2, 10, x, H * 0.2, 420);
    g.addColorStop(0, 'rgba(255,230,160,0.10)');
    g.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function dibujarObjeto(o) {
    const d = o.def;
    const escala = 0.6 + 0.4 * o.alpha;
    ctx.save();
    ctx.globalAlpha = o.alpha;
    ctx.translate(o.x, o.y);
    ctx.rotate(Math.sin(tiempo * o.bamb + o.fase) * 0.25);
    ctx.scale(escala, escala);
    ctx.shadowColor = d.brillo;
    ctx.shadowBlur = 16;
    if (listo(d.img)) {
      const s = o.tam / Math.max(d.img.naturalWidth, d.img.naturalHeight);
      const w = d.img.naturalWidth * s, h = d.img.naturalHeight * s;
      ctx.drawImage(d.img, -w / 2, -h / 2, w, h);
    } else {
      ctx.font = `${o.tam * 0.85}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.emoji, 0, 0);
    }
    ctx.restore();
  }

  // Mira tipo cámara de seguridad sobre el objetivo
  function dibujarHover(o) {
    const r = o.r * 1.4;
    const l = r * 0.45;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.strokeStyle = '#39ff88';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#39ff88';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.moveTo(sx * r, sy * (r - l));
      ctx.lineTo(sx * r, sy * r);
      ctx.lineTo(sx * (r - l), sy * r);
    }
    ctx.stroke();
    ctx.restore();
  }

  function dibujarHUD() {
    // Indicador REC parpadeante
    ctx.save();
    ctx.font = '26px VT323, monospace';
    ctx.textBaseline = 'middle';
    if (Math.floor(tiempo * 1.2) % 2 === 0) {
      ctx.fillStyle = '#e8202a';
      ctx.shadowColor = '#e8202a';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(34, 34, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d8ffe6';
    ctx.textAlign = 'left';
    ctx.fillText('REC', 52, 35);
    ctx.fillText('CAM 03 · OFICINA DE SEGURIDAD', 24, H - 26);

    // Reloj del turno: 12 AM -> 6 AM (cada hora dura 45 s)
    const hora = Math.min(6, Math.floor(tiempoJuego / 45));
    const horaTxt = hora === 0 ? 12 : hora;
    ctx.textAlign = 'right';
    ctx.fillText(`${dos(horaTxt)}:${dos(Math.floor((tiempoJuego % 45) / 45 * 60))} AM`, W - 24, 35);
    ctx.fillText(`ANIMATRÓNICOS: ${objetos.length}`, W - 24, H - 26);
    ctx.restore();
  }

  function dibujar() {
    ctx.save();
    if (sacudida > 0.05) ctx.translate(rand(-sacudida, sacudida), rand(-sacudida, sacudida));

    dibujarFondo();

    for (const o of objetos) dibujarObjeto(o);
    if (hover) dibujarHover(hover);

    for (const a of anillos) {
      const p = a.t / a.dur;
      ctx.save();
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 4 * (1 - p) + 1;
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.rmax * Math.sqrt(p), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const p of particulas) {
      ctx.globalAlpha = Math.max(0, p.vida / p.max);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.tam, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    for (const t of textos) {
      const p = t.t / t.dur;
      const esc = p < 0.2 ? 0.5 + p * 2.5 : 1;
      ctx.save();
      ctx.globalAlpha = 1 - p * p;
      ctx.translate(t.x, t.y);
      ctx.scale(esc, esc);
      ctx.font = `${t.tam}px VT323, monospace`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#000';
      ctx.strokeText(t.txt, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.txt, 0, 0);
      ctx.restore();
    }

    ctx.restore();

    // Capas de monitor (sin sacudida): tinte verde, estática, scanlines, viñeta
    ctx.fillStyle = 'rgba(20,60,35,0.10)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.06 + apagon * 0.18;
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(ruido, Math.floor(rand(-256, 0)), Math.floor(rand(-256, 0)), W + 512, H + 512);
    ctx.restore();

    ctx.drawImage(lineas, 0, 0);
    ctx.drawImage(vineta, 0, 0);

    // banda de interferencia que baja por la pantalla
    const yb = ((tiempo * 70) % (H + 120)) - 60;
    ctx.fillStyle = 'rgba(180,255,210,0.035)';
    ctx.fillRect(0, yb, W, 40);

    // fallo de luz: oscurece de golpe con parpadeo
    if (apagon > 0) {
      const flick = Math.sin(apagon * 40) > 0 ? 0.55 : 0.15;
      ctx.fillStyle = `rgba(0,0,0,${apagon * flick})`;
      ctx.fillRect(0, 0, W, H);
    }

    dibujarHUD();
  }

  /* --------------------------- BUCLE PRINCIPAL --------------------- */
  let anterior = performance.now();
  function bucle(ahora) {
    const dt = Math.min((ahora - anterior) / 1000, 0.05);
    anterior = ahora;
    actualizar(dt);
    dibujar();
    requestAnimationFrame(bucle);
  }

  /* ------------------------------ ENTRADA -------------------------- */
  function posicion(e) {
    const b = lienzo.getBoundingClientRect();
    return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height };
  }

  lienzo.addEventListener('pointermove', e => {
    const p = posicion(e);
    raton.x = p.x; raton.y = p.y; raton.dentro = true;
    if (jugando && Math.random() < 0.4) {      // estela de chispas verdes
      particulas.push({
        x: p.x, y: p.y, vx: rand(-30, 30), vy: rand(-40, 10),
        vida: 0.4, max: 0.4, tam: rand(1.5, 2.8), color: pick(['#39ff88', '#d8ffe6']), grav: 0
      });
    }
  });
  lienzo.addEventListener('pointerleave', () => { raton.dentro = false; });

  lienzo.addEventListener('pointerdown', e => {
    if (!jugando) return;
    const p = posicion(e);
    raton.x = p.x; raton.y = p.y; raton.dentro = true;

    let blanco = null;
    for (let i = objetos.length - 1; i >= 0; i--) {
      const o = objetos[i];
      if (o.alpha > 0.3 && Math.hypot(p.x - o.x, p.y - o.y) < o.r * 1.15) { blanco = o; break; }
    }

    if (blanco) {
      clics++;
      elContador.textContent = clics;
      elContador.classList.remove('sube');
      void elContador.offsetWidth;
      elContador.classList.add('sube');
      efectoCaptura(blanco.x, blanco.y, blanco.def.brillo);
      sonar('clic', 0.5);
      // se elimina y reaparece en otra zona: siempre quedan 25
      asignar(blanco, { modo: 'azar', evitar: { x: p.x, y: p.y } });
    } else {
      anillo(p.x, p.y, '#e8202a', 30);           // clic en vacío
    }
  });

  /* ------------------------------ INICIO --------------------------- */
  btnIniciar.addEventListener('click', () => {
    jugando = true;
    pantallaInicio.classList.add('oculta');
    musica.play().catch(() => {});
  });

  crearObjetos();
  requestAnimationFrame(bucle);
})();