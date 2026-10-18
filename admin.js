const STORE_KEY = "oy_apps_demo_v1";
const SETTINGS_KEY = "oy_settings_demo_v1";
const PASS_KEY = "oy_demo_pass_v1";
const SESSION_KEY = "oy_demo_session_v1";

const SUPABASE_URL = "https://usqiiwtvmgymdgngdvfh.supabase.co";
const SUPABASE_KEY = "sb_publishable_M0FMsPITFc-IXqo1gWbSbw_N0gk_p-i";
const BUCKET = "game-images";

const $ = id => document.getElementById(id);

function games() {
try {
return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
} catch {
return [];
}
}

function saveGames(items) {
localStorage.setItem(STORE_KEY, JSON.stringify(items));
}

function safeLink(value) {
try {
const u = new URL(value);
return ["http:", "https:"].includes(u.protocol);
} catch {
return false;
}
}

function enter() {
$("loginPanel").classList.add("hidden");
$("adminPanel").classList.remove("hidden");
renderAdmin();

const settings = JSON.parse(
localStorage.getItem(SETTINGS_KEY) || "{}"
);
$("telegramUrl").value = settings.telegram || "";
}

$("login").onclick = () => {
const password = $("password").value;

if (password.length < 8) {
$("loginError").textContent =
"डेमो पासवर्ड कम से कम 8 अक्षर का रखें।";
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

if (galleryInput) {
galleryInput.addEventListener("change", () => {
const file = galleryInput.files[0];

if (!file) {
  preview.hidden = true;
  return;
}

if (!file.type.startsWith("image/")) {
  alert("कृपया फोटो फ़ाइल चुनें।");
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
uploadStatus.textContent = "फोटो चुनी गई है। अब अपलोड करें।";

});
}

if (uploadButton) {
uploadButton.addEventListener("click", async () => {
const file = galleryInput.files[0];

if (!file) {
  alert("पहले मोबाइल गैलरी से फोटो चुनें।");
  return;
}

if (
  !SUPABASE_KEY ||
  SUPABASE_KEY === "PASTE_YOUR_PUBLISHABLE_KEY_HERE"
) {
  alert("पहले कोड में अपनी Supabase Publishable Key डालें।");
  return;
}

if (!window.supabase) {
  alert("Supabase लाइब्रेरी लोड नहीं हुई। इंटरनेट जाँचें।");
  return;
}

uploadButton.disabled = true;
uploadStatus.textContent = "फोटो अपलोड हो रही है, कृपया प्रतीक्षा करें…";

try {
  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  const extension = file.name.includes(".")
    ? file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "")
    : "jpg";

  const filePath =
    Date.now() + "-" + Math.random().toString(36).slice(2, 8) +
    "." + (extension || "jpg");

  const { error } = await client.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;

  const { data } = client.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  $("icon").value = data.publicUrl;
  uploadStatus.textContent =
    "अपलोड सफल! फोटो का URL आइकन बॉक्स में भर गया है। अब Save Game दबाएँ।";

} catch (error) {
  console.error(error);
  uploadStatus.textContent =
    "अपलोड नहीं हुआ: " + (error.message || "कृपया Supabase पॉलिसी जाँचें।");
} finally {
  uploadButton.disabled = false;
}

});
}

function clearForm() {
$("gameForm").reset();
$("gameId").value = "";

if (preview) {
preview.hidden = true;
preview.removeAttribute("src");
}

if (uploadStatus) uploadStatus.textContent = "";
}

$("clear").onclick = clearForm;

$("gameForm").onsubmit = event => {
event.preventDefault();

const name = $("name").value.trim();
const url = $("url").value.trim();
const icon = $("icon").value.trim();

if (!safeLink(url)) {
alert("कृपया सही https:// या http:// लिंक डालें।");
return;
}

if (icon.startsWith("http") && !safeLink(icon)) {
alert("आइकन URL सही नहीं है।");
return;
}

const all = games();
const id = $("gameId").value || ("g" + Date.now());

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

const index = all.findIndex(item => item.id === id);

if (index >= 0) all[index] = game;
else all.unshift(game);

saveGames(all);
clearForm();
renderAdmin();

alert("गेम इस ब्राउज़र में सेव हो गया।");
};

function renderAdmin() {
const root = $("adminGames");
root.innerHTML = "";

games().forEach(game => {
const row = document.createElement("div");
row.className = "admin-item";

const title = document.createElement("span");
title.textContent = (game.icon || "🎮") + " " + game.name;

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

del.onclick = () => {
  if (confirm("इस गेम को हटाएँ?")) {
    saveGames(games().filter(item => item.id !== game.id));
    renderAdmin();
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
alert("सही Telegram URL डालें।");
return;
}

localStorage.setItem(
SETTINGS_KEY,
JSON.stringify({ telegram: value })
);

alert("Telegram लिंक सेव हो गया।");
};

$("logout").onclick = () => {
localStorage.removeItem(SESSION_KEY);
location.reload();
};
