/*:
 * @target MZ
 * @plugindesc Reverie - disables autosave triggers and autosave slot access.
 * @author Aristel
 *
 * @help DisableAutosave.js
 *
 * Turns autosave into a no-op and treats savefile ID 0 as unavailable.
 * Manual save files are unchanged.
 */

(() => {
    "use strict";

    const AUTOSAVE_ID = 0;

    Game_System.prototype.isAutosaveEnabled = function() {
        return false;
    };

    Scene_Base.prototype.requestAutosave = function() {};
    Scene_Base.prototype.isAutosaveEnabled = function() {
        return false;
    };
    Scene_Base.prototype.executeAutosave = function() {};

    if (typeof Scene_Map !== "undefined") {
        Scene_Map.prototype.shouldAutosave = function() {
            return false;
        };
    }

    if (typeof Scene_Battle !== "undefined") {
        Scene_Battle.prototype.shouldAutosave = function() {
            return false;
        };
    }

    if (typeof Scene_File !== "undefined") {
        Scene_File.prototype.needsAutosave = function() {
            return false;
        };
    }

    const _DataManager_savefileInfo = DataManager.savefileInfo;
    DataManager.savefileInfo = function(savefileId) {
        if (Number(savefileId) === AUTOSAVE_ID) return null;
        return _DataManager_savefileInfo.call(this, savefileId);
    };

    const _DataManager_saveGame = DataManager.saveGame;
    DataManager.saveGame = function(savefileId) {
        if (Number(savefileId) === AUTOSAVE_ID) return Promise.resolve(false);
        return _DataManager_saveGame.call(this, savefileId);
    };

    const _DataManager_loadGame = DataManager.loadGame;
    DataManager.loadGame = function(savefileId) {
        if (Number(savefileId) === AUTOSAVE_ID) {
            return Promise.reject(new Error("Autosave is disabled."));
        }
        return _DataManager_loadGame.call(this, savefileId);
    };

    DataManager.isAnySavefileExists = function() {
        for (let savefileId = 1; savefileId < this.maxSavefiles(); savefileId++) {
            if (this.savefileInfo(savefileId)) return true;
        }
        return false;
    };

    DataManager.latestSavefileId = function() {
        let latestId = 0;
        let latestTimestamp = -Infinity;
        for (let savefileId = 1; savefileId < this.maxSavefiles(); savefileId++) {
            const info = this.savefileInfo(savefileId);
            if (info && info.timestamp > latestTimestamp) {
                latestTimestamp = info.timestamp;
                latestId = savefileId;
            }
        }
        return latestId;
    };

    DataManager.earliestSavefileId = function() {
        let earliestId = 1;
        let earliestTimestamp = Infinity;
        for (let savefileId = 1; savefileId < this.maxSavefiles(); savefileId++) {
            const info = this.savefileInfo(savefileId);
            if (info && info.timestamp < earliestTimestamp) {
                earliestTimestamp = info.timestamp;
                earliestId = savefileId;
            }
        }
        return earliestId;
    };
})();
