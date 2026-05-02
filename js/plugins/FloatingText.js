/*:
 * @target MZ
 * @plugindesc [v1.0] Menampilkan teks custom di layar seperti gambar overlay.
 * @author GitHub Copilot
 *
 * @help FloatingText.js
 * 
 * Plugin ini digunakan untuk menampilkan teks di tengah layar (atau di posisi
 * manapun) dengan font, ukuran, align, dan warna yang dapat diatur via 
 * Plugin Command.
 * 
 * Pastikan font yang Anda masukkan di "Font Face" sudah didaftarkan/diload
 * di dalam game (misalnya ada di folder fonts dan rmmz_ui.css).
 *
 * @command showText
 * @text Show Floating Text
 * @desc Menampilkan teks di layar.
 *
 * @arg text
 * @type string
 * @text Text
 * @desc Teks yang ingin ditampilkan.
 * @default SELAMAT DATANG DI WHITE SPACE.
 * 
 * @arg fontFace
 * @type string
 * @text Font Face
 * @desc Nama font custom. Kosongkan untuk menggunakan font bawaan game.
 * @default 
 *
 * @arg fontSize
 * @type number
 * @text Font Size
 * @desc Ukuran font.
 * @default 32
 *
 * @arg align
 * @type select
 * @option left
 * @option center
 * @option right
 * @text Alignment
 * @desc Perataan teks (Left, Center, Right).
 * @default center
 * 
 * @arg x
 * @type number
 * @text X Position
 * @desc Posisi horizontal (X). Layar default MZ adalah 816x624, tengahnya 408.
 * @default 408
 *
 * @arg y
 * @type number
 * @text Y Position
 * @desc Posisi vertikal (Y). Layar default MZ adalah 816x624, tengahnya 312.
 * @default 312
 *
 * @arg color
 * @type string
 * @text Color (CSS/Hex)
 * @desc Warna teks. Bisa pakai Hex (contoh: #ffffff) atau nama warna (white).
 * @default #ffffff
 * 
 * @arg outlineColor
 * @type string
 * @text Outline Color
 * @desc Warna outline/garis tepi teks. Format Hex atau RGBA.
 * @default rgba(0, 0, 0, 1)
 *
 * @arg outlineWidth
 * @type number
 * @text Outline Width
 * @desc Ketebalan outline teks. Isi 0 jika tidak ingin ada outline.
 * @default 3
 * 
 * @arg isBold
 * @type boolean
 * @text Bold Font
 * @desc Buat teks menjadi tebal (Bold). Membantu font tipis agar lebih kontras.
 * @default false
 *
 * @arg blendMode
 * @type select
 * @option Normal (Default)
 * @value 0
 * @option Tambah (Add - Sangat Terang)
 * @value 1
 * @option Multiply
 * @value 2
 * @option Screen
 * @value 3
 * @text Blending Mode
 * @desc Tipe pencampuran warna. Pilih 0 (Normal) agar solid, atau 1 (Add) agar bersinar.
 * @default 0
 * 
 * @arg duration
 * @type number
 * @text Duration (Frames)
 * @desc Lama teks muncul dalam frame (60 frame = 1 detik). Isi 0 untuk permanen.
 * @default 120
 * 
 * @arg fade
 * @type number
 * @text Fade speed
 * @desc Kecepatan transisi fade-in/fade-out (dalam frame).
 * @default 30
 *
 * @command clearText
 * @text Clear Floating Text
 * @desc Menghapus teks yang sedang tampil di layar dengan animasi fade-out.
 */

