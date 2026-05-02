/*:
 * @target MZ
 * @plugindesc Event Object Movement Animation (12-Frames Loop)
 * @author Safmica
 * 
 * @help ObjectMovementAnimation.js
 * 
 * Plugin ini membaca komentar pada event untuk membuat animasi looping penuh
 * menggunakan seluruh 12 frame dari sebuah character sheet (3 kolom x 4 baris).
 * Arah baca dari kiri ke kanan, dari atas ke bawah.
 * 
 * Cara Penggunaan:
 * Tambahkan komentar pada halaman Event:
 * <Object_Movement: True>
 * atau dengan speed (default 1):
 * <Object_Movement: True, 1>
 * 
 * Untuk mematikan:
 * <Object_Movement: False>
 * 
 * Semakin tinggi angka Speed, semakin cepat animasinya.
 */

(() => {
    const _Game_Event_setupPageSettings = Game_Event.prototype.setupPageSettings;
    Game_Event.prototype.setupPageSettings = function() {
        _Game_Event_setupPageSettings.call(this);
        this.setupObjectMovement();
    };

    Game_Event.prototype.setupObjectMovement = function() {
        this._isObjectMovementActive = false;
        this._objectMovementSpeed = 1;
        this._objectMovementFrame = 0;
        this._objectMovementCount = 0;

        const page = this.page();
        if (page && page.list) {
            for (const command of page.list) {
                // Check if the command is a Comment (108) or Next Comment Line (408)
                if (command.code === 108 || command.code === 408) {
                    const match = command.parameters[0].match(/<Object_Movement:\s*(True|False)(?:,\s*(\d+(?:\.\d+)?))?>/i);
                    if (match) {
                        const isActive = match[1].toLowerCase() === 'true';
                        this._isObjectMovementActive = isActive;
                        if (match[2]) {
                            this._objectMovementSpeed = Number(match[2]);
                        }
                    }
                }
            }
        }
    };

    const _Game_Event_updateAnimation = Game_Event.prototype.updateAnimation;
    Game_Event.prototype.updateAnimation = function() {
        if (this._isObjectMovementActive) {
            this.updateObjectMovementAnimation();
        } else {
            _Game_Event_updateAnimation.call(this);
        }
    };

    Game_Event.prototype.updateObjectMovementAnimation = function() {
        this._objectMovementCount++;
        // Hitung delay antar frame, default speed 1 menghasilkan delay sekitar 15 frame (seperempat detik pada 60 FPS)
        // Jika speed diubah menjadi 2, delay menjadi 7.5 frame (lebih cepat)
        const delay = Math.max(1, Math.floor(15 / (this._objectMovementSpeed || 1)));

        if (this._objectMovementCount >= delay) {
            this._objectMovementCount = 0;
            this._objectMovementFrame = (this._objectMovementFrame + 1) % 12;

            // Ada 3 kolom dan 4 baris. Baris merepresentasikan direction, kolom pattern.
            const row = Math.floor(this._objectMovementFrame / 3);
            const col = this._objectMovementFrame % 3;

            // Arah di RPG Maker: 2: Bawah(Row 0), 4: Kiri(Row 1), 6: Kanan(Row 2), 8: Atas(Row 3)
            const directions = [2, 4, 6, 8];
            
            this.setDirection(directions[row]);
            this._pattern = col;
        }
    };

    // Override untuk menghindari reset pattern saat sedang animasi custom
    const _Game_Event_pattern = Game_Event.prototype.pattern;
    Game_Event.prototype.pattern = function() {
        if (this._isObjectMovementActive) {
            return this._pattern;
        }
        return _Game_Event_pattern.call(this);
    };

})();