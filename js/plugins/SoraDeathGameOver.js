/*:
 * @target MZ
 * @plugindesc Ends the game when Sora dies, even if other party members are alive.
 * @author Aristel
 *
 * @help SoraDeathGameOver.js
 *
 * Sora is actor ID 1. If Sora is in the party and dies, the battle is treated
 * as a defeat and goes to the normal game over scene.
 */

(() => {
    "use strict";

    const SORA_ACTOR_ID = 1;

    const isSoraDeadInParty = () => {
        if (!$gameActors || !$gameParty) return false;

        const sora = $gameActors.actor(SORA_ACTOR_ID);
        if (!sora || !sora.isDead()) return false;

        const partyMembers = $gameParty.members ? $gameParty.members() : [];
        return partyMembers.includes(sora);
    };

    const forceGameOverDefeat = function() {
        const canLose = this._canLose;
        this._canLose = false;
        this.processDefeat();
        this._canLose = canLose;
    };

    const _BattleManager_setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        _BattleManager_setup.call(this, troopId, canEscape, canLose);
        this._soraDeathGameOverStarted = false;
    };

    const _BattleManager_checkBattleEnd = BattleManager.checkBattleEnd;
    BattleManager.checkBattleEnd = function() {
        if (isSoraDeadInParty()) {
            if (!this._soraDeathGameOverStarted) {
                this._soraDeathGameOverStarted = true;
                forceGameOverDefeat.call(this);
            }
            return true;
        }
        return _BattleManager_checkBattleEnd.call(this);
    };

    const _Game_Party_isAllDead = Game_Party.prototype.isAllDead;
    Game_Party.prototype.isAllDead = function() {
        return _Game_Party_isAllDead.call(this) || isSoraDeadInParty();
    };
})();
