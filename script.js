// ==========================================
// 1. MENU MOBILE RESPONSIVO
// ==========================================
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        if (navMenu.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }
    });

    document.querySelectorAll('.nav-list a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const icon = hamburger.querySelector('i');
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        });
    });
}

// ==========================================
// 2. FORMULÁRIO DE CONTATO (WHATSAPP)
// ==========================================
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameEl = document.getElementById('name');
        const emailEl = document.getElementById('email');
        const projectTypeEl = document.getElementById('projectType');
        const messageEl = document.getElementById('message');

        if (!nameEl || !emailEl || !projectTypeEl || !messageEl) return;

        const name = nameEl.value.trim();
        const email = emailEl.value.trim();
        const projectType = projectTypeEl.value.trim();
        const message = messageEl.value.trim();

        if (!name || !email || !projectType || !message) {
            alert('Por favor, preencha todos os campos antes de enviar.');
            return;
        }

        // ⚠️ Substitua abaixo pelo seu número de WhatsApp com DDI e DDD (ex: 5581999999999)
        const seuNumeroWhatsApp = "5581999999999"; 

        const textoMensagem = `*Olá, Forjex! Vim através do site institucional.*%0A%0A` +
                              `*Nome:* ${encodeURIComponent(name)}%0A` +
                              `*E-mail:* ${encodeURIComponent(email)}%0A` +
                              `*O que deseja:* ${encodeURIComponent(projectType)}%0A` +
                              `*Detalhes:* ${encodeURIComponent(message)}`;

        const urlWhatsApp = `https://wa.me/${seuNumeroWhatsApp}?text=${textoMensagem}`;
        window.open(urlWhatsApp, '_blank');
    });
}

