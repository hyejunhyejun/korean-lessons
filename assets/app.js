/* ─────────────────────────────────────────────
   한국어 자료실 — 목록 홈과 자료 뷰어를 함께 담당한다.
   페이지에 #cards 가 있으면 목록, #content 가 있으면 뷰어.
   ───────────────────────────────────────────── */

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

const WHO = { kids: '👶 어린이', adult: '🌏 외국인' };

/* ── 발음 듣기 ───────────────────────────── */

const canSpeak = 'speechSynthesis' in window;

function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

// 발음 버튼 HTML. 음성 기능이 없는 기기에서는 아예 만들지 않는다.
function speakBtn(text, label = '🔊') {
  if (!canSpeak) return '';
  return `<button class="speak" type="button" data-say="${esc(text)}"
    aria-label="${esc(text)} 발음 듣기">${label}</button>`;
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-say]');
  if (b) speak(b.dataset.say);
});

/* ── 목록 홈 ─────────────────────────────── */

async function renderHome(box) {
  let list;
  try {
    list = await (await fetch('lessons/index.json')).json();
  } catch {
    box.innerHTML = `<li class="empty">자료 목록을 불러오지 못했습니다.</li>`;
    return;
  }

  const draw = filter => {
    const shown = list.filter(x => filter === 'all' || x.profile === filter);
    box.innerHTML = shown.length
      ? shown.map(x => `
        <li><a class="card" href="lesson.html?id=${encodeURIComponent(x.id)}">
          <span class="em">${esc(x.emoji)}</span>
          <span class="ti">${esc(x.title)}</span>
          <span class="badge ${esc(x.profile)}">${WHO[x.profile] || ''} · ${esc(x.level)}</span>
          <span class="date">${esc(x.created)}</span>
        </a></li>`).join('')
      : `<li class="empty">아직 이 대상의 자료가 없습니다.</li>`;
    document.getElementById('count').textContent = `자료 ${shown.length}편`;
  };

  draw('all');

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t =>
        t.setAttribute('aria-selected', String(t === tab)));
      draw(tab.dataset.filter);
    });
  });
}

/* ── 자료 뷰어 ───────────────────────────── */

async function renderLesson(box) {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { fail(box, '어떤 자료인지 주소에 적혀 있지 않습니다.'); return; }

  let d;
  try {
    d = await (await fetch(`lessons/${encodeURIComponent(id)}.json`)).json();
  } catch {
    fail(box, '자료를 찾을 수 없습니다. 목록에서 다시 골라 주세요.');
    return;
  }

  document.title = `${d.title} · 한국어 자료실`;
  document.getElementById('crumb').textContent = `${WHO[d.profile] || ''} · ${d.level}`;
  document.getElementById('title').textContent = `${d.emoji} ${d.title}`;
  document.getElementById('desc').textContent = `주제: ${d.topic}`;
  document.getElementById('printTitle').textContent = `${d.title} — 써보기`;
  document.getElementById('meta').textContent = d.created;

  box.innerHTML = d.profile === 'kids' ? kidsHTML(d) : adultHTML(d);

  if (d.profile === 'kids') {
    const btn = box.querySelector('.print-btn');
    if (btn) btn.addEventListener('click', () => window.print());
  } else {
    wireAdult(box);
  }
}

function fail(box, msg) {
  document.getElementById('title').textContent = '자료를 열 수 없습니다';
  box.innerHTML = `<p class="empty">${esc(msg)}</p>`;
}

/* ── 1번 · 어린이 ────────────────────────── */

function kidsHTML(d) {
  const out = [];

  if (d.cards?.length) out.push(`
    <section class="sec">
      <h2 class="sec-title"><span class="mark"></span>단어 카드</h2>
      <p class="sec-note">그림을 보고 단어를 소리 내어 읽어 보세요.</p>
      <ul class="kid-cards">
        ${d.cards.map(c => `
          <li class="kid-card">
            <span class="em">${esc(c.emoji)}</span>
            <span class="w">${esc(c.word)}</span>
            ${c.hint ? `<span class="hint">${esc(c.hint)}</span>` : ''}
            ${speakBtn(c.word)}
          </li>`).join('')}
      </ul>
    </section>`);

  if (d.sentences?.length) out.push(`
    <section class="sec">
      <h2 class="sec-title"><span class="mark"></span>따라 읽기</h2>
      <p class="sec-note">한 줄씩 천천히 따라 읽어 보세요.</p>
      <ul class="kid-sents">
        ${d.sentences.map(s => `
          <li class="kid-sent">${esc(s)}${speakBtn(s)}</li>`).join('')}
      </ul>
    </section>`);

  if (d.writing?.length) out.push(`
    <section class="sec sec-writing">
      <h2 class="sec-title"><span class="mark"></span>써보기</h2>
      <p class="sec-note">흐린 글씨를 따라 쓰고, 빈칸에도 혼자 써 보세요.</p>
      ${d.writing.map(w => `
        <div class="writing-word">
          <p class="lbl">${esc(w)}</p>
          <div class="cells">
            ${[...w].map(ch => `<div class="cell">${esc(ch)}</div>`).join('')}
            ${[...w].map(() => `<div class="cell blank">·</div>`).join('')}
          </div>
        </div>`).join('')}
      <button class="print-btn" type="button">🖨 써보기 인쇄하기</button>
    </section>`);

  return out.join('');
}

