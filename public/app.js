const $ = (id) => document.getElementById(id),
  cats = [
    ["General Knowledge", "✧"],
    ["Science", "☼"],
    ["Technology", "⌘"],
    ["History", "⌛"],
    ["Geography", "◎"],
    ["Mathematics", "∑"],
    ["Literature", "❧"],
    ["Biology", "❀"],
    ["Computer Science", "⌨"],
    ["Space", "☾"],
  ];
let selected = "General Knowledge",
  expanded = false,
  qs = [],
  i = 0,
  pick = null,
  answers = [],
  tick = null,
  seconds = 0,
  saved = JSON.parse(localStorage.cqnSaved || "[]");
function showPage(id) {
  document.querySelectorAll(".page").forEach((p) => p.classList.add("hide"));
  $(id).classList.remove("hide");
  document
    .querySelectorAll(".nav")
    .forEach((b) => b.classList.toggle("active", b.dataset.page === id));
  if (id === "history") historyView();
  if (id === "saved") savedView();
  if (id === "notes") $("notes").value = localStorage.cqnNotes || "";
  scrollTo(0, 0);
}
window.showPage = showPage;
document
  .querySelectorAll("[data-page]")
  .forEach((b) => (b.onclick = () => showPage(b.dataset.page)));
function categoryView() {
  let list = expanded ? cats : cats.slice(0, 5);
  $("categories").innerHTML = list
    .map(
      (c) =>
        `<button class="cat ${selected === c[0] ? "selected" : ""}" data-cat="${c[0]}"><span>${c[1]}</span><b>${c[0]}</b><small>Explore & practise</small></button>`,
    )
    .join("");
  document.querySelectorAll("[data-cat]").forEach(
    (b) =>
      (b.onclick = () => {
        selected = b.dataset.cat;
        $("topic").value = "";
        categoryView();
      }),
  );
}
categoryView();
$("more").onclick = () => {
  expanded = !expanded;
  categoryView();
  $("more").textContent = expanded ? "Fewer categories ⌃" : "More categories ⌄";
};
$("count").onchange = () =>
  $("customCount").classList.toggle("hide", $("count").value !== "custom");
$("timed").onchange = () =>
  $("timeOptions").classList.toggle("hide", $("timed").value !== "on");
$("seconds").onchange = () =>
  $("customSeconds").classList.toggle("hide", $("seconds").value !== "custom");
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
async function start() {
  let topic = $("topic").value.trim() || selected,
    count =
      $("count").value === "custom"
        ? Math.min(50, Math.max(1, +$("customCount").value || 1))
        : +$("count").value,
    file = $("file").files[0],
    btn = $("start");
  btn.disabled = true;
  btn.textContent = "Creating your quiz…";
  $("status").textContent = "Asking Gemini to write fresh questions…";
  try {
    let sourceText = "";
    if (file) {
      let fd = new FormData();
      fd.append("file", file);
      let fr = await fetch("/api/extract", {
  method: "POST",
  body: fd,
});

let ft = await fr.text();
let fj;

try {
  fj = JSON.parse(ft);
} catch {
  throw Error(`File extraction returned invalid response: ${ft || "Empty response"}`);
}
      if (!fr.ok) throw Error(fj.error);
      sourceText = fj.text;
    }
    let r = await fetch("/api/quiz", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    topic,
    count,
    difficulty: $("difficulty").value,
    sourceText,
  }),
});

let rt = await r.text();
let d;

