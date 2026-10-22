const SUPABASE_URL = "https://usqiiwtvmgymdgngdvfh.supabase.co";
const SUPABASE_KEY = "sb_publishable_M0FMsPITFc-IXqo1gWbSbw_N0gk_p-i";
const TELEGRAM_URL = "https://t.me/abdulkalam6201";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let allGames = [];
let activeCategory = "all";

const $ = id => document.getElementById(id);

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

function getCategory(game) {
  const category = String(game.category || "")
    .trim()
    .toLowerCase();

  if (category === "gaming" || category === "yono games" || category === "yono") {
    return "yono";
  }

  if (category === "diwa games" || category === "diwa") {
    return "diwa";
  }

  return "other";
}

function getCategoryName(category) {
  if (category === "yono") return "🎮 Yono Games";
  if (category === "diwa") return "🎲 Diwa Games";
  if (category === "other") return "🕹️ Other Games";
  return "सभी गेम्स";
}

async function loadGames() {
  const root = $("games");
  if (!root) return;

  root.innerHTML = "<p>गेम लोड हो रहे हैं...</p>";

  try {
    const { data, error } = await db
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    allGames = data || [];
    renderGames();

  } catch (error) {
    console.error("Supabase games error:", error);
    root.innerHTML =
      "<p>गेम लोड नहीं हुए। कृपया थोड़ी देर बाद दोबारा कोशिश करें।</p>";

    if ($("count")) $("count").textContent = "लोड नहीं हुआ";
  }
}

function renderGames() {
  const root = $("games");
  if (!root) return;

  const searchText = $("search")
    ? $("search").value.trim().toLowerCase()
    : "";

  const games = allGames.filter(game => {
    const matchesCategory =
      activeCategory === "all" ||
      getCategory(game) === activeCategory;

    const searchableText = [
      game.name,
      game.category,
      game.description,
      game.bonus,
      game.withdrawal
    ].filter(Boolean).join(" ").toLowerCase();

    const matchesSearch = searchableText.includes(searchText);

    return matchesCategory && matchesSearch;
  });

  root.replaceChildren();

  if ($("count")) {
    $("count").textContent = games.length + " गेम";
  }

  if ($("categoryTitle")) {
    $("categoryTitle").textContent = getCategoryName(activeCategory);
  }

  if ($("empty")) {
    $("empty").hidden = games.length !== 0;
  }

  games.forEach(game => {
    const card = document.createElement("article");
    card.className = "card";

    const icon = document.createElement("div");
    icon.className = "icon";

    if (game.icon && /^https?:\/\//i.test(game.icon)) {
      const img = document.createElement("img");
      img.src = safeUrl(game.icon);
      img.alt = game.name || "गेम फोटो";

      img.onerror = () => {
        img.remove();
        icon.textContent = "🎮";
      };

      icon.appendChild(img);
    } else {
      icon.textContent = game.icon || "🎮";
    }

    const details = document.createElement("div");
    details.className = "details";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = getCategoryName(getCategory(game));

    const title = document.createElement("h3");
    title.textContent = game.name || "गेम";

    const desc = document.createElement("p");
    desc.textContent =
      (game.description || "") +
      (game.bonus ? " • " + game.bonus : "") +
      (game.withdrawal ? " • निकासी: " + game.withdrawal : "");

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const link = document.createElement("a");
    link.className = "btn";
    link.href = safeUrl(game.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "⬇ Open / Download";

    const telegramLink = document.createElement("a");
    telegramLink.className = "btn telegram-btn";
    telegramLink.href = TELEGRAM_URL;
    telegramLink.target = "_blank";
    telegramLink.rel = "noopener noreferrer";
    telegramLink.textContent = "✈ TG Join";
    telegramLink.setAttribute(
      "aria-label",
      "Telegram चैनल से जुड़ें"
    );

    actions.append(link, telegramLink);
    details.append(badge, title, desc, actions);
    card.append(icon, details);
    root.appendChild(card);
  });

  const telegram = $("telegram");
  if (telegram) {
    telegram.href = TELEGRAM_URL;
    telegram.hidden = false;
  }
}

const search = $("search");

if (search) {
  search.addEventListener("input", renderGames);
}

document.querySelectorAll("[data-category]").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category || "all";

    document.querySelectorAll("[data-category]").forEach(item => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });

    renderGames();
  });
});

if ($("year")) {
  $("year").textContent = new Date().getFullYear();
}

loadGames();
