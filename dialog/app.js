"use strict";

const fallbackTemplate = {
  map: "Map007",
  events: [
    {
      id: "EV007",
      page: 0,
      commands: [
        {
          type: "dialogue",
          actor: "sora",
          expression: "sad",
          text: "There is no way..."
        },
        {
          type: "dialogue",
          actor: "ann",
          expression: "angry",
          text: "We must fight!"
        }
      ]
    }
  ]
};

const fallbackExpressions = {
  "sora": {
    "expressions": {
      "normal": {
        "file": "sora_1",
        "index": 0
      },
      "smiling": {
        "file": "sora_1",
        "index": 1
      },
      "happy": {
        "file": "sora_1",
        "index": 2
      },
      "annoyed": {
        "file": "sora_1",
        "index": 3
      },
      "angry": {
        "file": "sora_1",
        "index": 4
      },
      "panicking": {
        "file": "sora_1",
        "index": 5
      },
      "relieved": {
        "file": "sora_1",
        "index": 6
      },
      "holding_tears": {
        "file": "sora_1",
        "index": 7
      },
      "confused": {
        "file": "sora_2",
        "index": 0
      },
      "horrified": {
        "file": "sora_2",
        "index": 1
      },
      "anxious": {
        "file": "sora_2",
        "index": 2
      },
      "smiling_empty": {
        "file": "sora_2",
        "index": 3
      },
      "exhausted": {
        "file": "sora_2",
        "index": 4
      },
      "hopeless": {
        "file": "sora_2",
        "index": 5
      },
      "complaining": {
        "file": "sora_2",
        "index": 6
      }
    }
  },
  "ann": {
    "expressions": {
      "normal": {
        "file": "ann_1",
        "index": 0
      },
      "smiling": {
        "file": "ann_1",
        "index": 1
      },
      "happy": {
        "file": "ann_1",
        "index": 2
      },
      "annoyed": {
        "file": "ann_1",
        "index": 3
      },
      "angry": {
        "file": "ann_1",
        "index": 4
      },
      "panicking": {
        "file": "ann_1",
        "index": 5
      },
      "relieved": {
        "file": "ann_1",
        "index": 6
      },
      "holding_tears": {
        "file": "ann_1",
        "index": 7
      },
      "confused": {
        "file": "ann_2",
        "index": 0
      },
      "horrified": {
        "file": "ann_2",
        "index": 1
      },
      "anxious": {
        "file": "ann_2",
        "index": 2
      },
      "smiling_empty": {
        "file": "ann_2",
        "index": 3
      },
      "exhausted": {
        "file": "ann_2",
        "index": 4
      },
      "hopeless": {
        "file": "ann_2",
        "index": 5
      },
      "complaining": {
        "file": "ann_2",
        "index": 6
      }
    }
  },
  "gin": {
    "expressions": {
      "normal": {
        "file": "gin_1",
        "index": 0
      },
      "smiling": {
        "file": "gin_1",
        "index": 1
      },
      "happy": {
        "file": "gin_1",
        "index": 2
      },
      "annoyed": {
        "file": "gin_1",
        "index": 3
      },
      "angry": {
        "file": "gin_1",
        "index": 4
      },
      "panicking": {
        "file": "gin_1",
        "index": 5
      },
      "relieved": {
        "file": "gin_1",
        "index": 6
      },
      "holding_tears": {
        "file": "gin_1",
        "index": 7
      },
      "confused": {
        "file": "gin_2",
        "index": 0
      },
      "horrified": {
        "file": "gin_2",
        "index": 1
      },
      "anxious": {
        "file": "gin_2",
        "index": 2
      },
      "smiling_empty": {
        "file": "gin_2",
        "index": 3
      },
      "exhausted": {
        "file": "gin_2",
        "index": 4
      },
      "hopeless": {
        "file": "gin_2",
        "index": 5
      },
      "complaining": {
        "file": "gin_2",
        "index": 6
      }
    }
  },
  "zuko": {
    "expressions": {
      "normal": {
        "file": "zuko_1",
        "index": 0
      },
      "smiling": {
        "file": "zuko_1",
        "index": 1
      },
      "happy": {
        "file": "zuko_1",
        "index": 2
      },
      "annoyed": {
        "file": "zuko_1",
        "index": 3
      },
      "angry": {
        "file": "zuko_1",
        "index": 4
      },
      "panicking": {
        "file": "zuko_1",
        "index": 5
      },
      "relieved": {
        "file": "zuko_1",
        "index": 6
      },
      "holding_tears": {
        "file": "zuko_1",
        "index": 7
      },
      "confused": {
        "file": "zuko_2",
        "index": 0
      },
      "horrified": {
        "file": "zuko_2",
        "index": 1
      },
      "anxious": {
        "file": "zuko_2",
        "index": 2
      },
      "smiling_empty": {
        "file": "zuko_2",
        "index": 3
      },
      "exhausted": {
        "file": "zuko_2",
        "index": 4
      },
      "hopeless": {
        "file": "zuko_2",
        "index": 5
      },
      "complaining": {
        "file": "zuko_2",
        "index": 6
      }
    }
  }
};