try {
  d = JSON.parse(rt);
} catch {
  throw Error(`Quiz API returned invalid response (${r.status}): ${rt || "Empty response"}`);
}
    if (!r.ok) throw Error(d.error || "Gemini request failed");
    if (!Array.isArray(d.questions) || d.questions.length !== count)
      throw Error(
        "Gemini did not return the requested number of questions. Try again.",
      );
    qs = d.questions;
    i = 0;
    answers = [];
    seconds =
      $("timed").value === "on"
        ? $("seconds").value === "custom"
          ? Math.max(5, +$("customSeconds").value || 40)
          : +$("seconds").value
        : 0;
    $("qtopic").textContent = topic.toUpperCase();
    showPage("quiz");
    renderQuestion();
    $("status").textContent = "Ready for your next topic.";
  } catch (e) {
    $("status").textContent = e.message;
    alert(e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Create my quiz →";
  }
}
$("start").onclick = start;
function renderQuestion() {
  clearInterval(tick);
  pick = null;
  let q = qs[i];
  $("progress").textContent = `QUESTION ${i + 1} OF ${qs.length}`;
  $("fill").style.width = ((i + 1) / qs.length) * 100 + "%";
  $("qtext").textContent = q.question;
  $("options").innerHTML = q.options
    .map(
      (x, n) =>
        `<button class="option" data-opt="${n}">${String.fromCharCode(65 + n)}. ${esc(x)}</button>`,
    )
    .join("");
  document
    .querySelectorAll("[data-opt]")
    .forEach((b) => (b.onclick = () => answer(+b.dataset.opt)));
  $("hinttext").textContent = q.hint;
  $("hinttext").classList.add("hide");
  $("hint").disabled = false;
  $("feedback").classList.add("hide");
  $("next").disabled = true;
  $("next").textContent = "Check answer →";
  updateSave();
  if (seconds) {
    let t = seconds;
    $("clock").textContent = "◷ " + t + "s";
    tick = setInterval(() => {
      t--;
      $("clock").textContent = "◷ " + t + "s";
      if (t <= 0) {
        clearInterval(tick);
        answer(-1);
      }
    }, 1000);
  } else $("clock").textContent = "";
}
function answer(n) {
  if (pick !== null) return;
  pick = n;
  clearInterval(tick);
  let q = qs[i],
    ok = n === q.answerIndex;
  answers.push({ n, ok });
  document.querySelectorAll("[data-opt]").forEach((b) => {
    let v = +b.dataset.opt;
    b.disabled = true;
    if (v === q.answerIndex) b.classList.add("correct");
    if (v === n && !ok) b.classList.add("wrong");
  });
  $("feedback").textContent =
    (ok ? "That's right! " : "Not quite — here's the explanation. ") +
    q.explanation;
  $("feedback").classList.remove("hide");
  $("next").disabled = false;
  $("next").textContent =
    i === qs.length - 1 ? "See my results →" : "Next question →";
}
$("hint").onclick = () => {
  $("hinttext").classList.remove("hide");
  $("hint").disabled = true;
};
$("next").onclick = () => {
  if (pick === null) return;
  if (i < qs.length - 1) {
    i++;
    renderQuestion();
  } else finish();
};
$("save").onclick = () => {
  let q = qs[i],
    n = saved.findIndex((x) => x.q === q.question);
  if (n >= 0) saved.splice(n, 1);
  else
    saved.push({
      q: q.question,
      a: q.options[q.answerIndex],
      e: q.explanation,
      t: $("qtopic").textContent,
    });
  localStorage.cqnSaved = JSON.stringify(saved);
  updateSave();
};
function updateSave() {
  let q = qs[i],
    yes = saved.some((x) => x.q === q.question);
  $("save").textContent = yes ? "♥ Saved" : "♡ Save";
}
function finish() {
  clearInterval(tick);
  let c = answers.filter((x) => x.ok).length,
    s = Math.round((c / qs.length) * 100);
  $("score").textContent = s + "%";
  $("stats").textContent =
    `${c} correct · ${qs.length - c} to revisit · ${qs.length} questions`;
  $("message").textContent =
    s >= 90
      ? "Beautiful work. Keep that curiosity alive."
      : s >= 60
        ? "Good effort — every session helps you grow."
        : "Every attempt is a step forward. Keep practising.";
  $("review").innerHTML = qs
    .map(
      (q, n) =>
        `<article><b>${n + 1}. ${esc(q.question)}</b><br>${answers[n].ok ? "✓ Correct" : "✕ Your answer: " + (answers[n].n < 0 ? "No answer" : esc(q.options[answers[n].n]))}<br>Correct answer: <b>${esc(q.options[q.answerIndex])}</b><br>${esc(q.explanation)}</article>`,
    )
    .join("");
  let h = JSON.parse(localStorage.cqnHistory || "[]");
  h.unshift({
    topic: $("qtopic").textContent,
    s,
    c,
    total: qs.length,
    date: new Date().toLocaleString(),
  });
  localStorage.cqnHistory = JSON.stringify(h.slice(0, 50));
  showPage("results");
}
$("leave").onclick = () => {
  if (confirm("Leave this quiz? Progress will be lost.")) {
    clearInterval(tick);
    showPage("home");
  }
};
function historyView() {
  let h = JSON.parse(localStorage.cqnHistory || "[]");
  $("historyList").innerHTML = h.length
    ? h
        .map(
          (x) =>
            `<article><b>${esc(x.topic)} · ${x.s}%</b><br>${x.c}/${x.total} correct · ${esc(x.date)}</article>`,
        )
        .join("")
    : "<article>Your completed quizzes will appear here.</article>";
}
function savedView() {
  $("savedList").innerHTML = saved.length
    ? saved
        .map(
          (x, n) =>
            `<article><b>${esc(x.q)}</b><br>Answer: ${esc(x.a)}<br>${esc(x.e)}<br><button onclick="removeSaved(${n})">Remove</button></article>`,
        )
        .join("")
    : "<article>No saved questions yet. Save one during a quiz.</article>";
}
window.removeSaved = (n) => {
  saved.splice(n, 1);
  localStorage.cqnSaved = JSON.stringify(saved);
  savedView();
};
$("saveNotes").onclick = () => {
  localStorage.cqnNotes = $("notes").value;
  alert("Notes saved on this device.");
};
$("date").textContent = new Date()
  .toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  .toUpperCase();