(() => {
    const pluginName = "FloatingText";
    let activeTextData = null;

    // Register Plugin Commands
    PluginManager.registerCommand(pluginName, "showText", args => {
        activeTextData = {
            text: args.text,
            fontFace: args.fontFace || $gameSystem.mainFontFace(),
            fontSize: Number(args.fontSize) || 32,
            align: args.align || "center",
            x: Number(args.x) || 408,
            y: Number(args.y) || 312,
            color: args.color || "#ffffff",
            outlineColor: args.outlineColor || "rgba(0, 0, 0, 1)",
            outlineWidth: args.outlineWidth !== undefined ? Number(args.outlineWidth) : 3,
            fontBold: String(args.isBold) === "true",
            blendMode: Number(args.blendMode || 0),
            duration: Number(args.duration) || 0,
            fadeSpeed: Number(args.fade) || 30,
            opacity: 0,
            timer: 0,
            state: "fadeIn"
        };
    });

    PluginManager.registerCommand(pluginName, "clearText", args => {
        if (activeTextData) {
            activeTextData.state = "fadeOut";
        }
    });

    //-----------------------------------------------------------------------------
    // Sprite_FloatingText
    //
    function Sprite_FloatingText() {
        this.initialize(...arguments);
    }

    Sprite_FloatingText.prototype = Object.create(Sprite.prototype);
    Sprite_FloatingText.prototype.constructor = Sprite_FloatingText;

    Sprite_FloatingText.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.bitmap = new Bitmap(Graphics.width, Graphics.height);
        this._currentTextData = null;
        this.z = 100; // Pastikan teks ada di atas layer peta biasa
    };

    Sprite_FloatingText.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (activeTextData !== this._currentTextData) {
            if (activeTextData && activeTextData.state === "fadeIn") {
                this.setupNewText(activeTextData);
            }
            this._currentTextData = activeTextData;
        }

        if (this._currentTextData) {
            this.updateFade();
        }
    };

    Sprite_FloatingText.prototype.setupNewText = function(data) {
        this.bitmap.clear();
        this.bitmap.fontFace = data.fontFace;
        this.bitmap.fontSize = data.fontSize;
        this.bitmap.fontBold = data.fontBold;
        this.bitmap.textColor = data.color;
        this.bitmap.outlineColor = data.outlineColor;
        this.bitmap.outlineWidth = data.outlineWidth;
        this.blendMode = data.blendMode;
        
        let drawX = 0;
        let maxWidth = Graphics.width;

        // Menghitung alignment dengan benar supaya titik pusatnya sesuai input X
        if (data.align === "center") {
            drawX = data.x - (maxWidth / 2);
        } else if (data.align === "right") {
            drawX = data.x - maxWidth;
        } else {
            drawX = data.x;
        }

        // Draw the text
        this.bitmap.drawText(data.text, drawX, data.y - (data.fontSize / 2), maxWidth, data.fontSize, data.align);
        
        this.opacity = 0;
    };

    Sprite_FloatingText.prototype.updateFade = function() {
        const data = this._currentTextData;
        
        if (data.state === "fadeIn") {
            this.opacity += (255 / data.fadeSpeed);
            if (this.opacity >= 255) {
                this.opacity = 255;
                if (data.duration > 0) {
                    data.state = "wait";
                    data.timer = data.duration;
                }
            }
        } else if (data.state === "wait") {
            data.timer--;
            if (data.timer <= 0) {
                data.state = "fadeOut";
            }
        } else if (data.state === "fadeOut") {
            this.opacity -= (255 / data.fadeSpeed);
            if (this.opacity <= 0) {
                this.opacity = 0;
                activeTextData = null;
                this._currentTextData = null;
                this.bitmap.clear();
            }
        }
    };

    //-----------------------------------------------------------------------------
    // Hook into Scene_Base (Bypass Screen Tint/Fade from Spriteset_Base, sehingga 100% Solid)
    //
    const _Scene_Base_createWindowLayer = Scene_Base.prototype.createWindowLayer;
    Scene_Base.prototype.createWindowLayer = function() {
        this.createFloatingText();
        _Scene_Base_createWindowLayer.call(this);
    };

    Scene_Base.prototype.createFloatingText = function() {
        this._floatingTextSprite = new Sprite_FloatingText();
        this.addChild(this._floatingTextSprite);
    };

})();