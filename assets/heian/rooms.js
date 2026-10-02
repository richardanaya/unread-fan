window.HEIAN_ROOMS = {};
window.HEIAN_ROOMS["bamboo"] = (function () {

const room = {
  still: [],
  depth: 0.62,
  x: 360,
  faceLeft: false,
  foot0: 360,
  foot1: 472,
  xMin: function (d) { return 320 - d * 145; },
  xMax: function (d) { return 530 + d * 145; },
  west: null,
  east: null,
  north: null,
  south: "night-bridge",
};

room.title = "The bamboo";
room.bg = "assets/heian/scene/bamboo.png";
return room;
})();
window.HEIAN_ROOMS["bell"] = (function () {

const room = {
  still: [],
  depth: 0.62,
  x: 420,
  faceLeft: true,
  foot0: 312,
  foot1: 458,
  xMin: function (d) { return d < 0.45 ? 300 - d * 400 : 24; },
  xMax: function (d) { return d < 0.4 ? 700 + d * 300 : 836; },
  west: null,
  east: null,
  north: null,
  south: "shrine-hall",
};

room.title = "The bell";
room.bg = "assets/heian/scene/bell.png";
return room;
})();
window.HEIAN_ROOMS["boatshed"] = (function () {

const room = {
  still: [["characters/fune", 300, 150, 40, false]],
  depth: 0.62,
  x: 620,
  faceLeft: true,
  foot0: 232,
  foot1: 456,
  // Far feet stay on the sand lane east of the shed. Near feet cross the open yard.
  xMin: function (d) {
    if (d >= 0.5) return 16;
    if (d < 0.32) return 500;
    if (d < 0.4) return 500 - (d - 0.32) * ((500 - 428) / 0.08);
    if (d < 0.46) return 428;
    return 428 - (d - 0.46) * ((428 - 16) / 0.04);
  },
  xMax: function () { return 852; },
  west: null,
  east: "shore",
  north: "nets",
  south: null,
};

room.title = "The boatshed";
room.bg = "assets/heian/scene/boatshed.png";
return room;
})();
window.HEIAN_ROOMS["bridge"] = (function () {

const room = {
  still: [],
  depth: 0.45,
  x: 180,
  faceLeft: false,
  foot0: 276,
  foot1: 366,
  // The deck touches the west edge. Its broken end is the right limit.
  xMin: function () { return 0; },
  xMax: function (d) { return 474 + d * 53; },
  west: "market",
  east: null,
  north: null,
  south: null,
};

room.title = "The bridge";
room.bg = "assets/heian/scene/bridge.png";
return room;
})();
window.HEIAN_ROOMS["cave"] = (function () {

const room = {
  still: [],
  depth: 0.7,
  x: 380,
  faceLeft: false,
  foot0: 312,
  foot1: 468,
  // The pool cuts the near left. Far rock runs to the left wall.
  xMin: function (d) { return (d > 0.38 && d < 0.92) ? 220 : 16; },
  // The right wall holds until the stone steps reach the east edge.
  xMax: function (d) { return d < 0.58 ? 800 : 852; },
  eastMinDepth: 0.58,
  west: null,
  east: "steps",
  north: null,
  south: null,
};

room.title = "The hermit cave";
room.bg = "assets/heian/scene/cave.png";
return room;
})();
window.HEIAN_ROOMS["cliff"] = (function () {

function edge(k, d) {
  if (d <= k[0][0]) return k[0][1];
  for (var i = 1; i < k.length; i++) {
    if (d <= k[i][0]) {
      var t = (d - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      return k[i - 1][1] + t * (k[i][1] - k[i - 1][1]);
    }
  }
  return k[k.length - 1][1];
}
const room = {
  still: [],
  depth: 0.82,
  x: 60,
  faceLeft: true,
  foot0: 264,
  foot1: 470,
  // Dirt only. The lip on the right is the drop; the steps take the west edge.
  xMin: function (d) {
    return edge([[0, 432], [0.20, 312], [0.25, 252], [0.32, 156], [0.42, 114], [0.50, 120], [0.62, 74], [0.74, 0], [1, 0]], d);
  },
  xMax: function (d) {
    return edge([[0, 576], [0.35, 440], [0.60, 390], [0.80, 340], [1, 286]], d);
  },
  west: "steps",
  east: null,
  north: null,
  south: null,
};

room.title = "The cliff path";
room.bg = "assets/heian/scene/cliff.png";
return room;
})();
window.HEIAN_ROOMS["copse"] = (function () {

const room = {
  still: [["characters/take", 360, 150, 44, false]],
  depth: 0.55,
  x: 360,
  faceLeft: false,
  foot0: 278,
  foot1: 372,
  xMin: function (d) { return 280 - d * 140; },
  xMax: function (d) { return 555 + d * 175; },
  west: null,
  east: null,
  north: null,
  south: "rice",
};

room.title = "The copse";
room.bg = "assets/heian/scene/copse.png";
return room;
})();
window.HEIAN_ROOMS["court-garden"] = (function () {

const room = {
  still: [],
  depth: 0.62,
  x: 460,
  faceLeft: false,
  foot0: 418,
  foot1: 468,
  // Far edge narrows to the covered walk. Near gravel runs to the side door.
  xMin: function (d) { return 400 - d * 384; },
  xMax: function (d) { return 700 + d * 130; },
  west: null,
  east: "ladies",
  north: "sewing",
  south: null,
};

room.title = "The ladies' garden";
room.bg = "assets/heian/scene/court-garden.png";
return room;
})();
window.HEIAN_ROOMS["drying"] = (function () {

const room = {
  still: [],
  depth: 0.55,
  x: 360,
  faceLeft: false,
  foot0: 220,
  foot1: 452,
  // Open dirt between the cloth poles. Far edge is the narrow gap toward the vats.
  xMin: function (d) {
    var L = [336, 300, 250, 200, 140, 130, 110, 70];
    var i = Math.min(6, Math.floor(d * 7));
    var t = d * 7 - i;
    return L[i] + (L[i + 1] - L[i]) * t;
  },
  xMax: function (d) {
    var R = [510, 550, 600, 650, 720, 720, 740, 800];
    var i = Math.min(6, Math.floor(d * 7));
    var t = d * 7 - i;
    return R[i] + (R[i + 1] - R[i]) * t;
  },
  west: null,
  east: null,
  north: "indigo",
  south: null,
};

room.title = "The drying yard";
room.bg = "assets/heian/scene/drying.png";
return room;
})();
window.HEIAN_ROOMS["dunes"] = (function () {

const room = {
  still: [],
  depth: 0.55,
  x: 380,
  faceLeft: false,
  foot0: 220,
  foot1: 468,
  xMin: function () { return 0; },
  xMax: function () { return 852; },
  west: "shore",
  east: "salt",
  north: null,
  south: null,
};

room.title = "The dunes";
room.bg = "assets/heian/scene/dunes.png";
return room;
})();
window.HEIAN_ROOMS["dyer"] = (function () {

const room = {
  still: [],
  depth: 0.7,
  x: 390,
  faceLeft: false,
  foot0: 248,
  foot1: 468,
  // Dirt edges on dyer.png. Half the prince's width keeps his feet on the lane, not the grass.
  xMin: function (d) {
    var L = [406, 370, 333, 293, 249, 206, 153, 97, 27];
    var i = Math.min(7, Math.floor(d * 8));
    var t = d * 8 - i;
    return Math.max(0, L[i] + (L[i + 1] - L[i]) * t + 6 - 36);
  },
  xMax: function (d) {
    var R = [467, 504, 541, 579, 625, 667, 721, 762, 826];
    var i = Math.min(7, Math.floor(d * 8));
    var t = d * 8 - i;
    return R[i] + (R[i + 1] - R[i]) * t - 6 + 36;
  },
  west: null,
  east: "indigo",
  north: "market",
  south: null,
};

room.title = "The dyer's lane";
room.bg = "assets/heian/scene/dyer.png";
return room;
})();
window.HEIAN_ROOMS["east-wall"] = (function () {

const room = {
  still: [],
  depth: 0.55,
  x: 200,
  faceLeft: false,
  foot0: 236,
  foot1: 448,
  // Gravel reaches the west edge. The wall base steps in as the ground goes far.
  xMin: function () { return 8; },
  xMax: function (d) { return 392 + d * 290; },
  west: "inner-garden",
  east: null,
  north: null,
  south: null,
};

room.title = "The east wall";
room.bg = "assets/heian/scene/east-wall.png";
return room;
})();
window.HEIAN_ROOMS["engawa"] = (function () {

const room = {
  still: [
    ["characters/matsu", 380, 150, 150, false],
  ],
  depth: 0.28,
  x: 500,
  faceLeft: true,
  // Far threshold of the boards, then the near stone of the yard.
  foot0: 276,
  foot1: 470,
  // Pillars pinch the deck until the near apron; the yard is open.
  xMin: function (d) {
    if (d < 0.36) return 322 - (d / 0.36) * (322 - 274);
    if (d < 0.44) return 274 - ((d - 0.36) / 0.08) * 274;
    return 0;
  },
  xMax: function (d) {
    if (d < 0.18) return 562 + (d / 0.18) * (628 - 562);
    if (d < 0.36) return 632;
    if (d < 0.44) return 632 + ((d - 0.36) / 0.08) * (852 - 632);
    return 852;
  },
  west: null,
  east: null,
  north: "hall",
  south: "scene",
};

room.title = "The engawa";
room.bg = "assets/heian/scene/engawa.png";
return room;
})();
window.HEIAN_ROOMS["farm"] = (function () {

const room = {
  still: [
    ["characters/kura", 340, 150, 48, false],
  ],
  depth: 0.55,
  x: 460,
  faceLeft: true,
  foot0: 330,
  foot1: 466,
  xMin: function () { return 20; },
  xMax: function (d) { return d < 0.3 ? 720 : 852; },
  eastMinDepth: 0.3,
  west: null,
  east: "rice",
  north: null,
  south: null,
};

room.title = "The farmhouse";
room.bg = "assets/heian/scene/farm.png";
return room;
})();
window.HEIAN_ROOMS["ferry"] = (function () {

const room = {
  still: [["characters/wata", 420, 150, 40, true]],
  depth: 0.7,
  x: 240,
  faceLeft: false,
  foot0: 250,
  foot1: 470,
  // Far feet stay on the bank path. Near feet stay on the planks and the east dirt.
  xMin: function (d) { return 340 - d * 300; },
  xMax: function (d) { return d < 0.36 ? 500 + d * (352 / 0.36) : 852; },
  eastMinDepth: 0.36,
  west: "landing-west",
  east: "marsh",
  north: "river",
  south: null,
};

room.title = "The ferry landing";
room.bg = "assets/heian/scene/ferry.png";
return room;
})();
window.HEIAN_ROOMS["forest"] = (function () {

const room = {
  still: [
    ["characters/haru", 470, 150, 96, false],
    ["items/magatama", 560, 20, 28, false],
  ],
  depth: 0.65,
  x: 300,
  faceLeft: false,
  foot0: 300,
  foot1: 460,
  // The path is narrow at the back and wide in front.
  xMin: function (d) { return 300 - d * 240; },
  xMax: function (d) { return 520 + d * 260; },
  west: "rice",
  east: "shrine",
  north: "steps",
  south: null,
};

room.title = "The cedar path";
room.bg = "assets/heian/scene/forest.png";
return room;
})();
window.HEIAN_ROOMS["hall"] = (function () {

const room = {
  still: [
    ["items/sensu", 390, 30, 50, false],
  ],
  depth: 0.55,
  x: 360,
  faceLeft: false,
  foot0: 256,
  foot1: 468,
  // Floor is a trapezoid: narrow at the far doors, wide on the near boards.
  xMin: function (d) { return 280 - d * 260; },
  xMax: function (d) { return 555 + d * 275; },
  west: "ladies",
  east: "storehouse",
  north: "inner-garden",
  south: "engawa",
};

room.title = "The great hall";
room.bg = "assets/heian/scene/hall.png";
return room;
})();
window.HEIAN_ROOMS["scene"] = (function () {

const room = {
  still: [
    ["characters/shizuka", 250, 150, 132, false],
    ["characters/masahiro", 470, 150, 34, false],
    ["items/ofuda", 575, 34, 34, false],
  ],
  depth: 0.45,
  x: 330,
  faceLeft: true,
  foot0: 352,
  foot1: 470,
  xMin: function () { return 120; },
  xMax: function () { return 670; },
  west: "shrine",
  east: null,
  north: "engawa",
  south: null,
};

room.title = "The courtyard";
room.bg = "assets/heian/scene/courtyard.png";
return room;
})();
window.HEIAN_ROOMS["indigo"] = (function () {

const room = {
  still: [["characters/ai", 340, 150, 40, false]],
  depth: 0.62,
  x: 220,
  faceLeft: false,
  foot0: 268,
  foot1: 470,
  // Dirt is open along the west edge. The vat row and fence close the east.
  xMin: function () { return 0; },
  xMax: function (d) {
    if (d < 0.42) return 700 - d * 160;
    if (d < 0.72) return 633 - (d - 0.42) * 310;
    return 540 + (d - 0.72) * 360;
  },
  west: "dyer",
  east: null,
  north: null,
  south: "drying",
};

room.title = "The indigo vats";
room.bg = "assets/heian/scene/indigo.png";
return room;
})();
window.HEIAN_ROOMS["inner-garden"] = (function () {

const room = {
  still: [
    ["items/koro", 100, 26, 36, false],
    ["characters/ue", 500, 150, 40, true],
  ],
  depth: 0.55,
  x: 320,
  faceLeft: false,
  foot0: 288,
  foot1: 468,
  // Gravel runs off the left edge. The east wall steps back as the ground comes near.
  xMin: function () { return 8; },
  xMax: function (d) { return 630 + d * 210; },
  west: "moon-deck",
  east: "east-wall",
  north: null,
  south: "hall",
};

room.title = "The inner garden";
room.bg = "assets/heian/scene/inner-garden.png";
return room;
})();
window.HEIAN_ROOMS["kitchen"] = (function () {

const room = {
  still: [
    ["characters/nabe", 300, 150, 44, false],
  ],
  depth: 0.55,
  x: 390,
  faceLeft: false,
  foot0: 330,
  foot1: 470,
  xMin: function (d) {
    if (d < 0.15) return 268;
    if (d < 0.55) return 268 - (d - 0.15) * 400;
    return 108 + (d - 0.55) * 70;
  },
  xMax: function (d) {
    if (d < 0.55) return 560 + d * (180 / 0.55);
    if (d < 0.75) return 740 + (d - 0.55) * (112 / 0.2);
    return 852;
  },
  west: "storehouse",
  east: null,
  north: "well",
  south: "wash",
};

room.title = "The kitchen";
room.bg = "assets/heian/scene/kitchen.png";
return room;
})();
window.HEIAN_ROOMS["ladies"] = (function () {

const room = {
  still: [
    ["items/kagami", 240, 30, 40, false],
  ],
  depth: 0.72,
  x: 400,
  faceLeft: false,
  foot0: 340,
  foot1: 472,
  xMin: function () { return 16; },
  xMax: function () { return 852; },
  west: "court-garden",
  east: "hall",
  north: null,
  south: null,
};

room.title = "The ladies' rooms";
room.bg = "assets/heian/scene/ladies.png";
return room;
})();
window.HEIAN_ROOMS["landing-west"] = (function () {

const room = {
  still: [],
  depth: 0.72,
  x: 400,
  faceLeft: false,
  foot0: 248,
  foot1: 462,
  // Far feet stay on the dirt lane. Near feet stay on the planks; the right bank opens toward the ferry.
  xMin: function (d) { return 376 - d * 110; },
  xMax: function (d) {
    if (d < 0.22) return 476 + d * 180;
    return Math.min(852, 516 + (d - 0.22) * (336 / 0.12));
  },
  eastMinDepth: 0.34,
  west: null,
  east: "ferry",
  north: "village",
  south: null,
};

room.title = "The far landing";
room.bg = "assets/heian/scene/landing-west.png";
return room;
})();
window.HEIAN_ROOMS["market"] = (function () {

const room = {
  still: [
    ["items/yumi", 591, 146, -33, false],
    ["characters/ichi", 260, 150, 36, false],
  ],
  depth: 0.55,
  x: 390,
  faceLeft: false,
  foot0: 278,
  foot1: 470,
  // Dirt lane, widening toward the foreground. Edges follow the stone curbs.
  xMin: function (d) {
    var y = 278 + d * 192;
    return 426 - (y - 240) * (333 / 236) + 6;
  },
  xMax: function (d) {
    var y = 278 + d * 192;
    return 426 + (y - 240) * (333 / 236) - 6;
  },
  west: "river",
  east: "bridge",
  north: "shrine",
  south: "dyer",
};

room.title = "The market lane";
room.bg = "assets/heian/scene/market.png";
return room;
})();
window.HEIAN_ROOMS["marsh"] = (function () {

// Dirt span at a foot Y: left and right edges of the raised track. The near plain touches both side edges.
function marshBand(d) {
  const y = 248 + d * (468 - 248);
  const rows = [
    [248, 196, 293],
    [264, 182, 330],
    [280, 228, 370],
    [296, 247, 410],
    [312, 269, 450],
    [328, 286, 490],
    [344, 305, 531],
    [360, 318, 572],
    [376, 335, 617],
    [392, 316, 852],
    [399, 316, 852],
    [400, 0, 852],
    [468, 0, 852],
  ];
  let i = 1;
  while (i < rows.length && y > rows[i][0]) i++;
  if (i >= rows.length) i = rows.length - 1;
  const a = rows[i - 1];
  const b = rows[i];
  const t = (y - a[0]) / (b[0] - a[0]);
  return [a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
}
const room = {
  still: [],
  depth: 0.72,
  x: 280,
  faceLeft: true,
  foot0: 248,
  foot1: 468,
  xMin: function (d) { return marshBand(d)[0]; },
  xMax: function (d) { return marshBand(d)[1]; },
  west: "ferry",
  east: null,
  north: null,
  south: "shore",
};

room.title = "The reed marsh";
room.bg = "assets/heian/scene/marsh.png";
return room;
})();
window.HEIAN_ROOMS["mill"] = (function () {

const room = {
  still: [["characters/yoshi", 460, 150, 56, true]],
  depth: 0.62,
  x: 400,
  faceLeft: true,
  foot0: 204,
  foot1: 468,
  // Dirt only. Far end is a narrow throat; the near end widens but stays off the stream and the grass.
  xMin: function (d) { return 420 - d * 140; },
  xMax: function (d) { return 508 + d * 192; },
  west: null,
  east: null,
  north: "rice",
  south: null,
};

room.title = "The mill";
room.bg = "assets/heian/scene/mill.png";
return room;
})();
window.HEIAN_ROOMS["moon-deck"] = (function () {

const room = {
  still: [
    ["items/biwa", 300, 78, 48, false],
  ],
  depth: 0.55,
  x: 360,
  faceLeft: false,
  foot0: 292,
  foot1: 468,
  // Far deck is narrow beside the water. Near planks run to both edges.
  xMin: function (d) { return d < 0.08 ? 28 : 8; },
  xMax: function (d) { return d < 0.34 ? 615 + d * 500 : 852; },
  eastMinDepth: 0.34,
  west: "night-bridge",
  east: "inner-garden",
  north: null,
  south: null,
};

room.title = "The moon deck";
room.bg = "assets/heian/scene/moon-deck.png";
return room;
})();
window.HEIAN_ROOMS["nets"] = (function () {

const room = {
  still: [],
  depth: 0.62,
  x: 390,
  faceLeft: false,
  foot0: 208,
  foot1: 468,
  xMin: function (d) {
    if (d < 0.44) return 364 - d * 200;
    return 16;
  },
  xMax: function (d) {
    if (d < 0.44) return 500 + d * 200;
    return 836;
  },
  west: null,
  east: null,
  north: null,
  south: "boatshed",
};

room.title = "The nets";
room.bg = "assets/heian/scene/nets.png";
return room;
})();
window.HEIAN_ROOMS["night-bridge"] = (function () {

const room = {
  still: [
    ["characters/ban", 280, 150, 48, false],
  ],
  depth: 0.62,
  x: 480,
  faceLeft: false,
  foot0: 302,
  foot1: 462,
  // Far path is the narrow mouth into the bamboo. Near planks run to the east edge.
  xMin: function (d) { return 400 - d * 170; },
  xMax: function (d) { return d < 0.45 ? 490 + d * 804 : 852; },
  eastMinDepth: 0.45,
  west: null,
  east: "moon-deck",
  north: "bamboo",
  south: null,
};

room.title = "The night bridge";
room.bg = "assets/heian/scene/night-bridge.png";
return room;
})();
window.HEIAN_ROOMS["offering"] = (function () {

const room = {
  still: [],
  depth: 0.55,
  x: 360,
  faceLeft: true,
  // Open boards in front of the tables and stands, down to the near floor.
  foot0: 348,
  foot1: 468,
  xMin: function (d) { return 110 - d * 90; },
  xMax: function (d) { return 700 + d * 120; },
  west: "shrine-hall",
  east: null,
  north: null,
  south: null,
};

room.title = "The offering room";
room.bg = "assets/heian/scene/offering.png";
return room;
})();
window.HEIAN_ROOMS["peak"] = (function () {

const room = {
  still: [
    ["characters/enkei", 400, 150, 90, true],
  ],
  depth: 0.7,
  x: 280,
  faceLeft: false,
  foot0: 278,
  foot1: 468,
  // Dirt apron narrows in the middle, then the stone steps widen toward the near edge.
  xMin: function (d) {
    if (d < 0.17) return 248 + (d / 0.17) * (308 - 248);
    if (d < 0.45) return 308 + ((d - 0.17) / 0.28) * (320 - 308);
    if (d < 0.6) return 320 + ((d - 0.45) / 0.15) * (296 - 320);
    return 296 + ((d - 0.6) / 0.4) * (248 - 296);
  },
  xMax: function (d) {
    if (d < 0.17) return 555 + (d / 0.17) * (525 - 555);
    if (d < 0.45) return 525 + ((d - 0.17) / 0.28) * (566 - 525);
    if (d < 0.6) return 566 + ((d - 0.45) / 0.15) * (588 - 566);
    return 588 + ((d - 0.6) / 0.4) * (640 - 588);
  },
  west: null,
  east: null,
  north: null,
  south: "steps",
};

room.title = "The peak shrine";
room.bg = "assets/heian/scene/peak.png";
return room;
})();
window.HEIAN_ROOMS["purification"] = (function () {

const room = {
  still: [],
  depth: 0.78,
  x: 400,
  faceLeft: true,
  foot0: 300,
  foot1: 468,
  xMin: function (d) {
    var y = 300 + d * 168;
    return y < 392 ? 524 : 20;
  },
  xMax: function (d) {
    var y = 300 + d * 168;
    if (y < 392) return 650 + (y - 292) * 1.3;
    return Math.min(830, 780 + (y - 392) * 0.7);
  },
  west: null,
  east: "shrine-hall",
  north: null,
  south: null
};

room.title = "The purification basin";
room.bg = "assets/heian/scene/purification.png";
return room;
})();
window.HEIAN_ROOMS["rice"] = (function () {

// Dirt causeway only. The cross opens to both side edges; the spine runs to the far copse and the near mill.
function riceBand(d) {
  const y = 204 + d * (468 - 204);
  const rows = [
    [204, 388, 466],
    [212, 348, 474],
    [220, 270, 584],
    [236, 244, 606],
    [248, 358, 500],
    [264, 360, 490],
    [272, 0, 852],
    [336, 0, 852],
    [348, 324, 530],
    [400, 320, 530],
    [468, 294, 548],
  ];
  let i = 1;
  while (i < rows.length && y > rows[i][0]) i++;
  if (i >= rows.length) i = rows.length - 1;
  const a = rows[i - 1];
  const b = rows[i];
  const t = (y - a[0]) / (b[0] - a[0]);
  return [a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
}
const room = {
  still: [],
  depth: 0.55,
  x: 360,
  faceLeft: false,
  foot0: 204,
  foot1: 468,
  xMin: function (d) { return riceBand(d)[0]; },
  xMax: function (d) { return riceBand(d)[1]; },
  west: "farm",
  east: "forest",
  north: "copse",
  south: "mill",
};

room.title = "The rice fields";
room.bg = "assets/heian/scene/rice.png";
return room;
})();
window.HEIAN_ROOMS["river"] = (function () {

const room = {
  still: [],
  depth: 0.72,
  x: 520,
  faceLeft: false,
  foot0: 210,
  foot1: 470,
  // Water is on the left. The bank is narrow up the shore and wider near the camera.
  xMin: function (d) {
    if (d < 0.75) return 428;
    return 428 - (d - 0.75) * 720;
  },
  xMax: function () { return 852; },
  west: null,
  east: "market",
  north: null,
  south: "ferry",
};

room.title = "The riverbank";
room.bg = "assets/heian/scene/river.png";
return room;
})();
window.HEIAN_ROOMS["salt"] = (function () {

const room = {
  still: [["characters/shio", 300, 150, 40, true]],
  depth: 0.55,
  x: 180,
  faceLeft: true,
  foot0: 252,
  foot1: 468,
  xMin: function () { return 0; },
  xMax: function (d) {
    if (d < 0.16) return 300;
    if (d < 0.28) return 480;
    if (d < 0.55) return 480 + (d - 0.28) * 740;
    if (d < 0.75) return 700 + (d - 0.55) * 700;
    return 844;
  },
  west: "dunes",
  east: null,
  north: null,
  south: null,
};

room.title = "The salt pans";
room.bg = "assets/heian/scene/salt.png";
return room;
})();
window.HEIAN_ROOMS["sewing"] = (function () {

const room = {
  still: [["characters/aya", 430, 150, 52, true]],
  depth: 0.62,
  x: 390,
  faceLeft: false,
  foot0: 292,
  foot1: 472,
  xMin: function () { return 16; },
  xMax: function () { return 836; },
  west: null,
  east: null,
  north: null,
  south: "court-garden",
};

room.title = "The sewing room";
room.bg = "assets/heian/scene/sewing.png";
return room;
})();
window.HEIAN_ROOMS["shore"] = (function () {

const room = {
  still: [["characters/iso", 340, 150, 32, false]],
  depth: 0.55,
  x: 500,
  faceLeft: false,
  foot0: 228,
  foot1: 468,
  // Far path is narrow. Past it, the jetty blocks the left sand until the near beach.
  xMin: function (d) {
    if (d < 0.04) return 295;
    if (d < 0.66) return 355;
    return 16;
  },
  xMax: function (d) {
    if (d < 0.07) return 548;
    if (d < 0.11) return 680;
    return 844;
  },
  west: "boatshed",
  east: "dunes",
  north: "marsh",
  south: null,
};

room.title = "The fishing shore";
room.bg = "assets/heian/scene/shore.png";
return room;
})();
window.HEIAN_ROOMS["shrine-hall"] = (function () {

const room = {
  still: [
    ["characters/myoen", 400, 150, 70, true],
  ],
  depth: 0.5,
  x: 380,
  faceLeft: false,
  // Depth 0 is the back wall, under the dark door. The bell is only that opening.
  foot0: 276,
  foot1: 470,
  northSpan: [375, 476],
  // The deck widens toward the lip. The gray steps start there, narrower, then widen at the near edge.
  xMin: function (d) {
    if (d < 0.5) return 200 - d * (120 / 0.5);
    return 156 - ((d - 0.5) / 0.5) * 56;
  },
  xMax: function (d) {
    if (d < 0.5) return 660 + d * (120 / 0.5);
    return 696 + ((d - 0.5) / 0.5) * 54;
  },
  west: "purification",
  east: "offering",
  north: "bell",
  south: "shrine",
};

room.title = "The shrine hall";
room.bg = "assets/heian/scene/shrine-hall.png";
return room;
})();
window.HEIAN_ROOMS["shrine"] = (function () {

const room = {
  still: [
    ["characters/tamayori", 300, 150, 128, true],
    ["characters/gyoban", 150, 150, 40, false],
  ],
  depth: 0.81,
  x: 480,
  faceLeft: true,
  // North leaves at the top of the steps, not the near lip of the path.
  foot0: 268,
  foot1: 462,
  fromNorth: 0.45,
  xMin: function () { return 40; },
  // The pond covers the right side until the near gray path.
  xMax: function (d) { return d < 0.76 ? 470 : 820; },
  eastMinDepth: 0.76,
  west: "forest",
  east: "scene",
  north: "shrine-hall",
  south: "market",
};

room.title = "The shrine path";
room.bg = "assets/heian/scene/shrine.png";
return room;
})();
window.HEIAN_ROOMS["steps"] = (function () {

const room = {
  still: [],
  depth: 0.72,
  x: 380,
  faceLeft: false,
  foot0: 208,
  foot1: 468,
  // Every tread and the near dirt run to both edges.
  xMin: function () { return 0; },
  xMax: function () { return 852; },
  west: "cave",
  east: "cliff",
  north: "peak",
  south: "forest",
};

room.title = "The stone steps";
room.bg = "assets/heian/scene/steps.png";
return room;
})();
window.HEIAN_ROOMS["storehouse"] = (function () {

const room = {
  still: [
    ["items/tachi", 500, 72, 36, false],
  ],
  depth: 0.6,
  x: 420,
  faceLeft: true,
  // Boards in front of the chests, down to the near floor. Not the side walls.
  foot0: 332,
  foot1: 466,
  xMin: function (d) { return 270 - d * 220; },
  xMax: function (d) { return 640 + d * 140; },
  west: "hall",
  east: "kitchen",
  north: null,
  south: null,
};

room.title = "The storehouse";
room.bg = "assets/heian/scene/storehouse.png";
return room;
})();
window.HEIAN_ROOMS["village"] = (function () {

const room = {
  still: [
    ["characters/mura", 400, 150, 44, true],
  ],
  depth: 0.5,
  x: 390,
  faceLeft: false,
  foot0: 286,
  foot1: 468,
  // Dirt street, narrow at the far houses and wide at the near edge.
  xMin: function (d) {
    var y = 286 + d * 182;
    return -1.695 * y + 837;
  },
  xMax: function (d) {
    var y = 286 + d * 182;
    return 1.694 * y + 14;
  },
  west: null,
  east: null,
  north: null,
  south: "landing-west",
};

room.title = "The village";
room.bg = "assets/heian/scene/village.png";
return room;
})();
window.HEIAN_ROOMS["wash"] = (function () {

const room = {
  still: [["characters/ito", 380, 150, 40, true]],
  depth: 0.55,
  x: 400,
  faceLeft: false,
  foot0: 240,
  foot1: 468,
  // Open stone on wash.png, inset around the tubs and the right basin. Half the prince's width keeps his feet on the paving.
  xMin: function (d) {
    var L = [405, 378, 280, 210, 220, 220, 48, 16];
    var i = Math.min(6, Math.floor(d * 7));
    var t = d * 7 - i;
    return Math.max(0, L[i] + (L[i + 1] - L[i]) * t - 36);
  },
  xMax: function (d) {
    var R = [446, 472, 600, 680, 660, 660, 820, 836];
    var i = Math.min(6, Math.floor(d * 7));
    var t = d * 7 - i;
    return R[i] + (R[i + 1] - R[i]) * t + 36;
  },
  west: null,
  east: null,
  north: "kitchen",
  south: null,
};

room.title = "The wash yard";
room.bg = "assets/heian/scene/wash.png";
return room;
})();
window.HEIAN_ROOMS["well"] = (function () {

const room = {
  still: [],
  depth: 0.55,
  x: 400,
  faceLeft: true,
  // Dirt in front of the brick wall, down onto the stone at the door.
  foot0: 248,
  foot1: 468,
  // Stay right of the well until the feet clear its base, then the yard opens and pinches into the door.
  xMin: function (d) {
    if (d < 0.4) return 380;
    if (d < 0.72) return 24;
    return 24 + ((d - 0.72) / 0.28) * (373 - 24);
  },
  xMax: function (d) {
    if (d < 0.4) return 800;
    if (d < 0.72) return 828;
    return 828 + ((d - 0.72) / 0.28) * (505 - 828);
  },
  west: null,
  east: null,
  north: null,
  south: "kitchen",
};

room.title = "The well yard";
room.bg = "assets/heian/scene/well.png";
return room;
})();
