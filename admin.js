const STORE_KEY = "oy_apps_demo_v1";
const SETTINGS_KEY = "oy_settings_demo_v1";
const PASS_KEY = "oy_demo_pass_v1";
const SESSION_KEY = "oy_demo_session_v1";

const SUPABASE_URL = "https://usqiiwtvmgymdgngdvfh.supabase.co";
const SUPABASE_KEY = "sb_publishable_M0FMsPITFc-IXqo1gWbSbw_N0gk_p-i";
const BUCKET = "game-images";

const $ = id => document.getElementById(id);

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

function safeLink(value) {
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

async function games() {
  const { data, error } = await db
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function loadGames() {
  try {
    renderAdmin(await games());
  } catch (error) {
    console.error(error);
    $("adminGames").textContent =
      "गेम लोड नहीं हुए: " + error.message;
  }
}

function enter() {
  $("loginPanel").classList.add("hidden");
  $("adminPanel").classList.remove("hidden");

  const settings = JSON.parse(
    localStorage.getItem(SETTINGS_KEY) || "{}"
  );

  $("telegramUrl").value = settings.telegram || "";
  loadGames();
}

$("login").onclick = () => {
  const password = $("password").value;

  if (password.length < 8) {
    $("loginError").textContent =
      "पासवर्ड कम से कम 8 अक्षर का रखें।";
    return;
  }

  const saved = localStorage.getItem(PASS_KEY);

  if (!saved) {
    localStorage.setItem(PASS_KEY, password);
    localStorage.setItem(SESSION_KEY, "yes");
    enter();
  } else if (saved === password) {
    localStorage.setItem(SESSION_KEY, "yes");
    enter();
  } else {
    $("loginError").textContent = "पासवर्ड सही नहीं है।";
  }
};

if (localStorage.getItem(SESSION_KEY) === "yes") {
  enter();
}

const galleryInput = $("galleryImage");
const preview = $("imagePreview");
const uploadButton = $("uploadImage");
const uploadStatus = $("uploadStatus");

galleryInput.addEventListener("change", () => {
  const file = galleryInput.files[0];

  if (!file) {
    preview.hidden = true;
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("कृपया फोटो चुनें।");
    galleryInput.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("फोटो 5 MB से छोटी चुनें।");
    galleryInput.value = "";
    return;
  }

  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  uploadStatus.textContent =
    "फोटो चुनी गई है। अब अपलोड करें।";
});

uploadButton.onclick = async () => {
  const file = galleryInput.files[0];

  if (!file) {
    alert("पहले गैलरी से फोटो चुनें।");
    return;
  }

  uploadButton.disabled = true;
  uploadStatus.textContent = "फोटो अपलोड हो रही है…";

  try {
    const extension =
      file.name.split(".").pop().toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";

    const filePath =
      Date.now() + "-" +
      Math.random().toString(36).slice(2, 10) +
      "." + extension;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    const { data } = db.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    $("icon").value = data.publicUrl;
    uploadStatus.textContent =
      "फोटो अपलोड हो गई! अब Save Game दबाएँ।";

  } catch (error) {
    console.error(error);
    uploadStatus.textContent =
      "अपलोड में समस्या: " + error.message;
  } finally {
    uploadButton.disabled = false;
  }
};

$("gameForm").onsubmit = async event => {
  event.preventDefault();

  const id = $("gameId").value || crypto.randomUUID();
  const name = $("name").value.trim();
  const url = $("url").value.trim();
  const icon = $("icon").value.trim();

  if (!safeLink(url)) {
    alert("सही गेम लिंक डालें।");
    return;
  }

  if (icon.startsWith("http") && !safeLink(icon)) {
    alert("फोटो URL सही नहीं है।");
    return;
  }

  const game = {
    id,
    name,
    category: $("category").value,
    icon,
    url,
    bonus: $("bonus").value.trim(),
    withdrawal: $("withdrawal").value.trim(),
    description: $("description").value.trim()
  };

  const saveButton =
    $("gameForm").querySelector('[type="submit"]');

  saveButton.disabled = true;

  try {
    const { error } = await db
      .from("games")
      .upsert(game, { onConflict: "id" });

    if (error) throw error;

    $("gameForm").reset();
    $("gameId").value = "";
    preview.hidden = true;
    preview.removeAttribute("src");
    uploadStatus.textContent = "";

    await loadGames();
    alert("गेम डेटाबेस में सेव हो गया!");

  } catch (error) {
    console.error(error);
    alert(
      "गेम सेव नहीं हुआ: " + error.message +
      "\nSupabase की INSERT/UPDATE policies जाँचें।"
    );
  } finally {
    saveButton.disabled = false;
  }
};

$("clear").onclick = () => {
  $("gameForm").reset();
  $("gameId").value = "";
  preview.hidden = true;
  preview.removeAttribute("src");
  uploadStatus.textContent = "";
};

async function renderAdmin(items) {
  const root = $("adminGames");
  root.replaceChildren();

  items.forEach(game => {
    const row = document.createElement("div");
    row.className = "admin-item";

    const title = document.createElement("span");
    title.textContent =
      (game.icon && !game.icon.startsWith("http")
        ? game.icon + " "
        : "") + game.name;

    const controls = document.createElement("span");

    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.style.marginRight = "6px";

    edit.onclick = () => {
      [
        "name", "category", "icon", "url",
        "bonus", "withdrawal", "description"
      ].forEach(key => {
        $(key).value = game[key] || "";
      });

      $("gameId").value = game.id;
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const del = document.createElement("button");
    del.textContent = "Delete";

    del.onclick = async () => {
      if (!confirm("क्या इस गेम को हटाना है?")) return;

      try {
        const { error } = await db
          .from("games")
          .delete()
          .eq("id", game.id);

        if (error) throw error;

        await loadGames();
        alert("गेम हटा दिया गया।");
      } catch (error) {
        alert("गेम नहीं हटा: " + error.message);
      }
    };

    controls.append(edit, del);
    row.append(title, controls);
    root.append(row);
  });
}

$("saveSettings").onclick = () => {
  const value = $("telegramUrl").value.trim();

  if (value && !safeLink(value)) {
    alert("सही Telegram लिंक डालें।");
    return;
  }

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ telegram: value })
  );

  alert("Telegram लिंक इसी ब्राउज़र में सेव हुआ।");
};

$("logout").onclick = () => {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
};
