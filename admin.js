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

function showError(message) {
  alert(message);
}

async function getGames() {
  const { data, error } = await db
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function loadGames() {
  try {
    renderAdmin(await getGames());
  } catch (error) {
    console.error(error);
    $("adminGames").textContent =
      "गेम लोड नहीं हुए: " + error.message;
  }
}

async function checkSession() {
  const { data } = await db.auth.getSession();

  if (data.session) {
    $("loginPanel").classList.add("hidden");
    $("adminPanel").classList.remove("hidden");
    await loadGames();
  } else {
    $("loginPanel").classList.remove("hidden");
    $("adminPanel").classList.add("hidden");
  }
}

$("login").onclick = async () => {
  const email = $("email")?.value.trim();
  const password = $("password").value;

  if (!email) {
    $("loginError").textContent =
      "कृपया अपना एडमिन ईमेल भरें।";
    return;
  }

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    $("loginError").textContent =
      "लॉगिन नहीं हुआ: " + error.message;
    return;
  }

  await checkSession();
};

const logoutButton = $("logout");
if (logoutButton) {
  logoutButton.onclick = async () => {
    await db.auth.signOut();
    location.reload();
  };
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
  uploadStatus.textContent =
    "फोटो चुनी गई है। अब अपलोड करें।";
});

uploadButton.onclick = async () => {
  const file = galleryInput.files[0];

  if (!file) {
    alert("पहले मोबाइल गैलरी से फोटो चुनें।");
    return;
  }

  const { data: sessionData } = await db.auth.getSession();

  if (!sessionData.session) {
    alert("पहले एडमिन ईमेल और पासवर्ड से लॉगिन करें।");
    return;
  }

  uploadButton.disabled = true;
  uploadStatus.textContent = "फोटो अपलोड हो रही है…";

  try {
    const extension =
      file.name.split(".").pop().toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";

    const path =
      Date.now() + "-" +
      Math.random().toString(36).slice(2, 9) +
      "." + extension;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    const { data } = db.storage
      .from(BUCKET)
      .getPublicUrl(path);

    $("icon").value = data.publicUrl;
    uploadStatus.textContent =
      "फोटो अपलोड हो गई! अब Save Game दबाएँ।";

  } catch (error) {
    uploadStatus.textContent =
      "फोटो अपलोड नहीं हुई: " + error.message;
  } finally {
    uploadButton.disabled = false;
  }
};

$("gameForm").onsubmit = async event => {
  event.preventDefault();

  const { data: sessionData } = await db.auth.getSession();

  if (!sessionData.session) {
    alert("पहले एडमिन लॉगिन करें।");
    return;
  }

  const id = $("gameId").value || crypto.randomUUID();
  const url = $("url").value.trim();
  const icon = $("icon").value.trim();

  if (!safeLink(url)) {
    alert("सही Referral / Download लिंक डालें।");
    return;
  }

  const game = {
    id,
    name: $("name").value.trim(),
    category: $("category").value,
    icon,
    url,
    bonus: $("bonus").value.trim(),
    withdrawal: $("withdrawal").value.trim(),
    description: $("description").value.trim()
  };

  const button =
    $("gameForm").querySelector('[type="submit"]');

  button.disabled = true;

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
    alert("गेम सेव नहीं हुआ: " + error.message);
  } finally {
    button.disabled = false;
  }
};

$("clear").onclick = () => {
  $("gameForm").reset();
  $("gameId").value = "";
  preview.hidden = true;
  preview.removeAttribute("src");
  uploadStatus.textContent = "";
};

function renderAdmin(items) {
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

    const edit = document.createElement("button");
    edit.textContent = "Edit";

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

      const { error } = await db
        .from("games")
        .delete()
        .eq("id", game.id);

      if (error) {
        alert("गेम नहीं हटा: " + error.message);
        return;
      }

      await loadGames();
    };

    row.append(title, edit, del);
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
    "oy_settings_demo_v1",
    JSON.stringify({ telegram: value })
  );

  alert("Telegram लिंक सेव हो गया।");
};

checkSession();
