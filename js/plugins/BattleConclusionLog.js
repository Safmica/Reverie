/*:
 * @target MZ
 * @plugindesc Reverie - routes battle conclusion messages through the battle log.
 * @author Aristel
 *
 * @help BattleConclusionLog.js
 *
 * Shows battle conclusion and reward text in the battle log
 * instead of the normal message window.
 *
 * Place this plugin after EscapeBehaviour.
 */

(() => {
    "use strict";

    const CONCLUSION_WAIT_COUNT = 5;
    const CONCLUSION_FOLLOWUP_WAIT_COUNT = 4;

    const cleanText = function(text) {
        return String(text || "")
            .replace(/\\I\[\d+\]/g, "")
            .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
            .trim();
    };

    const cleanBattlerName = function(battler) {
        return battler && battler.name ? cleanText(battler.name()) : "";
    };

    const currentEscapeActorName = function() {
        const cachedName = cleanText(BattleManager._reverieConclusionEscapeActorName);
        if (cachedName) return cachedName;

        const subjectName = cleanBattlerName(BattleManager._subject);
        if (subjectName) return subjectName;

        const actor = BattleManager.actor && BattleManager.actor();
        const actorName = cleanBattlerName(actor);
        if (actorName) return actorName;

        const leaderName = $gameParty && $gameParty.leader ? cleanBattlerName($gameParty.leader()) : "";
        return leaderName || cleanText($gameParty ? $gameParty.name() : "");
    };

    const stunnedEnemyMessage = function() {
        const members = $gameTroop && $gameTroop.members ? $gameTroop.members() : [];
        if (members.length === 1) {
            return "The Elementa is stunned!";
        }
        return "The Elementas are stunned!";
    };

    const addConclusionLog = function(text, waitCount = CONCLUSION_WAIT_COUNT) {
        const logWindow = BattleManager._logWindow;
        if (!logWindow) return false;

        logWindow.push("addText", cleanText(text));
        for (let i = 0; i < waitCount; i++) {
            logWindow.push("wait");
        }
        return true;
    };

    const _BattleManager_setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        _BattleManager_setup.call(this, troopId, canEscape, canLose);
        this._reverieConclusionEscapeActorName = "";
    };

    const _BattleManager_processEscape = BattleManager.processEscape;
    BattleManager.processEscape = function(actor) {
        const escapeActor = actor || this._subject || (this.actor && this.actor()) || ($gameParty && $gameParty.leader());
        this._reverieConclusionEscapeActorName = cleanBattlerName(escapeActor);
        return _BattleManager_processEscape.call(this, actor);
    };

    BattleManager.displayVictoryMessage = function() {
        addConclusionLog(stunnedEnemyMessage());
        addConclusionLog("Now is the perfect time to run!", CONCLUSION_FOLLOWUP_WAIT_COUNT);
    };

    BattleManager.displayDefeatMessage = function() {
        addConclusionLog(TextManager.defeat.format($gameParty.name()));
    };

    BattleManager.displayEscapeSuccessMessage = function() {
        //
    };

    BattleManager.displayEscapeFailureMessage = function() {
        addConclusionLog(TextManager.escapeStart.format($gameParty.name()));
        addConclusionLog(TextManager.escapeFailure);
    };

    BattleManager.displayExp = function() {
        const exp = this._rewards.exp;
        if (exp > 0) {
            addConclusionLog(TextManager.obtainExp.format(exp, TextManager.exp));
        }
    };

    BattleManager.displayGold = function() {
        const gold = this._rewards.gold;
        if (gold > 0) {
            addConclusionLog(TextManager.obtainGold.format(gold));
        }
    };

    BattleManager.displayDropItems = function() {
        for (const item of this._rewards.items) {
            addConclusionLog(TextManager.obtainItem.format(item.name));
        }
    };

    BattleManager.reverieEndEscapeAfterConclusionLog = function() {
        $gameParty.removeBattleStates();
        this.replayBgmAndBgs();
        this.endBattle(1);
    };

    BattleManager.reverieQueueEscapeConclusion = function() {
        this._escaped = true;
        if (this._logWindow) {
            this._logWindow.push("performReverieEscapeConclusionEnd");
        } else {
            this.reverieEndEscapeAfterConclusionLog();
        }
    };

    BattleManager.onEscapeSuccess = function() {
        this.reverieQueueEscapeConclusion();
    };

    BattleManager.finishReverieEscapeSuccess = function() {
        this.reverieQueueEscapeConclusion();
    };

    Window_BattleLog.prototype.performReverieEscapeConclusionEnd = function() {
        BattleManager.reverieEndEscapeAfterConclusionLog();
    };
})();
