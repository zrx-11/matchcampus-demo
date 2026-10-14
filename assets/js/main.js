// 校配 MatchCampus · 交互逻辑

// ========== 粒子背景 ==========
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 50;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.3 + 0.1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 168, 75, ${this.opacity})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    function connect() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(212, 168, 75, ${0.08 * (1 - dist / 120)})`;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        connect();
        requestAnimationFrame(animate);
    }
    animate();
}

// ========== 导航栏 ==========
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }
    if (toggle && links) {
        toggle.addEventListener('click', () => links.classList.toggle('open'));
    }
}

// ========== 滚动显示动画 ==========
function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ========== 数字滚动 ==========
function animateNumber(el, target, duration = 1500) {
    const start = 0;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function initStatsAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                if (!isNaN(target)) animateNumber(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-target]').forEach(el => observer.observe(el));
}

// ========== 匹配演示 ==========
let currentExample = -1;

function initMatchPage() {
    const grid = document.getElementById('exampleGrid');
    const input = document.getElementById('demandInput');
    const btn = document.getElementById('matchBtn');
    const results = document.getElementById('resultsArea');
    if (!grid || !btn) return;

    // 生成示例标签
    EXAMPLES.forEach((ex, i) => {
        const chip = document.createElement('div');
        chip.className = 'example-chip';
        chip.textContent = ex.label;
        chip.onclick = () => {
            currentExample = i;
            input.value = ex.label;
            document.querySelectorAll('.example-chip').forEach((c, j) => c.classList.toggle('active', j === i));
        };
        grid.appendChild(chip);
    });

    btn.addEventListener('click', () => {
        const val = input.value.trim();
        if (!val) { alert('先输入你要找什么，或点左侧示例'); return; }
        btn.disabled = true;
        showLoading();
        setTimeout(() => {
            const data = currentExample >= 0 ? MATCH_DATA[currentExample] : null;
            const keywords = currentExample >= 0 ? EXAMPLES[currentExample].keywords : ['需求', '匹配中'];
            renderResults(val, keywords, data);
            btn.disabled = false;
        }, 2000);
    });
}

function showLoading() {
    const area = document.getElementById('resultsArea');
    area.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <div style="color:var(--gold-light); font-size:15px; margin-bottom:8px;">正在解析需求...</div>
            <div class="loading-steps">
                <div class="loading-step" id="step1"><span class="check">✓</span> 提取关键词</div>
                <div class="loading-step" id="step2"><span class="check">✓</span> 标签分类与预算估算</div>
                <div class="loading-step" id="step3"><span class="check">✓</span> 二分图匹配计算</div>
                <div class="loading-step" id="step4"><span class="check">✓</span> 排序推送最优结果</div>
            </div>
        </div>
    `;
    setTimeout(() => document.getElementById('step1')?.classList.add('done'), 300);
    setTimeout(() => document.getElementById('step2')?.classList.add('done'), 700);
    setTimeout(() => document.getElementById('step3')?.classList.add('done'), 1200);
    setTimeout(() => document.getElementById('step4')?.classList.add('done'), 1700);
}

function renderResults(demand, keywords, data) {
    const area = document.getElementById('resultsArea');
    if (!data) {
        data = [
            { name: '匹配结果A', type: '系统匹配', desc: '系统根据你的需求找到的第一个匹配项', score: 0.89, tags: ['标签1', '标签2'] },
            { name: '匹配结果B', type: '系统匹配', desc: '系统根据你的需求找到的第二个匹配项', score: 0.82, tags: ['标签1', '标签3'] },
            { name: '匹配结果C', type: '系统匹配', desc: '系统根据你的需求找到的第三个匹配项', score: 0.75, tags: ['标签2', '标签4'] },
        ];
    }
    let html = `
        <div class="demand-bar">
            <div class="demand-bar-label">你的需求</div>
            <div class="demand-bar-text">${demand}</div>
            <div class="demand-tags">${keywords.map(k => `<span class="demand-tag">${k}</span>`).join('')}</div>
        </div>
    `;
    data.forEach((r, i) => {
        const sp = Math.round(r.score * 100);
        html += `
            <div class="match-result-card" style="cursor:pointer;" onclick='openModal(${JSON.stringify(r)})'>
                <div class="result-avatar">${r.name[0]}</div>
                <div class="result-info">
                    <div class="result-header">
                        <span class="result-name">${r.name}</span>
                        <span class="result-type">${r.type}</span>
                    </div>
                    <div class="result-desc">${r.desc}</div>
                    <div class="result-tags">${r.tags.map(t => `<span class="result-tag">${t}</span>`).join('')}</div>
                </div>
                <div class="result-score">
                    <div class="score-circle" style="--score:${sp}%">
                        <div class="score-circle-inner">${sp}%</div>
                    </div>
                    <div class="score-label">匹配度</div>
                </div>
            </div>
        `;
    });
    area.innerHTML = html;
}

