/*:
 * @target MZ
 * @plugindesc Reverie - check party leader by character name for event conditions.
 * @author Codex
 *
 * @param Leader Switches
 * @text Switch Leader Otomatis
 * @type struct<LeaderSwitch>[]
 * @desc Optional. Set switch ON/OFF automatically based on the current party leader name.
 * @default []
 *
 * @param Auto Refresh Switches
 * @text Auto Refresh Switches
 * @type boolean
 * @on Aktif
 * @off Mati
 * @desc If ON, configured Leader Switches refresh whenever party order/name changes or a save is loaded.
 * @default true
 *
 * @command CheckLeader
 * @text Cek Leader Party
 * @desc Sets a switch ON if the current party leader matches the typed character name.
 *
 * @arg actorName
 * @text Nama Karakter
 * @type string
 * @desc Type the character name, for example SORA, GIN, ANN, or ZUKO. Comma/pipe can check several names.
 * @default SORA
 *
 * @arg resultSwitch
 * @text Switch Hasil
 * @type switch
 * @desc This switch becomes ON if the leader matches, otherwise OFF.
 * @default 0
 *
 * @command StoreLeaderName
 * @text Simpan Nama Leader
 * @desc Stores the current party leader name into a variable.
 *
 * @arg variableId
 * @text Variable Tujuan
 * @type variable
 * @desc Variable that will receive the current leader name.
 * @default 0
 *
 * @command RefreshLeaderSwitches
 * @text Refresh Switch Leader
 * @desc Refreshes all switches configured in Switch Leader Otomatis now.
 *
 * @help PartyLeaderCondition.js
 *
 * Plugin ini dibuat supaya event bisa mengecek leader party tanpa menulis
 * script condition.
 *
 * Cara paling fleksibel:
 *   1. Tambahkan Plugin Command: PartyLeaderCondition > Cek Leader Party.
 *   2. Isi Nama Karakter, misalnya GIN.
 *   3. Pilih Switch Hasil.
 *   4. Setelah itu pakai Conditional Branch biasa: Switch Hasil is ON.
 *
 * Nama tidak case-sensitive, jadi GIN, Gin, dan gin dianggap sama. Jika ingin
 * mengecek beberapa leader sekaligus, tulis dengan koma atau pipe:
 *
 *   SORA, GIN
 *   ANN | ZUKO
 *
 * Cara otomatis:
 *   Isi parameter Switch Leader Otomatis dengan pasangan Nama Karakter +
 *   Switch. Selama Auto Refresh Switches aktif, switch tersebut akan selalu
 *   ON hanya saat leader party cocok dengan nama yang ditulis.
 *
 * Plugin juga menyediakan command Simpan Nama Leader untuk menyimpan nama
 * leader saat ini ke variable bila dibutuhkan untuk debug atau event lain.
 */

