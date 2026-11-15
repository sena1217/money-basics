
(function () {
  function on(id, type, fn) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(type, fn);
  }
  var CHECKED = "2026-11-15";
  var menuBtn = document.getElementById("menuBtn");
  var drawer = document.getElementById("drawer");
  var closeBtn = document.getElementById("closeDrawer");
  function openDrawer() {
    drawer.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }
  function closeDrawer() {
    drawer.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    menuBtn.focus();
  }
  menuBtn.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  drawer.addEventListener("click", function (e) {
    if (e.target === drawer || e.target.closest("a")) closeDrawer();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !drawer.hidden) closeDrawer();
  });
  var toTop = document.getElementById("toTop");
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  var bar = document.getElementById("progress");
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.round((window.scrollY / h) * 100) : 0;
    bar.style.width = p + "%";
    bar.setAttribute("aria-valuenow", String(p));
    toTop.hidden = window.scrollY < 480;
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function fit(canvas) {
    var w = canvas.parentElement.clientWidth || 320;
    var h = Number(canvas.dataset.h || 220);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }
  function yen(n) {
    if (!isFinite(n)) return "—";
    return Math.round(n).toLocaleString("ja-JP") + "円";
  }
  function monthlyRate(annual) {
    if (annual <= -0.999999) return -0.999999;
    return Math.pow(1 + annual, 1 / 12) - 1;
  }
  function fvAnnuity(pmt, r, n) {
    if (n <= 0) return 0;
    if (Math.abs(r) < 1e-12) return pmt * n;
    return pmt * (Math.pow(1 + r, n) - 1) / r;
  }
  function seriesCompound(pmt, annual, years) {
    var r = monthlyRate(annual);
    var rows = [];
    for (var y = 1; y <= years; y++) {
      var n = y * 12;
      var total = fvAnnuity(pmt, r, n);
      var principal = pmt * n;
      rows.push({ y: y, principal: principal, total: total, gain: total - principal });
    }
    return rows;
  }
  function drawStack(canvas, rows) {
    var box = fit(canvas);
    var ctx = box.ctx;
    ctx.clearRect(0, 0, box.w, box.h);
    if (!rows.length) return;
    var padL = 8, padR = 8, padT = 28, padB = 32;
    var max = 0;
    rows.forEach(function (d) { if (d.total > max) max = d.total; });
    if (max <= 0) max = 1;
    var innerW = box.w - padL - padR;
    var innerH = box.h - padT - padB;
    var gap = 2;
    var bw = Math.max(1, (innerW - gap * rows.length) / rows.length);
    ctx.strokeStyle = cssVar("--canvas-grid");
    ctx.fillStyle = cssVar("--canvas-text");
    ctx.font = "16px sans-serif";
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + innerH);
    ctx.lineTo(padL + innerW, padT + innerH);
    ctx.stroke();
    ctx.fillText("最大 " + yen(max), padL, 20);
    rows.forEach(function (d, i) {
      var x = padL + i * (bw + gap);
      var hGain = (Math.max(d.gain, 0) / max) * innerH;
      var hPri = (Math.max(d.principal, 0) / max) * innerH;
      var y0 = padT + innerH;
      ctx.fillStyle = cssVar("--c3");
      ctx.fillRect(x, y0 - hPri, bw, hPri);
      ctx.fillStyle = cssVar("--c1");
      ctx.fillRect(x, y0 - hPri - hGain, bw, hGain);
    });
    ctx.fillStyle = cssVar("--canvas-text");
    ctx.fillText("1年", padL, box.h - 8);
    ctx.fillText(rows.length + "年", box.w - 36, box.h - 8);
  }
  function drawLines(canvas, lines) {
    var box = fit(canvas);
    var ctx = box.ctx;
    ctx.clearRect(0, 0, box.w, box.h);
    var padL = 8, padR = 8, padT = 28, padB = 32;
    var max = 0;
    lines.forEach(function (ln) { ln.values.forEach(function (v) { if (v > max) max = v; }); });
    if (max <= 0) max = 1;
    var innerW = box.w - padL - padR;
    var innerH = box.h - padT - padB;
    ctx.strokeStyle = cssVar("--canvas-grid");
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + innerH);
    ctx.lineTo(padL + innerW, padT + innerH);
    ctx.stroke();
    ctx.fillStyle = cssVar("--canvas-text");
    ctx.font = "16px sans-serif";
    ctx.fillText("最大 " + yen(max), padL, 20);
    lines.forEach(function (ln) {
      ctx.beginPath();
      ctx.strokeStyle = ln.color;
      ctx.lineWidth = 2;
      ln.values.forEach(function (v, i) {
        var x = padL + (ln.values.length === 1 ? innerW / 2 : (i / (ln.values.length - 1)) * innerW);
        var y = padT + innerH - (v / max) * innerH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }
  function drawHist(canvas, a, b) {
    var box = fit(canvas);
    var ctx = box.ctx;
    ctx.clearRect(0, 0, box.w, box.h);
    var all = a.concat(b);
    if (!all.length) return;
    var min = Math.min.apply(null, all);
    var max = Math.max.apply(null, all);
    if (min === max) { min -= 1; max += 1; }
    var bins = 16;
    function hist(arr) {
      var h = [];
      for (var i = 0; i < bins; i++) h.push(0);
      arr.forEach(function (v) {
        var t = (v - min) / (max - min);
        var idx = Math.min(bins - 1, Math.max(0, Math.floor(t * bins)));
        h[idx]++;
      });
      return h;
    }
    var ha = hist(a), hb = hist(b);
    var peak = 1;
    ha.concat(hb).forEach(function (n) { if (n > peak) peak = n; });
    var padL = 8, padR = 8, padT = 12, padB = 26;
    var innerW = box.w - padL - padR;
    var innerH = box.h - padT - padB;
    var bw = innerW / bins;
    for (var i = 0; i < bins; i++) {
      var x = padL + i * bw;
      var haH = (ha[i] / peak) * innerH;
      var hbH = (hb[i] / peak) * innerH;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = cssVar("--c1");
      ctx.fillRect(x + 1, padT + innerH - haH, Math.max(1, bw * 0.45), haH);
      ctx.fillStyle = cssVar("--c2");
      ctx.fillRect(x + bw * 0.5, padT + innerH - hbH, Math.max(1, bw * 0.45), hbH);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = cssVar("--canvas-text");
    ctx.font = "16px sans-serif";
    ctx.fillText(min.toFixed(2) + "倍", padL, box.h - 6);
    ctx.fillText(max.toFixed(2) + "倍", box.w - 52, box.h - 6);
  }

  function num(id, fallback) {
    var v = Number(document.getElementById(id).value);
    return isFinite(v) ? v : fallback;
  }
  on("c-run", "click", function () {
    var pmt = Math.max(0, num("c-pmt", 0));
    var rate = num("c-rate", 0) / 100;
    var years = Math.max(1, Math.min(50, Math.round(num("c-years", 1))));
    var rows = seriesCompound(pmt, rate, years);
    drawStack(document.getElementById("c-chart"), rows);
    var last = rows[rows.length - 1];
    document.getElementById("c-out").textContent =
      years + "年後の元本は" + yen(last.principal) + "、仮定の運用益は" + yen(last.gain) +
      "、合計は" + yen(last.total) + "です。年利" + (rate * 100).toFixed(2) +
      "%が毎年続いた場合の計算であり、将来の結果ではありません。確認日 " + CHECKED + "。";
  });

  on("k-run", "click", function () {
    var pmt = Math.max(0, num("k-pmt", 0));
    var g = num("k-rate", 0) / 100;
    var c1 = Math.max(0, num("k-c1", 0)) / 100;
    var c2 = Math.max(0, num("k-c2", 0)) / 100;
    var years = Math.max(1, Math.min(50, Math.round(num("k-years", 1))));
    var a = seriesCompound(pmt, g - c1, years).map(function (d) { return d.total; });
    var b = seriesCompound(pmt, g - c2, years).map(function (d) { return d.total; });
    drawLines(document.getElementById("k-chart"), [
      { color: cssVar("--c1"), values: a },
      { color: cssVar("--c2"), values: b }
    ]);
    var diff = a[a.length - 1] - b[b.length - 1];
    document.getElementById("k-out").textContent =
      years + "年後、報酬" + (c1 * 100).toFixed(2) + "%のあとが" + yen(a[a.length - 1]) +
      "、報酬" + (c2 * 100).toFixed(2) + "%のあとが" + yen(b[b.length - 1]) +
      "です。差額は" + yen(diff) + "（A−B）。費用を年率で差し引く近似で、税金と販売手数料は含みません。想定リターンは仮定です。";
  });

  function randn() {
    var u = 1 - Math.random();
    var v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function simulate(mu, sigma, years, paths) {
    var out = [];
    for (var p = 0; p < paths; p++) {
      var w = 1;
      for (var y = 0; y < years; y++) {
        var r = mu + sigma * randn();
        if (r < -0.999) r = -0.999;
        w *= (1 + r);
      }
      out.push(w);
    }
    out.sort(function (x, y) { return x - y; });
    return out;
  }
  function pct(sorted, q) {
    if (!sorted.length) return 0;
    var i = (sorted.length - 1) * q;
    var lo = Math.floor(i);
    var hi = Math.min(sorted.length - 1, lo + 1);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
  }
  function runVol() {
    var mu = num("v-mu", 0) / 100;
    var s1 = Math.max(0, num("v-s1", 0)) / 100;
    var s2 = Math.max(0, num("v-s2", 0)) / 100;
    var years = Math.max(1, Math.min(40, Math.round(num("v-years", 1))));
    var paths = Math.max(50, Math.min(2000, Math.round(num("v-paths", 400))));
    var a = simulate(mu, s1, years, paths);
    var b = simulate(mu, s2, years, paths);
    drawHist(document.getElementById("v-chart"), a, b);
    function line(name, arr, sd) {
      return name + "（標準偏差" + (sd * 100).toFixed(1) + "%）の中央値は初期資金の" +
        pct(arr, 0.5).toFixed(2) + "倍、下位10%は" + pct(arr, 0.1).toFixed(2) +
        "倍、上位10%は" + pct(arr, 0.9).toFixed(2) + "倍";
    }
    document.getElementById("v-out").textContent =
      "平均" + (mu * 100).toFixed(1) + "%、" + years + "年、" + paths + "本。" +
      line("A", a, s1) + "。" + line("B", b, s2) +
      "。正規乱数の図示であり、市場の予測ではありません。−100%より大きい損失は切り捨てています。";
  }
  on("v-run", "click", runVol);
  on("v-reroll", "click", runVol);

  on("n-run", "click", function () {
    var Tcap = 1200000, Gcap = 2400000, Life = 18000000, Glife = 12000000;
    var wantT = Math.max(0, num("n-t", 0));
    var wantG = Math.max(0, num("n-g", 0));
    var years = Math.max(1, Math.min(40, Math.round(num("n-y", 1))));
    var usedT = Math.max(0, num("n-tu", 0));
    var usedG = Math.max(0, num("n-gu", 0));
    var sell = Math.max(0, num("n-sell", 0));
    if (usedT + usedG > Life) usedT = Math.max(0, Life - usedG);
    if (usedG > Glife) usedG = Glife;
    var rows = [];
    var note = [];
    if (wantT > Tcap) note.push("つみたて投資枠の希望額は年間120万円で頭打ちにしました。");
    if (wantG > Gcap) note.push("成長投資枠の希望額は年間240万円で頭打ちにしました。");
    for (var y = 1; y <= years; y++) {
      var room = Life - (usedT + usedG);
      var groom = Glife - usedG;
      var g = Math.min(wantG, Gcap, Math.max(0, groom), Math.max(0, room));
      var t = Math.min(wantT, Tcap, Math.max(0, room - g));
      usedG += g;
      usedT += t;
      var back = Math.min(sell, usedT + usedG);
      var backG = Math.min(back, usedG);
      var backT = Math.min(back - backG, usedT);
      rows.push({ y: y, t: t, g: g, end: usedT + usedG });
      usedG -= backG;
      usedT -= backT;
    }
    var tbody = document.querySelector("#n-table tbody");
    tbody.innerHTML = "";
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      [r.y + "年目", yen(r.t), yen(r.g), yen(r.end)].forEach(function (cell) {
        var td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    drawLines(document.getElementById("n-chart"), [
      { color: cssVar("--c1"), values: rows.map(function (r) { return r.end; }) }
    ]);
    var last = rows[rows.length - 1];
    var growthOnly = wantT === 0;
    document.getElementById("n-out").textContent =
      note.join("") +
      "最終年の年末時点で、生涯枠の使用簿価は" + yen(last.end) +
      "です。この金額は、売却分が戻る前の、その年に枠へ数える簿価です（上限" + yen(Life) + "、成長投資枠の内枠" + yen(Glife) + "）。" +
      (growthOnly ? "成長投資枠だけでは1,200万円までしか使えず、残りの600万円はつみたて投資枠でしか埋められません。" : "") +
      "年間枠を超えた分は、NISA口座では買い付けできません。超えた分を課税口座で買うかは、証券会社の取扱いとご自身の判断です。売却で戻るのは時価ではなく簿価で、翌年以降です。これは" + CHECKED + "確認の成人の制度に基づく試算です。";
  });

  var answers = {
    q11: "b", q12: "b",
    q21: "b", q22: "b",
    q31: "b", q32: "b",
    q41: "b", q42: "a",
    q51: "b", q52: "b",
    q61: "b", q62: "b",
    q71: "b", q72: "b"
  };
  document.querySelectorAll("form.quiz").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var picked = form.querySelector("input:checked");
      var out = form.querySelector(".quiz-result");
      if (!picked) {
        out.textContent = "選択肢を選んでください。";
        return;
      }
      var ok = answers[picked.name] === picked.value;
      out.innerHTML = (ok ? "<span class=\"good\">正解です。</span> " : "<span class=\"bad\">違います。</span> ") + form.getAttribute("data-explain");
    });
  });

  var dict = document.getElementById("dict-q");
  if (dict) dict.addEventListener("input", function () {
    var q = dict.value.trim();
    document.querySelectorAll("#dict li").forEach(function (li) {
      li.hidden = q !== "" && li.textContent.indexOf(q) === -1;
    });
  });

  function redrawCharts() {
    ["c-run", "k-run", "v-run", "n-run"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.click();
    });
  }
  redrawCharts();
  var redrawTimer = 0;
  function scheduleRedraw() {
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(redrawCharts, 80);
  }
  window.addEventListener("resize", scheduleRedraw);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(scheduleRedraw);
    document.querySelectorAll(".canvas-box").forEach(function (el) { ro.observe(el); });
  }
})();
