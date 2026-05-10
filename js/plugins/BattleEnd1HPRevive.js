/*:
 * @target MZ
 * @plugindesc Revives defeated non-Sora party members at 1 HP after battle ends.
 * @author Aristel
 *
 * @help BattleEnd1HPRevive.js
 *
 * If a party member other than Sora is dead when battle ends from victory,
 * escape, or abort, they are revived with 1 HP.
 *
 * Sora is actor ID 1 and is intentionally ignored here because
 * SoraDeathGameOver handles Sora's death.
 */

(() => {
    "use strict";

    const SORA_ACTOR_ID = 1;
    const REVIVE_HP = 1;

    const shouldReviveAfterBattle = (result) => {
        return result !== 2;
    };

    const reviveDeadNonSoraBattleMembers = () => {
        if (!$gameParty || !$gameParty.members) return;

        for (const actor of $gameParty.members()) {
            if (!actor || !actor.actorId || actor.actorId() === SORA_ACTOR_ID) continue;
            if (!actor.isDead || !actor.isDead()) continue;

            actor.removeState(actor.deathStateId());
            actor.setHp(Math.max(1, Math.min(REVIVE_HP, actor.mhp)));
        }
    };

    const _BattleManager_endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function(result) {
        _BattleManager_endBattle.call(this, result);
        if (shouldReviveAfterBattle(result)) {
            reviveDeadNonSoraBattleMembers();
        }
    };
})();
