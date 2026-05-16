/*:
 * @target MZ
 * @plugindesc Reverie - Opens tagged keepsakes as picture pages from the Mementos menu.
 * @author Aristel
 *
 * @help MementosPictureViewer.js
 *
 * Enable this below TotallyNotOmoriMainMenuUISkeleton.js.
 *
 * Item note tags:
 *   <MementoPicture: CopingChart>
 *   <MementoPages: 2>
 *
 * This loads:
 *   img/pictures/CopingChart_1.png
 *   img/pictures/CopingChart_2.png
 *
 * For exact page names, use:
 *   <MementoPictures: CopingChartBase, CopingChartAdvanced>
 *
 * OK advances to the next page. OK on the last page closes the viewer.
 * Cancel closes the viewer immediately.
 */

(() => {
    "use strict";

    const API_NAME = "ReverieMementosPictureViewer";
    const DIM_OPACITY = 190;
    const SCREEN_MARGIN = 24;
    const PAGE_SUFFIX_SEPARATOR = "_";

    function readMeta(item, names) {
        if (!item) return "";

        for (const name of names) {
            if (item.meta && item.meta[name] != null) {
                return String(item.meta[name]).trim();
            }
        }

        const note = item.note || "";
        for (const name of names) {
            const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const match = note.match(new RegExp("<" + escaped + "\\s*:\\s*([^>]+)>", "i"));
            if (match) return String(match[1]).trim();
        }

        return "";
    }

    function normalizePictureName(name) {
        return String(name || "")
            .trim()
            .replace(/^img[\\/]pictures[\\/]/i, "")
            .replace(/\.png$/i, "");
    }

    function buildPageNames(item) {
        const explicit = readMeta(item, ["MementoPictures", "MementosPictures"]);
        if (explicit) {
            return explicit
                .split(",")
                .map(normalizePictureName)
                .filter(Boolean);
        }

        const baseName = normalizePictureName(readMeta(item, ["MementoPicture", "MementosPicture"]));
        if (!baseName) return [];

        const pageCountText = readMeta(item, ["MementoPages", "MementosPages"]);
        const pageCount = Math.max(1, Number(pageCountText || 1) || 1);

        if (pageCount === 1) return [baseName];

        const pages = [];
        for (let i = 1; i <= pageCount; i++) {
            pages.push(baseName + PAGE_SUFFIX_SEPARATOR + i);
        }
        return pages;
    }

    const viewer = {
        _scene: null,
        _container: null,
        _dimSprite: null,
        _pictureSprite: null,
        _pages: [],
        _pageIndex: 0,
        _returnWindow: null,

        isPictureItem(item) {
            return buildPageNames(item).length > 0;
        },

        isOpen() {
            return !!this._container;
        },

        open(item, scene) {
            const pages = buildPageNames(item);
            if (!scene || pages.length === 0) return false;

            this.close(false);

            this._scene = scene;
            this._pages = pages;
            this._pageIndex = 0;
            this._returnWindow = scene._mementosActionWindow || scene._mementosItemWindow || null;

            this.deactivateMementosWindows(scene);
            this.createSprites(scene);
            this.showPage(0);

            if ($gameTemp) $gameTemp.mementosPictureViewerOpen = true;
            SoundManager.playOk();
            return true;
        },

        close(playSound = true) {
            if (this._container && this._scene) {
                this._scene.removeChild(this._container);
            }

            this._container = null;
            this._dimSprite = null;
            this._pictureSprite = null;
            this._pages = [];
            this._pageIndex = 0;

            if ($gameTemp) $gameTemp.mementosPictureViewerOpen = false;

            const returnWindow = this._returnWindow;
            this._returnWindow = null;
            this._scene = null;

            if (returnWindow && returnWindow.visible) {
                returnWindow.activate();
            }

            if (playSound) SoundManager.playCancel();
        },

        createSprites(scene) {
            const container = new Sprite();

            const dim = new Sprite(new Bitmap(Graphics.width, Graphics.height));
            dim.bitmap.fillAll("black");
            dim.opacity = DIM_OPACITY;

            const picture = new Sprite();
            picture.anchor.set(0.5, 0.5);
            picture.x = Math.floor(Graphics.width / 2);
            picture.y = Math.floor(Graphics.height / 2);

            container.addChild(dim);
            container.addChild(picture);
            scene.addChild(container);

            this._container = container;
            this._dimSprite = dim;
            this._pictureSprite = picture;
        },

        showPage(index) {
            if (!this._pictureSprite) return;

            this._pageIndex = index;
            const pictureName = this._pages[index];
            const bitmap = ImageManager.loadPicture(pictureName);
            this._pictureSprite.bitmap = bitmap;
            this._pictureSprite.scale.set(1, 1);

            const applyFit = () => this.fitPicture();
            if (bitmap.isReady()) {
                applyFit();
            } else {
                bitmap.addLoadListener(applyFit);
            }
        },

        fitPicture() {
            const sprite = this._pictureSprite;
            const bitmap = sprite ? sprite.bitmap : null;
            if (!sprite || !bitmap || !bitmap.isReady()) return;

            const maxWidth = Math.max(1, Graphics.width - SCREEN_MARGIN * 2);
            const maxHeight = Math.max(1, Graphics.height - SCREEN_MARGIN * 2);
            const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);

            sprite.scale.set(scale, scale);
            sprite.x = Math.floor(Graphics.width / 2);
            sprite.y = Math.floor(Graphics.height / 2);
        },

        deactivateMementosWindows(scene) {
            const windows = [
                scene._mementosCatWindow,
                scene._mementosItemWindow,
                scene._mementosActionWindow,
                scene._mementosConfirmWindow,
                scene._statusWindow
            ];

            for (const win of windows) {
                if (win && win.deactivate) win.deactivate();
            }

            if ($gameTemp) $gameTemp.mementosUseMode = false;
        },

        update(scene) {
            if (!this.isOpen() || scene !== this._scene) return;

            this.deactivateMementosWindows(scene);

            if (Input.isTriggered("cancel")) {
                this.close(true);
                return;
            }

            if (Input.isTriggered("ok")) {
                if (this._pageIndex < this._pages.length - 1) {
                    SoundManager.playOk();
                    this.showPage(this._pageIndex + 1);
                } else {
                    this.close(true);
                }
            }
        }
    };

    globalThis[API_NAME] = viewer;

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        viewer.update(this);
    };

    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        viewer.close(false);
        _Scene_Map_terminate.call(this);
    };
})();
