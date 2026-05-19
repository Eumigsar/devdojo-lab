// DevDojo Lab MVP
// - login local + progresso em localStorage
// - exercícios por linguagem e nível

const STORAGE_KEY = 'devdojo-lab:v1';

const DB = {
	languages: [
		{ id: 'js', name: 'JavaScript', description: 'Fundamentos e lógica para web', levels: [{ id: 'easy', name: 'Iniciante' }, { id: 'mid', name: 'Intermediário' }, { id: 'hard', name: 'Avançado' }] },
		{ id: 'py', name: 'Python', description: 'Do básico ao pensamento de automação', levels: [{ id: 'easy', name: 'Iniciante' }, { id: 'mid', name: 'Intermediário' }, { id: 'hard', name: 'Avançado' }] },
		{ id: 'htmlcss', name: 'HTML/CSS', description: 'Estrutura, layout e responsividade', levels: [{ id: 'easy', name: 'Iniciante' }, { id: 'mid', name: 'Intermediário' }, { id: 'hard', name: 'Avançado' }] },
		{ id: 'sql', name: 'SQL', description: 'Consultas e pensamento relacional', levels: [{ id: 'easy', name: 'Iniciante' }, { id: 'mid', name: 'Intermediário' }, { id: 'hard', name: 'Avançado' }] }
	],
	exercises: [
		{ id: 'js-e1', lang: 'js', level: 'easy', type: 'mcq', title: 'Tipos', prompt: 'Qual opção é um valor booleano em JavaScript?', choices: ['"true"', 'true', '1', 'null'], answerIndex: 1, explain: 'Booleano é true/false sem aspas.' },
		{ id: 'py-e1', lang: 'py', level: 'easy', type: 'mcq', title: 'Listas', prompt: 'Qual é a sintaxe para criar uma lista vazia?', choices: ['{}', '[]', '()', '<>'], answerIndex: 1, explain: '[] cria uma lista vazia.' },
		{ id: 'hc-e1', lang: 'htmlcss', level: 'easy', type: 'mcq', title: 'Semântica', prompt: 'Qual tag representa o conteúdo principal da página?', choices: ['<div>', '<main>', '<section>', '<aside>'], answerIndex: 1, explain: '<main> define o conteúdo principal.' },
		{ id: 'sql-e1', lang: 'sql', level: 'easy', type: 'mcq', title: 'SELECT', prompt: 'Qual consulta retorna todas as colunas da tabela users?', choices: ['SELECT users;', 'SELECT * FROM users;', 'GET * users;', 'FROM users SELECT *;'], answerIndex: 1, explain: 'SELECT * FROM <tabela>;' }
	]
};

function $(id) { return document.getElementById(id); }

function safeJsonParse(raw) {
	try { return JSON.parse(raw); } catch { return null; }
}

function loadState() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		return safeJsonParse(raw);
	} catch {
		return null;
	}
}

