/*:
 * @target MZ
 * @plugindesc Force enemy position to bottom with adjustable offset
 * @author Safmica
 *
 * @param Bottom Offset
 * @type number
 * @min -9999
 * @max 9999
 * @default 40
 * @desc Jarak dari bawah layar (semakin kecil = makin ke bawah)
 *
 */

/*:
 * @target MZ
 * @plugindesc Force enemy to bottom with adjustable offset (supports negative)
 *
 * @param Bottom Offset
 * @type number
 * @min -9999
 * @max 9999
 * @default 40
 */

(() => {
    const pluginName = document.currentScript.src.match(/([^\/]+)\.js$/)[1];
    const params = PluginManager.parameters(pluginName);
    const bottomOffset = Number(params["Bottom Offset"] ?? 40);

    // ========================================================
    // 1. SAFMICA'S OFFSET CODE
    // ========================================================
    const _Sprite_Enemy_updatePosition = Sprite_Enemy.prototype.updatePosition;

    Sprite_Enemy.prototype.updatePosition = function() {
        _Sprite_Enemy_updatePosition.call(this);

        this.anchor.y = 1;
        this.y = Graphics.height - bottomOffset;
    };

    const _Sprite_Enemy_updateStateSprite = Sprite_Enemy.prototype.updateStateSprite;
    
    Sprite_Enemy.prototype.updateStateSprite = function() {
        if (!this.bitmap) {
            if (this._stateIconSprite) {
                let safeHeight = 100; 
                this._stateIconSprite.y = -Math.round((safeHeight + 40) * 0.9);
                
                if (this._stateIconSprite.y < 20 - this.y) {
                    this._stateIconSprite.y = 20 - this.y;
                }
            }
            return; 
        }
        
        // If it's a normal enemy with a normal image, run the default code
        _Sprite_Enemy_updateStateSprite.call(this);
    };
})();