/*~struct~LeaderSwitch:
 * @param actorName
 * @text Nama Karakter
 * @type string
 * @desc Character name to compare with the current party leader.
 * @default SORA
 *
 * @param switchId
 * @text Switch
 * @type switch
 * @desc Switch that will be ON when this character is the leader.
 * @default 0
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "PartyLeaderCondition";
    const params = PluginManager.parameters(PLUGIN_NAME);

    const parseJson = (value, fallback) => {
        if (value === undefined || value === null || value === "") {
            return fallback;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            console.warn(`${PLUGIN_NAME}: failed to parse plugin parameter.`, error);
            return fallback;
        }
    };

    const boolParam = (name, fallback) => {
        const value = params[name];
        if (value === undefined || value === "") {
            return fallback;
        }
        return String(value).toLowerCase() === "true";
    };

    const cleanText = (value) => {
        let text = value === undefined || value === null ? "" : String(value).trim();
        let changed = true;

        while (changed && text.length >= 2) {
            changed = false;
            if (
                (text.startsWith('"') && text.endsWith('"')) ||
                (text.startsWith("'") && text.endsWith("'"))
            ) {
                text = text.slice(1, -1).trim();
                changed = true;
            }
        }

        return text;
    };

    const normalizeName = (value) => {
        return cleanText(value).replace(/\s+/g, " ").toLowerCase();
    };

    const splitNames = (value) => {
        return String(value || "")
            .split(/[|,]/)
            .map(normalizeName)
            .filter(name => name.length > 0);
    };

    const parseLeaderSwitches = () => {
        const list = parseJson(params["Leader Switches"], []);
        if (!Array.isArray(list)) {
            return [];
        }

        return list
            .map(rawEntry => {
                const entry = typeof rawEntry === "string" ? parseJson(rawEntry, {}) : rawEntry;
                return {
                    actorName: cleanText(entry.actorName),
                    switchId: Number(entry.switchId || 0)
                };
            })
            .filter(entry => entry.actorName.length > 0 && entry.switchId > 0);
    };

    const AUTO_REFRESH_SWITCHES = boolParam("Auto Refresh Switches", true);
    const LEADER_SWITCHES = parseLeaderSwitches();

    const PartyLeaderCondition = {
        leader() {
            return $gameParty && $gameParty.leader ? $gameParty.leader() : null;
        },

        leaderName() {
            const leader = this.leader();
            return leader && leader.name ? cleanText(leader.name()) : "";
        },

        leaderDatabaseName() {
            const leader = this.leader();
            if (!leader || !leader.actorId || !$dataActors) {
                return "";
            }

            const dataActor = $dataActors[leader.actorId()];
            return dataActor ? cleanText(dataActor.name) : "";
        },

        leaderNames() {
            const names = [];
            const currentName = normalizeName(this.leaderName());
            const databaseName = normalizeName(this.leaderDatabaseName());

            if (currentName) {
                names.push(currentName);
            }
            if (databaseName && !names.includes(databaseName)) {
                names.push(databaseName);
            }

            return names;
        },

        isLeader(actorNames) {
            const wantedNames = splitNames(actorNames);
            if (wantedNames.length === 0) {
                return false;
            }

            const currentNames = this.leaderNames();
            return wantedNames.some(name => currentNames.includes(name));
        },

        refreshSwitches(force = false) {
            if (!$gameSwitches || (!force && !AUTO_REFRESH_SWITCHES)) {
                return;
            }

            for (const entry of LEADER_SWITCHES) {
                $gameSwitches.setValue(entry.switchId, this.isLeader(entry.actorName));
            }
        }
    };

    window.PartyLeaderCondition = PartyLeaderCondition;

    PluginManager.registerCommand(PLUGIN_NAME, "CheckLeader", args => {
        const switchId = Number(args.resultSwitch || 0);
        if (switchId <= 0 || !$gameSwitches) {
            return;
        }

        $gameSwitches.setValue(switchId, PartyLeaderCondition.isLeader(args.actorName));
    });

    PluginManager.registerCommand(PLUGIN_NAME, "StoreLeaderName", args => {
        const variableId = Number(args.variableId || 0);
        if (variableId <= 0 || !$gameVariables) {
            return;
        }

        $gameVariables.setValue(variableId, PartyLeaderCondition.leaderName());
    });

    PluginManager.registerCommand(PLUGIN_NAME, "RefreshLeaderSwitches", () => {
        PartyLeaderCondition.refreshSwitches(true);
    });

    const refreshAutoSwitches = () => {
        PartyLeaderCondition.refreshSwitches(false);
    };

    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.call(this, contents);
        refreshAutoSwitches();
    };

    const _Game_Party_setupStartingMembers = Game_Party.prototype.setupStartingMembers;
    Game_Party.prototype.setupStartingMembers = function() {
        _Game_Party_setupStartingMembers.call(this);
        refreshAutoSwitches();
    };

    const _Game_Party_addActor = Game_Party.prototype.addActor;
    Game_Party.prototype.addActor = function(actorId) {
        _Game_Party_addActor.call(this, actorId);
        refreshAutoSwitches();
    };

    const _Game_Party_removeActor = Game_Party.prototype.removeActor;
    Game_Party.prototype.removeActor = function(actorId) {
        _Game_Party_removeActor.call(this, actorId);
        refreshAutoSwitches();
    };

    const _Game_Party_swapOrder = Game_Party.prototype.swapOrder;
    Game_Party.prototype.swapOrder = function(index1, index2) {
        _Game_Party_swapOrder.call(this, index1, index2);
        refreshAutoSwitches();
    };

    const _Game_Actor_setName = Game_Actor.prototype.setName;
    Game_Actor.prototype.setName = function(name) {
        _Game_Actor_setName.call(this, name);
        refreshAutoSwitches();
    };
})();
