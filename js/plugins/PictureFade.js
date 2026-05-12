/*:
 * @target MZ
 * @plugindesc Reverie - show a picture with automatic fade in, stay, and fade out.
 * @author Codex
 *
 * @command play
 * @text Play Picture Fade
 * @desc Shows one picture, fades it in, keeps it on screen, fades it out, then erases it.
 *
 * @arg image
 * @type file
 * @dir img/pictures/
 * @text Image
 * @desc Picture file from img/pictures.
 * @default
 *
 * @arg fadeInDuration
 * @type number
 * @min 0
 * @text Durasi Fade In
 * @desc Fade in duration in frames. 60 frames = 1 second. Use 0 for instant.
 * @default 30
 *
 * @arg stayDuration
 * @type number
 * @min 0
 * @text Durasi Stay
 * @desc How long the picture stays at full opacity, in frames.
 * @default 60
 *
 * @arg fadeOutDuration
 * @type number
 * @min 0
 * @text Durasi Fade Out
 * @desc Fade out duration in frames. Use 0 to erase instantly after stay.
 * @default 30
 *
 * @arg wait
 * @type boolean
 * @on Ya
 * @off Tidak
 * @text Tunggu Selesai
 * @desc If ON, the event waits until fade in, stay, and fade out are complete.
 * @default false
 *
 * @help PictureFade.js
 *
 * Plugin command:
 *   PictureFade > Play Picture Fade
 *
 * Command ini otomatis:
 *   1. Menampilkan image dari img/pictures di tengah layar dengan opacity 0.
 *   2. Fade in sampai opacity 255.
 *   3. Stay sesuai durasi.
 *   4. Fade out sampai opacity 0.
 *   5. Erase Picture otomatis.
 *
 * Picture ID tidak perlu diisi. Plugin akan memakai slot picture kosong
 * tertinggi agar gambar muncul di atas picture lain dan tidak menimpa picture
 * yang sedang dipakai.
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "PictureFade";
    const PICTURE_ORIGIN_CENTER = 1;
    const FULL_OPACITY = 255;
    const TRANSPARENT = 0;
    const NORMAL_BLEND = 0;
    const DEFAULT_SCALE = 100;
    const LINEAR_EASING = 0;

    const numberArg = (value, fallback) => {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    };

    const durationArg = (value, fallback) => {
        return Math.max(0, Math.floor(numberArg(value, fallback)));
    };

    const booleanArg = value => String(value).toLowerCase() === "true";

    const normalizePictureName = value => {
        return String(value || "")
            .trim()
            .replace(/\\/g, "/")
            .replace(/^img\/pictures\//i, "")
            .replace(/^pictures\//i, "")
            .replace(/\.(png|jpg|jpeg|webp)$/i, "");
    };

    const screenCenterX = () => Graphics.width / 2;
    const screenCenterY = () => Graphics.height / 2;

    const movePictureOpacity = (picture, opacity, duration) => {
        picture.move(
            picture.origin(),
            picture.x(),
            picture.y(),
            picture.scaleX(),
            picture.scaleY(),
            opacity,
            picture.blendMode(),
            duration,
            LINEAR_EASING
        );
    };

    const ensureSequences = screen => {
        if (!Array.isArray(screen._pictureFadeSequences)) {
            screen._pictureFadeSequences = [];
        }
        return screen._pictureFadeSequences;
    };

    const findFreePictureId = screen => {
        for (let id = screen.maxPictures(); id >= 1; id--) {
            if (!screen.picture(id)) {
                return id;
            }
        }
        return 0;
    };

    const startFadeOut = (screen, sequence) => {
        const picture = screen.picture(sequence.pictureId);
        if (!picture) {
            sequence.done = true;
            return;
        }

        if (sequence.fadeOutDuration <= 0) {
            screen.erasePicture(sequence.pictureId);
            sequence.done = true;
            return;
        }

        movePictureOpacity(picture, TRANSPARENT, sequence.fadeOutDuration);
        sequence.phase = "fadeOut";
        sequence.timer = sequence.fadeOutDuration;
    };

    const updateSequence = (screen, sequence) => {
        if (sequence.done) {
            return;
        }
        if (!screen.picture(sequence.pictureId)) {
            sequence.done = true;
            return;
        }

        sequence.timer--;

        if (sequence.timer > 0) {
            return;
        }

        if (sequence.phase === "fadeIn") {
            if (sequence.stayDuration > 0) {
                sequence.phase = "stay";
                sequence.timer = sequence.stayDuration;
            } else {
                startFadeOut(screen, sequence);
            }
        } else if (sequence.phase === "stay") {
            startFadeOut(screen, sequence);
        } else if (sequence.phase === "fadeOut") {
            screen.erasePicture(sequence.pictureId);
            sequence.done = true;
        }
    };

    const _Game_Screen_clearPictures = Game_Screen.prototype.clearPictures;
    Game_Screen.prototype.clearPictures = function() {
        _Game_Screen_clearPictures.call(this);
        this._pictureFadeSequences = [];
    };

    const _Game_Screen_update = Game_Screen.prototype.update;
    Game_Screen.prototype.update = function() {
        _Game_Screen_update.call(this);
        const sequences = ensureSequences(this);
        for (const sequence of sequences) {
            updateSequence(this, sequence);
        }
        this._pictureFadeSequences = sequences.filter(sequence => !sequence.done);
    };

    PluginManager.registerCommand(PLUGIN_NAME, "play", function(args) {
        const imageName = normalizePictureName(args.image);
        const fadeInDuration = durationArg(args.fadeInDuration, 30);
        const stayDuration = durationArg(args.stayDuration, 60);
        const fadeOutDuration = durationArg(args.fadeOutDuration, 30);
        const pictureId = findFreePictureId($gameScreen);

        if (!imageName) {
            console.warn(`${PLUGIN_NAME}: image is empty.`);
            return;
        }

        if (pictureId <= 0) {
            console.warn(`${PLUGIN_NAME}: no free picture slot is available.`);
            return;
        }

        $gameScreen.showPicture(
            pictureId,
            imageName,
            PICTURE_ORIGIN_CENTER,
            screenCenterX(),
            screenCenterY(),
            DEFAULT_SCALE,
            DEFAULT_SCALE,
            fadeInDuration > 0 ? TRANSPARENT : FULL_OPACITY,
            NORMAL_BLEND
        );

        const sequence = {
            pictureId,
            phase: fadeInDuration > 0 ? "fadeIn" : "stay",
            timer: fadeInDuration > 0 ? fadeInDuration : stayDuration,
            stayDuration,
            fadeOutDuration,
            done: false
        };

        if (fadeInDuration > 0) {
            movePictureOpacity($gameScreen.picture(pictureId), FULL_OPACITY, fadeInDuration);
        } else if (stayDuration <= 0) {
            startFadeOut($gameScreen, sequence);
        }

        ensureSequences($gameScreen).push(sequence);

        if (booleanArg(args.wait)) {
            this.wait(fadeInDuration + stayDuration + fadeOutDuration);
        }
    });
})();
