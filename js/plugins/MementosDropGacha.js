/*:
 * @target MZ
 * @plugindesc Reverie - Chapter-based mementos drop gacha for Elementa battles.
 * @author Aristel
 *
 * @help MementosDropGacha.js
 *
 * Enable this plugin below BattleConclusionLog.js.
 *
 * To attach a drop pool to an Elementa battle, put this Comment command
 * immediately before Battle Processing:
 *
 *   <MementosDrop: 1>
 *
 * Optional chance override:
 *
 *   <MementosDrop: 1, 75>
 *
 * The first number is chapter. The second number is drop chance override.
 * Omit the second number to use the chapter default.
 *
 * The plugin gives at most 1 item per call, even if the troop had multiple
 * enemies. Chapter pools are cumulative: later chapters can still drop older
 * mementos, but with lower weight.
 *
 * Plugin command / script call still work for non-battle drops or testing.
 *
 * Script call alternative:
 *   ReverieMementosDropGacha.roll(1);
 *
 * Result is stored in:
 *   $gameTemp.reverieLastMementosDrop
 *
 * @command RollDrop
 * @text Roll Mementos Drop
 * @desc Rolls one chapter-based memento drop.
 *
 * @arg chapter
 * @text Chapter
 * @type number
 * @min 0
 * @max 4
 * @default 1
 * @desc Chapter pool to roll from. Ch0 = 0, Ch1 = 1, and so on.
 *
 * @arg showMessage
 * @text Show Message
 * @type boolean
 * @on Show
 * @off Silent
 * @default true
 * @desc Shows "You got X!" if an item drops.
 *
 * @arg dropChanceOverride
 * @text Drop Chance Override
 * @type number
 * @min -1
 * @max 100
 * @default -1
 * @desc -1 uses the chapter default. 0-100 overrides the drop chance.
 *
 * @arg itemVariableId
 * @text Item ID Variable
 * @type variable
 * @default 0
 * @desc Optional. Stores dropped item ID, or 0 if no drop.
 *
 * @arg droppedSwitchId
 * @text Dropped Switch
 * @type switch
 * @default 0
 * @desc Optional. ON if an item dropped, OFF if no drop.
 */

