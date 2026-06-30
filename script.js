const CONFIG = {
  googleAppsScriptUrl:
    "https://script.google.com/macros/s/AKfycbwxrVNIiFV1QAC9RkngmXdC1N-jOURuRlY-MjP9CTbCCR2jzdlu8_Kr2NNjo9GistLCqA/exec
    ,
  showExplanations: true,
  requestTimeoutMs: 25000,
};

const STORE = {
  session: "ns_session_live_v1",
};

const state = {
  user: null,
  tests: [],
  notes: [],
  results: [],
  activeTest: null,
  activeQuestions: [],
  activeAnswers: {},
  activeIndex: 0,
  endAt: 0,
  timerId: null,
  submitted: false,
  loading: false,
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function readJson(k, f) {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? f;
  } catch {
    return f;
  }
}

function writeJson(k, v) {
  localStorage.setItem(k, JSON.stringify(v));
}

function escapeHtml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -------------------- API REQUEST (FIXED) -------------------- */
async function apiRequest(action, payload = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const formData = new URLSearchParams();

    formData.append(
      "payload",
      JSON.stringify({
        action,
        ...payload,
      }),
    );

    const res = await fetch(CONFIG.googleAppsScriptUrl, {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    console.log("RAW RESPONSE:", text);

    const data = JSON.parse(text);

    if (!data.ok) throw new Error(data.error || "Request failed");

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Server timeout");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
/* -------------------- AUTH -------------------- */

async function login(form) {
  const data = Object.fromEntries(new FormData(form));
  const res = await apiRequest("login", data);

  state.user = res.user;
  writeJson(STORE.session, state.user);

  await loadApp();
}

async function register(form) {
  const data = Object.fromEntries(new FormData(form));
  const res = await apiRequest("register", data);

  state.user = res.user;
  writeJson(STORE.session, state.user);

  await loadApp();
}

/* -------------------- LOAD APP -------------------- */

async function loadApp() {
  state.user = readJson(STORE.session, null);

  if (!state.user) {
    document.querySelector("#authView").classList.remove("hidden");
    document.querySelector("#workspace").classList.add("hidden");
    return;
  }

  document.querySelector("#authView").classList.add("hidden");
  document.querySelector("#workspace").classList.remove("hidden");

  await refreshData();
}

/* -------------------- REFRESH DATA -------------------- */

async function refreshData() {
  const auth = {
    userId: state.user.userId,
    token: state.user.token,
  };

  try {
    const [tests, notes, results] = await Promise.all([
      apiRequest("listTests", auth),
      apiRequest("listNotes", auth),
      apiRequest("myResults", auth),
    ]);

    state.tests = tests.tests || [];
    state.notes = notes.notes || [];
    state.results = results.results || [];

    renderAll();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* -------------------- TEST START -------------------- */

async function startTest(testName) {
  const res = await apiRequest("getQuestions", {
    testName,
    userId: state.user.userId,
    token: state.user.token,
  });

  state.activeTest = res.test;
  state.activeQuestions = res.questions;
  state.activeAnswers = {};
  state.activeIndex = 0;

  state.endAt = Date.now() + Number(res.test.duration || 0) * 60000;

  renderQuestion();
  switchView("attempt");

  state.timerId = setInterval(tickTimer, 1000);
}

/* -------------------- TIMER -------------------- */

function tickTimer() {
  const remaining = Math.max(0, state.endAt - Date.now());

  const m = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const s = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  document.querySelector("#timer").textContent = `${m}:${s}`;

  if (remaining <= 0) submitTest(true);
}

/* -------------------- SUBMIT -------------------- */

async function submitTest(auto = false) {
  if (state.submitted) return;
  state.submitted = true;

  clearInterval(state.timerId);

  const res = await apiRequest("submitResult", {
    user: state.user,
    testName: state.activeTest.testName,
    answers: state.activeAnswers,
    autoSubmitted: auto,
  });

  alert("Test submitted successfully");
  console.log(res);
}

/* -------------------- QUESTION -------------------- */

function renderQuestion() {
  const q = state.activeQuestions[state.activeIndex];

  document.querySelector("#questionArea").innerHTML = `
    <h2>${escapeHtml(q.question)}</h2>
    ${Object.entries(q.options)
      .map(
        ([k, v]) => `
        <button onclick="selectAnswer('${k}')">
          ${k}. ${escapeHtml(v)}
        </button>
      `,
      )
      .join("")}
  `;
}

function selectAnswer(key) {
  state.activeAnswers[state.activeIndex] = key;
  renderQuestion();
}

/* -------------------- VIEW -------------------- */

function switchView(v) {
  document.querySelectorAll(".view").forEach((x) => x.classList.add("hidden"));
  document.querySelector(`#${v}View`).classList.remove("hidden");
}

/* -------------------- INIT -------------------- */

loadApp();
