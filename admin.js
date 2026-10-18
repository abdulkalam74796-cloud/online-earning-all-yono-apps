const STORE_KEY="oy_apps_demo_v1", SETTINGS_KEY="oy_settings_demo_v1", PASS_KEY="oy_demo_pass_v1", SESSION_KEY="oy_demo_session_v1";
const $=id=>document.getElementById(id);
function games(){try{return JSON.parse(localStorage.getItem(STORE_KEY))||[]}catch{return []}}
function saveGames(x){localStorage.setItem(STORE_KEY,JSON.stringify(x))}
function safeLink(s){try{let u=new URL(s);return ["http:","https:"].includes(u.protocol)}catch{return false}}
function enter(){ $("loginPanel").classList.add("hidden");$("adminPanel").classList.remove("hidden");renderAdmin();const s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}");$("telegramUrl").value=s.telegram||""}
$("login").onclick=()=>{const p=$("password").value;if(p.length<8){$("loginError").textContent="डेमो पासवर्ड कम से कम 8 अक्षर का रखें।";return}
 let saved=localStorage.getItem(PASS_KEY);if(!saved){localStorage.setItem(PASS_KEY,p);localStorage.setItem(SESSION_KEY,"yes");enter()}else if(saved===p){localStorage.setItem(SESSION_KEY,"yes");enter()}else $("loginError").textContent="पासवर्ड सही नहीं है।"};
if(localStorage.getItem(SESSION_KEY)==="yes")enter();
function clearForm(){$("gameForm").reset();$("gameId").value=""}
$("clear").onclick=clearForm;
$("gameForm").onsubmit=e=>{e.preventDefault();const name=$("name").value.trim(),url=$("url").value.trim(),icon=$("icon").value.trim();
 if(!safeLink(url)){alert("कृपया सही https:// या http:// लिंक डालें।");return}if(icon.startsWith("http")&&!safeLink(icon)){alert("आइकन URL सही नहीं है।");return}
 const all=games(),id=$("gameId").value||("g"+Date.now());
 const g={id,name,category:$("category").value,icon,url,bonus:$("bonus").value.trim(),withdrawal:$("withdrawal").value.trim(),description:$("description").value.trim()};
 const i=all.findIndex(x=>x.id===id);if(i>=0)all[i]=g;else all.unshift(g);saveGames(all);clearForm();renderAdmin();alert("इस ब्राउज़र में सेव हो गया।")};
function renderAdmin(){const root=$("adminGames");root.innerHTML="";games().forEach(g=>{const row=document.createElement("div");row.className="admin-item";const title=document.createElement("span");title.textContent=(g.icon||"🎮")+" "+g.name;const controls=document.createElement("span");const edit=document.createElement("button");edit.textContent="Edit";edit.style.marginRight="6px";edit.onclick=()=>{["name","category","icon","url","bonus","withdrawal","description"].forEach(k=>$(k).value=g[k]||"");$("gameId").value=g.id;window.scrollTo({top:0,behavior:"smooth"})};const del=document.createElement("button");del.textContent="Delete";del.onclick=()=>{if(confirm("इस गेम को हटाएँ?")){saveGames(games().filter(x=>x.id!==g.id));renderAdmin()}};controls.append(edit,del);row.append(title,controls);root.append(row)})}
$("saveSettings").onclick=()=>{const v=$("telegramUrl").value.trim();if(v&&!safeLink(v)){alert("सही Telegram URL डालें।");return}localStorage.setItem(SETTINGS_KEY,JSON.stringify({telegram:v}));alert("Telegram लिंक सेव हो गया।")};
$("logout").onclick=()=>{localStorage.removeItem(SESSION_KEY);location.reload()};
