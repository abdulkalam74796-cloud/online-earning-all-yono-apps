const SUPABASE_URL = "https://usqiiwtvmgymdgngdvfh.supabase.co";
const SUPABASE_KEY = "sb_publishable_M0FMsPITFc-IXqo1gWbSbw_N0gk_p-i";
const TELEGRAM_URL = "https://t.me/abdulkalam6201";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

function safeUrl(url) {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol)
      ? u.href
      : "#";
  } catch {
    return "#";
  }
}

async function renderGames(filter = "") {
  const root = document.getElementById("games");
  if (!root) return;

  root.innerHTML = "<p>गेम लोड हो रहे हैं...</p>";

  try {
    const { data, error } = await db
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const games = (data || []).filter(g =>
      `${g.name || ""} ${g.category || ""} ${g.description || ""}`
        .toLowerCase()
        .includes(filter.toLowerCase())
    );

    root.innerHTML = "";

    const count = document.getElementById("count");
    if (count) count.textContent = games.length + " गेम";

    const empty = document.getElementById("empty");
    if (empty) empty.hidden = games.length !== 0;

    games.forEach(g => {
      const card = document.createElement("article");
      card.className = "card";

      const icon = document.createElement("div");
      icon.className = "icon";

      if (g.icon && /^https?:\/\//i.test(g.icon)) {
        const img = document.createElement("img");
        img.src = safeUrl(g.icon);
        img.alt = g.name || "गेम फोटो";
        img.onerror = () => {
          img.remove();
          icon.textContent = "🎮";
        };
        icon.appendChild(img);
      } else {
        icon.textContent = g.icon || "🎮";
      }

      const details = document.createElement("div");
      details.className = "details";

      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = g.category || "Gaming";

      const title = document.createElement("h3");
      title.textContent = g.name || "गेम";

      const desc = document.createElement("p");
      desc.textContent =
        (g.description || "") +
        (g.bonus ? " • " + g.bonus : "") +
        (g.withdrawal ? " • निकासी: " + g.withdrawal : "");

      const actions = document.createElement("div");
      actions.className = "card-actions";

      const link = document.createElement("a");
      link.className = "btn";
      link.href = safeUrl(g.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "⬇ Open / Download";

      const telegramLink = document.createElement("a");
      telegramLink.className = "btn telegram-btn";
      telegramLink.href = TELEGRAM_URL;
      telegramLink.target = "_blank";
      telegramLink.rel = "noopener noreferrer";
      telegramLink.textContent = "✈ TG Join";
      telegramLink.setAttribute("aria-label", "Telegram चैनल से जुड़ें");

      actions.append(link, telegramLink);
      details.append(badge, title, desc, actions);
      card.append(icon, details);
      root.appendChild(card);
    });

    const telegram = document.getElementById("telegram");
    if (telegram) {
      telegram.href = TELEGRAM_URL;
      telegram.hidden = false;
    }

  } catch (error) {
    console.error("Supabase games error:", error);
    root.innerHTML =
      "<p>गेम लोड नहीं हुए। कृपया थोड़ी देर बाद दोबारा कोशिश करें।</p>";
  }
}

const search = document.getElementById("search");

if (search) {
  search.addEventListener("input", e => {
    renderGames(e.target.value);
  });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

if (document.getElementById("games")) {
  renderGames();
}