const state = {
  dataDirHandle: null,
  dataDirName: "",
  previewItems: [],
  previewIndex: 0,
  faceLoadToken: "",
  mapFileCount: 0
};

const el = {
  loadDefaultsBtn: document.querySelector("#loadDefaultsBtn"),
  pickDataBtn: document.querySelector("#pickDataBtn"),
  templateFileBtn: document.querySelector("#templateFileBtn"),
  expressionFileBtn: document.querySelector("#expressionFileBtn"),
  templateFileInput: document.querySelector("#templateFileInput"),
  expressionFileInput: document.querySelector("#expressionFileInput"),
  templateInput: document.querySelector("#templateInput"),
  expressionInput: document.querySelector("#expressionInput"),
  writeMode: document.querySelector("#writeMode"),
  lineWidth: document.querySelector("#lineWidth"),
  backgroundType: document.querySelector("#backgroundType"),
  positionType: document.querySelector("#positionType"),
  createMissing: document.querySelector("#createMissing"),
  createBackup: document.querySelector("#createBackup"),
  previewBtn: document.querySelector("#previewBtn"),
  writeBtn: document.querySelector("#writeBtn"),
  statusBox: document.querySelector("#statusBox"),
  logOutput: document.querySelector("#logOutput"),
  sourceStatus: document.querySelector("#sourceStatus"),
  previewMeta: document.querySelector("#previewMeta"),
  prevBtn: document.querySelector("#prevBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  nameBox: document.querySelector("#nameBox"),
  faceFrame: document.querySelector("#faceFrame"),
  faceSprite: document.querySelector("#faceSprite"),
  faceFallback: document.querySelector("#faceFallback"),
  messageText: document.querySelector("#messageText"),
  messageWindow: document.querySelector(".message-window"),
  dialogueCounter: document.querySelector("#dialogueCounter"),
  targetInfo: document.querySelector("#targetInfo")
};

function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}

function setStatus(message, type = "") {
  el.statusBox.textContent = message;
  el.statusBox.className = `status ${type}`.trim();
}

function setLog(lines) {
  el.logOutput.value = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
}

