// Shared walk for the three rooms. Farther is higher on the screen. Size does not change.
(function () {
  const H = 480;
  const CHAR_H = 150;
  const WIDTH = CHAR_H * (93 / 195);
  const stage = document.getElementById("stage");
  let here = "scene";
  window.HeianHere = here;
  let room = window.HEIAN_ROOMS[here];
  const placed = [];
  drawMap(stage);

  function clearStills() {
    for (const p of placed) p.img.remove();
    placed.length = 0;
  }

  function layStills() {
    clearStills();
    stage.style.background = 'url("' + room.bg + '") 0 0 / 852px 480px no-repeat';
    for (const [file, sx, h, bottom, face] of room.still || []) {
      const img = document.createElement("img");
      img.className = "sprite";
      img.src = "assets/heian/" + file + ".png";
      img.alt = "";
      img.style.left = sx + "px";
      img.style.height = (file.startsWith("characters/") ? CHAR_H : h) + "px";
      img.style.bottom = bottom + "px";
      if (face) img.style.transform = "scaleX(-1)";
      stage.append(img);
      placed.push({ img, foot: H - bottom });
    }
  }

  const prince = document.createElement("img");
  prince.className = "sprite";
  prince.alt = "Prince Atsuhira";
  stage.append(prince);
  const frames = [0, 1, 2, 3].map((i) => "assets/heian/characters/atsuhira-walk-" + i + ".png");
  prince.src = frames[0];
  layStills();
  stage.append(prince);

  const keys = {};
  addEventListener("keydown", (e) => {
    if (e.key.startsWith("Arrow")) {
      keys[e.key] = true;
      e.preventDefault();
    }
  });
  addEventListener("keyup", (e) => {
    keys[e.key] = false;
    if (e.key.startsWith("Arrow") && window.HeianPlay && window.HeianPlay.save) window.HeianPlay.save();
  });

  let depth = room.depth;
  let x = room.x;
  let faceLeft = room.faceLeft;

  function arrive(from) {
    depth = room.depth;
    x = room.x;
    faceLeft = room.faceLeft;
    if (from === "east" || from === "west" || from === "south") depth = 0.92;
    if (from === "north") depth = 0.08;
    if (from === "west") { x = room.xMin(0.92) + 8; faceLeft = false; }
    if (from === "east") { x = room.xMax(0.92) - WIDTH - 8; faceLeft = true; }
  }
  let frame = 0;
  let acc = 0;
  let last = performance.now();

  function footAt(d) { return room.foot0 + d * (room.foot1 - room.foot0); }

  function placePrince() {
    const foot = footAt(depth);
    prince.style.height = CHAR_H + "px";
    prince.style.bottom = (H - foot) + "px";
    prince.style.left = x + "px";
    prince.style.transform = faceLeft ? "scaleX(-1)" : "";
    prince.style.zIndex = String(Math.round(foot));
    for (const p of placed) p.img.style.zIndex = String(Math.round(p.foot));
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let moving = false;
    if (keys.ArrowLeft) { x -= 110 * dt; faceLeft = true; moving = true; }
    if (keys.ArrowRight) { x += 110 * dt; faceLeft = false; moving = true; }
    if (keys.ArrowUp) { depth -= 0.45 * dt; moving = true; }
    if (keys.ArrowDown) { depth += 0.45 * dt; moving = true; }
    depth = Math.max(0, Math.min(1, depth));
    if (keys.ArrowUp && room.north && depth <= 0) {
      enter(room.north, "south");
      requestAnimationFrame(tick);
      return;
    }
    if (keys.ArrowDown && room.south && depth >= 1) {
      enter(room.south, "north");
      requestAnimationFrame(tick);
      return;
    }
    const minX = room.xMin(depth);
    const maxX = room.xMax(depth) - WIDTH;
    if (keys.ArrowLeft && room.west && x <= minX) {
      enter(room.west, "east");
      requestAnimationFrame(tick);
      return;
    }
    const eastOpen = room.east && depth >= (room.eastMinDepth == null ? 0 : room.eastMinDepth);
    if (keys.ArrowRight && eastOpen && x >= maxX) {
      enter(room.east, "west");
      requestAnimationFrame(tick);
      return;
    }
    x = Math.max(minX, Math.min(maxX, x));
    if (moving) {
      acc += dt;
      if (acc > 0.16) {
        acc = 0;
        frame = (frame + 1) % frames.length;
        prince.src = frames[frame];
      }
    } else {
      acc = 0;
      frame = 0;
      prince.src = frames[0];
    }
    placePrince();
    requestAnimationFrame(tick);
  }
  function enter(id, from) {
    const next = window.HEIAN_ROOMS[id];
    if (!next) return;
    here = id;
    window.HeianHere = here;
    room = next;
    layStills();
    stage.append(prince);
    arrive(from);
    placePrince();
    paintMap();
    if (window.HeianPlay && window.HeianPlay.arrive) window.HeianPlay.arrive(stage);
  }
  window.HeianEnter = enter;
  window.HeianPose = () => ({ x, depth, faceLeft });
  window.HeianStand = (pose) => {
    if (!pose || typeof pose.x !== "number") return;
    x = pose.x;
    if (typeof pose.depth === "number") depth = pose.depth;
    if (typeof pose.faceLeft === "boolean") faceLeft = pose.faceLeft;
    placePrince();
  };

  placePrince();
  requestAnimationFrame(tick);
  if (window.HeianPlay) window.HeianPlay.boot(stage);

  function drawMap(stage) {
    const pos = {
      bamboo:[2,0], bell:[3,3], boatshed:[2,9], bridge:[4,6], cave:[1,3], cliff:[3,2],
      copse:[0,4], "court-garden":[0,3], drying:[4,8], dunes:[4,9], dyer:[3,7],
      "east-wall":[5,2], engawa:[4,4], farm:[0,5], ferry:[2,7], forest:[2,5],
      hall:[4,3], indigo:[4,7], "inner-garden":[4,2], kitchen:[6,3], ladies:[2,3],
      "landing-west":[1,7], market:[3,6], marsh:[3,8], mill:[1,6], "moon-deck":[3,1],
      nets:[2,8], "night-bridge":[2,1], offering:[5,4], peak:[2,2], purification:[1,4],
      rice:[1,5], river:[2,6], salt:[5,9], scene:[4,5], sewing:[0,2], shore:[3,9],
      shrine:[3,5], "shrine-hall":[3,4], steps:[2,4], storehouse:[5,3], village:[0,6],
      wash:[6,4], well:[6,2],
    };
    const links = [
      ["bamboo","night-bridge"],["bell","shrine-hall"],["boatshed","shore"],["cave","steps"],
      ["copse","rice"],["court-garden","ladies"],["dunes","salt"],["dyer","indigo"],
      ["engawa","scene"],["farm","rice"],["ferry","marsh"],["forest","shrine"],
      ["hall","storehouse"],["hall","engawa"],["indigo","drying"],["inner-garden","east-wall"],
      ["inner-garden","hall"],["kitchen","wash"],["ladies","hall"],["landing-west","ferry"],
      ["market","bridge"],["market","dyer"],["marsh","shore"],["moon-deck","inner-garden"],
      ["nets","boatshed"],["night-bridge","moon-deck"],["peak","steps"],["purification","shrine-hall"],
      ["rice","forest"],["rice","mill"],["river","market"],["river","ferry"],
      ["sewing","court-garden"],["shore","dunes"],["shrine","scene"],["shrine","market"],
      ["shrine-hall","offering"],["shrine-hall","shrine"],["steps","cliff"],["steps","forest"],
      ["storehouse","kitchen"],["village","landing-west"],["well","kitchen"],
    ];
    let seen = [];
    try {
      const saved = JSON.parse(localStorage.getItem("heian-case-v1") || "null");
      if (saved && Array.isArray(saved.seen)) seen = saved.seen;
    } catch (e) { /* a new map */ }
    const known = new Set(seen);
    known.add(here);
    const S = 13, G = 5, pad = 8, cols = 7, rows = 10;
    const w = pad * 2 + cols * S + (cols - 1) * G;
    const h = pad * 2 + rows * S + (rows - 1) * G;
    const xy = (id) => {
      const p = pos[id];
      return [pad + p[0] * (S + G) + S / 2, pad + p[1] * (S + G) + S / 2];
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    for (const [a, b] of links) {
      if (!known.has(a) || !known.has(b)) continue;
      const [x1, y1] = xy(a);
      const [x2, y2] = xy(b);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1); line.setAttribute("y1", y1);
      line.setAttribute("x2", x2); line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#3d5238");
      line.setAttribute("stroke-width", "2");
      svg.append(line);
    }
    for (const id of Object.keys(pos)) {
      if (!known.has(id)) continue;
      const [x, y] = xy(id);
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const on = id === here;
      dot.setAttribute("x", x - (on ? 6 : 4));
      dot.setAttribute("y", y - (on ? 6 : 4));
      dot.setAttribute("width", on ? 12 : 8);
      dot.setAttribute("height", on ? 12 : 8);
      dot.setAttribute("fill", on ? "#e7c56a" : "#7ea06a");
      const label = id === "scene" ? "courtyard" : id.replace(/-/g, " ");
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = label;
      dot.append(title);
      svg.append(dot);
    }
    const wrap = document.createElement("div");
    wrap.id = "minimap";
    const exits = document.createElement("div");
    exits.id = "exits";
    const room = window.ROOM || {};
    for (const [dir, open] of [["n", room.north], ["w", room.west], ["e", room.east], ["s", room.south]]) {
      const mark = document.createElement("span");
      mark.dataset.dir = dir;
      mark.textContent = { n: "▲", w: "◀", e: "▶", s: "▼" }[dir];
      if (open) mark.className = "on";
      exits.append(mark);
    }
    wrap.append(svg, exits);
    const row = document.createElement("div");
    row.id = "scene-row";
    stage.replaceWith(row);
    row.append(stage, wrap);
  }

  function paintMap() {
    const wrap = document.getElementById("minimap");
    if (!wrap) return;
    wrap.replaceChildren();
    const pos = {
      bamboo:[2,0], bell:[3,3], boatshed:[2,9], bridge:[4,6], cave:[1,3], cliff:[3,2],
      copse:[0,4], "court-garden":[0,3], drying:[4,8], dunes:[4,9], dyer:[3,7],
      "east-wall":[5,2], engawa:[4,4], farm:[0,5], ferry:[2,7], forest:[2,5],
      hall:[4,3], indigo:[4,7], "inner-garden":[4,2], kitchen:[6,3], ladies:[2,3],
      "landing-west":[1,7], market:[3,6], marsh:[3,8], mill:[1,6], "moon-deck":[3,1],
      nets:[2,8], "night-bridge":[2,1], offering:[5,4], peak:[2,2], purification:[1,4],
      rice:[1,5], river:[2,6], salt:[5,9], scene:[4,5], sewing:[0,2], shore:[3,9],
      shrine:[3,5], "shrine-hall":[3,4], steps:[2,4], storehouse:[5,3], village:[0,6],
      wash:[6,4], well:[6,2],
    };
    const links = [
      ["bamboo","night-bridge"],["bell","shrine-hall"],["boatshed","shore"],["cave","steps"],
      ["copse","rice"],["court-garden","ladies"],["dunes","salt"],["dyer","indigo"],
      ["engawa","scene"],["farm","rice"],["ferry","marsh"],["forest","shrine"],
      ["hall","storehouse"],["hall","engawa"],["indigo","drying"],["inner-garden","east-wall"],
      ["inner-garden","hall"],["kitchen","wash"],["ladies","hall"],["landing-west","ferry"],
      ["market","bridge"],["market","dyer"],["marsh","shore"],["moon-deck","inner-garden"],
      ["nets","boatshed"],["night-bridge","moon-deck"],["peak","steps"],["purification","shrine-hall"],
      ["rice","forest"],["rice","mill"],["river","market"],["river","ferry"],
      ["sewing","court-garden"],["shore","dunes"],["shrine","scene"],["shrine","market"],
      ["shrine-hall","offering"],["shrine-hall","shrine"],["steps","cliff"],["steps","forest"],
      ["storehouse","kitchen"],["village","landing-west"],["well","kitchen"],
    ];
    let seen = [];
    try {
      const saved = JSON.parse(localStorage.getItem("heian-case-v1") || "null");
      if (saved && Array.isArray(saved.seen)) seen = saved.seen;
    } catch (e) { /* a new map */ }
    const known = new Set(seen);
    known.add(here);
    const S = 13, G = 5, pad = 8, cols = 7, rows = 10;
    const w = pad * 2 + cols * S + (cols - 1) * G;
    const h = pad * 2 + rows * S + (rows - 1) * G;
    const xy = (id) => {
      const p = pos[id];
      return [pad + p[0] * (S + G) + S / 2, pad + p[1] * (S + G) + S / 2];
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    for (const [a, b] of links) {
      if (!known.has(a) || !known.has(b)) continue;
      const [x1, y1] = xy(a);
      const [x2, y2] = xy(b);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1); line.setAttribute("y1", y1);
      line.setAttribute("x2", x2); line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#3d5238");
      line.setAttribute("stroke-width", "2");
      svg.append(line);
    }
    for (const id of Object.keys(pos)) {
      if (!known.has(id)) continue;
      const [x0, y0] = xy(id);
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const on = id === here;
      dot.setAttribute("x", x0 - (on ? 6 : 4));
      dot.setAttribute("y", y0 - (on ? 6 : 4));
      dot.setAttribute("width", on ? 12 : 8);
      dot.setAttribute("height", on ? 12 : 8);
      dot.setAttribute("fill", on ? "#e7c56a" : "#7ea06a");
      const label = id === "scene" ? "courtyard" : id.replace(/-/g, " ");
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = label;
      dot.append(title);
      svg.append(dot);
    }
    const exits = document.createElement("div");
    exits.id = "exits";
    for (const [dir, open] of [["n", room.north], ["w", room.west], ["e", room.east], ["s", room.south]]) {
      const mark = document.createElement("span");
      mark.dataset.dir = dir;
      mark.textContent = { n: "▲", w: "◀", e: "▶", s: "▼" }[dir];
      if (open) mark.className = "on";
      exits.append(mark);
    }
    wrap.append(svg, exits);
  }
})();
