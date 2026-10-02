// Parser for the capital case. Typed sentences are decided in the browser by
// open-jev. Each action lists the attempts it is.
(function () {
  const KEY = "heian-case-v1";
  const MAX = 86;

  const title = document.createElement("div");
  title.id = "titlecard";
  title.innerHTML = '<img src="assets/heian/scene/courtyard.png" alt=""><div class="title-copy"><h2>The Unread Fan</h2><p id="title-progress">Loading the interpreter</p><div id="title-bar"><span></span></div><div id="title-menu" hidden><button type="button" id="title-start">Start game</button><button type="button" id="title-reset">Reset game</button></div></div>';
  document.body.append(title);

  let jevBundle;
  function startJev() {
    if (!jevBundle) {
      jevBundle = import("https://esm.sh/open-jev@0.1.2").then(({ OpenJev, choice }) => {
        return OpenJev.load({
          model: "kev-0.6b",
          device: "auto",
          onProgress: paintDownload,
        }).then((jev) => ({ jev, choice }));
      });
    }
    return jevBundle;
  }

  function paintDownload(info) {
    const line = document.getElementById("title-progress");
    const bar = document.querySelector("#title-bar span");
    if (!line || !bar) return;
    const loaded = info && info.loaded ? info.loaded : 0;
    const total = info && info.total ? info.total : 0;
    const pct = total ? Math.round((loaded / total) * 100) : Math.round((info.progress || 0) * 100);
    bar.style.width = Math.max(0, Math.min(100, pct)) + "%";
    if (total) line.textContent = mb(loaded) + " of " + mb(total);
    else line.textContent = pct + "%";
  }

  function mb(bytes) {
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  async function mapInBrowser(sentence, paragraph, previous, actions) {
    const { jev, choice } = await startJev();
    const owner = new Map([["none", "none"]]);
    const options = ["none"];
    for (const action of actions) {
      if (!action || !action.id || !action.match) continue;
      for (const clause of String(action.match).split(/,\s*/)) {
        const phrase = clause.trim();
        if (!phrase || owner.get(phrase) === action.id) continue;
        const key = owner.has(phrase) ? action.id + ": " + phrase : phrase;
        if (owner.has(key)) continue;
        owner.set(key, action.id);
        options.push(key);
      }
    }
    const stateText = [
      "Player typed: " + String(sentence || "").trim(),
      "Situation: " + String(paragraph || "").trim(),
      "Previous command: " + (String(previous || "").trim() || "(none)"),
    ].join("\n");
    const answers = await jev.decide(stateText, {
      intent: choice(
        "Which listed phrase is the same attempt as what the player typed? Pick none when none of the phrases is that attempt.",
        options,
      ),
    }, { temperature: 0.6 });
    const answer = answers.intent || {};
    const picked = answer.choice || "none";
    return {
      actionId: owner.get(picked) || "none",
      confidence: typeof answer.confidence === "number" ? answer.confidence : 0,
      probabilities: answer.probabilities || {},
    };
  }

  startJev();

  const ACTIONS = [
    { id: "help", match: "help, what can i do, how do i play",
      say: "Type what the prince should do. You can look from anywhere. Walk up to someone and type talk with them. Choose a line in the conversation. Arrow keys still walk. The score is the case." },
    { id: "score", match: "score, how many points, what is my score",
      say: () => `Score: ${state.score} of ${MAX}.` },
    { id: "inventory", match: "inventory, what am i carrying, look in my pockets",
      say: () => {
        const held = [];
        if (state.flags.ofuda) held.push("Masahiro's ofuda");
        if (state.flags.sensu) held.push("the sensu from the hall");
        if (state.flags.magatama) held.push("the magatama");
        if (state.flags.yumi) held.push("the longbow");
        if (state.flags.koro) held.push("the incense burner");
        if (state.flags.biwa) held.push("the biwa");
        if (state.flags.kagami) held.push("the hand mirror");
        if (state.flags.tachi_held) held.push("the tachi");
        return held.length ? "You are carrying " + held.join(" and ") + "." : "You are carrying nothing but the case.";
      } },
    { id: "hint", match: "hint, what should i do, help me",
      say: () => hint() },
    { id: "who", match: "who is here, who is in this room, who do i see, anyone here, who is around, who can i talk to",
      say: () => whoHere() },
    { id: "look_place", match: "look, look around, examine the room, describe this place",
      say: () => (PLACES[roomId()] && PLACES[roomId()].look) || "You look. The evening holds still." },

    { id: "look_yard", room: "scene", match: "look, look around, examine the yard",
      say: () => state.flags.shizuka_gone
        ? "The veranda is empty. Masahiro still faces the trees. The gravel where the ofuda lay is bare."
        : state.flags.ofuda
          ? "Lady Shizuka looks down from the veranda and will not go in. Abe no Masahiro faces the dark trees. The ofuda is gone from the gravel."
          : "Lady Shizuka looks down from the veranda. Abe no Masahiro faces the trees. An ofuda lies on the gravel beside him." },
    { id: "look_ofuda", room: "scene", match: "look at the ofuda, examine the paper, examine the charm, look at the paper, look at the charm, inspect the ofuda",
      say: (s) => s.flags.ofuda
        ? "The ofuda is in your sleeve. It was set down, not dropped. Something crossed this gravel that Masahiro could not name."
        : "The paper was set down, not dropped. Something crossed this gravel that Masahiro could not name.",
      score: 2, once: "saw_ofuda", whenScore: (s) => !s.flags.ofuda },
    { id: "take_ofuda", room: "scene", match: "take the ofuda, get the paper, pick up the charm, take the paper",
      when: (s) => !s.flags.ofuda,
      say: "You take the ofuda. The gravel looks as if it had never held it.",
      score: 3, once: "took_ofuda", flag: "ofuda", hide: "ofuda" },
    { id: "stop_case", room: "scene", match: "stop investigating, abandon the case, leave the case, keep the capital",
      when: (s) => !s.won && (s.flags.saw_ofuda || s.flags.asked_masahiro),
      say: "You let the case stay open. Shizuka remains where she is, if she is still there. The bridge still ends at mid-span. That break is the evidence you refused to finish.",
      score: 8, once: "stopped", flag: "won_intact", win: true },

    { id: "look_hall", room: "hall", match: "look, look around, examine the hall",
      say: () => state.flags.sensu
        ? "The great hall is empty. The south doors stand open on the purple evening. The sensu is gone from the boards."
        : "The great hall is empty except for a sensu lying on the boards, placed so the room would look recently used." },
    { id: "look_sensu", room: "hall", match: "look at the sensu, examine the fan, look at the fan, examine the letter, look at the letter, inspect the sensu",
      say: (s) => s.flags.sensu
        ? "The sensu is in your sleeve. The fan is the letter. Someone left it so the hall would look occupied."
        : "The fan is the letter. Someone left it so the hall would look occupied.",
      score: 4, once: "saw_sensu", whenScore: (s) => !s.flags.sensu },
    { id: "take_sensu", room: "hall", match: "take the sensu, take the fan, get the fan",
      when: (s) => !s.flags.sensu,
      say: "You take the sensu. The boards remember the shape of it.",
      score: 2, once: "took_sensu", flag: "sensu", hide: "sensu" },
    { id: "read_sensu", room: "hall", match: "read the sensu, read the fan, read the letter, open the fan",
      when: (s) => s.flags.sensu || s.flags.saw_sensu,
      say: (s) => {
        if (s.flags.ofuda_read && s.flags.heard_enkei) {
          return "The fan opens on a name. Shizuka was framed by a letter written as a poem, stitched into this sensu, and the thing the ofuda failed to bind was your own attention. The capital comes loose as you finish the sentence.";
        }
        return "The fan will not open all the way. The shrine still owes you a reading, or the man at the peak still owes you a warning.";
      },
      score: 15, once: "solved",
      whenScore: (s) => s.flags.ofuda_read && s.flags.heard_enkei,
      flag: "won_solved", win: true },

    { id: "look_ladies", room: "ladies", match: "look, look around",
      say: "The ladies' rooms are empty. Shizuka is not here. A bronze mirror lies on the floor." },
    { id: "look_mirror", room: "ladies", match: "look at the mirror, examine the kagami, look in the mirror, look at the kagami, examine the hand mirror, inspect the mirror",
      say: (s) => (s.flags.kagami ? "The mirror is in your hands. " : "") + "The mirror keeps the last face that stood here. It is not Shizuka's. A man's sleeve crosses the bronze.",
      score: 3, once: "saw_mirror" },

    { id: "look_tachi", room: "storehouse", match: "look at the tachi, examine the sword, look at the sword, inspect the blade, examine the tachi",
      say: (s) => s.flags.tachi_held
        ? "The tachi is in your hands. It was never drawn. Whatever crossed the yard was not a thing a sword could cut."
        : "The tachi was never drawn. Whatever crossed the yard was not a thing a sword could cut.",
      score: 2, once: "saw_tachi", whenScore: (s) => !s.flags.tachi_held },

    { id: "look_bridge", room: "bridge", match: "look, look around, look at the bridge, examine the planks",
      say: "The planks stop at mid-span. They were whole before you started asking questions.",
      score: 3, once: "saw_bridge" },

    { id: "look_veranda", room: "scene", match: "look at the veranda, examine the veranda, look at the empty veranda",
      when: (s) => s.flags.shizuka_gone,
      say: "The veranda is empty. Shizuka did not go to her rooms. She is simply no longer where you left her.",
      score: 4, once: "saw_empty_veranda" },
  ];

  let state;
  let logEl;
  let scoreEl;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (!Array.isArray(saved.seen)) saved.seen = [];
        return saved;
      }
    } catch (e) { /* new game */ }
    return freshState();
  }

  function freshState() {
    return { score: 0, flags: {}, won: false, seen: [], log: [
      "The courtyard is the first room of the case. An ofuda lies on the gravel. Shizuka will not go inside.",
      "Arrow keys walk. Type at the > prompt.",
    ] };
  }

  let playingNow = false;

  function save() {
    if (!state || sessionStorage.getItem("heian-begin") === "1") return;
    if (playingNow && window.HeianHere) state.room = window.HeianHere;
    if (playingNow && window.HeianPose) {
      const pose = window.HeianPose();
      if (pose) {
        state.x = pose.x;
        state.depth = pose.depth;
        state.faceLeft = pose.faceLeft;
      }
    }
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function roomId() {
    return window.HeianHere || "scene";
  }

  function norm(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9' ]/g, "").replace(/\s+/g, " ").trim();
  }

  const NAMES = {
    shizuka: "Shizuka", masahiro: "Masahiro", matsu: "Matsu", aya: "Aya", myoen: "Myōen",
    enkei: "Enkei", tamayori: "Tamayori", gyoban: "Gyōban", haru: "Haru", kura: "Kura",
    yoshi: "Yoshi", take: "Take", ichi: "Ichi", wata: "Wata", iso: "Iso", shio: "Shio",
    fune: "Fune", mura: "Mura", ai: "Ai", nabe: "Nabe", ito: "Ito", ue: "Ue", ban: "Ban",
  };

  function present(name) {
    if (name === "shizuka" && state.flags.shizuka_gone) return false;
    if (name === "enkei" && state.flags.heard_enkei) return false;
    return true;
  }

  function whoHere() {
    const place = PLACES[roomId()] || {};
    const here = Object.keys(place).filter((name) => NAMES[name] && present(name)).map((name) => NAMES[name]);
    if (!here.length) return "No one is here.";
    if (here.length === 1) return here[0] + " is here.";
    return here.slice(0, -1).join(", ") + " and " + here[here.length - 1] + " are here.";
  }

  function hint() {
    const id = roomId();
    const f = state.flags;
    if (state.won) return "The case has already ended. The score will keep.";
    if (id === "scene" && !f.ofuda) return "The paper on the gravel is the start. Look at it, then take it. Masahiro will say who can read it.";
    if (id === "scene" && f.shizuka_gone && !f.saw_empty_veranda) return "Look at the veranda.";
    if (id === "shrine-hall" && !f.ofuda_read) return "Talk with Myōen about the paper. He needs the ofuda in your hands.";
    if (id === "hall" && !f.saw_sensu) return "Look at the fan on the boards.";
    if (id === "hall" && f.ofuda_read && f.heard_enkei) return "Read the sensu. That finishes the case, and spends the capital.";
    if (id === "peak" && !f.heard_enkei) return "Talk with Enkei. Ask why he stopped.";
    if (id === "ladies") return "Look at the mirror.";
    if (id === "sewing") return "Talk with Aya about what she stitched.";
    if (id === "bridge") return "Look at where the planks stop.";
    if (id === "scene") return "You can abandon the case here, and leave the capital as it stands.";
    return "Walk. The shrine, the hall, and the peak are the three questions.";
  }

  function legal() {
    const id = roomId();
    return ACTIONS.filter((a) => !a.room || a.room === id);
  }

  // open-jev picks the attempt from the phrases it is shown. Distance is not a
  // reason to hide talk, take, or use: if those phrases are missing, the model
  // answers "none" and the prince never hears that he should walk closer.
  // Looking stays open from anywhere. The reach check runs after the match.
  const GROUND = new Set(["gravel", "floor", "path", "sand", "dirt", "planks", "boards", "lane", "road", "causeway", "stones", "yard", "track", "ledge", "stairs", "steps", "bank", "stain"]);
  const BESIDE = { dx: 100, dy: 48 };
  const SCRIPTED_NEAR = {
    take_ofuda: "ofuda", talk_shizuka: "shizuka", talk_masahiro: "masahiro",
    take_sensu: "sensu", read_sensu: "sensu", talk_aya: "aya",
    talk_myoen: "myoen", talk_enkei: "enkei",
  };

  function carried(name) {
    if (name === "tachi") return !!state.flags.tachi_held;
    return !!state.flags[name];
  }

  function peopleHere() {
    const place = PLACES[roomId()] || {};
    return Object.keys(place).filter((name) => FOLK[name] && present(name));
  }

  function beside(name) {
    if (FOLK[name] && !present(name)) return true;
    if (carried(name)) return true;
    const pose = window.HeianPose && window.HeianPose();
    if (!pose) return true;
    const things = (window.HeianThings && window.HeianThings()) || [];
    const hit = things.find((thing) => thing.name === name);
    if (hit) {
      const dx = (pose.x + pose.w / 2) - (hit.x + hit.w / 2);
      const dy = pose.foot - hit.foot;
      return Math.abs(dx) < BESIDE.dx && Math.abs(dy) < BESIDE.dy;
    }
    if (GROUND.has(name)) return true;
    return pose.depth < 0.42;
  }

  function targetOf(actionId) {
    if (Object.prototype.hasOwnProperty.call(SCRIPTED_NEAR, actionId)) return SCRIPTED_NEAR[actionId];
    const kind = actionId.split("_")[0];
    if (actionId.startsWith("talk_")) {
      const safe = actionId.slice(5);
      return Object.keys(FOLK).find((key) => key.replace(/[^a-z0-9]/g, "") === safe) || safe;
    }
    if (kind === "see" || kind === "look" || actionId === "greet_all") return null;
    if (kind === "topic") {
      const rest = actionId.slice(6);
      return Object.keys(FOLK).find((key) => rest.startsWith(key + "_")) || null;
    }
    if (["nudge", "ask", "pocket", "try", "greet", "likes"].includes(kind)) {
      const safe = actionId.slice(kind.length + 1);
      const place = PLACES[roomId()] || {};
      return Object.keys(place).find((key) => key.replace(/[^a-z0-9]/g, "") === safe) || safe;
    }
    return null;
  }

  function tooFar(actionId) {
    if (actionId === "greet_all") {
      return peopleHere().some((name) => beside(name)) ? null : "You are not close enough to greet anyone.";
    }
    const name = targetOf(actionId);
    if (!name || beside(name)) return null;
    const who = NAMES[name] || ("the " + name);
    return "You are not close enough to interact with " + who + ".";
  }

  function reachNote() {
    const place = PLACES[roomId()] || {};
    const names = Object.keys(place).filter((name) => name !== "look");
    const near = names.filter((name) => beside(name));
    const far = names.filter((name) => !beside(name));
    return "The prince can look at anything from here. He can talk, take, move, or use only what he is standing next to."
      + " Beside him: " + (near.length ? near.join(", ") : "nothing he can touch") + "."
      + (far.length ? " Too far to interact with: " + far.join(", ") + "." : "");
  }

  function mapperActions() {
    const list = legal().map((a) => ({ id: a.id, match: a.match }));
    const place = PLACES[roomId()] || {};
    const seen = new Set(list.map((a) => a.id));
    function push(id, match) {
      if (seen.has(id) || list.length >= 40) return;
      seen.add(id);
      list.push({ id, match: match.slice(0, 400) });
    }
    const people = Object.keys(place).filter((name) => FOLK[name] && present(name));
    for (const name of people) {
      const safe = name.replace(/[^a-z0-9]/g, "");
      const who = NAMES[name] || name;
      push("see_" + safe, "look at " + name + ", examine " + name + ", look at the " + name);
      push("talk_" + safe, "talk with " + who + ", talk to " + who + ", speak with " + who + ", talk with " + name + ", talk to " + name);
    }
    for (const name of Object.keys(ITEM_WORDS)) {
      if (!place[name]) continue;
      const words = ITEM_WORDS[name].split(", ");
      push("see_" + name, words.map((word) => "look at the " + word + ", examine the " + word).join(", "));
    }
    for (const name of Object.keys(place)) {
      if (name === "look") continue;
      const safe = name.replace(/[^a-z0-9]/g, "");
      push("see_" + safe, "look at the " + name + ", examine the " + name);
      push("nudge_" + safe, "move the " + name + ", push the " + name + ", shift the " + name);
      if (!FOLK[name] && deedFor(roomId(), name, "talk")) push("ask_" + safe, "talk to " + name + ", ask " + name);
      if (deedFor(roomId(), name, "take")) push("pocket_" + safe, "take the " + name + ", get the " + name + ", pick up the " + name);
      if (deedFor(roomId(), name, "use")) push("try_" + safe, "use the " + name + ", ring the " + name + ", play the " + name + ", light the " + name + ", show the ofuda");
    }
    return list.slice(0, 40);
  }

  function folkLine(actionId) {
    let name = "";
    let topicId = "";
    if (actionId === "greet_all") {
      const lines = peopleHere().filter((key) => beside(key)).map((key) => FOLK[key].greet);
      return lines.length ? lines.join(" ") : "No one is here to greet.";
    }
    if (actionId.startsWith("greet_")) name = actionId.slice(6);
    else if (actionId.startsWith("likes_")) name = actionId.slice(6);
    else if (actionId.startsWith("topic_")) {
      const rest = actionId.slice(6);
      name = Object.keys(FOLK).find((key) => rest.startsWith(key + "_")) || "";
      if (name) topicId = rest.slice(name.length + 1);
    } else return null;
    const folk = FOLK[name];
    if (!folk) return null;
    if (name === "shizuka" && state.flags.shizuka_gone) return "The veranda is empty. Shizuka is not there to answer.";
    if (name === "enkei" && state.flags.heard_enkei) return "Enkei is no longer on the apron.";
    if (actionId.startsWith("greet_")) return folk.greet;
    if (!topicId) return folk.likes;
    const topic = folk.topics.find((item) => item.id === topicId);
    if (!topic) return null;
    if (name === "myoen" && topicId === "paper" && state.flags.ofuda && !state.flags.ofuda_read) {
      state.flags.ofuda_read = true;
      state.score += 5;
      save();
    }
    return typeof topic.say === "function" ? topic.say(state) : topic.say;
  }

  function payOnce(flag, points) {
    if (!flag || state.flags[flag]) return;
    state.flags[flag] = true;
    if (points) state.score += points;
    save();
    paintScore();
  }

  function noteCase(name, topicId) {
    if (name === "shizuka" && topicId === "hall") payOnce("asked_shizuka", 2);
    if (name === "masahiro" && (topicId === "paper" || topicId === "priest")) payOnce("asked_masahiro", 3);
    if (name === "aya" && topicId === "sensu") payOnce("asked_aya", 4);
    if (name === "myoen" && topicId === "paper" && state.flags.ofuda) payOnce("ofuda_read", 5);
    if (name === "enkei") payOnce("heard_enkei", 5);
  }

  function openTalk(name, stage) {
    if (document.getElementById("talk")) return;
    const folk = FOLK[name];
    if (!folk) return;
    const deed = deedFor(roomId(), name, "talk");
    if (deed) payOnce(deed.once, deed.score);
    window.HeianTalking = true;
    const line = document.getElementById("line");
    if (line) line.disabled = true;
    const who = NAMES[name] || name;
    const box = document.createElement("div");
    box.id = "talk";
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    const title = document.createElement("div");
    title.className = "who";
    title.textContent = who;
    const scroll = document.createElement("div");
    scroll.className = "scroll";
    const choices = document.createElement("div");
    choices.className = "choices";
    sheet.append(title, scroll, choices);
    box.append(sheet);
    stage.append(box);

    function say(cls, text) {
      const p = document.createElement("p");
      p.className = cls;
      p.textContent = text;
      scroll.append(p);
      scroll.scrollTop = scroll.scrollHeight;
    }

    function close() {
      window.HeianTalking = false;
      box.remove();
      if (name === "enkei" && state.flags.heard_enkei) {
        hideNamed(stage, "enkei");
        applyWorld(stage);
      }
      if (line) {
        line.disabled = false;
        line.focus();
      }
    }

    say("them", folk.greet);
    for (const topic of folk.topics) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Ask about the " + topic.id + ".";
      button.addEventListener("click", () => {
        button.remove();
        say("you", "Atsuhira: " + button.textContent);
        const reply = typeof topic.say === "function" ? topic.say(state) : topic.say;
        say("them", who + ": " + reply);
        noteCase(name, topic.id);
      });
      choices.append(button);
    }
    const bye = document.createElement("button");
    bye.type = "button";
    bye.textContent = "That's all.";
    bye.addEventListener("click", close);
    choices.append(bye);
  }

  function runMapped(actionId, stage) {
    const far = tooFar(actionId);
    if (far) {
      print(far);
      return;
    }
    if (actionId.startsWith("talk_")) {
      const who = targetOf(actionId);
      if (who && FOLK[who]) {
        openTalk(who, stage);
        return;
      }
    }
    const about = folkLine(actionId);
    if (about) {
      print(about);
      return;
    }
    const action = legal().find((a) => a.id === actionId);
    if (action) {
      for (const line of perform(action)) print(line);
      if (action.hide) hideNamed(stage, action.hide);
      applyWorld(stage);
      return;
    }
    const kind = actionId.split("_")[0];
    const safe = actionId.slice(kind.length + 1);
    const place = PLACES[roomId()] || {};
    const name = Object.keys(place).find((key) => key.replace(/[^a-z0-9]/g, "") === safe);
    const verb = { see: "look", nudge: "move", ask: "talk", pocket: "take", try: "use" }[kind];
    if (!name || !verb) {
      print("That does not move the case.");
      return;
    }
    const aside = scenery(verb, name, stage);
    if (!aside) {
      print("That does not move the case.");
      return;
    }
    grant(aside, stage);
    applyWorld(stage);
  }

  const POEMS = {
    pines: "The prince recalls a verse his nurse sang: pines keep the wind, and the wind keeps nothing.",
    gravel: "A line from a court poem returns: the gravel is raked, and still the night leaves footprints.",
    sea: "He remembers a shore poem, unbidden: the boat is gone, the rope remains, the tide does not explain.",
    moon: "An old poem surfaces: the moon is a hand-mirror, and the hand is not here.",
  };
  let poemsHeard = 0;

  const PLACES = {
    scene: { look: "A raked gravel yard under a purple evening. The palace veranda holds the west. Dark trees close the east.",
      shizuka: ["Shizuka's hair reaches the boards. She looks down into the yard and not at you.", "She will not leave the veranda. You cannot move her, only stand where she is looking.", null],
      masahiro: ["Masahiro's robes are dark and his face is turned to the trees, as if the trees were the client.", "He takes one step aside on the gravel and keeps his eyes on the trees.", null],
      pine: ["The pine is clipped into clouds. Its trunk is older than the prince's name.", "The pine is planted. It does not step aside.", null],
      trees: ["The trees on the east are black against the sky. The road ends in them.", "You cannot move a forest.", "pines"],
      gravel: ["The gravel is white and cyan in the evening light, combed into waves.", "You drag a foot through the raking. It looks worse.", "gravel"],
      roof: ["The roof is a long run of green tiles, with vines hanging off the eaves. It keeps the veranda in shade while the yard stays bright.", "You cannot lift a palace roof.", null],
      pillar: ["A red pillar holds the corner of the veranda, thicker than a man and set on a pale stone foot.", "The pillar refuses to shift.", null],
      rail: ["The rail is orange wood between red posts. This is the boards a lady would watch from, which is why Shizuka is out here and not in her rooms.", "The rail is built into the veranda and will not move.", null],
      window: ["A round window sits in the wooden wall, pale as a moon that never changes.", "You are in the yard. The window does not open for you.", null],
      sky: ["The sky behind the trees is a flat purple, the color of an evening that has already decided to stay.", "You cannot move the sky.", null],
      stones: ["A band of grey stones runs along the near edge of the yard, worn flat by feet.", "You scuff a stone with your foot. It stays in the path.", null] },
    engawa: { look: "Polished boards run the length of the house. Matsu stands where the veranda meets the yard.",
      matsu: ["Matsu is small in a dark jacket, eyes on the yard, waiting to be told.", "You ask him to move. He steps along the boards and watches you from the new place.", null],
      boards: ["The boards are worn smooth where people turn to enter the hall.", "The floor of the house is not yours to rearrange.", null],
      pillars: ["Two red pillars hold the eaves over the boards. They are painted the same red as the frame of the doorway.", "A pillar of the house does not step aside.", null],
      roof: ["The roof is a band of green tiles, thick as a hedge, running the length of the veranda.", "You cannot shift the roof of a palace.", null],
      rail: ["Slatted rails run along both sides of the boards and stop where the doorway begins.", "The rail is pegged in place. It will not slide.", null],
      doorway: ["The doorway is a red frame around a dark hall. No one stands in it. Shizuka is not waiting just inside.", "The frame stays where the carpenters left it.", null],
      pine: ["A clipped pine stands beyond the left rail, green against the purple sky.", "The pine is planted. It does not move.", null],
      gravel: ["A strip of pale raked gravel lies at the foot of the boards, bright in the evening.", "You scuff the raking with a toe. The waves look worse.", null] },
    hall: { look: "Pillars, a wood floor, and the south doors open on purple sky. The hall is too large for the people in it.",
      doors: ["The south doors are open. Evening comes in and does not sit down.", "The doors are already where the evening wants them.", null],
      pillars: ["Red pillars hold a green roof you can hear more than see.", "A pillar does not negotiate.", null],
      floor: ["The boards run straight to the far doors, worn smooth where feet turn. The sensu letter was set on them so the empty hall would look recently used.", "You scuff one board with your heel. The floor does not care.", null],
      lattice: ["Wooden lattice fills the side panels and the band above the doors, dark wood over a pale ground.", "You press a lattice. It is part of the wall and will not slide.", null],
      sky: ["Purple evening shows past the pillars, flat and close, as if the hall had no weather of its own.", "You cannot move the sky.", null],
      pines: ["Black pines stand outside the open sides, cut against the purple like paper silhouettes.", "The pines are planted outside the hall. They do not step aside.", null],
      beams: ["Dark beams cross the ceiling in a tight grid, closer than the roof they pretend to be.", "You cannot reach the beams, and they would not move if you could.", null],
      rings: ["Two dark rings sit on the far doors, handles for a room that is already open.", "You tug a ring. The doors stay where the evening left them.", null] },
    ladies: { look: "Screens and a wood floor. The room smells of unused incense. Shizuka is not here.",
      screens: ["The screens are painted with thin autumn grasses.", "You slide a screen. It whispers and stays where you leave it.", null],
      floor: ["The floor is bare boards running to the far wall. Shizuka is missing from her rooms, and nothing of hers has been left on the wood.", "You scuff a board with your foot. The floor refuses to shift.", null],
      pillars: ["Red pillars stand at the corners and divide the walls into bays.", "A pillar will not move. The room is built on that refusal.", null],
      ceiling: ["The ceiling is a flat field of purple, darker than the wood and brighter than the alcove.", "You cannot move the ceiling.", null],
      doorway: ["A dark doorway sits in the middle of the far wall, with no one standing in it.", "The opening stays where it is. You cannot push a hole.", null],
      corridor: ["On the right the room opens into a longer passage of the same boards.", "You cannot pick up a passage. It stays where the house put it.", null],
      banner: ["A small red and gold hanging marks the far end of the side passage. It is only cloth.", "You tug the hanging. It shifts a little and settles back.", null] },
    "court-garden": { look: "A walled gravel garden and one pine. The door east returns to the ladies' rooms.",
      pine: ["This pine is smaller than the one in the yard, and prouder.", "It is wired into its shape. You leave it.", "pines"],
      gravel: ["The gravel is white and speckled under the pine, left loose rather than combed into waves.", "You scuff a heel through it, and a pale streak shows before the stones settle.", null],
      wall: ["A brown plank wall closes the west side of the garden, with no opening cut in it.", "The wall is set in the ground and will not move.", null],
      roof: ["Green tiles cover the corridor, stepped and darker along the ridge.", "The roof is out of reach, and the tiles stay where they were laid.", null],
      pillars: ["Red pillars stand in a straight row and hold the covered walk.", "You set a shoulder to a pillar. It does not give.", null],
      door: ["The red door on the east stands open onto the passage. Beyond it are the ladies' rooms, and Shizuka is still not in them.", "You push the frame. It is already open and will not travel.", null],
      sky: ["The sky is a flat purple, with a few white stars and nothing else in it.", "You cannot move the sky.", null] },
    sewing: { look: "A quiet room of screens. Silk is folded where Aya can reach it without looking.",
      silk: ["The silk is the color of watered peach. Stitches hide in it.", "You lift a fold and put it back. Aya's hands know the difference.", null],
      aya: ["Aya's hair is looped, and her eyes are on the work, not on you.", "She shifts her cushion when you ask, and the work comes with her.", null],
      floor: ["The floor is long warm boards running toward the screens, with a darker seam down the middle.", "The boards are the room. They do not lift for you.", null],
      pillars: ["The pillars are red and square, set between the pale walls.", "A pillar does not step aside.", null],
      screens: ["The screens are a row of wooden lattices over pale paper. Nothing is painted on them.", "You slide one a little. It sticks, then stays where your hand left it.", null],
      ceiling: ["The ceiling is a flat purple, closed in by a dark dotted band.", "You cannot move a ceiling.", null],
      panels: ["The lower walls are wood panels, warmer than the plaster above them.", "The panels are fixed in place. They refuse.", null],
      walls: ["The upper walls are plain gray plaster between the red posts.", "The walls stay. That is their whole work.", null] },
    storehouse: { look: "Dim timber, chests against the wall, and a bare floor that makes the tachi look accidental.",
      chests: ["The chests are shut and heavier than a question.", "You set a shoulder to one. It does not believe in you.", null],
      door: ["A flat purple door sits in a red frame on the left. You find it shut, with nothing on it that asks to be read.", "You push the door, and the storehouse keeps it shut.", null],
      floor: ["You stand on wide orange planks that run back toward the far wall.", "You try to lift a board, and the floor refuses.", null],
      beams: ["Green beams cross overhead, brighter than the brown timber around them.", "You cannot move the roof.", null],
      walls: ["Vertical brown boards fill the walls between black posts. You see no opening except the ones already cut.", "The walls do not move.", null],
      window: ["A small purple pane sits in the right wall, edged in red, and gives you no view.", "You cannot open it, because it is part of the wall.", null],
      stain: ["A dark irregular mark spreads on the near planks. You cannot tell whether it is a stain or only where the light failed.", "You rub it with your foot, and it stays.", null] },
    kitchen: { look: "Clay stoves along the east wall. The air is warm and smells of rice and iron.",
      stoves: ["The stoves are banked. A thin thread of heat comes off the clay.", "Nabe would have opinions if you moved her fire.", null],
      nabe: ["Nabe's headcloth is white and her sleeves are already working.", "She steps aside from the stove without being asked twice.", null],
      floor: ["The floor is pale boards running the length of the room, swept and empty of bowls.", "The boards are the floor of the house, and they will not shift for you.", null],
      walls: ["The walls are vertical timber, brown and close, with no window cut into them.", "You set a hand on the wall. It is the kitchen, and it refuses.", null],
      ceiling: ["Green slats cross overhead, and the purple evening shows through the gaps between them.", "The roof stays where the builders left it.", null],
      door: ["A red frame stands open on the left, and another faces you at the far end. Both are only evening, with no door hung in them.", "There is no panel to slide. The openings stay as they are.", null],
      pots: ["Round lids sit in a row on the clay. Nothing has been lifted tonight, and no supper has gone out to the hall.", "You nudge a lid. It rocks once and settles back on the mouth of the pot.", null],
      sky: ["The sky in the doorways and between the roof slats is a flat purple, with no cloud and no moon you can point to.", "You cannot move the evening.", null] },
    well: { look: "Packed earth and a stone well set off the path, so a person can pass.",
      well: ["The well mouth is dark. A bucket rests on the rim and has not been asked for.", "The well stays. You can move the bucket a hand's width, and you do.", null],
      roof: ["The well roof is a small cap of green tile, neat against the purple sky.", "You set a hand under the eave. The roof stays where the well put it.", null],
      wall: ["The wall is brown brick, course on course, and it closes the yard behind the well.", "You set a shoulder to the bricks. The wall refuses.", null],
      tree: ["A bare tree stands at the east end of the wall, black branches cut against the sky.", "The tree is planted. It does not move.", null],
      shadow: ["A person-shaped stain sits on the bricks, and no one is standing in front of it. The capital is already keeping shapes after their owners leave.", "You step sideways. The stain stays on the wall and does not follow your feet.", null],
      door: ["A timber frame opens in the near ground. Past the lintel there is only black.", "You pull at the frame. It is set in the earth and will not come.", null],
      sky: ["The sky is a flat purple, with no moon in it yet.", "You cannot move the sky.", null] },
    wash: { look: "A stone yard. Wooden tubs sit against the wall, and the stones are dark where water has lived.",
      tubs: ["The tubs are empty and still smell of lye and river.", "You drag a tub a little. Ito watches the floor, not you.", null],
      ito: ["Ito's faded blue sleeves are damp at the cuff.", "She moves to the next stone when you ask, as if the wash had told her to.", null],
      stones: ["The yard is paved in pale cobbles, darker in the seams where wash water has sat.", "You try to pry a cobble loose. It stays with its neighbors.", null],
      basin: ["A square stone basin sits at the right, full of still pale water.", "The basin is mortared in place, and the water will not be ordered aside.", null],
      fence: ["Red posts and brown planks close the yard, with a green roof running along the top.", "The fence does not move for you.", null],
      opening: ["A dark opening cuts the far fence, and purple sky shows through it.", "You cannot shift a gap that was built into the wall.", null],
      trees: ["Black branches hang in the upper right, bare against the evening.", "The trees are planted beyond the fence, and they do not come closer.", null],
      sky: ["The sky is a flat band of purple over the green roof.", "You cannot move the sky.", null] },
    "inner-garden": { look: "Walled gravel, one pine, and a kōro on the near stones. Ue looks west.",
      ue: ["Ue wears moss-green and a straw hat that hides the eyes.", "He steps toward the pine when you ask, which is where he was going.", null],
      sky: ["The sky is a flat purple over the roof, with no moon in it yet.", "You cannot move the sky.", null],
      roof: ["The roof is green tile, running along the white walls and turning the corner.", "The roof stays where the carpenters left it.", null],
      wall: ["White plaster fills the bays between dark posts. There is no gate cut in this side.", "The wall does not shift for you.", null],
      koro: ["The kōro is a small bronze burner on the near stones. The ash inside is still warm.", "You turn it. The ash shifts and stays warm.", null],
      pine: ["The pine is clipped into clouds, and its trunk stands in a ring of bare stones.", "The pine is planted. It does not step aside.", null],
      gravel: ["The gravel is white and combed into waves. The rings around the pine are still too clean, as if someone raked them after dark.", "You drag a foot through the raking. The line looks worse.", null],
      planks: ["Brown boards run in from the near edge, a walk laid over the gravel.", "The boards are fixed. They only take your weight.", null] },
    "east-wall": { look: "A gravel walk pinched between the palace wall and the evening. It only leads back west.",
      wall: ["The east wall is plaster and timber, closed, with no gate cut in it.", "You cannot move the wall of a palace.", null],
      gravel: ["The gravel is raked in white and cyan, pale against the gray stones at your feet.", "You scuff a line through the raking, and the pattern looks worse for it.", null],
      roof: ["A green tiled roof runs the length of the wall, the far eave curling up against the purple.", "The roof is the palace's, and it does not shift for a hand.", null],
      posts: ["Brown timber posts stand at even intervals, holding the white panels and the green roof.", "A post set into the wall does not step aside.", null],
      sky: ["The sky is a flat evening purple, with no cloud and no moon in it.", "You cannot move the sky.", null],
      stones: ["Round gray stones sit under each post, where the timber meets the walk.", "The bases are mortared in place, and they stay.", null],
      path: ["A gray cobbled strip runs along the near edge of the gravel, the only floor that looks walked.", "You try the stones with a foot. The path does not give.", null] },
    "moon-deck": { look: "An open deck. The rail keeps the water below from becoming the floor. A biwa lies on the near planks.",
      biwa: ["The biwa lies on the near planks, strings still up, as if the player only stepped away.", "You turn it so the neck points at the water. It is still a biwa.", null],
      moon: ["The moon is up enough to be a rumor in the purple.", "You cannot move the moon. You can only admit you looked.", "moon"],
      rail: ["The rail is low. The drop beyond it is not a path.", "You try the rail. It is solid, and you are glad.", null],
      planks: ["The planks run the whole length of the deck, warm brown under the night. Unlike the town bridge, they do not stop mid-span.", "You shift your weight, and one board gives a little before it settles back.", null],
      water: ["Water shows on both sides of the deck, a hard cyan broken into white flecks where it meets the bank.", "You cannot move the water. It stays below the rail.", null],
      pine: ["A green pine stands at the left, its needles clipped into flat clouds against the sky.", "The pine is planted. It does not step aside.", null],
      trees: ["The trees beyond the water are black shapes, too flat to count a single leaf.", "The trees refuse to move.", null],
      grass: ["A dark line of grass sits between the water and the black trees.", "The grass is on the far bank, and you cannot reach it to move it.", null],
      sky: ["The sky is an even purple, with no cloud written on it.", "You cannot move the sky.", null] },
    "night-bridge": { look: "A footbridge over dark water. Ban stands on the planks and looks east, toward the palace.",
      ban: ["Ban's indigo clothes make him part of the evening. His eyes do not.", "He steps aside on the planks. The bridge is narrow, and he knows it.", null],
      water: ["The water under the bridge is black and does not reflect you.", "You cannot move water by asking.", null],
      rail: ["A brown rail runs along the near left of the deck, with posts set into the planks. It is low enough to lean on and high enough to keep you out of the water.", "You set a hand on the rail. It is solid and does not shift.", null],
      planks: ["The planks are warm brown and run straight to the far bank, worn darker where feet have agreed.", "You press a board with your foot. It gives a little and stays a bridge.", null],
      bamboo: ["Two stands of green bamboo close the far end, with a dark gap between them where the path continues.", "The bamboo is planted. You push a culm and it returns.", null],
      trees: ["Black pines stand in a line behind the water, darker than the sky and taller than the bridge.", "You cannot move a forest.", null],
      moon: ["The moon is a plain white disc in the purple, with no face drawn on it.", "You cannot move the moon. You can only admit you looked.", null] },
    bamboo: { look: "A dirt path with bamboo on both sides, tall enough to make a roof of the sky.",
      bamboo: ["The culms tick against each other. The path is the only thing that agreed to let you through.", "You push a culm. It returns.", null],
      path: ["The dirt is packed orange-brown and speckled with pale grit. It is the only floor the grove agreed to give you.", "You scuff the dirt with a foot. It settles back into the same path.", null],
      sky: ["The sky is a flat purple wedge, narrowed by the tops of the grove until it almost disappears ahead.", "The sky stays where the evening put it.", null],
      grass: ["A strip of hard green grass runs along each edge of the dirt, darker where the culms throw shade.", "The grass is rooted. It does not come up for a prince.", null],
      stones: ["A few gray stones sit in the dirt, flat and ordinary, as if the path had shrugged them up.", "You nudge a stone with your foot. It turns once and stays a stone.", null] },
    shrine: { look: "The torii is red. Tamayori stands at the steps and looks toward the forest. Gyōban, nearer, looks at her. A pond holds the east until the near path.",
      tamayori: ["Tamayori's white and red are the brightest things on the path. She is looking west, not at you.", "She does not move for a prince. The steps are her place.", null],
      gyoban: ["Gyōban leans on a staff. The mountain is still on him.", "He shifts his staff and gives you the path, not his attention.", null],
      pond: ["The pond is bright and shallow. Pine needles float and do not sink.", "You cannot rearrange a pond.", null],
      torii: ["The torii's pillars are red down to the black feet.", "The gate stays. That is what a gate is for.", null],
      steps: ["Pale stone steps climb from the path to the shrine floor, worn in the middle where feet agree.", "The steps are set into the ground and will not shift.", null],
      doors: ["The wooden doors are shut, striped with gold, and darker than the red wall around them. Myōen is the one past them who can read Masahiro's ofuda.", "You try a door. It gives a finger, then holds.", null],
      roof: ["The roof is green tile, curved at the eaves, and cut by the black beam of the torii.", "You cannot move a roof.", null],
      pines: ["A shaped pine stands at the pond's edge, black trunk and a hard green crown.", "The pine is planted. It stays.", null],
      trees: ["Tall trees crowd the west of the path, gray trunks under a roof of green.", "The trees are rooted and will not step aside.", null],
      path: ["The path is gray and worn, with small pale stones scattered on it.", "You kick a pebble. It rolls an inch and stops.", null] },
    "shrine-hall": { look: "Wood floor, the smell of old incense, and Myōen in white and pale blue.",
      myoen: ["Myōen's cap makes him taller than his years. His eyes go to the hands, not the face.", "He steps toward the side door, which is the way he was already looking.", null],
      steps: ["Gray stone steps climb into the hall, each tread worn where feet have agreed to enter.", "The steps are set in the ground and do not shift.", null],
      pillars: ["Red pillars stand in a row and hold the roof clear of the floor.", "A pillar does not step aside.", null],
      beams: ["Dark beams cross under the eaves, squared and close, with purple sky between them.", "You set a hand to a beam. It is the roof's business, and it stays.", null],
      roof: ["The roof is a band of green tiles, brighter than the evening beyond the openings.", "You cannot lift a roof.", null],
      walls: ["The walls are warm wood planks, shut except where the night is let in on either side.", "The walls are the hall. They refuse.", null],
      doorway: ["The rear doorway is a black square with no door in it. In that quiet Myōen could read Masahiro's ofuda and keep the reading between the two of you.", "The opening is already open. There is nothing to shift.", null] },
    purification: { look: "A stone basin under a small roof. The water is in the basin and nowhere else.",
      basin: ["The water is clear enough to show the stone, not your face.", "You could move the ladle. You do, an inch, and feel foolish.", null],
      roof: ["A small green roof of overlapping tiles sits on red posts, just wide enough to cover the basin.", "The roof is fixed to the posts and will not lift.", null],
      pillars: ["Four red posts hold the roof a little above your head, plain and squared.", "You set a shoulder to a post. It does not give.", null],
      water: ["The water is a flat sheet of cyan in the stone, clear and still. You would rinse your hands here before you asked Myoen to read the ofuda.", "Your hand only wrinkles the surface. The water stays in the basin.", null],
      stones: ["Gray paving runs under your feet and turns toward the building on the right.", "One paver rocks a finger's width, then settles back into the bed.", null],
      trees: ["Black trees stand behind the basin, bare against a purple sky.", "The trees are planted. They do not move.", null],
      railing: ["An orange wooden railing runs along the building to the right, under red framing and a dark doorway.", "The railing is built into the wall and will not come loose.", null] },
    offering: { look: "A small room of stands and low tables, built into the architecture. No one has left a prayer you can see.",
      tables: ["The stands are empty on purpose.", "They are pegged to the floor.", null],
      floor: ["The floor is long brown boards running toward the back wall. A pale patch of light sits on the left, and nothing has been set down in it.", "The boards are the floor of the room, and they stay put.", null],
      ceiling: ["The ceiling is a run of green boards, low enough that the room feels shut in.", "You cannot shift the ceiling.", null],
      walls: ["The side walls are vertical wood, warm brown, with no writing and no cloth hung on them.", "A wall does not move because you ask.", null],
      panels: ["Three sets of tall wooden panels close the back of the room, with black gaps between them.", "The panels are built into the wall and will not slide.", null],
      doorway: ["A red frame on the left opens into a flat purple room. No one is standing in it.", "The doorway is part of the wall, and it refuses.", null],
      window: ["A red frame on the right wall holds a flat purple square. There is no face in it, and no paper.", "The window is set in the wall and will not come loose.", null] },
    bell: { look: "An open dirt court. The bell hangs off the path, large and patient.",
      bell: ["The bell is bronze and bigger than a man. The striker rests in its hook.", "You set a hand on the bell. It does not swing. You are not ready to ring it.", null],
      roof: ["The roof is green tile in four slopes, brighter than the evening around it. It keeps weather off the bell and nothing else.", "You cannot lift a roof that is already doing its job.", null],
      posts: ["Four dark posts hold the roof. The wood is plain, squared, and older than the paint on the tiles.", "You push a post. The frame does not notice.", null],
      stones: ["The frame stands on a ring of pale stones, fitted tight, with no mortar you can see.", "The stones are the floor under the bell. They stay.", null],
      fence: ["A low wooden fence crosses the court and turns at the right, closing the yard without a gate in it.", "You set a shoulder to the fence. It is pegged, and it refuses.", null],
      trees: ["Black pines stand behind the fence, and a larger tree fills the right edge. They are shapes, not a path.", "Planted trees do not step aside.", null],
      sky: ["The sky is a flat purple, with no moon in it yet and no weather coming.", "You cannot move the sky.", null] },
    forest: { look: "Cedars meet overhead. The dirt road narrows as it climbs. Haru looks east, toward the shrine. A magatama lies on the near dirt.",
      haru: ["Haru's red armor is too fine for a forest road. He looks past you, toward the shrine.", "He steps to the edge of the dirt so you can pass, and no farther.", null],
      cedars: ["The bark is gray and the needles are a hard green. The path is a favor they are reconsidering.", "Trees do not move. The poem about them is older than the path.", "pines"],
      magatama: ["The jewel is small, comma-shaped, and older than the case.", "You nudge it with a toe. It turns. You leave it, which is harder.", null],
      sky: ["The sky between the crowns is a flat purple, with no cloud in it.", "You cannot move the sky.", null],
      road: ["The road is packed brown dirt, pale stones worked into it, narrowing until the trees take it.", "You scuff the dirt. The road stays the road.", null],
      grass: ["Green grass fills both verges, brighter where the sky can reach it.", "The grass is rooted. It does not come up.", null],
      stones: ["Pale stones sit in the near dirt, worn flat by feet.", "You toe one stone. It shifts an inch and stops.", null],
      hills: ["A dark rise closes the end of the road, where the track disappears.", "The far hills do not move.", null] },
    rice: { look: "Flooded fields on both sides of a raised dirt causeway. The water is loud and is not the floor.",
      rice: ["The shoots are bright against brown water. Someone has been here today.", "The fields are planted. You walk the causeway and leave them.", null],
      causeway: ["The causeway is packed earth, just wide enough for one person and a worry.", "It is the path. Moving it would be a different game.", null],
      sky: ["The sky is a flat purple from edge to edge, with no cloud and no moon in it. You look up and the color does not change.", "You cannot move the sky.", null],
      water: ["The paddies are flooded to a bright cyan, and a wider band of the same water runs behind the fields. It is loud beside the path and it is not a floor.", "You cannot move the water by asking.", null],
      trees: ["A tight clump of dark trees sits at the far end of the dirt, where the path meets the far water. They are planted and they close the view.", "The trees stay where they were planted.", null],
      banks: ["Dark earthen banks cut the flooded fields into rectangles and keep the water off the dirt. The edges are sharp and a little higher than the flood.", "You scuff a bank with your foot. The earth does not give.", null] },
    farm: { look: "A timber farmhouse and a dirt yard. Kura looks east, toward the fields.",
      kura: ["Kura's brown kosode is mended at the shoulder. Her feet know the yard.", "She moves toward the door, which still counts as the yard.", null],
      house: ["The farmhouse is low, smoke-dark under the eaves, and shut.", "You cannot take a house with you.", null],
      thatch: ["The roof is a thick brown thatch, heavier than the posts that hold it. Smoke has darkened the eaves, and the ridge still points at the sky.", "You tug a loose straw. It stays with the roof.", null],
      door: ["The doorway is a dark rectangle under the eaves. You cannot see the room past it.", "You push at the jamb. The opening gives nothing.", null],
      yard: ["The yard is packed dirt from the house to the near edge of the picture. It is bare enough that a single set of prints would show, and it does not.", "You scuff the dirt with a heel. The mark fills itself.", null],
      trees: ["A row of trees stands behind the house on the left, dark green against the sky.", "The trees are planted. They do not move.", null],
      sky: ["The sky is a flat purple, with no cloud and no sun you can point to.", "You cannot move the sky.", null],
      field: ["A narrow flooded field runs along the right, green at the border and dark in the water.", "The field is planted and wet. You leave it.", null] },
    mill: { look: "A small mill. The wheel turns beside the path, and the stream stays off it. Yoshi looks west.",
      yoshi: ["Yoshi's sleeves are rolled. Flour dusts the gray jacket.", "He steps off the path, closer to the wheel, and leaves you the dirt.", null],
      wheel: ["The wheel is wet and steady. It does not care that you are a prince.", "You cannot move a working wheel without breaking the mill.", null],
      mill: ["The mill is a low timber house under a thick thatch roof. The boards are shut, and the work is all outside at the wheel.", "You push a wall board. The mill does not give.", null],
      thatch: ["The thatch is gray-brown and heavy, layered down to the eaves.", "You cannot reach the roof from the path, and it would not come loose if you could.", null],
      stream: ["The stream runs bright beside the mill and under the wheel, then keeps to its ditch. It never crosses the path.", "You cannot move the stream. It already has a bed.", null],
      path: ["The path is pale packed dirt, wide enough for a cart, and it runs straight between the grass until the trees take it.", "The path is what you are standing on. It stays.", null],
      grass: ["The grass is a hard green on both sides of the path, cut short around the mill and left longer toward the trees.", "You scuff the grass with a foot. A few blades lean and then stand up again.", null],
      pines: ["Dark pines stand along both sides, and a twisted pine leans in from the right. They make a wall where the path ends.", "The pines are planted. They do not step aside.", null] },
    copse: { look: "Cedars and a dirt clearing. Take looks east into the trees, as if the trees owed him an answer.",
      take: ["Take has a short beard and a dark green jacket. The axe is in his belt, not in a tree.", "He steps aside. The clearing is large enough.", null],
      trees: ["Cedars stand in two dark ranks and leave a lane of purple sky between them. The trunks are close, and you cannot see a way through.", "The trees are planted and do not step aside.", null],
      sky: ["The sky is a flat purple, with no cloud and no moon in it.", "You cannot move the sky.", null],
      path: ["The dirt is pale in the middle and darker where feet have packed it toward the trees.", "You scuff the dirt. It shifts a little and settles back into the path.", null],
      grass: ["Green grass borders the dirt and runs under the first trees.", "You flatten a patch with your foot. It springs back almost at once.", null],
      rice: ["Two flooded plots sit at the near corners, each holding short green shoots in gray water.", "The shoots are planted. You leave them.", null],
      water: ["The water in the plots is still and gray, only deep enough to hold the shoots.", "You cannot move the water by asking.", null] },
    steps: { look: "Stone treads cut into the slope. They go west to the cave, east to the cliff, north to the peak, and south back to the cedars.",
      steps: ["The stone is hollowed in the middle, where feet have agreed for years.", "You cannot move a mountain's stairs.", null],
      sky: ["The sky is a flat purple above the trees, with no moon and no weather in it.", "You cannot move the sky.", null],
      trees: ["A row of green pines stands above the stone, striped dark where the needles overlap.", "The trees are planted in the slope. They refuse.", null],
      dirt: ["Brown dirt fills the bottom of the picture, dotted where the path meets the lowest tread.", "You scuff the dirt. It shifts a little and settles back.", null],
      blocks: ["Three pale stone blocks sit stacked on the right of the stairs, each framed by a darker edge.", "You push a block. It is mortared into the stair and does not give.", null],
      seams: ["White seams run the length of each tread, brighter than the gray stone around them.", "The seams are only edges of stone. They do not come loose.", null] },
    peak: { look: "A tiny stone shrine on a ridge. The dirt apron is the only floor. The cliffs drop on either side.",
      shrine: ["The peak shrine is one room wide and older than the palace.", "It is the peak. It stays.", null],
      enkei: ["Enkei stands thin on the dirt and looks west, away from the capital. He is the man who hides once the warning is given.", "He steps aside on the apron and keeps his face to the west.", null],
      roof: ["The roof is green tile, small and bright against the purple sky.", "The tiles do not shift. They are the shrine's only cover.", null],
      door: ["The door is orange wood in a gray stone frame, shut tight.", "You try the door. It refuses.", null],
      pines: ["Two pines stand on the rock, one to each side of the shrine, dark green and wind-cut.", "The trees are planted in the cliff. They refuse.", null],
      cliffs: ["Gray cliffs drop on both sides of the dirt. There is no path down them.", "You do not move a cliff.", null],
      sky: ["The sky is a flat purple with no cloud and no moon.", "You cannot move the sky.", null] },
    cave: { look: "Rock walls and a flagstone floor. A dark pool sits in the near left. The only way out is the stair on the right. Enkei is not here.",
      pool: ["The pool is dark and still. It does not show the moon.", "You cannot move a pool cut into the rock.", null],
      wall: ["The rock wall is a flat grey face, darker at the top, with pale points hanging along its edge. You see no mark that anyone has lived against it.", "You push the wall. It is the cave, and it does not move.", null],
      floor: ["Pale flagstones cover the floor in uneven polygons, smoother where feet have crossed.", "You scuff a stone. It sits tighter than it looks and will not lift.", null],
      arch: ["A stone arch on the right frames the only way out, cut clean against the black above.", "You set a hand on the arch. The stone does not give.", null],
      stairs: ["Grey treads climb through the arch toward daylight and a tree.", "You shift your weight on a tread. The stair stays where it was cut.", null],
      tree: ["Through the arch a brown trunk and dark leaves stand outside, not in the cave.", "The tree is planted beyond the stair. You cannot move it from here.", null],
      stalactites: ["Pale points hang along the top of the rock, like teeth that never close.", "You cannot reach them, and they do not fall for you.", null] },
    cliff: { look: "A narrow dirt ledge. West joins the steps. The drop is beside the ledge, not under your feet.",
      ledge: ["The dirt is pale and the edge is closer than manners allow.", "You do not move the cliff. You respect it.", null],
      stairs: ["Stone treads climb the left side, wide and gray, heading back the way you came.", "You cannot move a mountain's stairs.", null],
      pines: ["The pines stand in a hard green row against the purple, crowded behind the rocks.", "The pines are planted. They do not step aside.", null],
      boulders: ["Two piles of gray stone sit on the grass, cracked and heavier than a courtesy.", "You set a shoulder to the nearest boulder. It does not agree.", null],
      sky: ["The sky is a flat purple evening, with no moon in it.", "You cannot move the sky.", null],
      water: ["A strip of bright water shows far under the drop. The path stops short of it, the way the town bridge stops mid-span.", "You cannot move water by asking.", null],
      tree: ["A black tree fills the right side, all trunk and bare branches, with grass at its feet.", "The tree is rooted. It refuses.", null] },
    market: { look: "A dirt lane between stall roofs. Ichi, in orange, looks east. A longbow lies on the near dirt.",
      ichi: ["Ichi's orange jacket and white leggings are the loudest thing in the lane. Her outline is whole.", "She steps toward a stall and leaves you the middle of the lane.", null],
      stalls: ["The stalls are empty of sellers except her. Cloth hangs and does not advertise.", "The posts are set in the ground.", null],
      yumi: ["The longbow is taller than the woman who is not holding it.", "You turn the bow so it lies along the lane. It is still a bow.", null],
      roofs: ["Green tiles run down the left stalls and orange tiles down the right, both leaning over the lane.", "The roofs are pegged to the posts and will not lift.", null],
      lane: ["The lane is packed brown dirt, wide enough for a cart and empty of one.", "You scuff the dirt. It settles back into the same lane.", null],
      stones: ["A gray stone curb lines both edges of the dirt, neat as a rule.", "The stones are set. You cannot shift the curb.", null],
      trees: ["Dark pines close over the far end of the lane and leave a black gap in the middle.", "The trees are planted. They do not move.", null],
      grass: ["Bright weeds grow at the stall posts and along the stone, as if the market has been quiet.", "You toe a clump of grass. It bends and stays rooted.", null],
      sky: ["The sky is a flat purple with no cloud and no moon in it.", "You cannot move the sky.", null] },
    bridge: { look: "A wooden bridge. The deck runs from the market and stops at mid-span. Water is below, not the floor.",
      planks: ["The last plank ends cleanly, as if the rest had never been built.", "You cannot lay a plank that is not here.", null],
      gap: ["The boards stop in a clean gap over the middle of the water. This is the town bridge that ends at mid-span, the capital already coming loose around the break.", "You cannot cross a gap by naming it.", null],
      water: ["The water is a hard cyan, stippled white where the light sits on it, and it runs under the place the boards refuse to go.", "You cannot move the water by asking.", null],
      sky: ["The sky is one flat purple from the tree line upward, with no cloud and no moon.", "The sky does not shift for you.", null],
      pines: ["Black pines stand in a row on both banks, thicker and greener at the right edge.", "Planted trees do not step aside.", null],
      rocks: ["Gray rocks shore the right bank where the remaining boards come down toward the grass.", "You set a foot on a loose stone. It shifts a little and stays.", null],
      grass: ["A band of green grass sits above the rocks on the far right, under the last pines.", "You scuff the grass. It bends and lies back.", null] },
    river: { look: "A dirt bank. The river stays on the left. East is the market. South is the ferry.",
      river: ["The water is fast and brown at the edge, dark in the middle.", "A river is a decision you do not get to edit.", null],
      bank: ["The bank is packed brown dirt, higher than the water and wide enough to walk. It is the long way around, the one people take when the town bridge stops in the middle of the span.", "You scuff the dirt. A little of it shifts, and the bank stays the path.", null],
      pines: ["The pines stand on the right, one set apart from the cluster, dark green against the evening.", "You set a hand on a trunk. Planted trees do not step aside.", null],
      sky: ["The sky is a flat purple, with no cloud and no moon in it yet.", "You cannot move the sky.", null] },
    ferry: { look: "A wooden landing. Wata looks west, across the water, toward the other bank.",
      wata: ["Wata's headcloth is wrapped tight. He looks like a man who has already made the crossing in his head.", "He steps along the landing and keeps his face to the west.", null],
      water: ["The water is pale and patterned, and it is not a floor. Across it the far bank is still there, while the town bridge stops mid-span and does not.", "The water refuses you. It has a whole river's practice at that.", null],
      planks: ["The landing is brown boards laid in stripes, running down toward the water and stopping where a boat would.", "You shift a loose board with your foot. It knocks once and settles back.", null],
      posts: ["Three posts stand on the planks, gray shafts with small red caps, set for tying off.", "You push the nearest post. It rocks a little in its socket and stays seated.", null],
      trees: ["Black trees stand on both banks against the purple sky. They close the view. They do not open a path.", "The trees are planted. They do not step aside.", null],
      reeds: ["A stand of bright green reeds grows out of the dirt on the right, taller than the bank and thinner than a post.", "You bend a reed. It springs back, and the stand stays.", null],
      hedge: ["Squared green hedges run along the far bank, like a garden that decided the water was enough of a wall.", "The hedge is grown into the bank. Pushing it only proves that.", null] },
    "landing-west": { look: "The other bank. Dirt and boards, and a lane north toward houses.",
      landing: ["The far landing is ordinary, which is the strangest thing about it.", "There is nothing here to move but yourself.", null],
      posts: ["Four posts stand at the near boards, gray stone under flat red caps. They mark a crossing that finishes, which the town bridge, stopped at mid-span, does not.", "You set a hand on a post. It does not give.", null],
      water: ["The water on your left is bright and broken into little lights. It stays beside the boards and does not become the path.", "You cannot move the water by asking.", null],
      path: ["A brown dirt lane runs north between the grass, narrow and unbroken, toward the dark trees.", "The path is the ground under you. It stays.", null],
      grass: ["The grass is a flat hard green on both sides of the lane, cut clean where the dirt begins.", "The grass is planted. It does not come up.", null],
      pines: ["Black pines stand in a line under a plain purple sky, thick on the left and thick again on the right.", "The pines are planted. They refuse to move.", null],
      reeds: ["A clump of thin reeds grows out of the bare dirt on your right, darker than the grass.", "You brush the reeds. They sway and settle back.", null] },
    village: { look: "A short street of timber houses. Mura looks west, down the street, as if expecting worse news than a prince.",
      mura: ["Mura's deep red kosode and black cap mark him as the man the street asks.", "He steps into a doorway and still counts as present.", null],
      houses: ["The houses are shut. Smoke comes from one, politely.", "You do not enter, and you do not move them.", null],
      road: ["The road is packed dirt, pale where feet have worn it, and it runs west between the houses until the trees close the view.", "You scuff the dirt. The road stays the road.", null],
      grass: ["Green grass fills the strips between the road and the house posts.", "You toe the grass. It bends and stands back up.", null],
      doors: ["The doors are orange timber, shut, and still in their frames. If the capital is coming loose, these doors have not agreed yet.", "You try a door. It is latched and will not give.", null],
      roofs: ["The roofs are green tile, curved, and they overlap so the street has a green lid on both sides.", "The tiles are fixed. You cannot shift a roof.", null],
      windows: ["The windows are white paper in dark frames, and nothing moves behind them.", "The paper is set in the wall. It stays.", null],
      pines: ["Two dark pines stand on the left of the road, taller than the near roofs.", "The pines are planted. They do not move.", null] },
    marsh: { look: "A raised dirt track through reeds. West is the ferry. South is the shore. The reeds are not the floor.",
      reeds: ["The reeds are taller than you and full of small sounds.", "You push through and the track is still the only floor.", null],
      sky: ["The sky is a flat violet with a few hard white stars. You look up, and the marsh stays under your feet.", "You cannot take hold of the sky.", null],
      willow: ["Two black willows hang over the far bank, their branches drawn down like wet hair.", "The willows are rooted in the far ground and will not move.", null],
      water: ["The water is a bright blue sheet between the reed banks, speckled as if with light.", "You cannot move the water.", null],
      cattails: ["Brown cattails stand in the shallows, thicker on the left and again at the right edge.", "You bend a cattail. It springs back.", null],
      path: ["A bare brown path climbs from the near ground and narrows between the water and the reeds.", "You scuff the dirt. A little of it shifts, and the path is still there.", null],
      posts: ["A few short wooden posts rise out of the water beside the path, uneven and unfinished.", "You push a post. It rocks a little in the mud and stays put.", null] },
    shore: { look: "Sand along the bottom of the picture. The sea is only the far background. Iso looks east.",
      iso: ["Iso is bare below the knee. Salt has whitened the hem of his jacket.", "He moves down the sand and keeps looking east.", null],
      sea: ["The sea is a bright band and a darker band and then sky.", "You look, and a poem you did not invite stands up in you.", "sea"],
      path: ["A pale track runs up the middle of the sand toward the water and stops short of the surf. Your feet are already on it.", "You scuff the edge. The track is still the way down.", null],
      platform: ["A low wooden platform sits on the left sand, four short posts under a flat top, dry as a table that has not met the tide.", "You push a corner. It rocks once on the sand and settles.", null],
      pines: ["Dark pines crowd the left edge, green only where the light still reaches the needles.", "The pines are planted. They do not make room.", null],
      tree: ["A black tree stands on the right, wide enough to eat the sky behind it.", "You set a hand on the trunk. The tree refuses.", null],
      sky: ["The sky is a flat violet, with no cloud and no moon.", "You cannot move the sky.", null],
      sand: ["The sand is tan and open, marked by the path and by the shadow under the platform.", "You drag a foot. A little sand shifts, and the shore does not.", null] },
    dunes: { look: "Sand hills. A path runs from the shore to the salt pans. The sea stays in the background.",
      sand: ["The sand is fine and holds a footprint only until the next look.", "You can move sand. The dune does not care.", null],
      sky: ["The sky is a flat purple with no cloud in it. It sits above the sea and does not change while you look.", "You cannot move the sky.", null],
      sea: ["The sea is a bright band behind the hills, lighter at the top and darker where it meets the sand.", "The sea stays where it is.", null],
      hills: ["The hills are rust-colored dunes with pale crests. They rise between you and the water.", "You scuff a slope. The hill does not move.", null],
      path: ["A pale path climbs the nearest dune and another gray path runs along the foreground toward the pans.", "The path is packed. Your foot only marks it.", null] },
    salt: { look: "Shallow pans beside a sand track. Shio looks west, toward the dunes, under a sun hat.",
      shio: ["Shio's pale kosode is crusted a little at the sleeve.", "She steps off the track, nearer the pans.", null],
      pans: ["The pans hold a finger of water and a long patience.", "They are dug into the ground.", null],
      sky: ["The sky is a flat purple with no cloud in it. The salt dries under that color and nothing else.", "You cannot shift the sky.", null],
      water: ["The water in the pans is a hard bright blue, shallow enough to show the pale floor under it.", "The water stays in the pans. You cannot move it.", null],
      piles: ["Three white heaps sit beyond the pans, raked into low cones. No one has come to take them, which fits a town whose bridge stops mid-span.", "You scrape a little salt aside. The heap settles back into a cone.", null],
      track: ["The track is gray and speckled, worn by feet and empty of carts.", "You scuff the gravel. The track is still the only path.", null],
      ridges: ["Gray ridges close the far side of the pans, one shape after another, with no gate cut in them.", "The ridges stay where they are.", null],
      banks: ["Dark packed banks divide the pans and keep each rectangle of water to itself.", "The banks are earth. They do not give.", null] },
    boatshed: { look: "A timber shed and sand. A boat sits inside, off the path. Fune looks east, toward the shore.",
      fune: ["Fune's sea-green jacket is the color of shallow water.", "He moves to the shed mouth and leaves the sand clear.", null],
      boat: ["The boat is up on rollers, tar on the rope, not in the water.", "You rock it. It thumps and stays a boat.", null],
      shed: ["The shed is open toward you, a timber frame with the boat kept up on dry sand. She is out of the water the way the town bridge stops before the far bank.", "You set a shoulder to a corner. The shed is a building, and it does not go.", null],
      roof: ["The roof is green tile in neat overlapping rows, and the eaves drop the inside of the shed into black.", "You reach the eave. The tiles stay where the carpenters left them.", null],
      posts: ["Thick timber posts hold the roof, each one ending on a pale stone foot in the sand.", "You lean on a post. It is part of the shed, and it refuses.", null],
      boards: ["The side wall is horizontal boards, warm brown, closed against the open sand.", "You push the boards. They are nailed, and they stay a wall.", null],
      sand: ["The sand is pale and empty in front of the shed, broken only by the dark cut of the eaves.", "You scuff the sand with a foot. It slides a little and settles back.", null],
      pines: ["Three dark pines stand at the right against a flat purple sky, and they are where the open sand ends.", "The pines are planted. They do not step aside.", null] },
    nets: { look: "Sand, and nets hung on poles. South is the boatshed.",
      nets: ["The nets are mended in three colors of twine.", "You straighten a hanging. It is still a net.", null],
      poles: ["Black poles stand in two rows, crossed at the top, with a lane of sand left open between them.", "You lean on a pole. It gives a little and stays set in the sand.", null],
      sand: ["The sand is pale and empty in the middle, marked only where the racks are planted.", "You scuff the sand. A print appears, and nothing comes to fill it.", null],
      sea: ["The sea is a bright strip under the sky, held off the sand by a thin white edge of surf.", "The water stays where it is. You cannot pull it onto the beach.", null],
      sky: ["The sky is a flat purple, with no cloud and no moon in it.", "You cannot move the sky.", null],
      trees: ["A few dark trees stand on the far land at either end of the beach.", "The trees are planted. They refuse to shift.", null],
      hills: ["Low dark hills close the beach on the left and on the right.", "The hills stay where the coast put them.", null] },
    dyer: { look: "A narrow dirt lane and cloth poles. North returns to the market.",
      cloth: ["The cloth on the poles is undyed and dyed and waiting.", "You turn a pole. The cloth follows, then hangs again.", null],
      hut: ["A log hut sits on the left, brown walls under a heavy thatch and a dark open door. You are not asked inside.", "The hut is set in the ground and will not shift.", null],
      thatch: ["The thatch is thick and brown, laid in a slope over the log walls.", "You cannot lift the roof.", null],
      ladder: ["A short wooden ladder leans against the hut wall, just under the eaves.", "You nudge the ladder. It taps the wall and leans again.", null],
      path: ["The dirt path is orange-brown and runs straight between the poles until the picture ends.", "You scuff the dirt. It settles back into the lane.", null],
      grass: ["Green grass fills both verges, speckled and a little taller than the edge of the path.", "You push the grass aside with a foot. It springs back.", null],
      tree: ["A dark tree stands at the right, its crown a flat mass of green against the purple sky.", "The tree is planted. It does not move.", null] },
    indigo: { look: "A work yard. Vats sit against the wall. Ai looks toward them, sleeves already blue.",
      ai: ["Ai's cuffs are a deeper blue than the rest of her.", "She steps back from a vat and gives you the yard.", null],
      vats: ["The vats are dark and still. The blue is a skin on the water.", "You do not put a hand in. You do shift an empty lid.", null],
      fence: ["The fence is a close run of stakes, taller than you, shutting the yard on two sides.", "You set your shoulder to a stake, and the fence does not give.", null],
      doors: ["Two plank doors stand shut in the fence, with a short bar over the nearer pair.", "You try the nearer door. It shifts a finger and stays shut.", null],
      dirt: ["The yard under you is packed orange earth, darker where dye has dripped.", "You scuff the dirt with a heel, and the mark is small.", null],
      sky: ["The sky is a flat violet, with no cloud and no moon yet.", "You cannot move the sky. It was already this color.", null],
      lids: ["Round wooden lids rest by the near dye, paler than the blue they belong to.", "You tilt a lid. It rocks once and settles where you leave it.", null],
      beam: ["A heavy beam caps the tall posts on the right, higher than the fence.", "You cannot shift a beam set that high.", null] },
    drying: { look: "Poles and lengths of cloth over a dirt yard. No one is standing under them.",
      cloth: ["The cloth moves when the air moves, which is almost a person.", "You walk between the poles. They were already spaced for that.", null],
      poles: ["Wooden poles stand in two long rows, with crossbars holding the hanging lengths. They make a lane down the middle of the yard.", "You lean on a near pole and it gives a little, then stands straight again.", null],
      bowls: ["A cluster of blue bowls sits far down the dirt, small with distance, as if someone set them out and walked away.", "You cannot reach the far bowls, and the nearest empty one only rocks and settles.", null],
      dirt: ["The yard is bare brown dirt, worn flat between the rows and rough at the edges.", "You scuff the dirt. It stays the floor.", null],
      stains: ["Dark patches mark the dirt, the color of dye that missed whatever it was meant for.", "You rub a stain with your foot. It does not lift.", null],
      sky: ["The sky is one flat purple, with no cloud and no sun, only the evening over the poles.", "You cannot move the sky.", null] },
  };

  function recall(key) {
    if (!key || !POEMS[key]) return "";
    if (state.flags["poem_" + key]) return "";
    if ((state.poems || 0) >= 2) return "";
    state.flags["poem_" + key] = true;
    state.poems = (state.poems || 0) + 1;
    save();
    return " " + POEMS[key];
  }

  function nudge(stage, word) {
    for (const img of stage.querySelectorAll("img")) {
      const src = img.getAttribute("src") || "";
      if (!src.includes("/" + word) && !src.endsWith(word + ".png")) continue;
      const left = parseFloat(img.style.left) || 0;
      const next = left + (state.flags["nudged_" + word] ? -28 : 36);
      img.style.left = next + "px";
      state.flags["nudged_" + word] = !state.flags["nudged_" + word];
      save();
      return;
    }
  }

  const ITEM_WORDS = {
    ofuda: "ofuda, paper, charm",
    sensu: "sensu, fan, letter",
    kagami: "kagami, mirror, hand mirror",
    tachi: "tachi, sword, blade",
    yumi: "yumi, bow, longbow",
    biwa: "biwa, lute",
    koro: "koro, incense, burner",
    magatama: "magatama, jewel, stone",
    silk: "silk, cloth",
  };

  const FOLK = {
    shizuka: {
      likes: "Shizuka will talk about the yard, the veranda, and the rooms she will not enter. She will not talk about the hall.",
      greet: "Shizuka does not turn. \"You are seen. That is the greeting.\"",
      topics: [
        { id: "yard", match: "ask shizuka about the yard, ask the lady about the gravel, why is shizuka watching the yard", say: "Shizuka keeps her eyes on the gravel. \"If I look away, the yard may not be the same yard.\"" },
        { id: "veranda", match: "ask shizuka about the veranda, why are you out here, ask the lady why she stands outside", say: "\"The boards are the only place I can see the whole yard. Inside, I would only hear it.\"" },
        { id: "rooms", match: "ask shizuka about her rooms, where are the ladies rooms, ask the lady why she is not inside", say: "\"My rooms are empty on purpose. Do not look for me there and then tell me what you found.\"" },
        { id: "hall", match: "ask shizuka about the hall, ask the lady about the sensu, ask shizuka about the fan", say: "Shizuka does not look at you. \"I will not speak of the hall.\"" },
      ],
    },
    masahiro: {
      likes: "Masahiro will talk about the paper, the trees, and the priest who can read the paper.",
      greet: "Masahiro does not turn from the trees. \"Prince. The gravel already knows you are here.\"",
      topics: [
        { id: "paper", match: "ask masahiro about the paper, ask the onmyoji about the ofuda, what is the charm", say: "\"The paper is the record. Something crossed the gravel, and the ofuda is the only thing that noticed.\"" },
        { id: "trees", match: "ask masahiro about the trees, why is he facing the trees, ask the wizard what he is looking at", say: "\"The trees are where the road ends. I am watching the place a thing would have to stop.\"" },
        { id: "priest", match: "ask masahiro about myoen, who can read the paper, ask the onmyoji about the priest", say: "\"Myōen can read it. I wrote the binding. He is the one who can say why it failed.\"" },
      ],
    },
    matsu: {
      likes: "Matsu will talk about the lady and the yard.",
      greet: "Matsu bows too fast. \"Your highness. The boards are swept.\"",
      topics: [
        { id: "lady", match: "ask matsu about the lady, ask matsu about shizuka, where is the lady", say: "Matsu bows too fast. \"She has not come in. She watches the yard as if it might leave.\"" },
        { id: "yard", match: "ask matsu about the yard, ask the servant what he sees, ask matsu about the gravel", say: "\"I see the gravel and the lady. I do not see whatever she is waiting for.\"" },
      ],
    },
    aya: {
      likes: "Aya will talk about the sensu and the silk.",
      greet: "Aya nods without lifting the silk. \"A good evening. I am in the middle of a stitch.\"",
      topics: [
        { id: "sensu", match: "ask aya about the sensu, ask the seamstress about the fan, what did you stitch", say: "Aya looks up from the silk. \"I stitched the writing into the sensu. I was told it was a poem.\"" },
        { id: "silk", match: "ask aya about the silk, ask the seamstress what the stitches say, ask aya about the thread", say: "\"The silk still has the line in it. Hold it to the light if you do not believe a fan can be a letter.\"" },
      ],
    },
    myoen: {
      likes: "Myōen will talk about the paper and the binding.",
      greet: "Myōen inclines his cap. \"You are welcome in the hall. Your hands are what I will look at.\"",
      topics: [
        { id: "paper", match: "ask myoen about the paper, ask the priest about the ofuda, ask myoen to read the charm", say: (s) => s.flags.ofuda
          ? "Myōen takes the paper and gives it back. \"This was meant to bind a thing that cannot be seen, heard, or touched. It failed when it was lifted off the gravel.\""
          : "Myōen looks at your hands. \"Bring the paper from the yard.\"" },
        { id: "binding", match: "ask myoen about the binding, what was the ofuda meant to do, ask the priest what failed", say: "\"It was meant to bind a thing that cannot be seen, heard, or touched. A binding fails when someone lifts it to look.\"" },
      ],
    },
    enkei: {
      likes: "Enkei will talk about attention and the fan.",
      greet: "Enkei glances back once. \"You climbed. That is greeting enough.\"",
      topics: [
        { id: "attention", match: "ask enkei about attention, ask the monk what he saw, why did enkei stop", say: "Enkei looks west along the ridge. \"The unseen thing is the prince's attention. Every room you finish comes loose.\"" },
        { id: "fan", match: "ask enkei about the fan, ask the monk about the sensu, what happens if I read the letter", say: "\"Read the fan in the hall, and the capital will not hold. Leave it unread, and the capital keeps its shape.\"" },
      ],
    },
    tamayori: {
      likes: "Tamayori will talk about the forest and the palace yard.",
      greet: "Tamayori keeps her eyes west. \"The shrine sees you. I do not need to.\"",
      topics: [
        { id: "forest", match: "ask tamayori about the forest, why is she looking west, ask the shrine maiden about the road", say: "Tamayori keeps her eyes on the forest. \"The shrine is awake. That road has been walked since dusk.\"" },
        { id: "yard", match: "ask tamayori about the palace, ask her about the yard, ask tamayori about the ofuda", say: "\"The yard at the palace is not awake. The paper there was written for a priest, not for me.\"" },
      ],
    },
    gyoban: {
      likes: "Gyōban will talk about Enkei and the peak.",
      greet: "Gyōban taps the staff. \"Prince. The steps are clear.\"",
      topics: [
        { id: "enkei", match: "ask gyoban about enkei, where is the monk, ask gyoban who went up the mountain", say: "Gyōban taps the staff once. \"Enkei is on the peak. He went up and did not come down to eat.\"" },
        { id: "peak", match: "ask gyoban about the peak, ask about the mountain, is the ridge safe", say: "\"The peak is a place a man stops. I stayed here so someone would still be at the steps.\"" },
      ],
    },
    haru: {
      likes: "Haru will talk about the jewel and the road back to the shrine.",
      greet: "Haru nods, still facing the shrine. \"The road is yours. I was already walking it.\"",
      topics: [
        { id: "jewel", match: "ask haru about the jewel, ask haru about the magatama, who left the stone", say: "Haru finally looks at you. \"I was walking back to the shrine when I saw the jewel. I did not put it there.\"" },
        { id: "road", match: "ask haru about the road, ask the guard what he saw in the forest, ask haru about the shrine", say: "\"The road narrows when you climb. I was facing the shrine because that is the way I was already going.\"" },
      ],
    },
    kura: {
      likes: "Kura will talk about the prints and the dawn.",
      greet: "Kura dips her chin. \"The yard is muddy. Mind the prints.\"",
      topics: [
        { id: "prints", match: "ask kura about the prints, who crossed the yard, ask the farmer about the footprints", say: "Kura points her chin at the causeway. \"Someone crossed before dawn. The mud is a single line of prints, and they stop.\"" },
        { id: "dawn", match: "ask kura about the dawn, what happened this morning, ask the farmer about the causeway", say: "\"Before dawn the yard was raked by feet, not by a rake. After dawn it was only mud.\"" },
      ],
    },
    yoshi: {
      likes: "Yoshi will talk about the wheel and the rice.",
      greet: "Yoshi lifts a floury hand. \"Evening. The wheel can talk if you cannot.\"",
      topics: [
        { id: "wheel", match: "ask yoshi about the wheel, has the mill been turning, ask the miller who came", say: "Yoshi shrugs flour off his hands. \"The wheel has turned since dusk. No one came for rice.\"" },
        { id: "rice", match: "ask yoshi about the rice, is anyone eating, ask the miller about the harvest", say: "\"The rice is ground. The hall did not send for it. A quiet kitchen is a kind of news.\"" },
      ],
    },
    take: {
      likes: "Take will talk about the axe and the trees.",
      greet: "Take touches the axe haft. \"You are in the clearing. The trees noticed first.\"",
      topics: [
        { id: "axe", match: "ask take about the axe, why is the axe in his belt, ask the woodcutter what he cut", say: "Take rests the axe head on his boot. \"I cut nothing today. The trees were already listening.\"" },
        { id: "trees", match: "ask take about the trees, ask the woodcutter about the copse, what are the trees doing", say: "\"They lean in when a person stops talking. I kept the axe out of them so I would not have to hear that.\"" },
      ],
    },
    ichi: {
      likes: "Ichi will talk about the bridge and the salt.",
      greet: "Ichi grins. \"A prince in the lane. Stand where the carts can pass.\"",
      topics: [
        { id: "bridge", match: "ask ichi about the bridge, was the bridge whole, ask the seller about the span", say: "Ichi folds her arms. \"The bridge was whole at noon. I sent a boy across for salt. He came back the long way, by the river.\"" },
        { id: "salt", match: "ask ichi about the salt, why did the boy go the long way, ask the seller about the errand", say: "\"Salt still comes from the pans. It just does not come across the middle of the water anymore.\"" },
      ],
    },
    wata: {
      likes: "Wata will talk about the bridge and the far bank.",
      greet: "Wata grunts. \"You want the bank, or you want a conversation. The boat does one of those.\"",
      topics: [
        { id: "bridge", match: "ask wata about the bridge, did you cut the bridge, ask the ferryman about the span", say: "Wata spits into the water. \"I did not cut the bridge. I only know the far bank is still there, which is more than the planks can say.\"" },
        { id: "bank", match: "ask wata about the far bank, ask the ferryman about the crossing, can we still cross", say: "\"The ferry still reaches the bank. The bridge has started telling the truth about the capital, which is that the middle is gone.\"" },
      ],
    },
    iso: {
      likes: "Iso will talk about the tide and the east.",
      greet: "Iso looks past you. \"The tide says hello. I was going to let it.\"",
      topics: [
        { id: "tide", match: "ask iso about the tide, why is the water wrong, ask the fisherman about the hour", say: "Iso squints east. \"The tide is wrong for the hour. It is waiting for something.\"" },
        { id: "east", match: "ask iso about the east, what is he looking at, ask the shore man about the sea", say: "\"East is where the water decides. Today it is deciding slowly, which is worse than a storm.\"" },
      ],
    },
    shio: {
      likes: "Shio will talk about the salt and the empty lane.",
      greet: "Shio tips the hat. \"Salt and sun. You are early, or the customers are late.\"",
      topics: [
        { id: "salt", match: "ask shio about the salt, are the pans full, ask the salt maker about the harvest", say: "Shio lifts the hat a finger. \"No one came for salt. The pans are full, and the lane is empty.\"" },
        { id: "lane", match: "ask shio about the lane, who usually comes for salt, ask about the customers", say: "\"The market sends someone by noon. Noon came. The lane did not.\"" },
      ],
    },
    fune: {
      likes: "Fune will talk about the boat and the span.",
      greet: "Fune pats the hull. \"She is staying dry. You may stand on the sand.\"",
      topics: [
        { id: "boat", match: "ask fune about the boat, why is the boat out of the water, ask the boatman about the shed", say: "Fune pats the boat. \"She is out of the water on purpose. I do not like the look of the span.\"" },
        { id: "span", match: "ask fune about the span, ask the boatman about the bridge, is the water safe", say: "\"A span that stops in the middle is a sentence someone did not finish. I will not put a boat under an unfinished sentence.\"" },
      ],
    },
    mura: {
      likes: "Mura will talk about the doors and the capital.",
      greet: "Mura bows a small one. \"The street is still a street. Come in from the news if you have any.\"",
      topics: [
        { id: "doors", match: "ask mura about the doors, is the village safe, ask the village man about his house", say: "Mura studies your face. \"If the capital is fraying, it frays here last. We still have our doors.\"" },
        { id: "capital", match: "ask mura about the capital, what has he heard, ask the village about the palace", say: "\"The capital is a story that arrives late. When it arrives early, I count the doors again.\"" },
      ],
    },
    ai: {
      likes: "Ai will talk about the sleeve and the vat.",
      greet: "Ai lifts a blue cuff. \"Evening. Do not lean on the vats.\"",
      topics: [
        { id: "sleeve", match: "ask ai about the sleeve, ask the dyer about the court sleeve, whose cuff was in the vat", say: "Ai shows a blue cuff. \"A court sleeve was in my vat and then it was not. The blue took the ink that was already on it.\"" },
        { id: "vat", match: "ask ai about the vat, ask the dyer about the ink, what happened to the blue", say: "\"The vat keeps what it is given. It was given a man's ink, and then the sleeve was taken back.\"" },
      ],
    },
    nabe: {
      likes: "Nabe will talk about the hall and the fan.",
      greet: "Nabe does not stop stirring. \"You are late for a meal that no one is eating.\"",
      topics: [
        { id: "hall", match: "ask nabe about the hall, did anyone eat, ask the cook about supper", say: "Nabe does not stop stirring. \"No one ate in the hall tonight. The fan was already on the floor when I looked in.\"" },
        { id: "fan", match: "ask nabe about the fan, ask the cook about the sensu, who left the fan", say: "\"I did not put it there. A fan on the floor is how an empty room pretends it just had a person in it.\"" },
      ],
    },
    ito: {
      likes: "Ito will talk about the cuff and the ink.",
      greet: "Ito wrings the sleeve. \"The water is clean. Your hems are your own affair.\"",
      topics: [
        { id: "cuff", match: "ask ito about the cuff, ask the washer about the sleeve, what came through the wash", say: "Ito wrings a sleeve that is already dry. \"A man's cuff came through here with ink on it, not mud.\"" },
        { id: "ink", match: "ask ito about the ink, whose ink was on the cloth, ask the laundress about the stain", say: "\"Ink is a court stain. Mud is a road stain. This one had never been on a road.\"" },
      ],
    },
    ue: {
      likes: "Ue will talk about the gravel and the rake.",
      greet: "Ue nods under the hat. \"The pine greets you. I am only the one with the rake.\"",
      topics: [
        { id: "gravel", match: "ask ue about the gravel, who raked the garden, ask the gardener about the pine", say: "Ue nods at the pine. \"The gravel was raked after dark. The rake is still wet.\"" },
        { id: "rake", match: "ask ue about the rake, why is the rake wet, ask the gardener who was here", say: "\"I rake at dusk, and then I stop. Someone raked again after that, and did not stay to be seen.\"" },
      ],
    },
    ban: {
      likes: "Ban will talk about the deck and the evening.",
      greet: "Ban speaks quietly. \"You are on the planks. I saw you before you spoke.\"",
      topics: [
        { id: "deck", match: "ask ban about the deck, who crossed the bridge, ask the watchman who he saw", say: "Ban speaks quietly. \"I watched the deck all evening. The only person who crossed was you.\"" },
        { id: "evening", match: "ask ban about the evening, did anyone else come, ask the guard about the night", say: "\"Evening is when a person can cross without being a person. Tonight the planks only took your weight.\"" },
      ],
    },
  };

  const DEEDS = {
    engawa: { matsu: { talk: ["Matsu bows too fast. \"The lady has not come in. She watches the yard as if it might leave.\"", 1, "heard_matsu"] } },
    kitchen: { nabe: { talk: ["Nabe does not stop stirring. \"No one ate in the hall tonight. The fan was already on the floor when I looked in.\"", 1, "heard_nabe"] } },
    wash: { ito: { talk: ["Ito wrings a sleeve that is already dry. \"A man's cuff came through here with ink on it, not mud.\"", 1, "heard_ito"] } },
    "inner-garden": { ue: { talk: ["Ue nods at the pine. \"The gravel was raked after dark. The rake is still wet.\"", 1, "heard_ue"] } },
    "night-bridge": { ban: { talk: ["Ban speaks quietly. \"I watched the deck all evening. The only person who crossed was you.\"", 1, "heard_ban"] } },
    shrine: {
      tamayori: { talk: ["Tamayori keeps her eyes on the forest. \"The shrine is awake. The yard at the palace is not.\"", 1, "heard_tamayori"],
        use: ["You show her the ofuda. She will not touch it. \"That paper was written for a priest, not for me.\"", 1, "showed_tamayori"] },
      gyoban: { talk: ["Gyōban taps the staff once. \"Enkei is on the peak. He went up and did not come down to eat.\"", 1, "heard_gyoban"] },
    },
    forest: {
      haru: { talk: ["Haru finally looks at you. \"I was walking back to the shrine when I saw the jewel. I did not put it there.\"", 1, "heard_haru"] },
      magatama: { take: ["You pocket the magatama. It is warm, which a stone should not be.", 1, "took_magatama", "magatama", "magatama"] },
    },
    farm: { kura: { talk: ["Kura points her chin at the causeway. \"Someone crossed before dawn. The mud on the yard is a single line of prints, and they stop.\"", 1, "heard_kura"] } },
    mill: { yoshi: { talk: ["Yoshi shrugs flour off his hands. \"The wheel has turned since dusk. No one came for rice.\"", 1, "heard_yoshi"] } },
    copse: { take: { talk: ["Take rests the axe head on his boot. \"I cut nothing today. The trees were already listening.\"", 1, "heard_take"] } },
    market: {
      ichi: { talk: ["Ichi folds her arms. \"The bridge was whole at noon. I sent a boy across for salt. He came back the long way, by the river.\"", 1, "heard_ichi"] },
      yumi: { take: ["You take the longbow. It is taller than it has any right to be in your hands.", 1, "took_yumi", "yumi", "yumi"] },
    },
    ferry: { wata: { talk: ["Wata spits into the water. \"I did not cut the bridge. I only know the far bank is still there, which is more than the planks can say.\"", 1, "heard_wata"] } },
    shore: { iso: { talk: ["Iso squints east. \"The tide is wrong for the hour. It is waiting for something.\"", 1, "heard_iso"] } },
    salt: { shio: { talk: ["Shio lifts the hat a finger. \"No one came for salt. The pans are full, and the lane is empty.\"", 1, "heard_shio"] } },
    boatshed: { fune: { talk: ["Fune pats the boat. \"She is out of the water on purpose. I do not like the look of the span.\"", 1, "heard_fune"] } },
    village: { mura: { talk: ["Mura studies your face. \"If the capital is fraying, it frays here last. We still have our doors.\"", 1, "heard_mura"] } },
    indigo: { ai: { talk: ["Ai shows a blue cuff. \"A court sleeve was in my vat and then it was not. The blue took the ink that was already on it.\"", 1, "heard_ai"] } },
    sewing: { silk: { use: ["You hold the silk to the light. A line of stitches reads, faintly: the name is in the fan.", 1, "read_silk"] } },
    storehouse: { tachi: { take: ["You take the tachi. It has never been drawn, and the scabbard knows it.", 1, "took_tachi", "tachi_held", "tachi"] } },
    ladies: { kagami: { take: ["You take the hand mirror. It is heavier than a mirror should be.", 1, "took_kagami", "kagami", "kagami"] } },
    "moon-deck": { biwa: { take: ["You take the biwa. The strings are still tuned.", 1, "took_biwa", "biwa", "biwa"],
      use: ["You strike one string. The note is the same pitch as the bell you have not rung.", 1, "played_biwa"] } },
    "inner-garden": { koro: { take: ["You take the incense burner. The ash inside is warm.", 1, "took_koro", "koro", "koro"],
      use: ["You light what ash remains. The smoke goes west, toward the hall, and will not be waved aside.", 1, "lit_koro"] } },
    bell: { bell: { use: ["You ring the bell once. The sound goes down the steps and does not come back. Birds do not rise, because there are no birds.", 1, "rang_bell"] } },
  };

  function deedFor(room, name, verb) {
    const row = DEEDS[room] && DEEDS[room][name] && DEEDS[room][name][verb];
    if (!row) return null;
    const [text, score, once, flag, hide] = row;
    return { text, score, once, flag, hide };
  }

  function scenery(verb, name, stage) {
    const spec = (PLACES[roomId()] || {})[name];
    if (!spec) return null;
    const [look, move, poem] = spec;
    if (typeof look !== "string") return null;
    if (verb === "move") {
      nudge(stage, name);
      return move;
    }
    if (verb === "look") {
      const held = { yumi: "yumi", biwa: "biwa", koro: "koro", magatama: "magatama" }[name];
      if (held && state.flags[held]) return "You are carrying it. " + look + recall(poem);
      return look + recall(poem);
    }
    const deed = deedFor(roomId(), name, verb);
    if (deed) {
      if (verb === "use" && name === "tamayori" && !state.flags.ofuda) {
        return "You have nothing in your hands she is willing to see.";
      }
      if (verb === "use" && (name === "biwa" || name === "koro") && state.flags[name === "biwa" ? "biwa" : "koro"]) {
        return deed;
      }
      return deed;
    }
    if (verb === "talk") return name.charAt(0).toUpperCase() + name.slice(1) + " looks at you, and the look is the whole answer.";
    if (verb === "take") return "You leave it. Carrying it would not make it truer.";
    if (verb === "use") return "You see the use, and the evening does not agree yet.";
    return null;
  }

  function hideNamed(stage, name) {
    for (const img of stage.querySelectorAll("img")) {
      if (img.src.includes("/" + name + ".png")) img.style.visibility = "hidden";
    }
  }

  function applyWorld(stage) {
    if (state.flags.ofuda) hideNamed(stage, "ofuda");
    if (state.flags.sensu) hideNamed(stage, "sensu");
    if (state.flags.heard_enkei) hideNamed(stage, "enkei");
    if (state.flags.shizuka_gone) hideNamed(stage, "shizuka");
    if (state.flags.magatama) hideNamed(stage, "magatama");
    if (state.flags.yumi) hideNamed(stage, "yumi");
    if (state.flags.koro) hideNamed(stage, "koro");
    if (state.flags.biwa) hideNamed(stage, "biwa");
    if (state.flags.kagami) hideNamed(stage, "kagami");
    if (state.flags.tachi_held) hideNamed(stage, "tachi");
  }

  function grant(aside, stage) {
    if (typeof aside === "string") {
      print(aside);
      return;
    }
    const again = aside.once && state.flags[aside.once];
    print(again ? "You already did that." : aside.text);
    if (!again && aside.score && aside.once) {
      state.flags[aside.once] = true;
      state.score += aside.score;
    }
    if (aside.flag) state.flags[aside.flag] = true;
    if (aside.hide) hideNamed(stage, aside.hide);
    save();
  }

  function palaceSearched() {
    return state.flags.saw_sensu && (state.flags.saw_mirror || state.flags.asked_aya);
  }

  function onEnter(lines) {
    const id = roomId();
    const key = "entered_" + id;
    if (id === "scene" && palaceSearched() && !state.flags.shizuka_gone && !state.won) {
      state.flags.shizuka_gone = true;
      lines.push("You return to the courtyard. The veranda is empty. Shizuka is not in her rooms. She is simply gone from the place you left her.");
    }
    if (!state.flags[key]) {
      state.flags[key] = true;
      if (id === "hall" && !state.flags.sensu) lines.push("A sensu lies on the boards of the empty hall.");
      if (id === "shrine-hall") lines.push("Myōen keeps the hall.");
      if (id === "peak" && !state.flags.heard_enkei) lines.push("Enkei stands on the apron and looks west, away from the capital.");
      if (id === "bridge") lines.push("The bridge stops at mid-span.");
    }
    save();
  }

  function say(action) {
    const text = typeof action.say === "function" ? action.say(state) : action.say;
    return text;
  }

  function perform(action) {
    const lines = [];
    if (state.won && action.id !== "score" && action.id !== "help" && action.id !== "inventory") {
      lines.push(state.flags.won_solved
        ? "The case is already read. The capital has already come loose."
        : "You already set the case down. The capital stays as you left it.");
      return lines;
    }
    if (action.when && !action.when(state)) {
      lines.push("You can't do that.");
      return lines;
    }
    lines.push(say(action));
    const pay = !action.whenScore || action.whenScore(state);
    if (pay && action.score && action.once && !state.flags[action.once]) {
      state.flags[action.once] = true;
      state.score += action.score;
    }
    if (action.flag && pay) state.flags[action.flag] = true;
    if (action.win && pay) state.won = true;
    save();
    return lines;
  }

  function print(text) {
    const p = document.createElement("p");
    p.textContent = text;
    logEl.append(p);
    logEl.scrollTop = logEl.scrollHeight;
    state.log = state.log.concat(text).slice(-12);
  }

  function paintScore() {
    scoreEl.textContent = "Score: " + state.score + " of " + MAX;
  }

  function boot(stage) {
    state = load();
    const here = roomId();
    if (!state.seen.includes(here)) state.seen.push(here);
    scoreEl = document.createElement("div");
    scoreEl.id = "score";
    logEl = document.createElement("section");
    logEl.id = "case-log";
    const form = document.createElement("form");
    form.id = "cmd";
    form.innerHTML = '<label for="line">&gt;</label><input id="line" autocomplete="off" spellcheck="false" placeholder="type here, then Enter"><span id="wait" aria-hidden="true"></span>';
    const cabinet = document.createElement("div");
    cabinet.id = "cabinet";
    const status = document.createElement("div");
    status.id = "status";
    const roomName = document.createElement("div");
    roomName.id = "room-name";
    roomName.textContent = (document.querySelector("h1") || {}).textContent || "";
    status.append(scoreEl, roomName);
    const well = document.createElement("div");
    well.id = "textwell";
    well.append(logEl, form);
    const row = document.getElementById("scene-row") || stage;
    row.before(cabinet);
    cabinet.append(status, row, well);
    const header = document.querySelector("header");
    if (header) header.classList.add("exits");
    applyWorld(stage);
    const arrived = [];
    if (!state.room || state.room === "scene") onEnter(arrived);
    for (const line of state.log) {
      const p = document.createElement("p");
      p.textContent = line;
      logEl.append(p);
    }
    for (const line of arrived) print(line);
    paintScore();
    save();
    const input = form.querySelector("#line");
    let previous = "";
    let busy = false;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const typed = input.value;
      if (!norm(typed) || busy) return;
      input.value = "";
      busy = true;
      form.classList.add("waiting");
      print("> " + typed);
      try {
        const mapped = await mapInBrowser(
          typed,
          ((PLACES[roomId()] && PLACES[roomId()].look) || "") + " " + reachNote(),
          previous,
          mapperActions(),
        );
        const prob = typeof mapped.probabilities?.[mapped.actionId] === "number"
          ? mapped.probabilities[mapped.actionId]
          : (mapped.confidence || 0);
        if (!mapped.actionId || mapped.actionId === "none" || prob < 0.22) {
          print("That does not move the case.");
        } else {
          runMapped(mapped.actionId, stage);
        }
        previous = typed;
      } catch (err) {
        print("The interpreter is down.");
      } finally {
        paintScore();
        save();
        busy = false;
        form.classList.remove("waiting");
        if (!window.HeianTalking) {
          input.disabled = false;
          input.focus();
        }
      }
    });
    input.disabled = true;
    function gameInProgress() {
      if (state.started || state.won || state.score > 0) return true;
      if ((state.seen || []).some((id) => id !== "scene")) return true;
      return Object.keys(state.flags || {}).some((key) => key !== "entered_scene");
    }
    function begin() {
      state.started = true;
      playingNow = true;
      document.body.classList.add("playing");
      if (window.HeianMusic) window.HeianMusic.start();
      title.remove();
      input.disabled = false;
      input.focus();
      const where = state.room;
      if (where && where !== roomId() && window.HeianEnter) window.HeianEnter(where);
      if (window.HeianStand && typeof state.x === "number") window.HeianStand(state);
      save();
    }
    addEventListener("beforeunload", save);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") save();
    });
    startJev().then(() => {
      if (sessionStorage.getItem("heian-begin") === "1") {
        sessionStorage.removeItem("heian-begin");
        save();
        begin();
        return;
      }
      const line = document.getElementById("title-progress");
      const bar = document.getElementById("title-bar");
      const menu = document.getElementById("title-menu");
      if (line) line.hidden = true;
      if (bar) bar.hidden = true;
      if (menu) menu.hidden = false;
      const start = document.getElementById("title-start");
      start.textContent = gameInProgress() ? "Continue game" : "Start game";
      start.onclick = begin;
      document.getElementById("title-reset").onclick = () => {
        localStorage.removeItem(KEY);
        state = freshState();
        state.started = true;
        previous = "";
        logEl.replaceChildren();
        for (const line of state.log) {
          const p = document.createElement("p");
          p.textContent = line;
          logEl.append(p);
        }
        begin();
        if (window.HeianEnter) window.HeianEnter("scene");
      };
    }).catch(() => {
      const line = document.getElementById("title-progress");
      if (line) line.textContent = "The interpreter could not load.";
    });
  }

  function arrive(stage) {
    const here = roomId();
    state.room = here;
    if (!state.seen.includes(here)) state.seen.push(here);
    const data = (window.HEIAN_ROOMS || {})[here];
    const roomName = document.getElementById("room-name");
    if (roomName && data) roomName.textContent = data.title;
    applyWorld(stage);
    const arrived = [];
    onEnter(arrived);
    for (const line of arrived) print(line);
    paintScore();
    save();
  }

  window.HeianPlay = { boot, arrive, save, openTalk };
})();