(() => {
    "use strict";

    const BATTLE_LOG_WAIT_COUNT = 5;

    const pluginName = (() => {
        const script = document.currentScript;
        if (!script) return "MementosDropGacha";
        const match = script.src.match(/([^/\\]+)\.js$/i);
        return match ? match[1] : "MementosDropGacha";
    })();

    const POOLS = {
        0: {
            dropChance: 45,
            entries: [
                { id: 42, weight: 42 }, // BREAD
                { id: 43, weight: 25 }, // JUICE BOX
                { id: 44, weight: 20 }, // SHARED CANDY
                { id: 72, weight: 8 },  // MEMO SCRAP
                { id: 73, weight: 5 }   // MARBLE
            ]
        },
        1: {
            dropChance: 55,
            entries: [
                { id: 42, weight: 7 },  // BREAD
                { id: 43, weight: 6 },  // JUICE BOX
                { id: 44, weight: 6 },  // SHARED CANDY
                { id: 72, weight: 2 },  // MEMO SCRAP
                { id: 73, weight: 2 },  // MARBLE

                { id: 45, weight: 20 }, // SOGGY BUN
                { id: 46, weight: 14 }, // MILK
                { id: 47, weight: 14 }, // SPLIT BISCUIT
                { id: 48, weight: 10 }, // MELTED GELATO
                { id: 74, weight: 5 },  // WATERLOGGED NOTE
                { id: 75, weight: 4 },  // RUSTY WHISTLE
                { id: 83, weight: 2 },  // PAPER CROWN
                { id: 84, weight: 2 },  // RED THREAD
                { id: 85, weight: 2 }   // HEAVY STONE
            ]
        },
        2: {
            dropChance: 60,
            entries: [
                { id: 42, weight: 3 },
                { id: 43, weight: 3 },
                { id: 44, weight: 3 },
                { id: 72, weight: 1 },
                { id: 73, weight: 1 },

                { id: 45, weight: 7 },
                { id: 46, weight: 6 },
                { id: 47, weight: 6 },
                { id: 48, weight: 5 },
                { id: 74, weight: 3 },
                { id: 75, weight: 2 },
                { id: 83, weight: 2 },
                { id: 84, weight: 2 },
                { id: 85, weight: 2 },

                { id: 49, weight: 16 }, // CRACKERS
                { id: 50, weight: 10 }, // CANNED PEACHES
                { id: 51, weight: 12 }, // LUNCHBOX
                { id: 52, weight: 4 },  // SOUR JAM
                { id: 76, weight: 5 },  // GRAVEL
                { id: 77, weight: 4 },  // FRAYED RIBBON
                { id: 78, weight: 3 }   // WARNING TAPE
            ]
        },
        3: {
            dropChance: 60,
            entries: [
                { id: 45, weight: 2 },
                { id: 46, weight: 2 },
                { id: 47, weight: 2 },
                { id: 48, weight: 2 },
                { id: 74, weight: 1 },
                { id: 75, weight: 1 },
                { id: 83, weight: 2 },
                { id: 84, weight: 2 },
                { id: 85, weight: 2 },

                { id: 49, weight: 6 },
                { id: 50, weight: 6 },
                { id: 51, weight: 6 },
                { id: 52, weight: 3 },
                { id: 76, weight: 3 },
                { id: 77, weight: 3 },
                { id: 78, weight: 3 },

                { id: 53, weight: 14 }, // SUN-WARM BREAD
                { id: 54, weight: 10 }, // SPARKLING SODA
                { id: 55, weight: 10 }, // CHEESECAKE SLICE
                { id: 56, weight: 2 },  // HONEY TOAST
                { id: 57, weight: 10 }, // CARAMEL
                { id: 79, weight: 4 },  // RALLY STICKER
                { id: 80, weight: 4 }   // SAFETY PIN
            ]
        },
        4: {
            dropChance: 65,
            entries: [
                { id: 49, weight: 2 },
                { id: 50, weight: 2 },
                { id: 51, weight: 2 },
                { id: 52, weight: 1 },
                { id: 77, weight: 1 },

                { id: 53, weight: 5 },
                { id: 54, weight: 5 },
                { id: 55, weight: 4 },
                { id: 56, weight: 2 },
                { id: 57, weight: 5 },
                { id: 79, weight: 2 },
                { id: 80, weight: 2 },
                { id: 83, weight: 2 },
                { id: 84, weight: 2 },
                { id: 85, weight: 2 },

                { id: 58, weight: 18 }, // BLACK TEA
                { id: 59, weight: 18 }, // LAST SANDWICH
                { id: 60, weight: 14 }, // BITTER CANDY
                { id: 61, weight: 3 },  // MEMORY SOUP
                { id: 81, weight: 7 },  // BADGE
                { id: 82, weight: 7 }   // BROKEN LABEL
            ]
        }
    };

    function toNumber(value, fallback = 0) {
        const result = Number(value);
        return Number.isFinite(result) ? result : fallback;
    }

    function toBoolean(value, fallback = false) {
        if (value === true || value === "true") return true;
        if (value === false || value === "false") return false;
        return fallback;
    }

    function validEntries(entries) {
        return (entries || []).filter(entry => {
            const item = $dataItems[entry.id];
            return item && item.name && Number(entry.weight) > 0;
        });
    }

    function weightedPick(entries) {
        const usable = validEntries(entries);
        const totalWeight = usable.reduce((sum, entry) => sum + Number(entry.weight), 0);
        if (totalWeight <= 0) return null;

        let roll = Math.random() * totalWeight;
        for (const entry of usable) {
            roll -= Number(entry.weight);
            if (roll < 0) return entry;
        }

        return usable[usable.length - 1] || null;
    }

    function setResult(result, options) {
        if ($gameTemp) {
            $gameTemp.reverieLastMementosDrop = result;
        }

        const itemVariableId = Number(options.itemVariableId || 0);
        if (itemVariableId > 0) {
            $gameVariables.setValue(itemVariableId, result.itemId || 0);
        }

        const droppedSwitchId = Number(options.droppedSwitchId || 0);
        if (droppedSwitchId > 0) {
            $gameSwitches.setValue(droppedSwitchId, !!result.dropped);
        }
    }

    function showDropMessage(item, amount) {
        if (!item || !$gameMessage) return;

        if ($gameTemp && $gameTemp.reverieShowLastMementosGainMessage) {
            $gameTemp.reverieShowLastMementosGainMessage();
            return;
        }

        const suffix = amount > 1 ? " x" + amount : "";
        $gameMessage.add("You got " + item.name + suffix + "!");
    }

    function dropMessageText(item, amount) {
        if (!item) return "";
        const suffix = amount > 1 ? " x" + amount : "";
        return "You got " + item.name + suffix + "!";
    }

    function showDropBattleLog(item, amount) {
        const logWindow = BattleManager._logWindow;
        const text = dropMessageText(item, amount);
        if (!logWindow || !text) return false;

        logWindow.push("addText", text);
        for (let i = 0; i < BATTLE_LOG_WAIT_COUNT; i++) {
            logWindow.push("wait");
        }
        return true;
    }

    function noDropResult(chapter, dropChance) {
        return {
            dropped: false,
            chapter,
            dropChance,
            itemId: 0,
            itemName: "",
            amount: 0
        };
    }

    function roll(chapter, options = {}) {
        chapter = Math.max(0, Math.min(4, Math.floor(toNumber(chapter, 0))));

        const pool = POOLS[chapter] || POOLS[0];
        const override = toNumber(options.dropChanceOverride, -1);
        const dropChance = override >= 0 ? Math.max(0, Math.min(100, override)) : pool.dropChance;

        if (Math.random() * 100 >= dropChance) {
            const result = noDropResult(chapter, dropChance);
            setResult(result, options);
            return result;
        }

        const entry = weightedPick(pool.entries);
        if (!entry) {
            const result = noDropResult(chapter, dropChance);
            setResult(result, options);
            return result;
        }

        const item = $dataItems[entry.id];
        const amount = Math.max(1, Math.floor(toNumber(entry.amount, 1)));

        $gameParty.gainItem(item, amount);

        const result = {
            dropped: true,
            chapter,
            dropChance,
            itemId: item.id,
            itemName: item.name,
            amount
        };
        setResult(result, options);

        if (options.showMessage) {
            showDropMessage(item, amount);
        }

        return result;
    }

    function rollToBattleLog(chapter, options = {}) {
        const result = roll(chapter, {
            showMessage: false,
            dropChanceOverride: options.dropChanceOverride,
            itemVariableId: options.itemVariableId,
            droppedSwitchId: options.droppedSwitchId
        });

        if (result.dropped) {
            showDropBattleLog($dataItems[result.itemId], result.amount);
        }

        return result;
    }

    function parseDropComment(text) {
        const comment = String(text || "");
        const bracketMatch = comment.match(/<\s*MementosDrop\s*:\s*(\d+)(?:\s*,\s*(-?\d+))?\s*>/i);
        if (bracketMatch) {
            return {
                chapter: toNumber(bracketMatch[1], 0),
                dropChanceOverride: bracketMatch[2] != null ? toNumber(bracketMatch[2], -1) : -1
            };
        }

        const plainMatch = comment.match(/\bMEMENTOS_DROP\s+(\d+)(?:\s+(-?\d+))?/i);
        if (plainMatch) {
            return {
                chapter: toNumber(plainMatch[1], 0),
                dropChanceOverride: plainMatch[2] != null ? toNumber(plainMatch[2], -1) : -1
            };
        }

        return null;
    }

    function setPendingBattleDrop(config) {
        if (!$gameTemp || !config) return;
        $gameTemp.reveriePendingMementosBattleDrop = {
            chapter: Math.max(0, Math.min(4, Math.floor(toNumber(config.chapter, 0)))),
            dropChanceOverride: toNumber(config.dropChanceOverride, -1)
        };
    }

    function takePendingBattleDrop() {
        if (!$gameTemp) return null;
        const config = $gameTemp.reveriePendingMementosBattleDrop || null;
        $gameTemp.reveriePendingMementosBattleDrop = null;
        return config;
    }

    globalThis.ReverieMementosDropGacha = {
        roll,
        rollToBattleLog,
        pool(chapter) {
            return POOLS[Math.max(0, Math.min(4, Math.floor(toNumber(chapter, 0))))];
        },
        lastResult() {
            return $gameTemp ? $gameTemp.reverieLastMementosDrop : null;
        },
        setPendingBattleDrop
    };

    const _Game_Interpreter_command108 = Game_Interpreter.prototype.command108;
    Game_Interpreter.prototype.command108 = function(params) {
        const lines = [params[0] || ""];
        let index = this._index + 1;
        while (this._list[index] && this._list[index].code === 408) {
            lines.push(this._list[index].parameters[0] || "");
            index++;
        }

        const config = parseDropComment(lines.join("\n"));
        if (config) {
            setPendingBattleDrop(config);
        }

        return _Game_Interpreter_command108.call(this, params);
    };

    const _BattleManager_setup_ReverieMementosDrop = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        _BattleManager_setup_ReverieMementosDrop.call(this, troopId, canEscape, canLose);
        this._reverieMementosBattleDrop = takePendingBattleDrop();
    };

    const _BattleManager_displayDropItems_ReverieMementosDrop = BattleManager.displayDropItems;
    BattleManager.displayDropItems = function() {
        _BattleManager_displayDropItems_ReverieMementosDrop.call(this);

        const config = this._reverieMementosBattleDrop;
        if (!config) return;

        this._reverieMementosBattleDrop = null;
        rollToBattleLog(config.chapter, {
            dropChanceOverride: config.dropChanceOverride
        });
    };

    const _BattleManager_endBattle_ReverieMementosDrop = BattleManager.endBattle;
    BattleManager.endBattle = function(result) {
        this._reverieMementosBattleDrop = null;
        _BattleManager_endBattle_ReverieMementosDrop.call(this, result);
    };

    PluginManager.registerCommand(pluginName, "RollDrop", args => {
        roll(args.chapter, {
            showMessage: toBoolean(args.showMessage, true),
            dropChanceOverride: toNumber(args.dropChanceOverride, -1),
            itemVariableId: toNumber(args.itemVariableId, 0),
            droppedSwitchId: toNumber(args.droppedSwitchId, 0)
        });
    });
})();
