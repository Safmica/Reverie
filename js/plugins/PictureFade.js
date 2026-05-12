/*:
 * @target MZ
 * @plugindesc Reverie - fade in/out pictures by ID and duration.
 * @author Codex
 *
 * @command fadeIn
 * @text Fade In Picture
 * @desc Fades an existing picture to full opacity.
 *
 * @arg pictureId
 * @type number
 * @min 1
 * @max 100
 * @text Picture ID
 * @desc ID of the picture to fade.
 * @default 1
 *
 * @arg duration
 * @type number
 * @min 1
 * @text Durasi (Frames)
 * @desc Fade duration in frames. 60 frames = 1 second.
 * @default 60
 *
 * @arg wait
 * @type boolean
 * @on Ya
 * @off Tidak
 * @text Tunggu Selesai
 * @desc If ON, the event waits until the fade is complete.
 * @default false
 *
 * @command fadeOut
 * @text Fade Out Picture
 * @desc Fades an existing picture to transparent.
 *
 * @arg pictureId
 * @type number
 * @min 1
 * @max 100
 * @text Picture ID
 * @desc ID of the picture to fade.
 * @default 1
 *
 * @arg duration
 * @type number
 * @min 1
 * @text Durasi (Frames)
 * @desc Fade duration in frames. 60 frames = 1 second.
 * @default 60
 *
 * @arg wait
 * @type boolean
 * @on Ya
 * @off Tidak
 * @text Tunggu Selesai
 * @desc If ON, the event waits until the fade is complete.
 * @default false
 *
 * @help PictureFade.js
 *
 * Plugin command:
 *   - Fade In Picture
 *   - Fade Out Picture
 *
 * Input:
 *   - Picture ID
 *   - Durasi (Frames)
 *   - Tunggu Selesai
 *
 * Cara pakai:
 *   1. Jalankan Show Picture lebih dulu.
 *   2. Untuk fade in dari transparan, set Opacity Show Picture ke 0.
 *   3. Jalankan Plugin Command > PictureFade > Fade In Picture.
 *   4. Untuk menghilangkan picture, jalankan Fade Out Picture.
 *
 * Catatan:
 *   Fade Out hanya membuat opacity menjadi 0. Jika ingin benar-benar
 *   menghapus picture, jalankan Erase Picture setelah fade selesai.
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "PictureFade";

    const numberArg = (value, fallback) => {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    };

    const booleanArg = value => String(value).toLowerCase() === "true";

    const fadePicture = (interpreter, args, targetOpacity) => {
        const pictureId = Math.max(1, Math.floor(numberArg(args.pictureId, 1)));
        const duration = Math.max(1, Math.floor(numberArg(args.duration, 60)));
        const picture = $gameScreen.picture(pictureId);

        if (!picture) {
            console.warn(`${PLUGIN_NAME}: picture ID ${pictureId} is not currently shown.`);
            return;
        }

        picture.move(
            picture.origin(),
            picture.x(),
            picture.y(),
            picture.scaleX(),
            picture.scaleY(),
            targetOpacity,
            picture.blendMode(),
            duration,
            0
        );

        if (booleanArg(args.wait) && interpreter) {
            interpreter.wait(duration);
        }
    };

    PluginManager.registerCommand(PLUGIN_NAME, "fadeIn", function(args) {
        fadePicture(this, args, 255);
    });

    PluginManager.registerCommand(PLUGIN_NAME, "fadeOut", function(args) {
        fadePicture(this, args, 0);
    });
})();
