/*:
 * @target MZ
 * @plugindesc Reverie - Gin-only swimming interaction for regions 247/248/249.
 * @author Safmica
 *
 * @param ginActorId
 * @text Gin Actor ID
 * @type actor
 * @default 6
 *
 * @param swimRegionId
 * @text Swimmable Water Region
 * @type number
 * @default 247
 *
 * @param shoreRegionId
 * @text Shore Region
 * @type number
 * @default 248
 *
 * @param deepRegionId
 * @text Deep Water Region
 * @type number
 * @default 249
 *
 * @param swimCharacterName
 * @text Gin Swim Character
 * @type file
 * @dir img/characters
 * @default $Gin_Skill
 *
 * @param swimCharacterIndex
 * @text Gin Swim Character Index
 * @type number
 * @default 0
 *
 * @param normalCharacterName
 * @text Gin Normal Character
 * @type file
 * @dir img/characters
 * @default ActorReverie
 *
 * @param normalCharacterIndex
 * @text Gin Normal Character Index
 * @type number
 * @default 3
 *
 * @param fadeFrames
 * @text Fade Duration
 * @type number
 * @default 24
 *
 * @param notGinMessage
 * @text Not Gin Message
 * @type string
 * @default It seems like only Gin can do this
 *
 * @param deepWaterMessage
 * @text Deep Water Message
 * @type string
 * @default The water is too deep and the flow is too strong for swimming
 *
 * @help GinSkill.js
 *
 * Region setup:
 *   247 = swimmable water
 *   248 = shore/edge where Gin can enter and exit
 *   249 = deep water that blocks swimming
 *
 * Press OK/Enter/gamepad confirm while the player stands on region 248 and
 * faces region 247. If the party leader is Gin, the screen fades to black,
 * the party is reduced to Gin, Gin's character sprite changes, and the player
 * is placed one tile forward onto the water.
 *
 * While swimming, region 247 ignores tile passability for the player. Moving
 * toward region 249 is blocked with a warning. Moving toward region 248 fades
 * the screen, restores the original party, restores Gin's normal sprite, and
 * places the player on the shore tile.
 *
 * No plugin commands are required.
 */

