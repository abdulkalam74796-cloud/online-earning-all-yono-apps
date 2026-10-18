const STORE_KEY = "oy_apps_demo_v1";
const SETTINGS_KEY = "oy_settings_demo_v1";
const seedGames = [
  {id:"sample1",name:"आपका पहला गेम",category:"Gaming",bonus:"बोनस की जानकारी यहाँ",withdrawal:"नियम जाँचें",url:"https://example.com",icon:"🎮",description:"यह नमूना कार्ड है। Admin Panel से इसे बदलें या हटाएँ।"},
  {id:"sample2",name:"अपना Referral App जोड़ें",category:"Referral",bonus:"शर्तें लागू",withdrawal:"कंपनी के नियम देखें",url:"https://example.com",icon:"🕹️",description:"यहाँ गेम का छोटा विवरण लिखें।"}
];
function loadGames(){try{const x=JSON.parse(localStorage.getItem(STORE_KEY));return Array.isArray(x)?x:seedGames}catch{return seedGames}}
function safeUrl(url){try{const u=new URL(url);return ["http:","https:"].includes(u.protocol)?u.href:"#"}catch{return "#"}}
function renderGames(filter=""){
 const list=loadGames().filter(g=>(g.name+" "+g.category+" "+g.description).toLowerCase().includes(filter.toLowerCase()));
 const root=document.getElementById("games"); if(!root)return;
 root.innerHTML=""; document.getElementById("count").textContent=list.length+" गेम";
 document.getElementById("empty").hidden=list.length!==0;
 list.forEach(g=>{const card=document.createElement("article");card.className="card";
 const icon=document.createElement("div");icon.className="icon";
 if(g.icon && /^https?:\/\//i.test(g.icon)){const img=document.createElement("img");img.src=safeUrl(g.icon);img.alt="";img.onerror=()=>{icon.textContent="🎮"};icon.appendChild(img)}else icon.textContent=g.icon||"🎮";
 const details=document.createElement("div");details.className="details";
 const badge=document.createElement("span");badge.className="badge";badge.textContent=g.category||"Gaming";
 const title=document.createElement("h3");title.textContent=g.name||"Unnamed Game";
 const desc=document.createElement("p");desc.textContent=(g.description||"")+(g.bonus?" • "+g.bonus:"")+(g.withdrawal?" • निकासी: "+g.withdrawal:"");
 const link=document.createElement("a");link.className="btn";link.href=safeUrl(g.url);link.target="_blank";link.rel="noopener noreferrer";link.textContent="Open / Download";
 details.append(badge,title,desc,link);card.append(icon,details);root.appendChild(card);
 });
 const settings=JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}");const tg=document.getElementById("telegram");
 if(settings.telegram){tg.href=safeUrl(settings.telegram);tg.hidden=false}
}
if(document.getElementById("games")){document.getElementById("search").addEventListener("input",e=>renderGames(e.target.value));document.getElementById("year").textContent=new Date().getFullYear();renderGames()}