function parseJsonTextarea(textarea, label) {
  try {
    let text = textarea.value;
    text = text.replace(/\\./g, match => {
      // Allow standard JSON escapes
      if (['\\"', '\\\\', '\\/', '\\b', '\\f', '\\n', '\\r', '\\t'].includes(match)) {
        return match;
      }
      if (match.startsWith('\\u')) return match;
      // Double escape proprietary/RPG Maker backslashes so JSON.parse succeeds
      return '\\\\' + match.substring(1);
    });
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} JSON tidak valid: ${error.message}`);
  }
}

async function fetchJsonOrFallback(path, fallback) {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } catch {
    return fallback;
  }
}

async function loadDefaults() {
  const [template, expressions] = await Promise.all([
    fetchJsonOrFallback("template.json", fallbackTemplate),
    fetchJsonOrFallback("expression.json", fallbackExpressions)
  ]);

  el.templateInput.value = prettyJson(template);
  el.expressionInput.value = prettyJson(expressions);
  setStatus("Default JSON dimuat.", "ok");
  updatePreviewFromInputs();
}

async function readFileToTextarea(fileInput, textarea, label) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  textarea.value = await file.text();
  setStatus(`${label} dimuat dari file.`, "ok");
  updatePreviewFromInputs();
  fileInput.value = "";
}

function getSettings() {
  return {
    writeMode: el.writeMode.value,
    lineWidth: clamp(Number(el.lineWidth.value) || 52, 20, 80),
    backgroundType: Number(el.backgroundType.value),
    positionType: Number(el.positionType.value),
    createMissing: el.createMissing.checked,
    createBackup: el.createBackup.checked
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeMapName(value) {
  const raw = String(value || "").trim().replace(/\.json$/i, "");
  if (!raw) throw new Error("Field map wajib diisi, contoh: Map007.");

  const mapMatch = raw.match(/^map0*(\d+)$/i);
  if (mapMatch) return `Map${String(Number(mapMatch[1])).padStart(3, "0")}`;

  if (/^\d+$/.test(raw)) return `Map${String(Number(raw)).padStart(3, "0")}`;

  throw new Error(`Nama map tidak dikenali: ${raw}`);
}

function mapFileName(template) {
  return `${normalizeMapName(template.map)}.json`;
}

function parseEventNumber(value) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  const match = String(value || "").match(/(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function eventDisplayName(value, numericId) {
  if (typeof value === "string" && value.trim()) return value.trim();
  return `EV${String(numericId).padStart(3, "0")}`;
}

function ensureEventsArray(mapData) {
  if (!Array.isArray(mapData.events)) {
    throw new Error("Map JSON tidak memiliki array events.");
  }
}

function findEvent(mapData, spec) {
  const requested = spec.id;
  if (typeof requested === "string" && requested.trim()) {
    const byName = mapData.events.find((event) => event && event.name === requested.trim());
    if (byName) return byName;
  }

  const numericId = parseEventNumber(requested);
  if (numericId && mapData.events[numericId]) return mapData.events[numericId];

  return null;
}

function nextEventId(mapData) {
  for (let i = 1; i < mapData.events.length; i += 1) {
    if (!mapData.events[i]) return i;
  }
  return mapData.events.length;
}

function createDefaultEvent(spec, mapData) {
  const requestedId = parseEventNumber(spec.id);
  const eventId = requestedId || nextEventId(mapData);
  while (mapData.events.length <= eventId) mapData.events.push(null);

  const event = {
    id: eventId,
    name: eventDisplayName(spec.name || spec.id, eventId),
    note: spec.note || "",
    pages: [],
    x: Number.isFinite(Number(spec.x)) ? Number(spec.x) : 0,
    y: Number.isFinite(Number(spec.y)) ? Number(spec.y) : 0
  };

  mapData.events[eventId] = event;
  return event;
}

function createDefaultPage(spec = {}) {
  return {
    conditions: {
      actorId: 1,
      actorValid: false,
      itemId: 1,
      itemValid: false,
      selfSwitchCh: "A",
      selfSwitchValid: false,
      switch1Id: Number(spec.switchId || spec.switch1Id || 1),
      switch1Valid: Boolean(spec.switchValid || spec.switch1Valid || false),
      switch2Id: Number(spec.switch2Id || 1),
      switch2Valid: Boolean(spec.switch2Valid || false),
      variableId: Number(spec.variableId || 1),
      variableValid: Boolean(spec.variableValid || false),
      variableValue: Number(spec.variableValue || 0)
    },
    directionFix: Boolean(spec.directionFix || false),
    image: spec.image || {
      characterIndex: 0,
      characterName: "",
      direction: 2,
      pattern: 0,
      tileId: 0
    },
    list: [{ code: 0, indent: 0, parameters: [] }],
    moveFrequency: Number(spec.moveFrequency || 3),
    moveRoute: {
      list: [{ code: 0, parameters: [] }],
      repeat: true,
      skippable: false,
      wait: false
    },
    moveSpeed: Number(spec.moveSpeed || 3),
    moveType: Number(spec.moveType || 0),
    priorityType: Number(spec.priorityType || 0),
    stepAnime: Boolean(spec.stepAnime || false),
    through: Boolean(spec.through || false),
    trigger: Number(spec.trigger || 0),
    walkAnime: spec.walkAnime === undefined ? true : Boolean(spec.walkAnime)
  };
}

function resolvePageIndex(event, spec) {
  const rawPage = spec.page;
  if (rawPage === undefined || rawPage === null || rawPage === "") return 0;
  if (String(rawPage).toLowerCase() === "new") return event.pages.length;
  const pageIndex = Number(rawPage);
  if (!Number.isInteger(pageIndex) || pageIndex < 0) {
    throw new Error(`Page tidak valid pada ${spec.id}: ${rawPage}`);
  }
  return pageIndex;
}

function ensurePage(event, pageIndex, spec, createMissing) {
  if (!Array.isArray(event.pages)) event.pages = [];

  if (event.pages[pageIndex]) return event.pages[pageIndex];

  if (!createMissing) {
    throw new Error(`Page ${pageIndex} belum ada pada event ${event.name}.`);
  }

  while (event.pages.length <= pageIndex) {
    event.pages.push(createDefaultPage(spec.pageSettings || spec));
  }

  return event.pages[pageIndex];
}

function titleCase(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function resolveActorConfig(expressions, actor) {
  if (!actor) return {};
  return expressions[actor] || expressions[String(actor).toLowerCase()] || {};
}

function resolveFace(command, expressions, warnings) {
  const actor = command.actor || "";
  const hasExpression = Object.prototype.hasOwnProperty.call(command, "expression") && String(command.expression || "").trim() !== "";
  const expression = hasExpression ? String(command.expression).trim() : "";
  const actorConfig = resolveActorConfig(expressions, actor);
  const expressionMap = actorConfig.expressions || {};
  const directFace = command.face || command.portrait || null;

  let source = directFace;
  if (!source && hasExpression) {
    source = expressionMap[expression] || actorConfig[expression] || (expression === "default" ? actorConfig.default : null) || null;
  }

  if (!source) {
    if (hasExpression) warnings.push(`Expression "${actor}.${expression}" tidak ada, portrait dikosongkan.`);
    return { file: "", index: 0 };
  }

  return {
    file: String(source.file || source.faceName || command.faceName || ""),
    index: Number(source.index ?? source.faceIndex ?? command.faceIndex ?? 0)
  };
}

function resolveSpeaker(command) {
  const actor = command.actor || "";
  return command.name || command.speaker || titleCase(actor);
}

function wrapText(text, width) {
  const inputLines = String(text ?? "").replace(/\r\n/g, "\n").split("\n");
  const wrapped = [];

  for (const inputLine of inputLines) {
    if (!inputLine) {
      wrapped.push("");
      continue;
    }

    const words = inputLine.split(/\s+/);
    let line = "";

    for (const word of words) {
      if (!word) continue;

      if (word.length > width) {
        if (line) {
          wrapped.push(line);
          line = "";
        }
        for (let i = 0; i < word.length; i += width) {
          wrapped.push(word.slice(i, i + width));
        }
        continue;
      }

      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > width && line) {
        wrapped.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) wrapped.push(line);
  }

  return wrapped.length ? wrapped : [""];
}

function commandText(command) {
  if (Array.isArray(command.text)) return command.text.join("\n");
  return String(command.text ?? command.message ?? "");
}

function buildDialogueCommands(commands, expressions, settings, indent = 0) {
  const output = [];
  const previewItems = [];
  const warnings = [];

  if (!Array.isArray(commands)) {
    throw new Error("commands harus berupa array.");
  }

  for (const command of commands) {
    if (!command) continue;

    if (command.type === "raw" && Array.isArray(command.commands)) {
      output.push(...structuredClone(command.commands));
      continue;
    }

    if (command.type && command.type !== "dialogue") {
      warnings.push(`Command type "${command.type}" dilewati.`);
      continue;
    }

    const face = resolveFace(command, expressions, warnings);
    const speaker = resolveSpeaker(command);
    const text = commandText(command);
    const lines = wrapText(text, Number(command.lineWidth || settings.lineWidth));
    const background = Number(command.background ?? command.backgroundType ?? settings.backgroundType);
    const position = Number(command.position ?? command.positionType ?? settings.positionType);

    output.push({
      code: 101,
      indent,
      parameters: [face.file, face.index, background, position, speaker]
    });

    for (const line of lines) {
      output.push({ code: 401, indent, parameters: [line] });
    }

    previewItems.push({
      actor: command.actor || "",
      expression: command.expression || "",
      speaker,
      text,
      lines,
      faceFile: face.file,
      faceIndex: face.index
    });
  }

  return { commands: output, previewItems, warnings };
}

function findFinalTerminatorIndex(list) {
  if (!Array.isArray(list)) return -1;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i] && list[i].code === 0 && Number(list[i].indent || 0) === 0) return i;
  }
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i] && list[i].code === 0) return i;
  }
  return -1;
}

function appendBeforeFinalTerminator(page, commands) {
  if (!Array.isArray(page.list)) page.list = [];
  const insertAt = findFinalTerminatorIndex(page.list);
  if (insertAt >= 0) {
    page.list.splice(insertAt, 0, ...commands);
  } else {
    page.list.push(...commands, { code: 0, indent: 0, parameters: [] });
  }
}

function replacePageList(page, commands) {
  page.list = [...commands, { code: 0, indent: 0, parameters: [] }];
}

function validateTemplate(template) {
  if (!template || typeof template !== "object") throw new Error("Template harus berupa object.");
  normalizeMapName(template.map);
  if (!Array.isArray(template.events) || template.events.length === 0) {
    throw new Error("Template wajib memiliki events array.");
  }
}

function buildPreviewFromInputs() {
  const template = parseJsonTextarea(el.templateInput, "Template");
  const expressions = parseJsonTextarea(el.expressionInput, "Expression");
  const settings = getSettings();
  validateTemplate(template);

  const allPreview = [];
  const allWarnings = [];
  const allLogs = [`Target map: ${mapFileName(template)}`];

  for (const eventSpec of template.events) {
    const built = buildDialogueCommands(eventSpec.commands || [], expressions, settings, 0);
    const page = eventSpec.page === undefined ? 0 : eventSpec.page;

    for (const item of built.previewItems) {
      allPreview.push({
        ...item,
        targetMap: normalizeMapName(template.map),
        targetEvent: eventSpec.id || eventSpec.name || "(new)",
        targetPage: page
      });
    }

    allLogs.push(`${eventSpec.id || eventSpec.name || "(new event)"} page ${page}: ${built.commands.length} command`);
    allWarnings.push(...built.warnings);
  }

  return { previewItems: allPreview, logs: allLogs, warnings: allWarnings, template, expressions };
}

function updatePreviewFromInputs() {
  try {
    const result = buildPreviewFromInputs();
    state.previewItems = result.previewItems;
    state.previewIndex = 0;
    renderPreview();

    const logLines = [...result.logs];
    if (result.warnings.length) {
      logLines.push("", "Warnings:", ...result.warnings.map((warning) => `- ${warning}`));
    }
    setLog(logLines);
    setStatus(`Preview siap: ${state.previewItems.length} dialogue.`, "ok");
  } catch (error) {
    state.previewItems = [];
    state.previewIndex = 0;
    renderPreview();
    setStatus(error.message, "error");
    setLog(error.message);
  }
}

const rmmzColors = [
  "#ffffff", "#20a0d6", "#ff784c", "#66cc40", "#99ccff", "#ccc0ff", "#ffffa0", "#808080",
  "#c0c0c0", "#2080cc", "#ff3810", "#00a010", "#3e9ade", "#a098ff", "#ffcc20", "#000000",
  "#84aaff", "#ffff40", "#ff2020", "#202040", "#ff8000", "#ff4000", "#40a0ff", "#40c0ea",
  "#80ff80", "#c0a0c0", "#4040ff", "#ff80ff", "#00a040", "#00e060", "#a060e0", "#c080ff"
];

function formatRmmzText(text) {
  // Strip VisuStella name box tags like \N<Name> or \NC<Name> so they don't break the preview
  // We already use the speaker property for the Name Box.
  let source = (text || "").replace(/\\N[A-Z]*<([^>]+)>/gi, '');
  const regex = /\\C\[(\d+)\]|\\ResetColor|\\FX<([^>]+)>|\\RX/gi;
  let result = "";
  let lastIndex = 0;

  let activeColor = "";
  let activeFx = "";

  function openSpan() {
    let classes = activeFx ? `fx-${activeFx.replace(/\s+/g, '-')}` : '';
    let style = activeColor ? `color: ${activeColor};` : '';
    if (!classes && !style) return '';
    let clsAttr = classes ? ` class="${classes}"` : '';
    let styAttr = style ? ` style="${style}"` : '';
    return `<span${clsAttr}${styAttr}>`;
  }

  let match;
  while ((match = regex.exec(source)) !== null) {
    let textChunk = source.slice(lastIndex, match.index);
    if (textChunk) {
      let htmlChunk = escapeHtml(textChunk).replace(/\n/g, '<br>');
      let span = openSpan();
      if (span) result += span + htmlChunk + "</span>";
      else result += htmlChunk;
    }

    let m0 = match[0].toUpperCase();
    if (m0.startsWith("\\C[")) {
      let idx = parseInt(match[1], 10);
      activeColor = rmmzColors[idx] || activeColor;
    } else if (m0.startsWith("\\RESETCOLOR")) {
      activeColor = "";
    } else if (m0.startsWith("\\FX<")) {
      let args = match[2].split(',');
      let cat = (args[0] || "").trim().toLowerCase();
      let sub = (args[1] || "").trim().toLowerCase();
      activeFx = `${cat}-${sub}`;
    } else if (m0.startsWith("\\RX")) {
      activeFx = "";
    }

    lastIndex = regex.lastIndex;
  }

  let remainder = source.slice(lastIndex);
  if (remainder) {
    let htmlChunk = escapeHtml(remainder).replace(/\n/g, '<br>');
    let span = openSpan();
    if (span) result += span + htmlChunk + "</span>";
    else result += htmlChunk;
  }

  return result;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function encodedFaceUrl(file) {
  return `../img/faces/${encodeURIComponent(file)}.png`;
}

function renderFace(item) {
  const file = item && item.faceFile ? String(item.faceFile) : "";
  const index = item && Number.isFinite(Number(item.faceIndex)) ? Number(item.faceIndex) : 0;

  el.faceFrame.hidden = !file;
  el.faceSprite.style.backgroundImage = "";
  el.faceSprite.style.backgroundPosition = "0 0";
  el.faceFallback.hidden = false;
  el.faceFallback.textContent = file ? `${file}.png` : "No face";

  if (!file) return;

  const col = index % 4;
  const row = Math.floor(index / 4);
  const url = encodedFaceUrl(file);
  const token = `${url}:${index}:${Date.now()}`;
  state.faceLoadToken = token;

  const img = new Image();
  img.onload = () => {
    if (state.faceLoadToken !== token) return;
    const frameWidth = el.faceFrame.clientWidth || 144;
    const frameHeight = el.faceFrame.clientHeight || 144;
    const scale = Math.max(frameWidth / 144, frameHeight / 144);
    el.faceSprite.style.setProperty("--face-scale", String(scale));
    el.faceSprite.style.backgroundImage = `url("${url}")`;
    el.faceSprite.style.backgroundPosition = `${-col * 144}px ${-row * 144}px`;
    el.faceFallback.hidden = true;
  };
  img.onerror = () => {
    if (state.faceLoadToken !== token) return;
    el.faceFallback.hidden = false;
    el.faceFallback.textContent = `${file}.png tidak ditemukan`;
  };
  img.src = url;
}

function renderPreview() {
  const total = state.previewItems.length;
  el.previewMeta.textContent = `${total} dialogue`;
  el.prevBtn.disabled = total <= 1;
  el.nextBtn.disabled = total <= 1;

  if (!total) {
    el.messageWindow.classList.remove("no-face");
    el.nameBox.textContent = "Name";
    el.nameBox.style.display = "block";
    el.messageText.textContent = "Preview dialog akan muncul di sini.";
    el.dialogueCounter.textContent = "0 / 0";
    el.targetInfo.textContent = "No target";
    renderFace(null);
    return;
  }

  state.previewIndex = ((state.previewIndex % total) + total) % total;
  const item = state.previewItems[state.previewIndex];
  const hasFace = Boolean(item.faceFile);
  el.messageWindow.classList.toggle("no-face", !hasFace);
  const speakerName = item.speaker || "";
  el.nameBox.textContent = speakerName;
  el.nameBox.style.display = speakerName.trim() ? "block" : "none";
  el.messageText.innerHTML = item.lines.map(formatRmmzText).join("<br>");
  el.dialogueCounter.textContent = `${state.previewIndex + 1} / ${total}`;
  el.targetInfo.textContent = `${item.targetMap} -> ${item.targetEvent} page ${item.targetPage}`;
  renderFace(item);
}

async function verifyPermission(handle, mode = "readwrite") {
  const options = { mode };
  if ((await handle.queryPermission(options)) === "granted") return true;
  return (await handle.requestPermission(options)) === "granted";
}

async function resolveDataDirectory(handle) {
  try {
    await handle.getFileHandle("Map001.json");
    return handle;
  } catch {
    try {
      return await handle.getDirectoryHandle("data");
    } catch {
      throw new Error("Folder yang dipilih bukan folder data dan tidak memiliki subfolder data.");
    }
  }
}

async function countMapFiles(dataHandle) {
  let count = 0;
  for await (const [name, entry] of dataHandle.entries()) {
    if (entry.kind === "file" && /^Map\d+\.json$/i.test(name)) count += 1;
  }
  return count;
}

async function pickDataDirectory() {
  if (!window.showDirectoryPicker) {
    throw new Error("Browser ini belum mendukung File System Access API. Gunakan Chrome atau Edge via localhost.");
  }

  const picked = await window.showDirectoryPicker({ mode: "readwrite" });
  const dataHandle = await resolveDataDirectory(picked);
  const allowed = await verifyPermission(dataHandle, "readwrite");
  if (!allowed) throw new Error("Akses tulis ke folder data ditolak.");

  state.dataDirHandle = dataHandle;
  state.dataDirName = dataHandle.name;
  state.mapFileCount = await countMapFiles(dataHandle);
  el.sourceStatus.textContent = `${state.dataDirName}: ${state.mapFileCount} map file`;
  setStatus(`Folder data siap: ${state.dataDirName}.`, "ok");
}

function applyTemplateToMap(mapData, template, expressions, settings) {
  ensureEventsArray(mapData);
  validateTemplate(template);

  const changes = [];
  const allWarnings = [];
  const previewItems = [];
  const targetMap = normalizeMapName(template.map);

  for (const eventSpec of template.events) {
    let event = findEvent(mapData, eventSpec);
    let createdEvent = false;

    if (!event) {
      if (!settings.createMissing) {
        throw new Error(`Event ${eventSpec.id || eventSpec.name} tidak ditemukan.`);
      }
      event = createDefaultEvent(eventSpec, mapData);
      createdEvent = true;
    }

    const pageIndex = resolvePageIndex(event, eventSpec);
    const hadPage = Boolean(event.pages && event.pages[pageIndex]);
    const page = ensurePage(event, pageIndex, eventSpec, settings.createMissing);

    const built = buildDialogueCommands(eventSpec.commands || [], expressions, settings, 0);
    if (settings.writeMode === "replace") {
      replacePageList(page, built.commands);
    } else {
      appendBeforeFinalTerminator(page, built.commands);
    }

    for (const item of built.previewItems) {
      previewItems.push({
        ...item,
        targetMap,
        targetEvent: event.name,
        targetPage: pageIndex
      });
    }

    allWarnings.push(...built.warnings);
    changes.push(
      `${event.name} page ${pageIndex}: ${settings.writeMode}, ${built.previewItems.length} dialogue` +
      `${createdEvent ? ", event baru" : ""}${!hadPage ? ", page baru" : ""}`
    );
  }

  return { changes, warnings: allWarnings, previewItems };
}

function backupFileName(fileName) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return fileName.replace(/\.json$/i, `.dialogue-backup-${stamp}.json`);
}

async function writeTextFile(fileHandle, text) {
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
}

async function writeToMap() {
  if (!state.dataDirHandle) {
    await pickDataDirectory();
  }

  const allowed = await verifyPermission(state.dataDirHandle, "readwrite");
  if (!allowed) throw new Error("Akses tulis ke folder data ditolak.");

  const template = parseJsonTextarea(el.templateInput, "Template");
  const expressions = parseJsonTextarea(el.expressionInput, "Expression");
  const settings = getSettings();
  const fileName = mapFileName(template);

  const fileHandle = await state.dataDirHandle.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  const originalText = await file.text();
  const mapData = JSON.parse(originalText);
  const result = applyTemplateToMap(mapData, template, expressions, settings);

  if (settings.createBackup) {
    const backupHandle = await state.dataDirHandle.getFileHandle(backupFileName(fileName), { create: true });
    await writeTextFile(backupHandle, originalText);
  }

  await writeTextFile(fileHandle, JSON.stringify(mapData));

  state.previewItems = result.previewItems;
  state.previewIndex = 0;
  renderPreview();

  const logLines = [`Saved: ${fileName}`, ...result.changes];
  if (result.warnings.length) {
    logLines.push("", "Warnings:", ...result.warnings.map((warning) => `- ${warning}`));
  }
  setLog(logLines);
  setStatus(`${fileName} berhasil ditulis.`, "ok");
}

function bindEvents() {
  el.loadDefaultsBtn.addEventListener("click", () => {
    loadDefaults().catch((error) => setStatus(error.message, "error"));
  });

  el.pickDataBtn.addEventListener("click", () => {
    pickDataDirectory().catch((error) => setStatus(error.message, "error"));
  });

  el.templateFileBtn.addEventListener("click", () => el.templateFileInput.click());
  el.expressionFileBtn.addEventListener("click", () => el.expressionFileInput.click());

  el.templateFileInput.addEventListener("change", () => {
    readFileToTextarea(el.templateFileInput, el.templateInput, "Template").catch((error) => setStatus(error.message, "error"));
  });

  el.expressionFileInput.addEventListener("change", () => {
    readFileToTextarea(el.expressionFileInput, el.expressionInput, "Expression").catch((error) => setStatus(error.message, "error"));
  });

  el.previewBtn.addEventListener("click", updatePreviewFromInputs);

  el.writeBtn.addEventListener("click", () => {
    setStatus("Menulis Map JSON...", "");
    writeToMap().catch((error) => {
      setStatus(error.message, "error");
      setLog(error.stack || error.message);
    });
  });

  el.prevBtn.addEventListener("click", () => {
    state.previewIndex -= 1;
    renderPreview();
  });

  el.nextBtn.addEventListener("click", () => {
    state.previewIndex += 1;
    renderPreview();
  });

  window.addEventListener("resize", renderPreview);
}

bindEvents();
loadDefaults().catch(() => {
  el.templateInput.value = prettyJson(fallbackTemplate);
  el.expressionInput.value = prettyJson(fallbackExpressions);
  updatePreviewFromInputs();
});