(() => {
    "use strict";

    const pluginName = "GinSkill";
    const params = PluginManager.parameters(pluginName);

    const numberParam = function(name, defaultValue) {
        const value = Number(params[name]);
        return Number.isFinite(value) ? value : defaultValue;
    };

    const stringParam = function(name, defaultValue) {
        const value = params[name];
        return value !== undefined && value !== "" ? String(value) : defaultValue;
    };

    const CONFIG = {
        ginActorId: numberParam("ginActorId", 6),
        swimRegionId: numberParam("swimRegionId", 247),
        shoreRegionId: numberParam("shoreRegionId", 248),
        deepRegionId: numberParam("deepRegionId", 249),
        swimCharacterName: stringParam("swimCharacterName", "$Gin_Skill"),
        swimCharacterIndex: numberParam("swimCharacterIndex", 0),
        normalCharacterName: stringParam("normalCharacterName", "ActorReverie"),
        normalCharacterIndex: numberParam("normalCharacterIndex", 3),
        fadeFrames: Math.max(1, numberParam("fadeFrames", 24)),
        notGinMessage: stringParam(
            "notGinMessage",
            "It seems like only Gin can do this"
        ),
        deepWaterMessage: stringParam(
            "deepWaterMessage",
            "The water is too deep and the flow is too strong for swimming"
        )
    };

    const GinSkill = {
        _transition: null,

        makeState() {
            return {
                active: false,
                partyActorIds: [],
                ginCharacterName: CONFIG.normalCharacterName,
                ginCharacterIndex: CONFIG.normalCharacterIndex
            };
        },

        state() {
            if (!$gameSystem._ginSkill) {
                $gameSystem._ginSkill = this.makeState();
            }
            return $gameSystem._ginSkill;
        },

        isSwimming() {
            return !!this.state().active;
        },

        isTransitioning() {
            return !!this._transition;
        },

        leaderIsGin() {
            const leader = $gameParty.leader();
            return leader && leader.actorId() === CONFIG.ginActorId;
        },

        regionAt(x, y) {
            return $gameMap.isValid(x, y) ? $gameMap.regionId(x, y) : 0;
        },

        playerRegion() {
            return this.regionAt($gamePlayer.x, $gamePlayer.y);
        },

        frontPosition(direction) {
            const d = direction || $gamePlayer.direction();
            return {
                x: $gameMap.roundXWithDirection($gamePlayer.x, d),
                y: $gameMap.roundYWithDirection($gamePlayer.y, d),
                direction: d
            };
        },

        showMessage(text) {
            if (text && !$gameMessage.isBusy()) {
                $gameMessage.add(text);
            }
        },

        tryStartFromAction() {
            if (this.isTransitioning() || this.isSwimming()) {
                return false;
            }
            if (this.playerRegion() !== CONFIG.shoreRegionId) {
                return false;
            }

            const front = this.frontPosition();
            if (this.regionAt(front.x, front.y) !== CONFIG.swimRegionId) {
                return false;
            }

            if (!this.leaderIsGin()) {
                this.showMessage(CONFIG.notGinMessage);
                return true;
            }

            this.startTransition("enter", front.x, front.y, front.direction);
            return true;
        },

        onBeforeMoveStraight(player, direction) {
            if (!this.isSwimming() || this.isTransitioning()) {
                return null;
            }

            const front = this.frontPosition(direction);
            const regionId = this.regionAt(front.x, front.y);
            if (regionId === CONFIG.deepRegionId) {
                player.setDirection(direction);
                player.setMovementSuccess(false);
                this.showMessage(CONFIG.deepWaterMessage);
                return "blocked";
            }

            if (regionId === CONFIG.shoreRegionId) {
                player.setDirection(direction);
                player.setMovementSuccess(false);
                this.startTransition("exit", front.x, front.y, direction);
                return "transition";
            }

            return null;
        },

        playerMapPassability(x, y, direction) {
            const x2 = $gameMap.roundXWithDirection(x, direction);
            const y2 = $gameMap.roundYWithDirection(y, direction);
            if (!$gameMap.isValid(x2, y2)) {
                return false;
            }

            const targetRegionId = this.regionAt(x2, y2);
            if (this.isSwimming()) {
                if (targetRegionId === CONFIG.deepRegionId) {
                    return false;
                }
                if (
                    targetRegionId === CONFIG.swimRegionId ||
                    targetRegionId === CONFIG.shoreRegionId
                ) {
                    return true;
                }
                return false;
            }

            if (targetRegionId === CONFIG.swimRegionId) {
                return false;
            }

            return null;
        },

        startTransition(type, x, y, direction) {
            if (this.isTransitioning()) {
                return;
            }
            this._transition = {
                type,
                x,
                y,
                direction,
                phase: "fadeOut"
            };
            $gameTemp.clearDestination();
            $gameScreen.startFadeOut(CONFIG.fadeFrames);
        },

        updateTransition() {
            const transition = this._transition;
            if (!transition) {
                return;
            }

            if (transition.phase === "fadeOut") {
                if ($gameScreen.brightness() > 0) {
                    return;
                }

                if (transition.type === "enter") {
                    this.applyEnterTransition(transition);
                } else {
                    this.applyExitTransition(transition);
                }

                transition.phase = "fadeIn";
                $gameScreen.startFadeIn(CONFIG.fadeFrames);
                return;
            }

            if (transition.phase === "fadeIn" && $gameScreen.brightness() >= 255) {
                this._transition = null;
            }
        },

        applyEnterTransition(transition) {
            const state = this.state();
            const gin = $gameActors.actor(CONFIG.ginActorId);

            state.active = true;
            state.partyActorIds = this.currentPartyActorIds();
            if (gin) {
                state.ginCharacterName = gin.characterName() || CONFIG.normalCharacterName;
                state.ginCharacterIndex = gin.characterIndex();
                gin.setCharacterImage(CONFIG.swimCharacterName, CONFIG.swimCharacterIndex);
            }

            this.setPartyActorIds([CONFIG.ginActorId]);
            this.placePlayer(transition.x, transition.y, transition.direction);
            this.refreshSwimmingVisuals();
        },

        applyExitTransition(transition) {
            const state = this.state();
            const actorIds = state.partyActorIds.length > 0 ?
                state.partyActorIds.slice() :
                [CONFIG.ginActorId];
            const gin = $gameActors.actor(CONFIG.ginActorId);

            if (gin) {
                gin.setCharacterImage(
                    state.ginCharacterName || CONFIG.normalCharacterName,
                    Number.isFinite(Number(state.ginCharacterIndex)) ?
                        Number(state.ginCharacterIndex) :
                        CONFIG.normalCharacterIndex
                );
            }

            state.active = false;
            state.partyActorIds = [];
            state.ginCharacterName = CONFIG.normalCharacterName;
            state.ginCharacterIndex = CONFIG.normalCharacterIndex;

            this.setPartyActorIds(actorIds);
            this.placePlayer(transition.x, transition.y, transition.direction);
            $gamePlayer.followers().show();
            this.refreshMapActors();
        },

        currentPartyActorIds() {
            return $gameParty._actors ? $gameParty._actors.slice() : [];
        },

        setPartyActorIds(actorIds) {
            const validActorIds = actorIds
                .map(actorId => Number(actorId))
                .filter(actorId => $gameActors.actor(actorId));
            $gameParty._actors = validActorIds.length > 0 ?
                validActorIds :
                [CONFIG.ginActorId];
            this.refreshMapActors();
        },

        placePlayer(x, y, direction) {
            $gamePlayer.setDirection(direction);
            $gamePlayer.locate(x, y);
            $gamePlayer.setDirection(direction);
            $gamePlayer.followers().synchronize(x, y, direction);
        },

        refreshMapActors() {
            $gamePlayer.refresh();
            $gameMap.requestRefresh();
            $gameTemp.requestBattleRefresh();
        },

        refreshSwimmingVisuals() {
            if (!this.isSwimming()) {
                return;
            }
            $gamePlayer.setImage(CONFIG.swimCharacterName, CONFIG.swimCharacterIndex);
            $gamePlayer.followers().hide();
            this.refreshMapActors();
        },

        syncAfterLoad() {
            if (!this.isSwimming()) {
                return;
            }
            const gin = $gameActors.actor(CONFIG.ginActorId);
            if (gin) {
                gin.setCharacterImage(CONFIG.swimCharacterName, CONFIG.swimCharacterIndex);
            }
            this.setPartyActorIds([CONFIG.ginActorId]);
            $gamePlayer.followers().hide();
            $gamePlayer.setImage(CONFIG.swimCharacterName, CONFIG.swimCharacterIndex);
        }
    };

    window.GinSkill = GinSkill;

    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._ginSkill = GinSkill.makeState();
    };

    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.call(this, contents);
        GinSkill.syncAfterLoad();
    };

    const _Scene_Map_updateMain = Scene_Map.prototype.updateMain;
    Scene_Map.prototype.updateMain = function() {
        _Scene_Map_updateMain.call(this);
        GinSkill.updateTransition();
    };

    const _Scene_Map_isMenuEnabled = Scene_Map.prototype.isMenuEnabled;
    Scene_Map.prototype.isMenuEnabled = function() {
        if (GinSkill.isTransitioning()) {
            return false;
        }
        return _Scene_Map_isMenuEnabled.call(this);
    };

    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if (GinSkill.isTransitioning()) {
            return false;
        }
        return _Game_Player_canMove.call(this);
    };

    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && GinSkill.tryStartFromAction()) {
            return true;
        }
        return _Game_Player_triggerButtonAction.call(this);
    };

    const _Game_Player_isMapPassable = Game_Player.prototype.isMapPassable;
    Game_Player.prototype.isMapPassable = function(x, y, direction) {
        const passability = GinSkill.playerMapPassability(x, y, direction);
        if (passability !== null) {
            return passability;
        }
        return _Game_Player_isMapPassable.call(this, x, y, direction);
    };

    const _Game_Player_moveStraight = Game_Player.prototype.moveStraight;
    Game_Player.prototype.moveStraight = function(direction) {
        if (GinSkill.onBeforeMoveStraight(this, direction)) {
            return;
        }
        _Game_Player_moveStraight.call(this, direction);
    };

    const _Game_Player_refresh = Game_Player.prototype.refresh;
    Game_Player.prototype.refresh = function() {
        _Game_Player_refresh.call(this);
        if (GinSkill.isSwimming()) {
            this.setImage(CONFIG.swimCharacterName, CONFIG.swimCharacterIndex);
            this.followers().hide();
        }
    };
})();