/* ── 2번 · 외국인 ────────────────────────── */

function adultHTML(d) {
  const out = [`
    <div class="en-bar">
      <button class="en-toggle" type="button" aria-pressed="false">EN 보기</button>
    </div>`];

  if (d.vocab?.length) out.push(`
    <section class="sec">
      <h2 class="sec-title"><span class="mark"></span>어휘</h2>
      <p class="sec-note">이 자료에 나오는 주요 단어입니다.</p>
      <div class="table-scroll">
        <table class="vocab">
          <thead><tr><th>단어</th><th>품사</th><th>예문</th></tr></thead>
          <tbody>
            ${d.vocab.map(v => `
              <tr>
                <td>${esc(v.ko)} ${speakBtn(v.ko)}
                    ${v.en ? `<span class="en">${esc(v.en)}</span>` : ''}</td>
                <td class="pos">${esc(v.pos || '')}</td>
                <td>${esc(v.ex)}
                    ${v.exEn ? `<span class="en">${esc(v.exEn)}</span>` : ''}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>`);

  if (d.reading?.text) out.push(`
    <section class="sec">
      <h2 class="sec-title"><span class="mark"></span>읽기</h2>
      <p class="sec-note">글을 읽고 아래 문제를 풀어 보세요. 보기를 누르면 정답과 해설이 나옵니다.</p>
      <p class="passage">${esc(d.reading.text)}</p>
      ${d.reading.textEn ? `<p class="passage en">${esc(d.reading.textEn)}</p>` : ''}
      ${(d.reading.questions || []).map((q, qi) => `
        <div class="qa" data-answer="${q.answer}">
          <p class="q">${qi + 1}. ${esc(q.q)}</p>
          <ul class="opts">
            ${q.choices.map((c, ci) => `
              <li><button class="opt" type="button" data-i="${ci}">
                <span class="n">${ci + 1}</span><span>${esc(c)}</span>
              </button></li>`).join('')}
          </ul>
          ${q.why ? `<p class="why" hidden>해설 — ${esc(q.why)}</p>` : ''}
        </div>`).join('')}
    </section>`);

  if (d.grammar?.length) out.push(`
    <section class="sec">
      <h2 class="sec-title"><span class="mark"></span>문법</h2>
      <p class="sec-note">지문에 나온 문형입니다.</p>
      ${d.grammar.map(g => `
        <div class="gram">
          <p class="form">${esc(g.form)}</p>
          <p class="mean">${esc(g.meaning)}</p>
          ${g.meaningEn ? `<p class="mean en">${esc(g.meaningEn)}</p>` : ''}
          <ul>${(g.examples || []).map(x => `<li>${esc(x)} ${speakBtn(x)}</li>`).join('')}</ul>
        </div>`).join('')}
    </section>`);

  if (d.dialogue?.lines?.length) out.push(`
    <section class="sec">
      <h2 class="sec-title"><span class="mark"></span>회화</h2>
      ${d.dialogue.situation ? `<p class="situation">${esc(d.dialogue.situation)}</p>` : ''}
      <ul class="talk">
        ${d.dialogue.lines.map(l => `
          <li class="turn">
            <span class="who">${esc(l.who)}</span>
            <span>
              <p class="ko">${esc(l.ko)} ${speakBtn(l.ko)}</p>
              ${l.en ? `<span class="en">${esc(l.en)}</span>` : ''}
            </span>
          </li>`).join('')}
      </ul>
      ${d.dialogue.expressions?.length ? `
        <ul class="expr">
          ${d.dialogue.expressions.map(x => `<li>${esc(x)}</li>`).join('')}
        </ul>` : ''}
    </section>`);

  return out.join('');
}

function wireAdult(box) {
  const toggle = box.querySelector('.en-toggle');
  toggle.addEventListener('click', () => {
    const on = document.body.classList.toggle('show-en');
    toggle.setAttribute('aria-pressed', String(on));
    toggle.textContent = on ? 'EN 끄기' : 'EN 보기';
  });

  box.querySelectorAll('.qa').forEach(qa => {
    const answer = Number(qa.dataset.answer);
    const why = qa.querySelector('.why');
    qa.querySelectorAll('.opt').forEach(opt => {
      opt.addEventListener('click', () => {
        const picked = Number(opt.dataset.i);
        qa.querySelectorAll('.opt').forEach(o => o.classList.remove('right', 'wrong'));
        opt.classList.add(picked === answer ? 'right' : 'wrong');
        // 틀렸을 때도 정답이 어디인지 함께 보여 준다.
        if (picked !== answer) qa.querySelector(`.opt[data-i="${answer}"]`).classList.add('right');
        if (why) why.hidden = false;
      });
    });
  });
}

/* ── 시작 ───────────────────────────────── */

const cards = document.getElementById('cards');
const content = document.getElementById('content');
if (cards) renderHome(cards);
if (content) renderLesson(content);
