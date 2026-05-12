/*:
 * @target MZ
 * @plugindesc actor-based escape chance with failed escape turn cancellation.
 * @author Aristel
 *
 * @help EscapeBehaviour.js
 *
 * Makes Escape use an agility-based chance instead of always succeeding.
 *
 * Escape is treated as the current actor's action when used from the actor
 * command window. If it fails, all remaining party actions for the current
 * turn are cancelled, but enemies that have not acted yet still act.
 */

(() => {
    "use strict";

    const BASE_ESCAPE_RATE = 0.3;
    const MIN_ESCAPE_RATE = 0.05;
    const MAX_ESCAPE_RATE = 0.95;
    const AGI_PARAM_ID = 6;
    const ESCAPE_FAILURE_BONUS_RATE = 0.1;
    const ESCAPE_FAILURE_MIN_BONUS = 0.03;
    const ESCAPE_FAILURE_MAX_BONUS = 0.08;
    const ELEMENTOR_SWITCH_ID = 102;
    const ACTOR_STATE_ESCAPE_MODIFIERS = {
        3: 1.1,  // Heroic
        5: 0.9,  // Hopeless
        6: 1.15, // Martyr
        8: 0.85  // Despair
    };
    const ENEMY_STATE_ESCAPE_MODIFIERS = {
        3: 0.9,  // Heroic
        5: 1.1,  // Hopeless
        6: 0.85, // Martyr
        8: 1.15  // Despair
    };

    const cleanName = (battler) => {
        if (!battler || !battler.name) return "Someone";
        return String(battler.name())
            .replace(/\\I\[\d+\]/g, "")
            .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
            .trim() || "Someone";
    };

    const escapeActor = () => {
        const subject = BattleManager._subject;
        if (subject && subject.isActor && subject.isActor()) return subject;

        const inputActor = BattleManager.actor && BattleManager.actor();
        if (inputActor && inputActor.isActor && inputActor.isActor()) return inputActor;

        return $gameParty ? $gameParty.leader() : null;
    };

    const addEscapeLog = (text) => {
        const logWindow = BattleManager._logWindow;
        if (!logWindow) return;
        logWindow.push("addText", text);
        logWindow.push("wait");
        logWindow.push("wait");
        logWindow.push("wait");
        logWindow.push("wait");
    };

    const clearEscapeLog = () => {
        const logWindow = BattleManager._logWindow;
        if (!logWindow) return;
        logWindow.push("clear");
    };

    const escapeAgi = (battler) => {
        if (!battler) return 1;
        const base = battler.paramBase ? battler.paramBase(AGI_PARAM_ID) : battler.agi;
        const plus = battler.paramPlus ? battler.paramPlus(AGI_PARAM_ID) : 0;
        return Math.max(1, base + plus);
    };

    const escapeStateModifier = (battler, modifiers) => {
        if (!battler || !battler.isStateAffected) return 1;
        let rate = 1;
        for (const stateId of Object.keys(modifiers)) {
            if (battler.isStateAffected(Number(stateId))) {
                rate *= modifiers[stateId];
            }
        }
        return rate;
    };

    const troopEscapeAgi = () => {
        const members = $gameTroop ? $gameTroop.aliveMembers() : [];
        if (members.length === 0) return 1;
        const sum = members.reduce((total, enemy) => total + escapeAgi(enemy), 0);
        return Math.max(1, sum / members.length);
    };

    const troopEscapeStateModifier = () => {
        const members = $gameTroop ? $gameTroop.aliveMembers() : [];
        if (members.length === 0) return 1;
        const sum = members.reduce((total, enemy) => {
            return total + escapeStateModifier(enemy, ENEMY_STATE_ESCAPE_MODIFIERS);
        }, 0);
        return sum / members.length;
    };

    const isElementorBattle = () => {
        return !!($gameSwitches && $gameSwitches.value(ELEMENTOR_SWITCH_ID));
    };

    const isElementorUnlockPage = (page) => {
        const list = page && Array.isArray(page.list) ? page.list : [];
        const conditions = page && page.conditions ? page.conditions : {};
        const waitsForEnemyDepleted = !!conditions.enemyValid && Number(conditions.enemyHp) <= 0;
        const hasUnlockScript = list.some(command => {
            const text = command && command.parameters ? String(command.parameters[0] || "") : "";
            return command.code === 355 && text.includes("BattleManager._canEscape = true");
        });
        return waitsForEnemyDepleted && hasUnlockScript;
    };

    const _BattleManager_setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        _BattleManager_setup.call(this, troopId, canEscape, canLose);
        this._reverieEscapeFailureBonus = 0;
        if ($gameTroop) {
            $gameTroop._reverieElementorUnlockTurnKey = "";
        }
    };

    BattleManager.reverieIsElementorBattle = function() {
        return isElementorBattle();
    };

    BattleManager.reverieElementorEscapeUnlocked = function() {
        return isElementorBattle() && !!this._canEscape;
    };

    BattleManager.reverieEscapeRate = function(actor) {
        if (isElementorBattle()) {
            return this.reverieElementorEscapeUnlocked() ? 1 : 0;
        }

        const actorAgi = actor ? escapeAgi(actor) : Math.max(1, $gameParty.agility());
        const enemyAgi = troopEscapeAgi();
        const stateModifier = escapeStateModifier(actor, ACTOR_STATE_ESCAPE_MODIFIERS) * troopEscapeStateModifier();
        const bonus = this._reverieEscapeFailureBonus || 0;
        return (BASE_ESCAPE_RATE * actorAgi / enemyAgi * stateModifier + bonus).clamp(MIN_ESCAPE_RATE, MAX_ESCAPE_RATE);
    };

    BattleManager.reverieEscapePercent = function(actor) {
        return Math.round(this.reverieEscapeRate(actor) * 100);
    };

    BattleManager.reverieEscapeFailureBonus = function(actor) {
        const rate = this.reverieEscapeRate(actor);
        return (rate * ESCAPE_FAILURE_BONUS_RATE).clamp(ESCAPE_FAILURE_MIN_BONUS, ESCAPE_FAILURE_MAX_BONUS);
    };

    BattleManager.reverieCanEscape = function() {
        if (isElementorBattle()) return this.reverieElementorEscapeUnlocked();
        if (this._canEscape !== undefined) return !!this._canEscape;
        return !this.canEscape || this.canEscape();
    };

    const _Game_Troop_meetsConditions = Game_Troop.prototype.meetsConditions;
    Game_Troop.prototype.meetsConditions = function(page) {
        const result = _Game_Troop_meetsConditions.call(this, page);
        if (!result) return false;

        if (isElementorBattle() && isElementorUnlockPage(page)) {
            if (!BattleManager.isTurnEnd()) return false;
        }

        return true;
    };

    const elementorUnlockPageIndexReadyForTurnEnd = (troop) => {
        if (!troop || !isElementorBattle() || !BattleManager.isTurnEnd()) return -1;

        const data = troop.troop && troop.troop();
        const pages = data && Array.isArray(data.pages) ? data.pages : [];
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            if (!troop.meetsConditions(page)) continue;
            if (isElementorUnlockPage(page)) return i;
            if (!troop._eventFlags[i]) return -1;
        }

        return -1;
    };

    const _Game_Troop_setupBattleEvent = Game_Troop.prototype.setupBattleEvent;
    Game_Troop.prototype.setupBattleEvent = function() {
        let elementorUnlockIndex = -1;
        if (!this._interpreter.isRunning()) {
            const index = elementorUnlockPageIndexReadyForTurnEnd(this);
            if (index >= 0) {
                const turnKey = this._turnCount + ":" + index;
                if (this._reverieElementorUnlockTurnKey !== turnKey) {
                    this._reverieElementorUnlockTurnKey = turnKey;
                    elementorUnlockIndex = index;
                    this._eventFlags[index] = false;
                }
            }
        }

        _Game_Troop_setupBattleEvent.call(this);

        if (elementorUnlockIndex >= 0) {
            this._eventFlags[elementorUnlockIndex] = true;
        }
    };

    BattleManager.cancelRemainingPartyEscapeActions = function() {
        if (Array.isArray(this._actionBattlers)) {
            this._actionBattlers = this._actionBattlers.filter(battler => {
                return !(battler && battler.isActor && battler.isActor());
            });
        }

        for (const actor of $gameParty.members()) {
            if (actor) {
                actor.clearActions();
                actor._martyrBlinded = false;
            }
        }
    };

    BattleManager.finishReverieEscapeFailure = function() {
        this.cancelRemainingPartyEscapeActions();
        if (this._subject) {
            this.endBattlerActions(this._subject);
            this._subject = null;
        } else if (!this.isTpb() && this._phase !== "turn") {
            this.startTurn();
            this.cancelRemainingPartyEscapeActions();
        }
    };

    BattleManager.finishReverieEscapeSuccess = function() {
        this._escaped = true;
        this.processAbort();
    };

    BattleManager.processEscape = function(actor) {
        if (!this.reverieCanEscape()) {
            SoundManager.playBuzzer();
            return false;
        }

        const user = actor || escapeActor();
        const userName = cleanName(user || $gameParty);
        const success = Math.random() < this.reverieEscapeRate(user);

        $gameParty.performEscape();
        SoundManager.playEscape();
        clearEscapeLog();
        addEscapeLog(userName + " initiated an escape...");

        if (success) {
            addEscapeLog("The escape succeeded!");
            if (this._logWindow) {
                this._logWindow.push("performReverieEscapeSuccess");
            } else {
                this.finishReverieEscapeSuccess();
            }
        } else {
            $gameParty.onEscapeFailure();
            this._reverieEscapeFailureBonus = (this._reverieEscapeFailureBonus || 0) + this.reverieEscapeFailureBonus(user);
            addEscapeLog("The escape failed!");
            addEscapeLog("Party remaining actions have been cancelled!");
            if (this._logWindow) {
                this._logWindow.push("performReverieEscapeFailure");
            } else {
                this.finishReverieEscapeFailure();
            }
        }

        return success;
    };

    const _BattleManager_processTurn = BattleManager.processTurn;
    BattleManager.processTurn = function() {
        const subject = this._subject;
        const action = subject && subject.currentAction();
        if (action && action.isReverieEscape && action.isReverieEscape()) {
            subject.removeCurrentAction();
            this.processEscape(subject);
            return;
        }
        _BattleManager_processTurn.call(this);
    };

    const _Game_Action_clear = Game_Action.prototype.clear;
    Game_Action.prototype.clear = function() {
        _Game_Action_clear.call(this);
        this._reverieEscape = false;
    };

    Game_Action.prototype.setReverieEscape = function() {
        this.clear();
        this._reverieEscape = true;
    };

    Game_Action.prototype.isReverieEscape = function() {
        return !!this._reverieEscape;
    };

    Window_BattleLog.prototype.performReverieEscapeSuccess = function() {
        BattleManager.finishReverieEscapeSuccess();
    };

    Window_BattleLog.prototype.performReverieEscapeFailure = function() {
        BattleManager.finishReverieEscapeFailure();
    };

    const _Scene_Battle_createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;
    Scene_Battle.prototype.createActorCommandWindow = function() {
        _Scene_Battle_createActorCommandWindow.call(this);
        if (this._actorCommandWindow) {
            this._actorCommandWindow.setHandler("escape", this.commandReverieEscape.bind(this));
        }
    };

    Scene_Battle.prototype.commandReverieEscape = function() {
        const action = BattleManager.inputtingAction();
        if (action) {
            action.setReverieEscape();
            this.selectNextCommand();
        } else {
            BattleManager.processEscape(BattleManager.actor());
            this.changeInputWindow();
        }
    };
})();