// ==========================================
// 3. MOTOR WEBGL: PARTICLE DRIFT
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false, premultipliedAlpha: true });
    if (!gl) {
        console.error("ParticleDrift: WebGL indisponível");
        return;
    }

    const MAX_DPR = 2;
    const MAX_LINES = 4000;
    const EDGE = 20;

    const LINE_VERT = `
        precision highp float;
        attribute vec2 a_p0;
        attribute vec2 a_p1;
        attribute vec2 a_corner;
        attribute vec3 a_shade;
        uniform vec2 uSize;
        varying float v_alpha;
        varying float v_mix;
        varying float v_off;
        varying float v_half;
        void main(){
            vec2 d = a_p1 - a_p0;
            float len = max(length(d), 1e-5);
            vec2 nrm = vec2(-d.y, d.x) / len;
            float half_ = max(a_shade.z * 0.5, 0.35);
            float ext = half_ + 0.75;
            vec2 p = mix(a_p0, a_p1, a_corner.x);
            p += nrm * a_corner.y * ext;
            v_alpha = a_shade.x;
            v_mix = a_shade.y;
            v_off = a_corner.y * ext;
            v_half = half_;
            gl_Position = vec4(p.x / uSize.x * 2.0 - 1.0, 1.0 - p.y / uSize.y * 2.0, 0.0, 1.0);
        }
    `;

    const LINE_FRAG = `
        precision mediump float;
        uniform vec3 uBase, uAccent;
        varying float v_alpha;
        varying float v_mix;
        varying float v_off;
        varying float v_half;
        void main(){
            float cov = clamp((v_half - abs(v_off)) / 0.75 + 0.5, 0.0, 1.0);
            float a = v_alpha * cov;
            vec3 col = mix(uBase, uAccent, v_mix);
            gl_FragColor = vec4(col * a, a);
        }
    `;

    const DOT_VERT = `
        precision highp float;
        attribute vec2 a_pos;
        attribute float a_lit;
        uniform vec2 uSize;
        uniform float uDpr, uDot;
        varying float v_lit;
        void main(){
            gl_PointSize = max(1.0, uDot * uDpr);
            v_lit = a_lit;
            gl_Position = vec4(a_pos.x / uSize.x * 2.0 - 1.0, 1.0 - a_pos.y / uSize.y * 2.0, 0.0, 1.0);
        }
    `;

    const DOT_FRAG = `
        precision mediump float;
        uniform vec3 uBase, uAccent;
        uniform float uRestAlpha;
        varying float v_lit;
        void main(){
            float d = length(gl_PointCoord - 0.5) * 2.0;
            float disc = 1.0 - smoothstep(0.72, 1.0, d);
            vec3 col = mix(uBase, uAccent, v_lit);
            float a = disc * mix(uRestAlpha, 1.0, v_lit);
            if (a <= 0.004) discard;
            gl_FragColor = vec4(col * a, a);
        }
    `;

    function compile(gl, type, src) {
        const sh = gl.createShader(type);
        if (!sh) return null;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.error("Shader error:", gl.getShaderInfoLog(sh));
            gl.deleteShader(sh);
            return null;
        }
        return sh;
    }

    function link(gl, vsSrc, fsSrc) {
        const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
        const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
        if (!vs || !fs) return null;
        const prog = gl.createProgram();
        if (!prog) return null;
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(prog));
            return null;
        }
        return prog;
    }

    const lineProg = link(gl, LINE_VERT, LINE_FRAG);
    const dotProg = link(gl, DOT_VERT, DOT_FRAG);
    if (!lineProg || !dotProg) return;

    const locs = new Map();
    const u = (prog, name) => {
        const key = (prog === lineProg ? "L:" : "D:") + name;
        if (!locs.has(key)) locs.set(key, gl.getUniformLocation(prog, name));
        return locs.get(key);
    };

    const CORNERS = [
        [0, -1], [1, -1], [1, 1],
        [0, -1], [1, 1], [0, 1],
    ];

    const lP0 = new Float32Array(MAX_LINES * 6 * 2);
    const lP1 = new Float32Array(MAX_LINES * 6 * 2);
    const lCorner = new Float32Array(MAX_LINES * 6 * 2);
    const lShade = new Float32Array(MAX_LINES * 6 * 3);
    for (let e = 0; e < MAX_LINES; e++) {
        for (let c = 0; c < 6; c++) {
            const k = (e * 6 + c) * 2;
            lCorner[k] = CORNERS[c][0];
            lCorner[k + 1] = CORNERS[c][1];
        }
    }

    const bP0 = gl.createBuffer();
    const bP1 = gl.createBuffer();
    const bCorner = gl.createBuffer();
    const bShade = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bP0);
    gl.bufferData(gl.ARRAY_BUFFER, lP0.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bP1);
    gl.bufferData(gl.ARRAY_BUFFER, lP1.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bCorner);
    gl.bufferData(gl.ARRAY_BUFFER, lCorner, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bShade);
    gl.bufferData(gl.ARRAY_BUFFER, lShade.byteLength, gl.DYNAMIC_DRAW);

    let seedVal = 2026;
    const rng = () => {
        seedVal += 0x6d2b79f5;
        let t = seedVal;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    let nCount = 180;
    let nx = new Float32Array(nCount);
    let ny = new Float32Array(nCount);
    let nSpd = new Float32Array(nCount);
    let gPos = new Float32Array(nCount * 2);
    let gLit = new Float32Array(nCount);

    const bGPos = gl.createBuffer();
    const bGLit = gl.createBuffer();

    const initNodes = (w, h) => {
        for (let i = 0; i < nCount; i++) {
            nx[i] = rng() * w;
            ny[i] = rng() * h;
            nSpd[i] = (rng() * 0.4 + 0.1) * 35;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, bGPos);
        gl.bufferData(gl.ARRAY_BUFFER, gPos.byteLength, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, bGLit);
        gl.bufferData(gl.ARRAY_BUFFER, gLit.byteLength, gl.DYNAMIC_DRAW);
    };

    let last = performance.now();
    let ptr = { x: -10000, y: -10000 };

    const heroSection = document.getElementById('inicio');
    if (heroSection) {
        heroSection.addEventListener("pointermove", (e) => {
            const r = canvas.getBoundingClientRect();
            ptr.x = e.clientX - r.left;
            ptr.y = e.clientY - r.top;
        });
        heroSection.addEventListener("pointerleave", () => {
            ptr.x = -10000;
            ptr.y = -10000;
        });
    }

    let initialized = false;

    const render = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        const cw = canvas.clientWidth || 1200;
        const ch = canvas.clientHeight || 800;
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        const bw = Math.max(1, Math.round(cw * dpr));
        const bh = Math.max(1, Math.round(ch * dpr));

        if (canvas.width !== bw || canvas.height !== bh) {
            canvas.width = bw;
            canvas.height = bh;
            if (!initialized) {
                initNodes(cw, ch);
                initialized = true;
            }
        }
        gl.viewport(0, 0, bw, bh);

        let lines = 0;
        const pushLine = (x0, y0, x1, y1, a0, a1, mix, wpx) => {
            if (lines >= MAX_LINES) return;
            for (let c = 0; c < 6; c++) {
                const k = (lines * 6 + c) * 2;
                const s3 = (lines * 6 + c) * 3;
                lP0[k] = x0; lP0[k + 1] = y0;
                lP1[k] = x1; lP1[k + 1] = y1;
                lShade[s3] = CORNERS[c][0] === 0 ? a0 : a1;
                lShade[s3 + 1] = mix;
                lShade[s3 + 2] = wpx;
            }
            lines++;
        };

        const reach = 160;
        const LINKD = 180;
        const LINKW = 1.2;

        for (let i = 0; i < nCount; i++) {
            nx[i] += nSpd[i] * dt;
            ny[i] += nSpd[i] * 0.3 * dt;

            if (nx[i] < -EDGE) nx[i] = cw + EDGE;
            if (nx[i] > cw + EDGE) nx[i] = -EDGE;
            if (ny[i] < -EDGE) ny[i] = ch + EDGE;
            if (ny[i] > ch + EDGE) ny[i] = -EDGE;

            const dx = ptr.x - nx[i];
            const dy = ptr.y - ny[i];
            const d = Math.sqrt(dx * dx + dy * dy);
            const lit = d < reach ? 1 : 0;

            if (lit === 1) {
                const a = 0.6 * (1 - d / reach);
                pushLine(nx[i], ny[i], ptr.x, ptr.y, a, a, 1, LINKW);
            }
            gPos[i * 2] = nx[i];
            gPos[i * 2 + 1] = ny[i];
            gLit[i] = lit;
        }

        const l2 = LINKD * LINKD;
        for (let i = 0; i < nCount && lines < MAX_LINES; i++) {
            for (let j = i + 1; j < nCount && lines < MAX_LINES; j++) {
                const dx = nx[i] - nx[j];
                const dy = ny[i] - ny[j];
                const dd = dx * dx + dy * dy;
                if (dd >= l2) continue;
                const a = 0.18 * (1 - Math.sqrt(dd) / LINKD);
                pushLine(nx[i], ny[i], nx[j], ny[j], a, a, 0, LINKW);
            }
        }

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        const cb = [0.945, 0.960, 0.976];
        const ca = [0.878, 0.376, 0.141];

        if (lines > 0) {
            gl.useProgram(lineProg);
            const verts = lines * 6;
            gl.bindBuffer(gl.ARRAY_BUFFER, bP0);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, lP0.subarray(0, verts * 2));
            const aP0 = gl.getAttribLocation(lineProg, "a_p0");
            gl.enableVertexAttribArray(aP0);
            gl.vertexAttribPointer(aP0, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, bP1);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, lP1.subarray(0, verts * 2));
            const aP1 = gl.getAttribLocation(lineProg, "a_p1");
            gl.enableVertexAttribArray(aP1);
            gl.vertexAttribPointer(aP1, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, bCorner);
            const aCorner = gl.getAttribLocation(lineProg, "a_corner");
            gl.enableVertexAttribArray(aCorner);
            gl.vertexAttribPointer(aCorner, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, bShade);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, lShade.subarray(0, verts * 3));
            const aShade = gl.getAttribLocation(lineProg, "a_shade");
            gl.enableVertexAttribArray(aShade);
            gl.vertexAttribPointer(aShade, 3, gl.FLOAT, false, 0, 0);

            gl.uniform2f(u(lineProg, "uSize"), cw, ch);
            gl.uniform3f(u(lineProg, "uBase"), cb[0], cb[1], cb[2]);
            gl.uniform3f(u(lineProg, "uAccent"), ca[0], ca[1], ca[2]);
            gl.drawArrays(gl.TRIANGLES, 0, verts);
        }

        if (nCount > 0) {
            gl.useProgram(dotProg);
            gl.bindBuffer(gl.ARRAY_BUFFER, bGPos);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, gPos);
            const aPos = gl.getAttribLocation(dotProg, "a_pos");
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, bGLit);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, gLit);
            const aLit = gl.getAttribLocation(dotProg, "a_lit");
            gl.enableVertexAttribArray(aLit);
            gl.vertexAttribPointer(aLit, 1, gl.FLOAT, false, 0, 0);

            gl.uniform2f(u(dotProg, "uSize"), cw, ch);
            gl.uniform1f(u(dotProg, "uDpr"), dpr);
            gl.uniform1f(u(dotProg, "uDot"), 5.0);
            gl.uniform1f(u(dotProg, "uRestAlpha"), 0.5);
            gl.uniform3f(u(dotProg, "uBase"), cb[0], cb[1], cb[2]);
            gl.uniform3f(u(dotProg, "uAccent"), ca[0], ca[1], ca[2]);
            gl.drawArrays(gl.POINTS, 0, nCount);
        }

        requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
});