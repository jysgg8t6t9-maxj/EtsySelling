/* ============================================================
   Personal Budget App  —  app.js   (vanilla JS, no dependencies)
   Data is saved locally in this browser only. Nothing is sent anywhere.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- icons ---------- */
  const I = {
    dashboard:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    tx:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h12m0 0-3-3m3 3-3 3M20 17H8m0 0 3-3m-3 3 3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    budget:'<svg viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 9-9v9H3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 3a9 9 0 0 1 9 9h-9V3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    debt:'<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.7"/></svg>',
    goal:'<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.2" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="3.4" stroke="currentColor" stroke-width="1.7"/></svg>',
    settings:'<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2l-.4-2.6H8.9l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 4 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2l.4 2.6h4.2l.4-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    edit:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m13.5 6.5 4 4" stroke="currentColor" stroke-width="1.7"/></svg>',
    del:'<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M10 7V5h4v2m1 0-.5 13h-9L5 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-3-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4 10-11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    wallet:'<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M16 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };

  /* ---------- data ---------- */
  const KEY = "pba.v1";
  const DEFAULT_EXP = ["Rent / Mortgage","Utilities","Groceries","Dining & Takeout","Transport","Subscriptions","Health & Fitness","Shopping","Entertainment","Personal Care","Savings","Miscellaneous"];
  const DEFAULT_INC = ["Salary","Side Income","Other"];

  function blank() {
    const m = new Date().toISOString().slice(0, 7);
    return {
      meta:{ brand:"My Budget", tag:"your money, in focus", currency:"£", passcode:"" },
      ui:{ view:"dashboard", month:m },
      cats:{ income:[...DEFAULT_INC], expense:[...DEFAULT_EXP] },
      budgets:{},                 // {category: plannedAmount}
      transactions:[],            // {id,date,desc,type,category,amount}
      debts:[],                   // {id,name,balance,apr,min}
      goals:[]                    // {id,name,target,saved,date}
    };
  }
  let S = load();
  function load(){ try{ const r = localStorage.getItem(KEY); return r ? Object.assign(blank(), JSON.parse(r)) : blank(); }catch(e){ return blank(); } }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){ toast("Couldn't save — storage may be full","warn"); } }

  /* ---------- helpers ---------- */
  const $ = (s, r=document) => r.querySelector(s);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function money(n){
    const c = S.meta.currency || "£";
    const v = Math.abs(Number(n)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
    return (n<0?"-":"") + c + v;
  }
  const monthTx = () => S.transactions.filter(t => (t.date||"").slice(0,7) === S.ui.month);
  function monthLabel(m){ const [y,mo]=m.split("-"); return new Date(y, mo-1, 1).toLocaleDateString(undefined,{month:"long",year:"numeric"}); }
  function shiftMonth(d){ const [y,mo]=S.ui.month.split("-").map(Number); const dt=new Date(y,mo-1+d,1); S.ui.month=dt.toISOString().slice(0,7); save(); render(); }

  /* ---------- nav ---------- */
  const NAV = [["dashboard","Dashboard",I.dashboard],["transactions","Transactions",I.tx],["budget","Budget",I.budget],["debts","Debts",I.debt],["goals","Goals",I.goal],["settings","Settings",I.settings]];
  const TITLES = {dashboard:"Dashboard",transactions:"Transactions",budget:"Monthly Budget",debts:"Debt Payoff",goals:"Savings Goals",settings:"Settings"};
  function paintNav(){
    $("#nav").innerHTML = NAV.map(([id,label,ic]) =>
      `<button class="nav-item ${S.ui.view===id?"active":""}" data-act="nav" data-id="${id}">${ic}<span>${label}</span></button>`).join("");
    const mob = [NAV[0],NAV[1],NAV[2],NAV[4],NAV[5]];
    $("#mobileBar").innerHTML = mob.map(([id,label,ic]) =>
      `<button class="${S.ui.view===id?"active":""}" data-act="nav" data-id="${id}">${ic}<span>${label}</span></button>`).join("");
    $("#brandName").childNodes[0].nodeValue = S.meta.brand || "My Budget";
    $("#brandTag").textContent = S.meta.tag || "";
    document.title = (S.meta.brand||"My Budget");
  }

  /* ---------- render router ---------- */
  function render(){
    paintNav();
    $("#viewTitle").textContent = TITLES[S.ui.view];
    $("#monthLabel").textContent = monthLabel(S.ui.month);
    const showMonth = ["dashboard","transactions","budget"].includes(S.ui.view);
    $("#monthNav").style.visibility = showMonth ? "visible" : "hidden";
    ({dashboard:viewDashboard,transactions:viewTransactions,budget:viewBudget,debts:viewDebts,goals:viewGoals,settings:viewSettings}[S.ui.view])();
  }

  /* ---------- DASHBOARD ---------- */
  function viewDashboard(){
    const tx = monthTx();
    const income = tx.filter(t=>t.type==="income").reduce((a,b)=>a+ +b.amount,0);
    const spent  = tx.filter(t=>t.type==="expense").reduce((a,b)=>a+ +b.amount,0);
    const net = income - spent;
    const planned = S.cats.expense.reduce((a,c)=>a + (+S.budgets[c]||0),0);
    const left = planned - spent;
    const pctSpent = planned>0 ? Math.min(spent/planned*100,100) : 0;
    const savingsRate = income>0 ? net/income*100 : 0;
    let ringColor = "#9FE6C4"; if(pctSpent>=90) ringColor="#F2B6A6"; else if(pctSpent>=70) ringColor="#F4D08A";

    const heroFig = planned>0 ? money(left) : money(net);
    const heroLbl = planned>0 ? "Left to spend this month" : "Net this month";
    const heroSub = planned>0 ? `of <b>${money(planned)}</b> planned · ${money(spent)} spent`
                              : `<b>${money(income)}</b> in · ${money(spent)} out`;
    const ringInner = planned>0
      ? `<div class="ring-txt"><div class="pct num">${Math.round(pctSpent)}%</div><div class="cap">spent</div></div>`
      : `<div class="ring-txt"><div class="cap" style="padding:0 10px">Set a budget to see your gauge</div></div>`;

    // category bars
    const cats = S.cats.expense.map(c=>{
      const sp = tx.filter(t=>t.type==="expense"&&t.category===c).reduce((a,b)=>a+ +b.amount,0);
      const pl = +S.budgets[c]||0;
      return {c,sp,pl};
    }).filter(x=>x.sp>0||x.pl>0).sort((a,b)=>b.sp-a.sp).slice(0,7);
    const barsHtml = cats.length ? cats.map(x=>{
      const pct = x.pl>0 ? Math.min(x.sp/x.pl*100,100) : (x.sp>0?100:0);
      const cls = x.pl>0 && x.sp>x.pl ? "over" : (x.pl>0 && x.sp>=x.pl*0.85 ? "near" : "");
      const meta = x.pl>0 ? `<b>${money(x.sp)}</b> of ${money(x.pl)}` : `<b>${money(x.sp)}</b>`;
      return `<div class="row"><div class="top"><span class="name">${esc(x.c)}</span><span class="amt">${meta}</span></div>
        <div class="track"><span class="${cls}" style="width:${pct}%"></span></div></div>`;
    }).join("") : `<p style="color:var(--muted);font-size:.9rem">No spending logged yet this month.</p>`;

    // recent
    const recent = [...tx].sort((a,b)=> (b.date>a.date?1:-1)).slice(0,6);
    const recentHtml = recent.length ? `<div class="txlist">${recent.map(txRow).join("")}</div>`
      : `<p style="color:var(--muted);font-size:.9rem">Nothing logged yet. Hit “Add transaction”.</p>`;

    $("#view").innerHTML = `
      <div class="hero">
        <div>
          <div class="hero-label">${heroLbl}</div>
          <div class="hero-figure num">${heroFig}</div>
          <div class="hero-sub num">${heroSub}</div>
        </div>
        <div class="ring" style="--p:${pctSpent}; --c:${ringColor}">${ringInner}</div>
      </div>

      <div class="grid stats">
        ${stat("Income", money(income), "var(--pos)", income>0?"pos":"")}
        ${stat("Spent", money(spent), "var(--neg)", "")}
        ${stat("Net", money(net), net>=0?"var(--pos)":"var(--neg)", net>=0?"pos":"neg")}
        ${stat("Savings rate", (income>0?Math.round(savingsRate):0)+"%", "var(--brand)", "")}
      </div>

      <div class="grid cols">
        <div class="card card-pad">
          <div class="section-title">Spending by category</div>
          <div class="catbar">${barsHtml}</div>
        </div>
        <div class="card card-pad">
          <div class="section-title">Recent activity</div>
          ${recentHtml}
        </div>
      </div>`;
  }
  function stat(lbl,val,dot,cls){
    return `<div class="card stat"><div class="lbl"><span class="dot" style="background:${dot}"></span>${lbl}</div><div class="val ${cls} num">${val}</div></div>`;
  }
  function txRow(t){
    const inc = t.type==="income";
    return `<div class="tx">
      <div class="tx-ico ${inc?"inc":"exp"}">${inc?"+":"–"}</div>
      <div class="tx-main"><div class="tx-desc">${esc(t.desc||t.category||"—")}</div>
        <div class="tx-meta"><span class="chip">${esc(t.category||"—")}</span><span class="num">${esc(t.date)}</span></div></div>
      <div class="tx-amt ${inc?"inc":"exp"} num">${inc?"+":"-"}${money(t.amount)}</div>
      <div class="tx-actions">
        <button class="icon-btn" data-act="edit-tx" data-id="${t.id}" aria-label="Edit">${I.edit}</button>
        <button class="icon-btn danger" data-act="del-tx" data-id="${t.id}" aria-label="Delete">${I.del}</button>
      </div></div>`;
  }

  /* ---------- TRANSACTIONS ---------- */
  let txFilter = {q:"",type:"all",cat:"all"};
  function viewTransactions(){
    let list = monthTx().slice().sort((a,b)=> (b.date>a.date?1:-1));
    if(txFilter.type!=="all") list=list.filter(t=>t.type===txFilter.type);
    if(txFilter.cat!=="all") list=list.filter(t=>t.category===txFilter.cat);
    if(txFilter.q) list=list.filter(t=>(t.desc||"").toLowerCase().includes(txFilter.q.toLowerCase()));
    const allCats = [...S.cats.income,...S.cats.expense];
    const body = list.length ? `<div class="txlist">${list.map(txRow).join("")}</div>` : emptyState(I.tx,"No transactions here","Add your income and spending to see it all in one place. Your budget updates automatically.","Add transaction","add-tx");
    $("#view").innerHTML = `
      <div class="card card-pad">
        <div class="list-head">
          <div class="toolbar">
            <div class="search"><span>${I.search}</span><input class="input" id="txSearch" placeholder="Search" value="${esc(txFilter.q)}"></div>
            <select class="input" id="txType"><option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option></select>
            <select class="input" id="txCat"><option value="all">All categories</option>${allCats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select>
          </div>
          <button class="btn btn-accent btn-sm" data-act="add-tx">${I.plus} Add</button>
        </div>
        ${body}
      </div>`;
    $("#txType").value=txFilter.type; $("#txCat").value=txFilter.cat;
    $("#txSearch").oninput = e=>{ txFilter.q=e.target.value; const v=e.target.selectionStart; viewTransactions(); const s=$("#txSearch"); s.focus(); s.setSelectionRange(v,v); };
    $("#txType").onchange = e=>{ txFilter.type=e.target.value; viewTransactions(); };
    $("#txCat").onchange = e=>{ txFilter.cat=e.target.value; viewTransactions(); };
  }

  /* ---------- BUDGET ---------- */
  function viewBudget(){
    const tx = monthTx();
    const rows = S.cats.expense.map(c=>{
      const sp = tx.filter(t=>t.type==="expense"&&t.category===c).reduce((a,b)=>a+ +b.amount,0);
      const pl = +S.budgets[c]||0;
      const rem = pl - sp;
      const pct = pl>0 ? Math.min(sp/pl*100,100) : (sp>0?100:0);
      const cls = pl>0 && sp>pl ? "over" : (pl>0 && sp>=pl*0.85 ? "near" : "");
      return `<div class="budget-row">
        <div class="cat">${esc(c)}</div>
        <input class="input planned-input num" type="number" min="0" step="1" inputmode="decimal" value="${pl||""}" placeholder="0" data-act="set-budget" data-id="${esc(c)}">
        <div class="budget-prog">
          <div class="track"><span class="${cls}" style="width:${pct}%"></span></div>
          <div class="meta num">${money(sp)} spent · <b style="color:${rem<0?"var(--neg)":"var(--ink)"}">${money(rem)} ${rem<0?"over":"left"}</b></div>
        </div>
        <button class="icon-btn danger" data-act="del-cat" data-id="${esc(c)}" aria-label="Remove category">${I.del}</button>
      </div>`;
    }).join("");
    const planned = S.cats.expense.reduce((a,c)=>a+(+S.budgets[c]||0),0);
    const spent = tx.filter(t=>t.type==="expense").reduce((a,b)=>a+ +b.amount,0);
    $("#view").innerHTML = `
      <div class="grid stats" style="grid-template-columns:repeat(3,1fr)">
        ${stat("Planned", money(planned), "var(--brand)","")}
        ${stat("Spent", money(spent), "var(--neg)","")}
        ${stat("Remaining", money(planned-spent), (planned-spent)>=0?"var(--pos)":"var(--neg)", (planned-spent)>=0?"pos":"neg")}
      </div>
      <div class="card card-pad" style="margin-top:16px">
        <div class="list-head"><div class="section-title" style="margin:0">Planned vs actual by category</div>
          <button class="btn btn-ghost btn-sm" data-act="add-cat">${I.plus} Add category</button></div>
        <div class="budget-head muted-h" style="display:grid;grid-template-columns:1.4fr 1fr 1.6fr auto;gap:16px;padding:0 6px 8px">
          <span>Category</span><span>Planned</span><span>Progress</span><span></span></div>
        ${rows}
      </div>
      <p style="color:var(--muted);font-size:.86rem;margin-top:14px">Tip: type a planned amount and your bar fills as you log spending. Bars turn amber near your limit, red when you go over.</p>`;
  }

  /* ---------- DEBTS ---------- */
  function viewDebts(){
    const debts = S.debts.slice().sort((a,b)=>(+a.balance)-(+b.balance));
    const totalBal = S.debts.reduce((a,b)=>a+ +b.balance,0);
    const totalMin = S.debts.reduce((a,b)=>a+ +b.min,0);
    const rows = debts.length ? debts.map((d,i)=>`
      <div class="debt-row">
        <div class="order-badge">${i+1}</div>
        <div><div style="font-weight:650">${esc(d.name)}</div><div class="muted-h" style="margin-top:2px">${(+d.apr||0).toFixed(1)}% APR</div></div>
        <div><div class="muted-h">Balance</div><div class="num" style="font-weight:600">${money(d.balance)}</div></div>
        <div><div class="muted-h">Min / mo</div><div class="num">${money(d.min)}</div></div>
        <div><div class="muted-h">Order</div><div>${i===0?'<span class="chip" style="color:var(--brand-d);background:var(--brand-soft);border-color:transparent">Focus first</span>':"#"+(i+1)}</div></div>
        <div style="display:flex;gap:2px">
          <button class="icon-btn" data-act="edit-debt" data-id="${d.id}">${I.edit}</button>
          <button class="icon-btn danger" data-act="del-debt" data-id="${d.id}">${I.del}</button></div>
      </div>`).join("") : emptyState(I.debt,"No debts added","List what you owe and we'll order them smallest-first — the snowball method that keeps you motivated as each one disappears.","Add a debt","add-debt");
    $("#view").innerHTML = `
      <div class="grid stats" style="grid-template-columns:repeat(3,1fr)">
        ${stat("Total debt", money(totalBal), "var(--neg)","")}
        ${stat("Min payments / mo", money(totalMin), "var(--ink)","")}
        ${stat("Debts", String(S.debts.length), "var(--brand)","")}
      </div>
      <div class="card card-pad" style="margin-top:16px">
        <div class="list-head"><div class="section-title" style="margin:0">Your debts — snowball order</div>
          <button class="btn btn-accent btn-sm" data-act="add-debt">${I.plus} Add debt</button></div>
        ${rows}
      </div>
      ${S.debts.length?`<div class="card card-pad" style="margin-top:16px;background:var(--brand-soft);border-color:transparent">
        <b style="color:var(--brand-d)">The snowball:</b> throw every spare ${esc(S.meta.currency)} at debt #1. When it's gone, roll its payment onto #2. Repeat until you're free.</div>`:""}`;
  }

  /* ---------- GOALS ---------- */
  function viewGoals(){
    const cards = S.goals.length ? `<div class="grid goal-grid">${S.goals.map(g=>{
      const pct = g.target>0 ? Math.min(g.saved/g.target*100,100) : 0;
      const rem = Math.max(g.target-g.saved,0);
      return `<div class="card goal">
        <div class="goal-head"><h4>${esc(g.name)}</h4><div class="sub num">${g.date?("by "+esc(g.date)):"&nbsp;"}</div></div>
        <div class="figs"><div class="saved num">${money(g.saved)}</div><div class="target num">/ ${money(g.target)}</div></div>
        <div class="track"><span style="width:${pct}%"></span></div>
        <div class="goal-foot"><span class="num">${money(rem)} to go</span><span class="pctbig num">${Math.round(pct)}%</span></div>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn btn-ghost btn-sm" data-act="add-saved" data-id="${g.id}" style="flex:1;justify-content:center">${I.plus} Add saved</button>
          <button class="icon-btn" data-act="edit-goal" data-id="${g.id}">${I.edit}</button>
          <button class="icon-btn danger" data-act="del-goal" data-id="${g.id}">${I.del}</button>
        </div></div>`;
    }).join("")}</div>` : emptyState(I.goal,"No goals yet","Name what you're saving for — an emergency fund, a holiday, a deposit — and watch the progress bar fill as you go.","Add a goal","add-goal");
    $("#view").innerHTML = `
      <div class="list-head"><div class="section-title" style="margin:0">What you're saving for</div>
        <button class="btn btn-accent btn-sm" data-act="add-goal">${I.plus} Add goal</button></div>
      ${cards}`;
  }

  /* ---------- SETTINGS ---------- */
  function viewSettings(){
    const hasPass = !!S.meta.passcode;
    $("#view").innerHTML = `
      <div class="card card-pad">
        <div class="section-title">Personalise</div>
        <div class="set-row"><div class="info"><h4>App name</h4><p>Shown in the sidebar and browser tab. Make it yours.</p></div>
          <input class="input" id="setBrand" style="max-width:200px" value="${esc(S.meta.brand)}"></div>
        <div class="set-row"><div class="info"><h4>Tagline</h4><p>The small line under the name.</p></div>
          <input class="input" id="setTag" style="max-width:200px" value="${esc(S.meta.tag)}"></div>
        <div class="set-row"><div class="info"><h4>Currency symbol</h4><p>Used everywhere amounts appear.</p></div>
          <input class="input num" id="setCur" style="max-width:80px;text-align:center" value="${esc(S.meta.currency)}" maxlength="3"></div>
        <div class="set-row"><div class="info" style="width:100%"><button class="btn btn-primary btn-sm" data-act="save-settings">${I.check} Save changes</button></div></div>
      </div>

      <div class="card card-pad" style="margin-top:16px">
        <div class="section-title">Privacy lock</div>
        <div class="set-row"><div class="info"><h4>Passcode ${hasPass?'<span class="chip" style="color:var(--pos);background:var(--pos-soft);border-color:transparent">On</span>':""}</h4>
          <p>Adds a passcode screen when the app opens. A soft lock for privacy on a shared device — not bank-grade security. Your data always stays on this device.</p></div>
          ${hasPass?`<button class="btn btn-danger btn-sm" data-act="remove-pass">Turn off</button>`:`<button class="btn btn-ghost btn-sm" data-act="set-pass">Set passcode</button>`}
        </div>
      </div>

      <div class="card card-pad" style="margin-top:16px">
        <div class="section-title">Your data</div>
        <div class="set-row"><div class="info"><h4>Back up / export</h4><p>Download all your data as a file you can keep safe or move to another device.</p></div>
          <button class="btn btn-ghost btn-sm" data-act="export">Export data</button></div>
        <div class="set-row"><div class="info"><h4>Restore / import</h4><p>Load data from a backup file. This replaces what's here now.</p></div>
          <button class="btn btn-ghost btn-sm" data-act="import">Import data</button></div>
        <div class="set-row"><div class="info"><h4>Try it with sample data</h4><p>Fill the app with example figures to explore. You can clear it any time.</p></div>
          <button class="btn btn-ghost btn-sm" data-act="load-sample">Load sample</button></div>
        <div class="set-row"><div class="info"><h4>Start fresh</h4><p>Permanently delete everything and reset the app.</p></div>
          <button class="btn btn-danger btn-sm" data-act="clear-all">Clear all data</button></div>
      </div>
      <p style="color:var(--faint);font-size:.8rem;margin-top:16px;text-align:center">For personal budgeting only · not financial advice · your data lives only in this browser</p>`;
    $("#setBrand").oninput=e=>S.meta.brand=e.target.value;
    $("#setTag").oninput=e=>S.meta.tag=e.target.value;
    $("#setCur").oninput=e=>S.meta.currency=e.target.value||"£";
  }

  function emptyState(ic,title,body,btn,act){
    return `<div class="empty"><div class="e-ico">${ic}</div><h3>${title}</h3><p>${body}</p>
      <button class="btn btn-accent" data-act="${act}">${I.plus} ${btn}</button></div>`;
  }

  /* ---------- MODAL ---------- */
  function modal(title, bodyHtml, onSave, saveLabel="Save"){
    const root=$("#modalRoot");
    root.innerHTML = `<div class="scrim" id="scrim"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" id="mClose" aria-label="Close">✕</button></div>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-foot"><button class="btn btn-ghost" id="mCancel">Cancel</button><button class="btn btn-primary" id="mSave">${saveLabel}</button></div>
    </div></div>`;
    const close=()=>{ root.innerHTML=""; document.removeEventListener("keydown",onKey); };
    function onKey(e){ if(e.key==="Escape") close(); if(e.key==="Enter" && e.target.tagName!=="SELECT"){ e.preventDefault(); doSave(); } }
    function doSave(){ if(onSave()!==false) close(); }
    $("#mClose").onclick=close; $("#mCancel").onclick=close;
    $("#scrim").onclick=e=>{ if(e.target.id==="scrim") close(); };
    $("#mSave").onclick=doSave;
    document.addEventListener("keydown",onKey);
    const first=root.querySelector("input,select"); if(first) first.focus();
  }
  const val = id => { const e=$("#"+id); return e?e.value.trim():""; };
  const numv = id => { const n=parseFloat(val(id)); return isNaN(n)?0:n; };

  function txModal(existing){
    const t = existing || {type:"expense",date:new Date().toISOString().slice(0,10),category:"",desc:"",amount:""};
    const catOptions = ty => (ty==="income"?S.cats.income:S.cats.expense).map(c=>`<option value="${esc(c)}" ${c===t.category?"selected":""}>${esc(c)}</option>`).join("");
    modal(existing?"Edit transaction":"Add transaction",`
      <div class="seg" id="segType">
        <button data-t="expense" class="${t.type==="expense"?"on exp":""}">Expense</button>
        <button data-t="income" class="${t.type==="income"?"on inc":""}">Income</button>
      </div>
      <div class="field"><label>Description</label><input class="input" id="fDesc" placeholder="e.g. Groceries at Tesco" value="${esc(t.desc)}"></div>
      <div class="two">
        <div class="field"><label>Amount</label><input class="input num" id="fAmt" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${t.amount}"></div>
        <div class="field"><label>Date</label><input class="input num" id="fDate" type="date" value="${t.date}"></div>
      </div>
      <div class="field"><label>Category</label><select class="input" id="fCat">${catOptions(t.type)}</select></div>
    `, ()=>{
      const amt=numv("fAmt"); if(amt<=0){ toast("Enter an amount","warn"); return false; }
      const rec={ id: existing?existing.id:uid(), type:curType, date:val("fDate")||t.date,
        desc:val("fDesc"), category:val("fCat"), amount:amt };
      if(existing){ const i=S.transactions.findIndex(x=>x.id===existing.id); S.transactions[i]=rec; toast("Transaction updated"); }
      else { S.transactions.push(rec); toast("Transaction added"); }
      save(); render();
    }, existing?"Save":"Add");
    let curType=t.type;
    $("#segType").querySelectorAll("button").forEach(b=>b.onclick=()=>{
      curType=b.dataset.t;
      $("#segType").querySelectorAll("button").forEach(x=>x.className="");
      b.className="on "+(curType==="income"?"inc":"exp");
      $("#fCat").innerHTML=(curType==="income"?S.cats.income:S.cats.expense).map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
    });
  }

  function debtModal(existing){
    const d=existing||{name:"",balance:"",apr:"",min:""};
    modal(existing?"Edit debt":"Add debt",`
      <div class="field"><label>Debt name</label><input class="input" id="dName" placeholder="e.g. Visa credit card" value="${esc(d.name)}"></div>
      <div class="two">
        <div class="field"><label>Balance owed</label><input class="input num" id="dBal" type="number" min="0" step="0.01" value="${d.balance}"></div>
        <div class="field"><label>Interest (APR %)</label><input class="input num" id="dApr" type="number" min="0" step="0.1" value="${d.apr}"></div>
      </div>
      <div class="field"><label>Minimum monthly payment</label><input class="input num" id="dMin" type="number" min="0" step="0.01" value="${d.min}"></div>
    `, ()=>{
      const name=val("dName"); if(!name){ toast("Name your debt","warn"); return false; }
      const rec={id:existing?existing.id:uid(),name,balance:numv("dBal"),apr:numv("dApr"),min:numv("dMin")};
      if(existing){ const i=S.debts.findIndex(x=>x.id===existing.id); S.debts[i]=rec; toast("Debt updated"); }
      else { S.debts.push(rec); toast("Debt added"); }
      save(); render();
    }, existing?"Save":"Add");
  }

  function goalModal(existing){
    const g=existing||{name:"",target:"",saved:"",date:""};
    modal(existing?"Edit goal":"Add goal",`
      <div class="field"><label>Goal name</label><input class="input" id="gName" placeholder="e.g. Emergency fund" value="${esc(g.name)}"></div>
      <div class="two">
        <div class="field"><label>Target amount</label><input class="input num" id="gTarget" type="number" min="0" step="0.01" value="${g.target}"></div>
        <div class="field"><label>Saved so far</label><input class="input num" id="gSaved" type="number" min="0" step="0.01" value="${g.saved}"></div>
      </div>
      <div class="field"><label>Target date (optional)</label><input class="input num" id="gDate" type="date" value="${g.date}"></div>
    `, ()=>{
      const name=val("gName"); if(!name){ toast("Name your goal","warn"); return false; }
      const rec={id:existing?existing.id:uid(),name,target:numv("gTarget"),saved:numv("gSaved"),date:val("gDate")};
      if(existing){ const i=S.goals.findIndex(x=>x.id===existing.id); S.goals[i]=rec; toast("Goal updated"); }
      else { S.goals.push(rec); toast("Goal added"); }
      save(); render();
    }, existing?"Save":"Add");
  }

  function addSavedModal(g){
    modal("Add to “"+g.name+"”",`
      <div class="field"><label>How much did you save?</label><input class="input num" id="aAmt" type="number" min="0" step="0.01" placeholder="0.00"></div>
    `, ()=>{ const a=numv("aAmt"); if(a<=0){toast("Enter an amount","warn");return false;}
      g.saved=(+g.saved||0)+a; save(); render(); toast("Nice — "+money(a)+" added"); }, "Add");
  }

  function catModal(){
    modal("Add expense category",`
      <div class="field"><label>Category name</label><input class="input" id="cName" placeholder="e.g. Childcare"></div>
    `, ()=>{ const n=val("cName"); if(!n){toast("Name the category","warn");return false;}
      if(S.cats.expense.includes(n)){toast("That already exists","warn");return false;}
      S.cats.expense.push(n); save(); render(); toast("Category added"); }, "Add");
  }

  function passModal(){
    modal("Set a passcode",`
      <p style="color:var(--muted);font-size:.88rem;margin:-2px 0 2px">Choose a passcode you'll remember. It locks this app on this device.</p>
      <div class="field"><label>Passcode</label><input class="input num" id="pA" type="password" inputmode="numeric" placeholder="••••" maxlength="12"></div>
      <div class="field"><label>Confirm passcode</label><input class="input num" id="pB" type="password" inputmode="numeric" placeholder="••••" maxlength="12"></div>
    `, ()=>{ const a=val("pA"),b=val("pB");
      if(a.length<3){toast("Use at least 3 characters","warn");return false;}
      if(a!==b){toast("Passcodes don't match","warn");return false;}
      S.meta.passcode=a; save(); render(); toast("Passcode set"); }, "Set passcode");
  }

  /* ---------- export / import ---------- */
  function exportData(){
    const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=(S.meta.brand||"budget").replace(/\s+/g,"-").toLowerCase()+"-backup.json";
    a.click(); URL.revokeObjectURL(a.href); toast("Backup downloaded");
  }
  function importData(){
    const inp=document.createElement("input"); inp.type="file"; inp.accept="application/json,.json";
    inp.onchange=()=>{ const f=inp.files[0]; if(!f) return; const r=new FileReader();
      r.onload=()=>{ try{ const d=JSON.parse(r.result); S=Object.assign(blank(),d); save(); render(); toast("Data imported"); }
        catch(e){ toast("That file couldn't be read","warn"); } };
      r.readAsText(f); };
    inp.click();
  }
  function loadSample(){
    const m=S.ui.month;
    S.budgets={"Rent / Mortgage":1100,"Utilities":180,"Groceries":420,"Dining & Takeout":160,"Transport":140,"Subscriptions":55,"Health & Fitness":45,"Shopping":120,"Entertainment":90,"Savings":300,"Miscellaneous":80};
    const mk=(d,desc,type,cat,amt)=>({id:uid(),date:m+"-"+String(d).padStart(2,"0"),desc,type,category:cat,amount:amt});
    S.transactions=[mk(1,"Monthly salary","income","Salary",2650),mk(2,"Rent","expense","Rent / Mortgage",1100),
      mk(3,"Big shop","expense","Groceries",96.4),mk(5,"Electric & gas","expense","Utilities",132),
      mk(6,"Coffee & lunch","expense","Dining & Takeout",18.5),mk(8,"Train pass","expense","Transport",78),
      mk(9,"Streaming","expense","Subscriptions",27.97),mk(11,"Groceries","expense","Groceries",54.2),
      mk(12,"Gym","expense","Health & Fitness",39),mk(14,"Freelance design","income","Side Income",320),
      mk(15,"New trainers","expense","Shopping",84.99),mk(17,"Cinema","expense","Entertainment",24),
      mk(19,"Dinner out","expense","Dining & Takeout",61.3),mk(20,"To savings","expense","Savings",300)];
    S.debts=[{id:uid(),name:"Store card",balance:480,apr:24.9,min:25},{id:uid(),name:"Credit card",balance:2150,apr:21.9,min:65},{id:uid(),name:"Car loan",balance:5400,apr:7.4,min:180}];
    S.goals=[{id:uid(),name:"Emergency fund",target:5000,saved:1850,date:""},{id:uid(),name:"Holiday",target:1800,saved:640,date:""}];
    save(); render(); toast("Sample data loaded");
  }

  /* ---------- toast ---------- */
  function toast(msg,kind="ok"){
    const w=$("#toastWrap"); const el=document.createElement("div");
    el.className="toast "+(kind==="warn"?"warn":"ok");
    el.innerHTML=(kind==="warn"?"":I.check)+`<span>${esc(msg)}</span>`;
    w.appendChild(el); setTimeout(()=>el.remove(),3000);
  }

  /* ---------- lock ---------- */
  function maybeLock(){
    if(S.meta.passcode){
      const lock=$("#lock"); lock.hidden=false;
      $("#lockTitle").textContent="Welcome to "+(S.meta.brand||"your budget");
      const tryUnlock=()=>{ if($("#lockInput").value===S.meta.passcode){ lock.hidden=true; }
        else { toast("Wrong passcode","warn"); $("#lockInput").value=""; $("#lockInput").focus(); } };
      $("#lockBtn").onclick=tryUnlock;
      $("#lockInput").onkeydown=e=>{ if(e.key==="Enter") tryUnlock(); };
      $("#lockInput").focus();
    }
  }

  /* ---------- global actions ---------- */
  document.addEventListener("click", e=>{
    const el=e.target.closest("[data-act]"); if(!el) return;
    const act=el.dataset.act, id=el.dataset.id;
    const A={
      nav:()=>{ S.ui.view=id; save(); render(); document.querySelector(".content").scrollTo?.(0,0); },
      "add-tx":()=>txModal(), "edit-tx":()=>txModal(S.transactions.find(t=>t.id===id)),
      "del-tx":()=>{ if(confirm("Delete this transaction?")){ S.transactions=S.transactions.filter(t=>t.id!==id); save(); render(); toast("Deleted"); } },
      "add-debt":()=>debtModal(), "edit-debt":()=>debtModal(S.debts.find(d=>d.id===id)),
      "del-debt":()=>{ if(confirm("Delete this debt?")){ S.debts=S.debts.filter(d=>d.id!==id); save(); render(); toast("Deleted"); } },
      "add-goal":()=>goalModal(), "edit-goal":()=>goalModal(S.goals.find(g=>g.id===id)),
      "del-goal":()=>{ if(confirm("Delete this goal?")){ S.goals=S.goals.filter(g=>g.id!==id); save(); render(); toast("Deleted"); } },
      "add-saved":()=>addSavedModal(S.goals.find(g=>g.id===id)),
      "add-cat":()=>catModal(),
      "del-cat":()=>{ if(confirm("Remove “"+id+"”? Logged transactions keep their category.")){ S.cats.expense=S.cats.expense.filter(c=>c!==id); delete S.budgets[id]; save(); render(); } },
      "save-settings":()=>{ save(); render(); toast("Saved"); },
      "set-pass":()=>passModal(),
      "remove-pass":()=>{ S.meta.passcode=""; save(); render(); toast("Passcode turned off"); },
      export:exportData, import:importData, "load-sample":loadSample,
      "clear-all":()=>{ if(confirm("Delete ALL your data and start fresh? This cannot be undone.")){ S=blank(); save(); render(); toast("All data cleared"); } },
    };
    if(A[act]) A[act]();
  });
  // budget planned inline inputs
  document.addEventListener("input", e=>{
    const el=e.target.closest('[data-act="set-budget"]'); if(!el) return;
    S.budgets[el.dataset.id]=parseFloat(el.value)||0; save();
  });

  $("#addBtn").onclick=()=>txModal();
  $("#fab").onclick=()=>txModal();
  $("#prevMonth").onclick=()=>shiftMonth(-1);
  $("#nextMonth").onclick=()=>shiftMonth(1);

  maybeLock();
  render();
})();
