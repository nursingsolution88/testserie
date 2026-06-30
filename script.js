      ${review
        .map(
          (item, index) => `
            <div class="review-item ${item.isCorrect ? "correct" : "wrong"}">
              <strong>Q${index + 1}. ${escapeHtml(item.question)}</strong>
              <p>Your answer: ${escapeHtml(item.selected || "Not attempted")}</p>
              <p>Correct answer: ${escapeHtml(item.correctAnswer)}</p>
              <p>${escapeHtml(item.explanation)}</p>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function showMessage(text) {
  $("#authMessage").textContent = text;
}

function showPayment(itemTitle, link) {
  $("#paySummary").innerHTML = `
    <div class="payment-box">
      <h3>${escapeHtml(itemTitle)}</h3>
      <p>Payment complete karne ke baad admin Google Sheet ke Access Control tab me aapka access Active karega. Refresh button dabane par item unlock ho jayega.</p>
      ${
        link
          ? `<button class="pay-button" data-open-pay-link="${escapeHtml(link)}" type="button">Open Razorpay link</button>`
          : `<button class="secondary-button" type="button" disabled>Payment link not added yet</button>`
      }
    </div>
  `;
  $("#payDialog").showModal();
}

$("#loginTab").addEventListener("click", () => setAuthMode("login"));
$("#registerTab").addEventListener("click", () => setAuthMode("register"));

$("#registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  setBusy(true, "Creating account...");
  try {
    const response = await apiRequest("register", data);
    state.user = response.user;
    writeJson(STORE.session, state.user);
    await showWorkspace();
  } catch (error) {
    showMessage(error.message);
  } finally {
    setBusy(false);
  }
});

$("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  setBusy(true, "Logging in...");
  try {
    const response = await apiRequest("login", data);
    state.user = response.user;
    writeJson(STORE.session, state.user);
    await showWorkspace();
  } catch (error) {
    showMessage(error.message);
  } finally {
    setBusy(false);
  }
});

$("#logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(STORE.session);
  location.reload();
});

$("#refreshBtn").addEventListener("click", refreshData);

$("#navList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (button) switchView(button.dataset.view);
});

document.addEventListener("click", async (event) => {
  const retry = event.target.closest("[data-retry-load]");
  if (retry) refreshData();

  const jump = event.target.closest("[data-view-jump]");
  if (jump) switchView(jump.dataset.viewJump);

  const pay = event.target.closest("[data-pay-url]");
  if (pay) showPayment(pay.dataset.payTitle, pay.dataset.payUrl);

  const openPay = event.target.closest("[data-open-pay-link]");
  if (openPay && openPay.dataset.openPayLink) {
    window.open(openPay.dataset.openPayLink, "_blank", "noopener");
  }

  const note = event.target.closest("[data-open-note]");
  if (note) {
    if (!note.dataset.openNote) {
      alert("Note link is not added yet.");
      return;
    }
    window.open(note.dataset.openNote, "_blank", "noopener");
  }

  const start = event.target.closest("[data-start-test]");
  if (start) {
    try {
      await startTest(start.dataset.startTest);
    } catch (error) {
      const test = state.tests.find((item) => item.testName === start.dataset.startTest);
      if (test && isPaid(test)) showPayment(test.testName, test.razorpayLink);
      else alert(error.message);
    }
  }

  const answer = event.target.closest("[data-answer]");
  if (answer) {
    state.activeAnswers[String(state.activeIndex)] = answer.dataset.answer;
    renderQuestion();
  }

  const palette = event.target.closest("[data-question-index]");
  if (palette) {
    state.activeIndex = Number(palette.dataset.questionIndex);
    renderQuestion();
  }

  const resultButton = event.target.closest("[data-result-id]");
  if (resultButton) {
    const result = state.results.find((item) => item.resultId === resultButton.dataset.resultId);
    if (result) showResult(result);
  }
});

$("#prevQuestion").addEventListener("click", () => {
  state.activeIndex = Math.max(0, state.activeIndex - 1);
  renderQuestion();
});

$("#nextQuestion").addEventListener("click", () => {
  state.activeIndex = Math.min(state.activeQuestions.length - 1, state.activeIndex + 1);
  renderQuestion();
});

$("#submitTest").addEventListener("click", () => {
  const unanswered = state.activeQuestions.length - Object.keys(state.activeAnswers).length;
  const ok = unanswered
    ? confirm(`${unanswered} questions are unanswered. Submit now?`)
    : confirm("Submit this test now?");
  if (ok) submitActiveTest(false);
});

$("#closeResult").addEventListener("click", () => $("#resultDialog").close());
$("#closePay").addEventListener("click", () => $("#payDialog").close());
$("#testSearch").addEventListener("input", () => renderTests("#testList", filteredTests(), false));
$("#subjectFilter").addEventListener("change", () => renderTests("#testList", filteredTests(), false));
$("#accessFilter").addEventListener("change", () => renderTests("#testList", filteredTests(), false));
$("#noteSearch").addEventListener("input", () => renderNotes("#noteList", filteredNotes(), false));
$("#noteSubjectFilter").addEventListener("change", () => renderNotes("#noteList", filteredNotes(), false));

loadApp();