function saveState(state) {
	try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function todayKey() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStreak(activeDays = []) {
	const set = new Set(activeDays);
	let streak = 0;
	let d = new Date();
	while (true) {
		const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
		if (!set.has(k)) break;
		streak++;
		d.setDate(d.getDate() - 1);
	}
	return streak;
}

function setRoute(route) {
	for (const r of document.querySelectorAll('.route')) r.hidden = true;
	const target = $(`route_${route}`);
	if (target) target.hidden = false;

	for (const btn of document.querySelectorAll('.navItem')) {
		btn.classList.toggle('active', btn.dataset.route === route);
	}
}

function renderKPIs(state) {
	const completed = state.progress.completed || {};
	const completedIds = Object.keys(completed);
	let correct = 0;
	for (const id of completedIds) if (completed[id]?.correct) correct++;

	$('kpiCorrect').textContent = String(correct);
	$('kpiCompleted').textContent = String(completedIds.length);
	$('kpiStreak').textContent = String(computeStreak(state.progress.activeDays || []));
}

function renderLanguages(state) {
	const grid = $('languageGrid');
	grid.innerHTML = '';

	for (const lang of DB.languages) {
		const card = document.createElement('div');
		card.className = 'card';
		card.innerHTML = `
			<h3>${lang.name}</h3>
			<p class="muted">${lang.description}</p>
			<div class="pillRow">${lang.levels.map(l => `<span class="pill">${l.name}</span>`).join('')}</div>
			<div style="height: 10px"></div>
			<button class="btn primary">Abrir exercícios</button>
		`;
		card.querySelector('button').addEventListener('click', () => openLanguage(lang.id, state));
		grid.appendChild(card);
	}
}

function renderProgress(state) {
	$('progressUser').textContent = state.user.name;
	const list = $('progressList');
	list.innerHTML = '';

	const completed = state.progress.completed || {};
	const completedIds = new Set(Object.keys(completed));

	for (const lang of DB.languages) {
		const container = document.createElement('div');
		container.className = 'listItem';
		const total = DB.exercises.filter(e => e.lang === lang.id).length;
		const done = DB.exercises.filter(e => e.lang === lang.id && completedIds.has(e.id)).length;
		container.innerHTML = `
			<div>
				<div class="strong">${lang.name}</div>
				<div class="muted">${done}/${total} concluídos</div>
			</div>
			<span class="badgeMini">${Math.round((done / Math.max(total,1)) * 100)}%</span>
		`;
		list.appendChild(container);
	}
}

function openLanguage(langId, state) {
	const lang = DB.languages.find(l => l.id === langId);
	if (!lang) return;

	$('modalTitle').textContent = `Exercícios — ${lang.name}`;
	$('modalSubtitle').textContent = 'Escolha um exercício.';
	const body = $('modalBody');
	body.innerHTML = '';

	const completed = state.progress.completed || {};
	const exList = DB.exercises.filter(e => e.lang === langId);
	for (const ex of exList) {
		const isDone = Boolean(completed[ex.id]);
		const item = document.createElement('div');
		item.className = 'listItem';
		item.innerHTML = `
			<div>
				<div class="strong">${ex.title}</div>
				<div class="muted">${isDone ? 'Concluído' : 'Novo'} • ${ex.type === 'mcq' ? 'Múltipla escolha' : 'Complete'}</div>
			</div>
			<button class="btn ${isDone ? 'ghost' : 'primary'}">${isDone ? 'Rever' : 'Jogar'}</button>
		`;
		item.querySelector('button').addEventListener('click', () => playExercise(ex.id, state));
		body.appendChild(item);
	}

	$('modal').hidden = false;
}

function playExercise(exId, state) {
	const ex = DB.exercises.find(e => e.id === exId);
	if (!ex) return;

	$('modalTitle').textContent = ex.title;
	$('modalSubtitle').textContent = 'Escolha a resposta.';
	const body = $('modalBody');
	body.innerHTML = '';

	const wrap = document.createElement('div');
	wrap.className = 'exercise';
	wrap.innerHTML = `
		<div class="exercisePrompt">
			<div class="strong">Desafio</div>
			<div>${ex.prompt}</div>
		</div>
	`;

	const grid = document.createElement('div');
	grid.className = 'choiceGrid';
	ex.choices.forEach((c, idx) => {
		const btn = document.createElement('button');
		btn.className = 'choice';
		btn.textContent = c;
		btn.addEventListener('click', () => onSolved(ex, idx === ex.answerIndex, state));
		grid.appendChild(btn);
	});
	wrap.appendChild(grid);

	const hint = document.createElement('div');
	hint.className = 'muted';
	hint.textContent = `Dica: ${ex.explain}`;
	wrap.appendChild(hint);

	body.appendChild(wrap);
}

function onSolved(ex, ok, state) {
	state.progress.activeDays = state.progress.activeDays || [];
	const t = todayKey();
	if (!state.progress.activeDays.includes(t)) state.progress.activeDays.push(t);

	state.progress.completed = state.progress.completed || {};
	state.progress.completed[ex.id] = { correct: ok, at: new Date().toISOString() };
	saveState(state);

	renderKPIs(state);
	renderProgress(state);

	const box = document.createElement('div');
	box.className = ok ? 'resultOk' : 'resultBad';
	box.innerHTML = ok
		? `<div class="strong">✅ Acertou!</div><div class="muted">Progresso salvo.</div>`
		: `<div class="strong">🟨 Quase!</div><div class="muted">Salvei para revisão.</div>`;
	$('modalBody').appendChild(box);
}

function setLoggedInUI(state) {
	$('authView').hidden = true;
	$('appView').hidden = false;
	$('userChip').hidden = false;
	$('logoutBtn').hidden = false;
	$('userName').textContent = state.user.name;

	renderLanguages(state);
	renderProgress(state);
	renderKPIs(state);
	setRoute('home');
}

function setLoggedOutUI() {
	$('authView').hidden = false;
	$('appView').hidden = true;
	$('userChip').hidden = true;
	$('logoutBtn').hidden = true;
}

function init() {
	const required = ['authView','appView','loginForm','nameInput','languageGrid','progressList','progressUser','kpiStreak','kpiCorrect','kpiCompleted','modal','modalClose','modalTitle','modalSubtitle','modalBody','userChip','userName','logoutBtn','resetProgress'];
	for (const id of required) {
		if (!$(id)) {
			const p = $('authError');
			if (p) {
				p.hidden = false;
				p.textContent = `Não consegui iniciar (elemento faltando: #${id}). Atualize a página.`;
			}
			return;
		}
	}

	let state = loadState();

	$('modalClose').addEventListener('click', () => ($('modal').hidden = true));
	$('modal').addEventListener('click', (e) => { if (e.target === $('modal')) $('modal').hidden = true; });

	for (const btn of document.querySelectorAll('.navItem')) {
		btn.addEventListener('click', () => setRoute(btn.dataset.route));
	}
	for (const btn of document.querySelectorAll('[data-goto]')) {
		btn.addEventListener('click', () => setRoute(btn.dataset.goto));
	}

	$('loginForm').addEventListener('submit', (e) => {
		e.preventDefault();
		const name = ($('nameInput').value || '').trim();
		if (!name) return;
		state = { user: { name }, progress: { completed: {}, activeDays: [] } };
		saveState(state);
		setLoggedInUI(state);
	});

	$('logoutBtn').addEventListener('click', () => setLoggedOutUI());

	$('resetProgress').addEventListener('click', () => {
		if (!state) return;
		state.progress = { completed: {}, activeDays: [] };
		saveState(state);
		renderProgress(state);
		renderKPIs(state);
	});

	if (state?.user?.name) setLoggedInUI(state);
	else setLoggedOutUI();
}

document.addEventListener('DOMContentLoaded', init);
