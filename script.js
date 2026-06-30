async function apiRequest(action, payload = {}) {
  if (!CONFIG.googleAppsScriptUrl) {
    throw new Error("Apps Script URL missing");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);

  try {
    const response = await fetch(CONFIG.googleAppsScriptUrl, {
      method: "POST",

      // ✅ IMPORTANT FIX: no headers (THIS FIXES CORS ISSUE)
      body: JSON.stringify({
        action,
        ...payload,
      }),

      signal: controller.signal,
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log("RAW RESPONSE:", text);
      throw new Error("Server JSON invalid. Apps Script response check karo.");
    }

    if (!data.ok) throw new Error(data.error || "Request failed");

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Server timeout - Apps Script slow or blocked");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
