/*:
 * @target MZ
 * @plugindesc [Reverie] Enemy State HUD - State-based nameplate customizer for VisuStella's Battle Core.
 * @author Custom
 * @help Place this BELOW VisuMZ_1_BattleCore in your plugin list.
 * * This plugin forces VisuStella's nameplates to recognize color codes (\C)
 * and icons (\I), while automatically changing enemy names based on 
 * States 3 (Heroic), 4 (Frantic), and 5 (Hopeless).
 */

(() => {
    const FONT_MAP = {
        NEUTRAL:  'NeutralFont',
        HEROIC:   'HeroicFont',   
        FRANTIC:  'FranticFont',  
        HOPELESS: 'HopelessFont'  
    };

    // --- 1. FONT PRELOADER (Ensures fonts are ready before the first draw) ---
    Object.values(FONT_MAP).forEach(f => {
        if (f !== 'rmmz-mainfont') {
            const link = document.createElement('span');
            link.style.fontFamily = f;
            link.innerHTML = '.';
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
        }
    });

    // --- 2. THE DATA HIJACK ---
    const _Game_Enemy_name = Game_Enemy.prototype.name;
    Game_Enemy.prototype.name = function() {
        const base = _Game_Enemy_name.call(this);
        if (this.isStateAffected(4)) return `${base.toUpperCase().split('').join(' ')}`;
        if (this.isStateAffected(5)) return `..${base.toLowerCase()}..`;
        if (this.isStateAffected(3)) return `THE ${base.toUpperCase()}`;
        return base;
    };

    // --- 3. THE POP KILLER (Resets the sprite data instantly on setup) ---
    const _Sprite_EnemyName_setup = Sprite_EnemyName.prototype.setup;
    Sprite_EnemyName.prototype.setup = function(battler) {
        _Sprite_EnemyName_setup.call(this, battler);
        this._name = ""; // Wipes the internal name cache
        if (this.bitmap) this.bitmap.clear(); // Wipes the visual cache
    };

    // --- 4. THE RENDERER OVERHAUL ---
    const _Sprite_EnemyName_updateBitmap = Sprite_EnemyName.prototype.updateBitmap;
    Sprite_EnemyName.prototype.updateBitmap = function() {
        if (!this._battler) return;

        if ($gameParty.inBattle() && (BattleManager._phase === 'init' || BattleManager._phase === 'start')) {
            if (this.bitmap) this.bitmap.clear();
            return;
        }
        
        const name = this._battler.name();
        const currentState = this._battler.isStateAffected(4) ? 4 : 
                             this._battler.isStateAffected(5) ? 5 : 
                             this._battler.isStateAffected(3) ? 3 : 0;

        // Only redraw if the string OR the emotional state changes
        if (this._name !== name || this._lastState !== currentState) {
            this._name = name;
            this._lastState = currentState;
            
            if (!this.bitmap || this.bitmap.width < 800) {
                this.bitmap = new Bitmap(800, 100);
            }
            this.bitmap.clear();

            let font = FONT_MAP.NEUTRAL;
            let color = '#FFFFFF';

            if (currentState === 4) { 
                font = FONT_MAP.FRANTIC;
                color = '#FF0000'; 
            } else if (currentState === 5) { 
                font = FONT_MAP.HOPELESS;
                color = '#999999';
            } else if (currentState === 3) { 
                font = FONT_MAP.HEROIC;
                color = '#FFD700';
            }

            // Set font parameters BEFORE drawing the text
            this.bitmap.fontFace = font;
            this.bitmap.fontSize = 24;
            this.bitmap.textColor = color;
            this.bitmap.outlineColor = 'black';
            this.bitmap.outlineWidth = 6;

            this.bitmap.drawText(name, 0, 0, 800, 100, 'center');
        }
    };
})();