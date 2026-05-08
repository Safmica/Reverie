/*:
 * @target MZ
 * @plugindesc Reverie - swap actor character sprites while sprinting.
 * @author Aristel
 *
 * @help ActorSprintSprites.js
 *
 * Uses img/characters/Sprint_Actor.png while the player is actually dashing.
 * This only changes the displayed character sheet; it does not change movement
 * speed or the walk/dash option behavior.
 */

(() => {
    "use strict";

    const WALK_CHARACTER_NAME = "ActorReverie";
    const SPRINT_CHARACTER_NAME = "Sprint_Actor";

    const sprintCharacterNameFor = function(actor, sprinting) {
        if (!actor) return "";
        const name = actor.characterName();
        return sprinting && name === WALK_CHARACTER_NAME ? SPRINT_CHARACTER_NAME : name;
    };

    const shouldUseSprintSprites = function() {
        return $gamePlayer && $gamePlayer.isDashing() && !$gamePlayer.isInVehicle();
    };

    const setCharacterImageIfNeeded = function(character, characterName, characterIndex) {
        if (!character) return;
        if (character.characterName() === characterName && character.characterIndex() === characterIndex) return;
        character.setImage(characterName, characterIndex);
    };

    ImageManager.loadCharacter(SPRINT_CHARACTER_NAME);

    const _Game_Player_refresh = Game_Player.prototype.refresh;
    Game_Player.prototype.refresh = function() {
        _Game_Player_refresh.call(this);
        this.refreshSprintActorSprite();
    };

    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _Game_Player_update.call(this, sceneActive);
        this.refreshSprintActorSprite();
    };

    Game_Player.prototype.refreshSprintActorSprite = function() {
        const actor = $gameParty.leader();
        const characterName = sprintCharacterNameFor(actor, shouldUseSprintSprites());
        const characterIndex = actor ? actor.characterIndex() : 0;
        setCharacterImageIfNeeded(this, characterName, characterIndex);
    };

    const _Game_Follower_refresh = Game_Follower.prototype.refresh;
    Game_Follower.prototype.refresh = function() {
        _Game_Follower_refresh.call(this);
        this.refreshSprintActorSprite();
    };

    const _Game_Follower_update = Game_Follower.prototype.update;
    Game_Follower.prototype.update = function() {
        _Game_Follower_update.call(this);
        this.refreshSprintActorSprite();
    };

    Game_Follower.prototype.refreshSprintActorSprite = function() {
        const actor = this.actor();
        const visible = this.isVisible();
        const characterName = visible ? sprintCharacterNameFor(actor, shouldUseSprintSprites()) : "";
        const characterIndex = visible && actor ? actor.characterIndex() : 0;
        setCharacterImageIfNeeded(this, characterName, characterIndex);
    };
})();