// ========== 商家端 ==========
function initMerchantPage() {
    const selector = document.getElementById('shopSelector');
    if (!selector) return;
    SHOP_DATA.forEach((shop, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = shop.name;
        selector.appendChild(opt);
    });
    selector.addEventListener('change', () => updateDashboard(parseInt(selector.value)));
    updateDashboard(0);
}

function updateDashboard(idx) {
    const d = SHOP_DATA[idx];
    document.getElementById('statTotal').textContent = d.total;
    document.getElementById('statHigh').textContent = d.high;
    document.getElementById('statRate').textContent = d.rate;
    document.getElementById('statRev').textContent = d.rev;

    // 需求排行
    const list = document.getElementById('demandRankList');
    list.innerHTML = d.demands.map((item, i) => `
        <div class="demand-rank-item">
            <div class="rank-num">${i + 1}</div>
            <div class="rank-content">
                <div class="rank-text">${item.text}</div>
                <div class="rank-bar"><div class="rank-bar-fill" style="width:0%" data-width="${item.heat}%"></div></div>
            </div>
            <div class="rank-count">${item.count}人</div>
        </div>
    `).join('');
    setTimeout(() => {
        document.querySelectorAll('.rank-bar-fill').forEach(el => {
            el.style.width = el.dataset.width;
        });
    }, 100);

    // 建议
    document.getElementById('adviceList').innerHTML = d.advice.map(a => `<p>${a}</p>`).join('');

    // 周趋势图
    drawWeeklyChart(d.weekly);
}

function drawWeeklyChart(data) {
    const container = document.getElementById('weeklyChart');
    if (!container) return;
    const max = Math.max(...data) * 1.2;
    const bars = data.map((v, i) => {
        const h = (v / max) * 100;
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        return `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
                <div style="font-size:11px; color:var(--gold-light);">${v}</div>
                <div style="width:100%; height:120px; display:flex; align-items:flex-end;">
                    <div style="width:100%; height:${h}%; background:linear-gradient(180deg, var(--gold-light), var(--gold)); border-radius:4px 4px 0 0; transition:height 1s ease;"></div>
                </div>
                <div style="font-size:11px; color:var(--text-faint);">${days[i]}</div>
            </div>
        `;
    }).join('');
    container.innerHTML = `<div style="display:flex; gap:8px; align-items:flex-end; height:160px;">${bars}</div>`;
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavbar();
    initReveal();
    initStatsAnimation();
    initMatchPage();
    initMerchantPage();
});

// ========== v5 新增：快速匹配 + 模态框 ==========
function quickMatch(idx) {
    currentExample = idx;
    const input = document.getElementById('demandInput');
    if (input) {
        input.value = EXAMPLES[idx].label;
        document.getElementById('matchBtn').click();
    }
}

function openModal(data) {
    document.getElementById('modalName').textContent = data.name;
    document.getElementById('modalType').textContent = data.type;
    document.getElementById('modalDesc').textContent = data.desc;
    document.getElementById('modalScore').textContent = Math.round(data.score * 100) + '%';
    document.getElementById('matchModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('matchModal').classList.remove('active');
    document.body.style.overflow = '';
}

// 点击遮罩关闭模态框
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('matchModal');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
});
