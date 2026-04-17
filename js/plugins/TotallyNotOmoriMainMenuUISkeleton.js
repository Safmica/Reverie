/*:
@target MZ
@plugindesc Reverie - Complete Main Menu UI Override (PIXI HIJACK + MEMENTOS BLUEPRINT)
@author Aristel
*/

(() => {
    // =======================================================
    // 1. SETTINGS & CONSTANTS
    // =======================================================
    const DEBUG_MODE = false; 

    const MENU_MARGIN_X = 12; 
    const MENU_MARGIN_Y = 12; 

    const CURSOR_IMAGE_NAME = "FingerCursor";
    const CURSOR_NATIVE_SIZE = 14; 
    const CURSOR_DRAW_SIZE = 24;

    const HMU_MEMENTOS_GROUP = "MementosMenu";
    const HMU_MEMENTOS_LIST_GROUP = "MementosListMenu";
    const HMU_MEMENTOS_ACTION_GROUP = "MementosActionMenu";
    const HMU_MEMENTOS_CONFIRM_GROUP = "MementosConfirmMenu";
    const HMU_MEMENTOS_DESC_GROUP = "MementosDescMenu"; 

    const CURSOR_ANIMATION_DELAY = 30; 

    const SLIDE_Y_OFFSET_CAT     = -68; 
    const SLIDE_Y_OFFSET_LIST    = -68; 
    const SLIDE_Y_OFFSET_ACTION  = -110; 
    const SLIDE_Y_OFFSET_CONFIRM = -110; 
    const SLIDE_Y_OFFSET_DESC    = -108; 

    const MEMENTOS_LIST_VISIBLE_ITEMS = 4;
    const MEMENTOS_LIST_ITEM_PADDING = 0; 
    const MEMENTOS_LIST_ITEM_HEIGHT = 36; 
    const MEMENTOS_LIST_FONT_SIZE = 16; 
    const MEMENTOS_LIST_TEXT_Y_OFFSET = 10; 

    const MEMENTOS_LIST_CURSOR_X_OFFSET = -12;

    const MEMENTOS_LIST_Y_OFFSET = 3; 
    const MEMENTOS_ACTION_Y_OFFSET = -9; 
    const MEMENTOS_CONFIRM_Y_OFFSET =5;

    // =======================================================
    // 1.2. PIXI WEBGL HIJACK ENGINE
    // =======================================================
    const hijackHUDMakerNode = (parent, targetName, isActiveFn, isClosingFn, getClosingDelayFn, offsetAmount, isVisibleFn) => {
        if (!parent || !parent.children) return;
        
        for (let i = 0; i < parent.children.length; i++) {
            const child = parent.children[i];
            
            let isTarget = false;
            if (child.name === targetName) isTarget = true;
            else if (child._component && child._component.name === targetName) isTarget = true;
            else if (child.component && child.component.name === targetName) isTarget = true;
            else if (child._data && (child._data.name === targetName || child._data.Name === targetName)) isTarget = true;
            else if (child.data && (child.data.name === targetName || child.data.Name === targetName)) isTarget = true;
            
            if (isTarget && !child._reverieRenderHijacked) {
                child._reverieRenderHijacked = true;
                
                const originalRender = child.render;
                const originalRenderCanvas = child.renderCanvas;

                const applyReverieSlide = function(target, renderer, originalMethod) {
                    const originalY = target.y; 
                    let shouldRender = true;

                    // Absolute Ban: If menu is fully closed, do not draw anything.
                    if (!$gameTemp || !$gameTemp._customMenuOpen) {
                        shouldRender = false;
                    }
                    // Absolute Ban 2: If the skeleton window itself is formally hidden, block HMU from flashing it
                    else if (isVisibleFn && !isVisibleFn()) {
                        shouldRender = false;
                    }
                    // IN Animation
                    else if ($gameTemp._menuCursorDelay > 0 && isActiveFn && isActiveFn()) {
                        const progress = (CURSOR_ANIMATION_DELAY - $gameTemp._menuCursorDelay) / CURSOR_ANIMATION_DELAY;
                        const easeOut = 1 - Math.pow(1 - progress, 3);
                        
                        if ($gameTemp._menuCursorDelay === CURSOR_ANIMATION_DELAY) {
                            target.y = originalY + offsetAmount;
                        } else {
                            target.y = originalY + (offsetAmount * (1 - easeOut));
                        }
                        target.updateTransform();
                    } 
                    // OUT Animation (Glitch Fixed)
                    else if (isClosingFn && isClosingFn() && getClosingDelayFn) {
                        const delay = getClosingDelayFn();
                        if (delay > 0) {
                            const progress = (CURSOR_ANIMATION_DELAY - delay) / CURSOR_ANIMATION_DELAY;
                            const easeIn = Math.pow(progress, 3);
                            target.y = originalY + (offsetAmount * easeIn);
                            target.updateTransform();
                        } else {
                            target.y = originalY + offsetAmount; 
                            target.updateTransform();
                            shouldRender = false; // Prevent the 1-frame flash at resting position
                        }
                    } 
                    else {
                        target.y = originalY;
                        target.updateTransform();
                    }

                    // Only execute the draw call if we aren't hiding the flash
                    if (shouldRender && originalMethod) originalMethod.call(target, renderer);

                    target.y = originalY;
                    target.updateTransform(); 
                };

                if (originalRender) {
                    child.render = function(renderer) { applyReverieSlide(this, renderer, originalRender); };
                }
                if (originalRenderCanvas) {
                    child.renderCanvas = function(renderer) { applyReverieSlide(this, renderer, originalRenderCanvas); };
                }
            }
            hijackHUDMakerNode(child, targetName, isActiveFn, isClosingFn, getClosingDelayFn, offsetAmount, isVisibleFn);
        }
    };

    // =======================================================
    // 1.5. OVERLAY ENGINE
    // =======================================================
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        if ($gameTemp && ($gameTemp._customMenuOpen || $gameTemp._globalClosingDelay > 0)) {
            Scene_Base.prototype.update.call(this); 
            this.updateHUDMakerBridge(); 

            if (this._mementosCatWindow && (this._mementosCatWindow.visible || this._mementosCatWindow._closingDelay > 0 || $gameTemp._globalClosingDelay > 0)) {
                const isCatClosing = () => this._mementosCatWindow._closingDelay > 0 || $gameTemp._globalClosingDelay > 0;
                const catDelay = () => $gameTemp._globalClosingDelay > 0 ? $gameTemp._globalClosingDelay : this._mementosCatWindow._closingDelay;
                hijackHUDMakerNode(this, HMU_MEMENTOS_GROUP, () => this._mementosCatWindow.active, isCatClosing, catDelay, SLIDE_Y_OFFSET_CAT, () => this._mementosCatWindow.visible);
            }
            if (this._mementosItemWindow && (this._mementosItemWindow.visible || this._mementosItemWindow._closingDelay > 0 || $gameTemp._globalClosingDelay > 0)) {
                const isListClosing = () => this._mementosItemWindow._closingDelay > 0 || $gameTemp._globalClosingDelay > 0;
                const listDelay = () => $gameTemp._globalClosingDelay > 0 ? $gameTemp._globalClosingDelay : this._mementosItemWindow._closingDelay;
                hijackHUDMakerNode(this, HMU_MEMENTOS_LIST_GROUP, () => this._mementosItemWindow.active, isListClosing, listDelay, SLIDE_Y_OFFSET_LIST, () => this._mementosItemWindow.visible);
                hijackHUDMakerNode(this, HMU_MEMENTOS_DESC_GROUP, () => this._mementosItemWindow.active, isListClosing, listDelay, SLIDE_Y_OFFSET_DESC, () => this._mementosItemWindow.visible);
            }
            if (this._mementosActionWindow && (this._mementosActionWindow.visible || this._mementosActionWindow._closingDelay > 0 || $gameTemp._globalClosingDelay > 0)) {
                const isActionActive = () => this._mementosActionWindow.active || $gameTemp.mementosUseMode;
                const isActionClosing = () => this._mementosActionWindow._closingDelay > 0 || $gameTemp._globalClosingDelay > 0;
                const actionDelay = () => $gameTemp._globalClosingDelay > 0 ? $gameTemp._globalClosingDelay : this._mementosActionWindow._closingDelay;
                hijackHUDMakerNode(this, HMU_MEMENTOS_ACTION_GROUP, isActionActive, isActionClosing, actionDelay, SLIDE_Y_OFFSET_ACTION, () => this._mementosActionWindow.visible);
            }
            if (this._mementosConfirmWindow && (this._mementosConfirmWindow.visible || this._mementosConfirmWindow._closingDelay > 0 || $gameTemp._globalClosingDelay > 0)) {
                const isConfirmClosing = () => this._mementosConfirmWindow._closingDelay > 0 || $gameTemp._globalClosingDelay > 0;
                const confirmDelay = () => $gameTemp._globalClosingDelay > 0 ? $gameTemp._globalClosingDelay : this._mementosConfirmWindow._closingDelay;
                hijackHUDMakerNode(this, HMU_MEMENTOS_CONFIRM_GROUP, () => this._mementosConfirmWindow.active, isConfirmClosing, confirmDelay, SLIDE_Y_OFFSET_CONFIRM, () => this._mementosConfirmWindow.visible);
            }

            const allWindows = [
                {win: this._mementosCatWindow, offset: SLIDE_Y_OFFSET_CAT}, 
                {win: this._mementosItemWindow, offset: SLIDE_Y_OFFSET_LIST}, 
                {win: this._mementosActionWindow, offset: SLIDE_Y_OFFSET_ACTION}, 
                {win: this._mementosConfirmWindow, offset: SLIDE_Y_OFFSET_CONFIRM}
            ];

            // IN Animation math
            if ($gameTemp._menuCursorDelay > 0) {
                $gameTemp._menuCursorDelay--;
                
                const progress = (CURSOR_ANIMATION_DELAY - $gameTemp._menuCursorDelay) / CURSOR_ANIMATION_DELAY;
                const easeOut = 1 - Math.pow(1 - progress, 3);

                allWindows.forEach(item => {
                    const win = item.win;
                    if (win && win.active && win.visible) {
                        const currentOffset = item.offset * (1 - easeOut);
                        win.y = win._baseY + currentOffset;
                        if (win.index && win.index() >= 0) win.redrawItem(win.index());
                    }
                });

                if ($gameTemp._menuCursorDelay === 0) {
                    allWindows.forEach(item => {
                        const win = item.win;
                        if (win && win.active && win.visible) {
                            win.y = win._baseY;
                            if (win.index && win.index() >= 0) win.redrawItem(win.index());
                        }
                    });
                }
            } 
            
            // Global OUT Animation (When leaving entire menu)
            if ($gameTemp._globalClosingDelay > 0) {
                $gameTemp._globalClosingDelay--;
                const progress = (CURSOR_ANIMATION_DELAY - $gameTemp._globalClosingDelay) / CURSOR_ANIMATION_DELAY;
                const easeIn = Math.pow(progress, 3);
                
                allWindows.forEach(item => {
                    const win = item.win;
                    if (win && win.visible) {
                        const currentOffset = item.offset * easeIn;
                        win.y = win._baseY + currentOffset;
                    }
                });

                if ($gameTemp._globalClosingDelay === 0) {
                    $gameTemp._customMenuOpen = false; // Finally close it completely

                    if (this._spriteset && this._reverieBlurFilter) {
                        const filters = this._spriteset.filters || [];
                        const filterIndex = filters.indexOf(this._reverieBlurFilter);
                        if (filterIndex > -1) {
                            filters.splice(filterIndex, 1);
                            this._spriteset.filters = filters;
                        }
                    }
                    
                    // Force HUD Maker variables false so it doesn't stick
                    $gameTemp.hudShowMementos = false;
                    $gameTemp.hudShowMementosList = false;
                    $gameTemp.hudShowMementosAction = false;
                    $gameTemp.hudShowMementosConfirm = false;

                    this._commandWindow.hide();
                    this._commandWindow.deactivate();
                    this._statusWindow.hide();
                    this._statusWindow.deactivate();
                    allWindows.forEach(item => {
                        if (item.win) {
                            item.win.hide();
                            item.win.deactivate();
                            item.win.y = item.win._baseY;
                        }
                    });
                }
                return; 
            }

            // Submenu OUT Animation Math
            allWindows.forEach(item => {
                const win = item.win;
                if (win && win._closingDelay > 0) {
                    win._closingDelay--;
                    const progress = (CURSOR_ANIMATION_DELAY - win._closingDelay) / CURSOR_ANIMATION_DELAY;
                    const easeIn = Math.pow(progress, 3);
                    const currentOffset = item.offset * easeIn;

                    win.y = win._baseY + currentOffset;

                    if (win._closingDelay === 0) {
                        win.hide();
                        win.y = win._baseY;
                    }
                }
            });

            return;
        }
        _Scene_Map_update.call(this);
    };

    Scene_Map.prototype.updateCallMenu = function() {
        if (this.isMenuEnabled() && this.isMenuCalled()) {
            this.menuCalling = false;
            this.openCustomOmoriMenu();
        }
    };

    Scene_Map.prototype.calcWindowHeight = function(numLines, selectable) {
        if (selectable) return Window_Selectable.prototype.fittingHeight(numLines);
        return Window_Base.prototype.fittingHeight(numLines);
    };

    // =======================================================
    // 1.8. THE "STUN" LOCK
    // =======================================================
    const _Window_Selectable_processCursorMove = Window_Selectable.prototype.processCursorMove;
    Window_Selectable.prototype.processCursorMove = function() {
        if ($gameTemp && ($gameTemp._menuCursorDelay > 0 || this._closingDelay > 0 || $gameTemp._globalClosingDelay > 0)) return; 
        _Window_Selectable_processCursorMove.call(this);
    };

    const _Window_Selectable_processHandling = Window_Selectable.prototype.processHandling;
    Window_Selectable.prototype.processHandling = function() {
        if ($gameTemp && ($gameTemp._menuCursorDelay > 0 || this._closingDelay > 0 || $gameTemp._globalClosingDelay > 0)) return; 
        _Window_Selectable_processHandling.call(this);
    };

    const _Window_Selectable_processTouch = Window_Selectable.prototype.processTouch;
    Window_Selectable.prototype.processTouch = function() {
        if ($gameTemp && ($gameTemp._menuCursorDelay > 0 || this._closingDelay > 0 || $gameTemp._globalClosingDelay > 0)) return; 
        _Window_Selectable_processTouch.call(this);
    };

    // =======================================================
    // 2. ANNIHILATE UNWANTED UI ELEMENTS
    // =======================================================
    Scene_Map.prototype.createMenuButton = function() {}; 
    Scene_MenuBase.prototype.createCancelButton = function() {}; 
    Scene_MenuBase.prototype.createButtonAssistWindow = function() {};

    const _Scene_Menu_start = Scene_Menu.prototype.start;
    Scene_Menu.prototype.start = function() {
        _Scene_Menu_start.call(this);
        if (this._helpWindow) this._helpWindow.visible = false;
    };

    // =======================================================
    // 3. SKELETON INVISIBILITY & CURSOR INJECTION
    // =======================================================
    const applySkeletonStyle = function(windowClass) {
        const _initialize = windowClass.prototype.initialize;
        windowClass.prototype.initialize = function(rect) {
            _initialize.call(this, rect);
            this._closingDelay = 0; 
            if (DEBUG_MODE) {
                this.opacity = 150; 
                this.frameVisible = true; 
            } else {
                this.opacity = 0; 
                this.frameVisible = false; 
                this.backOpacity = 0; 
            }
        };

        windowClass.prototype.drawItemBackground = function(index) {};

        windowClass.prototype._refreshCursor = function() {
            if (this._cursorSprite) this._cursorSprite.visible = false;
        };

        // COMPLETELY DESTROY ARROWS AND SCROLLBAR FOR ALL WINDOWS
        const _update = windowClass.prototype.update;
        windowClass.prototype.update = function() {
            if (_update) _update.call(this);
            if (this._upArrowSprite) this._upArrowSprite.visible = false;
            if (this._downArrowSprite) this._downArrowSprite.visible = false;
            if (this._leftArrowSprite) this._leftArrowSprite.visible = false;
            if (this._rightArrowSprite) this._rightArrowSprite.visible = false;
            if (this._scrollBaseSprite) this._scrollBaseSprite.visible = false;
        };

        const _activate = windowClass.prototype.activate;
        windowClass.prototype.activate = function() {
            _activate.call(this);
            if (this.index() >= 0) this.redrawItem(this.index());
        };

        const _deactivate = windowClass.prototype.deactivate;
        windowClass.prototype.deactivate = function() {
            _deactivate.call(this);
            if (this.index() >= 0) this.redrawItem(this.index());
        };
    };

    const customDrawItemWithCursor = function(index) {
        const rect = this.itemLineRect(index);
        
        const clearX = rect.x - CURSOR_DRAW_SIZE - 20;
        const clearW = rect.width + CURSOR_DRAW_SIZE + 40;
        this.contents.clearRect(clearX, rect.y, clearW, rect.height);
        
        const name = this.commandName ? this.commandName(index) : (this.item() ? this.item().name : "");
        this.changePaintOpacity(this.isCommandEnabled ? this.isCommandEnabled(index) : true);

        const textWidth = this.textWidth(name);
        const textX = rect.x + CURSOR_DRAW_SIZE + 10; 
        
        if (DEBUG_MODE) this.drawText(name, textX, rect.y, textWidth, 'left');

        if (this.index() === index && this.active) {
            const cursorX = textX - CURSOR_DRAW_SIZE - 5; 
            const cursorY = rect.y + (rect.height - CURSOR_DRAW_SIZE) / 2; 
            const cursorBmp = ImageManager.loadSystem(CURSOR_IMAGE_NAME);
            
            if (cursorBmp.isReady()) {
                this.contents.blt(cursorBmp, 0, 0, CURSOR_NATIVE_SIZE, CURSOR_NATIVE_SIZE, cursorX, cursorY, CURSOR_DRAW_SIZE, CURSOR_DRAW_SIZE);
            } else {
                cursorBmp.addLoadListener(() => this.redrawItem(index));
            }
        }
    };

    const customSelectRefresh = function(index) {
        const lastIndex = this.index();
        Window_Selectable.prototype.select.call(this, index);
        if (this.index() !== lastIndex) {
            if (lastIndex >= 0) this.redrawItem(lastIndex); 
            if (this.index() >= 0) this.redrawItem(this.index()); 
        }
    };

    applySkeletonStyle(Window_MenuCommand);
    applySkeletonStyle(Window_MenuStatus);
    Window_MenuCommand.prototype.drawItem = customDrawItemWithCursor;
    Window_MenuCommand.prototype.select = customSelectRefresh;
    Window_MenuStatus.prototype.select = customSelectRefresh;

    // =======================================================
    // 5. BLUEPRINT ALIGNMENT: MAIN MENUS
    // =======================================================
    Scene_Map.prototype.commandWindowRect = function() {
        const w = Graphics.boxWidth - (MENU_MARGIN_X * 2);
        const h = this.calcWindowHeight(1, true);
        return new Rectangle(MENU_MARGIN_X, MENU_MARGIN_Y, w, h);
    };

    Window_MenuCommand.prototype.maxCols = function() { return 5; };
    Window_MenuCommand.prototype.numVisibleRows = function() { return 1; }; 
    Window_MenuCommand.prototype.makeCommandList = function() {
        this.addCommand("Equip", 'equip');
        this.addCommand("Skill", 'skill');    
        this.addCommand("Bond", 'bond');      
        this.addCommand("Mementos", 'mementos'); 
        this.addCommand("Options", 'options');
    };

    Scene_Map.prototype.statusWindowRect = function() {
        const height = 240; 
        const w = Graphics.boxWidth - (MENU_MARGIN_X * 2);
        const y = Graphics.boxHeight - height - MENU_MARGIN_Y;
        return new Rectangle(MENU_MARGIN_X, y, w, height);
    };
    Window_MenuStatus.prototype.maxCols = function() { return 4; }; 
    Window_MenuStatus.prototype.numVisibleRows = function() { return 1; }; 
    Window_MenuStatus.prototype.drawItemImage = function(index) {}; 
    Window_MenuStatus.prototype.drawItemStatus = function(index) {}; 
    Window_MenuStatus.prototype.drawItem = function(index) {
        const rect = this.itemRect(index);
        this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
        if (DEBUG_MODE) {
            const isSelected = (this.index() === index && this.active);
            const color = isSelected ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.3)';
            this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, color);
            this.drawText(this.actor(index).name(), rect.x, rect.y, rect.width, 'center');
        }
    };

    // =======================================================
    // 6. MEMENTOS: CATEGORIES
    // =======================================================
    function Window_MenuMementosCat() { this.initialize(...arguments); }
    Window_MenuMementosCat.prototype = Object.create(Window_HorzCommand.prototype);
    Window_MenuMementosCat.prototype.constructor = Window_MenuMementosCat;
    applySkeletonStyle(Window_MenuMementosCat);
    
    Window_MenuMementosCat.prototype.maxCols = function() { return 5; }; 
    Window_MenuMementosCat.prototype.makeCommandList = function() {
        this.addCommand("Goodies", 'goodies');
        this.addCommand("Trinkets", 'trinkets');
        this.addCommand("Keepsakes", 'keepsakes');
    };
    Window_MenuMementosCat.prototype.drawItem = customDrawItemWithCursor;
    Window_MenuMementosCat.prototype.select = customSelectRefresh;

    // =======================================================
    // 7. MEMENTOS: ITEM LIST & ACTIONS
    // =======================================================
    function Window_MementosItemList() { this.initialize(...arguments); }
    Window_MementosItemList.prototype = Object.create(Window_ItemList.prototype);
    Window_MementosItemList.prototype.constructor = Window_MementosItemList;
    applySkeletonStyle(Window_MementosItemList);
    
    Window_MementosItemList.prototype.maxCols = function() { return 1; };
    
    Window_MementosItemList.prototype.itemHeight = function() {
        return MEMENTOS_LIST_ITEM_HEIGHT;
    };

    Window_MementosItemList.prototype.includes = function(item) {
        if (!item) return false;
        const cat = this._category;
        if (cat === 'goodies') return item.itypeId === 1 && item.meta.Category !== 'Trinkets'; 
        if (cat === 'trinkets') return item.itypeId === 1 && item.meta.Category === 'Trinkets';
        if (cat === 'keepsakes') return item.itypeId === 2; 
        return false;
    };
    
    Window_MementosItemList.prototype.drawItem = function(index) {
        if (this.itemAt(index)) {
            const rect = this.itemLineRect(index); 
            this.contents.clearRect(rect.x - 40, rect.y, rect.width + 80, rect.height);

            if (this.index() === index && this.active) {
                 const cursorBmp = ImageManager.loadSystem(CURSOR_IMAGE_NAME);
                 if (cursorBmp.isReady()) {
                     const cursorX = rect.x + 10 + MEMENTOS_LIST_CURSOR_X_OFFSET; 
                     const cursorY = rect.y + (MEMENTOS_LIST_ITEM_HEIGHT - CURSOR_DRAW_SIZE) / 2;
                     this.contents.blt(cursorBmp, 0, 0, CURSOR_NATIVE_SIZE, CURSOR_NATIVE_SIZE, cursorX, cursorY, CURSOR_DRAW_SIZE, CURSOR_DRAW_SIZE);
                 } else {
                     cursorBmp.addLoadListener(() => this.redrawItem(index));
                 }
            }
        }
    };
    Window_MementosItemList.prototype.select = customSelectRefresh;

    function Window_MementosAction() { this.initialize(...arguments); }
    Window_MementosAction.prototype = Object.create(Window_Command.prototype);
    Window_MementosAction.prototype.constructor = Window_MementosAction;
    applySkeletonStyle(Window_MementosAction);
    Window_MementosAction.prototype.setItem = function(item) {
        this._item = item;
        this.refresh();
    };
    Window_MementosAction.prototype.makeCommandList = function() {
        const item = this._item;
        
        let isNeeded = false;
        if (item && item.itypeId === 1 && item.meta.Category !== 'Trinkets') {
            if (item.occasion === 0 || item.occasion === 2) { 
                isNeeded = $gameParty.members().some(actor => {
                    const action = new Game_Action(actor);
                    action.setItemObject(item);
                    return action.testApply(actor);
                });
            }
        }

        const canTrash = item && item.itypeId !== 2; 

        this.addCommand("Use", 'use', isNeeded);
        this.addCommand("Trash", 'trash', canTrash);
    };
    Window_MementosAction.prototype.drawItem = customDrawItemWithCursor;
    Window_MementosAction.prototype.select = customSelectRefresh;

    function Window_MementosConfirm() { this.initialize(...arguments); }
    Window_MementosConfirm.prototype = Object.create(Window_Command.prototype);
    Window_MementosConfirm.prototype.constructor = Window_MementosConfirm;
    applySkeletonStyle(Window_MementosConfirm);
    
    Window_MementosConfirm.prototype.maxCols = function() { return 2; }; 
    
    Window_MementosConfirm.prototype.itemRect = function(index) {
        const rect = Window_Command.prototype.itemRect.call(this, index);
        rect.y += 36; 
        return rect;
    };
    Window_MementosConfirm.prototype.makeCommandList = function() {
        this.addCommand("Yes", 'yes');
        this.addCommand("No", 'no');
    };
    Window_MementosConfirm.prototype.drawAllItems = function() {
        if (DEBUG_MODE) {
            this.drawText("Are you sure?", 0, 0, this.innerWidth, 'center');
        }
        Window_Selectable.prototype.drawAllItems.call(this);
    };
    Window_MementosConfirm.prototype.drawItem = customDrawItemWithCursor;
    Window_MementosConfirm.prototype.select = customSelectRefresh;

    // =======================================================
    // 8. WIRING IT ALL TOGETHER ON THE MAP
    // =======================================================
    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this.createCustomOmoriMenu();
    };

    Scene_Map.prototype.createCustomOmoriMenu = function() {
        this.createCommandWindow();
        this.createStatusWindow();
        
        this.createMementosSubWindow();
        this.createMementosItemList();
        this.createMementosActionWindow();
        this.createMementosConfirmWindow();

        this._commandWindow.hide();
        this._commandWindow.deactivate();
        this._statusWindow.hide();
        this._statusWindow.deactivate();
    };

    Scene_Map.prototype.createCommandWindow = function() {
        const rect = this.commandWindowRect();
        this._commandWindow = new Window_MenuCommand(rect);
        this._commandWindow.setHandler('equip', this.commandPersonal.bind(this));
        this._commandWindow.setHandler('skill', this.commandPersonal.bind(this)); 
        this._commandWindow.setHandler('bond', this.commandPersonal.bind(this));  
        this._commandWindow.setHandler('mementos', this.commandMementos.bind(this));
        this._commandWindow.setHandler('cancel', this.closeCustomOmoriMenu.bind(this));
        this.addWindow(this._commandWindow);
    };

    Scene_Map.prototype.createStatusWindow = function() {
        const rect = this.statusWindowRect();
        this._statusWindow = new Window_MenuStatus(rect);
        this._statusWindow.setHandler('ok', this.onPersonalOkCustom.bind(this));
        this._statusWindow.setHandler('cancel', this.onPersonalCancel.bind(this));
        this.addWindow(this._statusWindow);
    };

    Scene_Map.prototype.createMementosSubWindow = function() {
        const h = this.calcWindowHeight(1, true);
        const y = MENU_MARGIN_Y + h; 
        const rect = new Rectangle(MENU_MARGIN_X, y, Graphics.boxWidth - (MENU_MARGIN_X * 2), h);
        this._mementosCatWindow = new Window_MenuMementosCat(rect);
        this._mementosCatWindow._baseY = y; 
        this._mementosCatWindow.setHandler('ok', this.onMementosCatOk.bind(this));
        this._mementosCatWindow.setHandler('cancel', this.onMementosCancel.bind(this));
        this.addWindow(this._mementosCatWindow);
        this._mementosCatWindow.hide(); 
        this._mementosCatWindow.deactivate();
    };

    Scene_Map.prototype.createMementosItemList = function() {
        const w = 300; 
        const x = Graphics.boxWidth - w - MENU_MARGIN_X; 
        const y = this._mementosCatWindow.y + MEMENTOS_LIST_Y_OFFSET; 
        
        const itemH = MEMENTOS_LIST_ITEM_HEIGHT + MEMENTOS_LIST_ITEM_PADDING;
        const h = (itemH * MEMENTOS_LIST_VISIBLE_ITEMS) + ($gameSystem.windowPadding() * 2);
        
        this._mementosItemWindow = new Window_MementosItemList(new Rectangle(x, y, w, h));
        this._mementosItemWindow._baseY = y; 
        this._mementosItemWindow.setHandler('ok', this.onMementosItemOk.bind(this));
        this._mementosItemWindow.setHandler('cancel', this.onMementosItemCancel.bind(this));
        this.addWindow(this._mementosItemWindow);
        this._mementosItemWindow.hide();
        this._mementosItemWindow.deactivate();
    };

    Scene_Map.prototype.createMementosActionWindow = function() {
        const w = 200;
        const h = this.calcWindowHeight(2, true);
        
        const x = this._mementosCatWindow.x; 
        const y = this._mementosItemWindow.y + this._mementosItemWindow.height + MEMENTOS_ACTION_Y_OFFSET;
        
        this._mementosActionWindow = new Window_MementosAction(new Rectangle(x, y, w, h));
        this._mementosActionWindow._baseY = y; 
        this._mementosActionWindow.setHandler('use', this.onMementosActionUse.bind(this));
        this._mementosActionWindow.setHandler('trash', this.onMementosActionTrash.bind(this));
        this._mementosActionWindow.setHandler('cancel', this.onMementosActionCancel.bind(this));
        this.addWindow(this._mementosActionWindow);
        this._mementosActionWindow.hide();
        this._mementosActionWindow.deactivate();
    };

    Scene_Map.prototype.createMementosConfirmWindow = function() {
        const w = 200;
        const h = this.calcWindowHeight(2, true); 
        
        const x = this._mementosActionWindow.x + this._mementosActionWindow.width; 
        const y = this._mementosActionWindow.y + MEMENTOS_CONFIRM_Y_OFFSET;
        
        this._mementosConfirmWindow = new Window_MementosConfirm(new Rectangle(x, y, w, h));
        this._mementosConfirmWindow._baseY = y; 
        this._mementosConfirmWindow.setHandler('yes', this.onMementosConfirmYes.bind(this));
        this._mementosConfirmWindow.setHandler('no', this.onMementosConfirmCancel.bind(this));
        this._mementosConfirmWindow.setHandler('cancel', this.onMementosConfirmCancel.bind(this));
        this.addWindow(this._mementosConfirmWindow);
        this._mementosConfirmWindow.hide();
        this._mementosConfirmWindow.deactivate();
    };

    // --- OVERLAY LOGIC HANDLERS ---
    Scene_Map.prototype.openCustomOmoriMenu = function() {
        $gameTemp._customMenuOpen = true;
        $gameTemp._globalClosingDelay = 0;
        $gameTemp._menuCursorDelay = 0; 

        if (!this._reverieBlurFilter) {
            this._reverieBlurFilter = new PIXI.filters.BlurFilter();
            this._reverieBlurFilter.blur = 8; // Change this number to make it more or less blurry
        }
        if (this._spriteset) {
            const filters = this._spriteset.filters || [];
            if (!filters.includes(this._reverieBlurFilter)) {
                filters.push(this._reverieBlurFilter);
                this._spriteset.filters = filters;
            }
        }
        
        this._commandWindow.show();
        this._commandWindow.activate();
        this._commandWindow.select(0);
        this._statusWindow.show();      
        this._statusWindow.deselect();  
    };

    Scene_Map.prototype.closeCustomOmoriMenu = function() {
        $gameTemp.mementosUseMode = false;
        $gameTemp._globalClosingDelay = CURSOR_ANIMATION_DELAY;
    };

    Scene_Map.prototype.commandPersonal = function() {
        this._statusWindow.show();
        this._statusWindow.activate();
        this._statusWindow.select(0); 
    };

    Scene_Map.prototype.onPersonalCancel = function() {
        this._statusWindow.deselect(); 
        this._statusWindow.deactivate();
        if ($gameTemp.mementosUseMode) {
            $gameTemp.mementosUseMode = false;
            this._mementosActionWindow.activate();
        } else {
            this._commandWindow.activate();
        }
    };

    Scene_Map.prototype.commandMementos = function() {
        $gameTemp._menuCursorDelay = CURSOR_ANIMATION_DELAY; 
        this._mementosCatWindow.show();
        this._mementosCatWindow.activate();
        this._mementosCatWindow.select(0); 
    };

    Scene_Map.prototype.onMementosCatOk = function() {
        this._mementosCatWindow.deactivate(); 
        
        $gameTemp._menuCursorDelay = CURSOR_ANIMATION_DELAY; 
        
        this._mementosItemWindow.setCategory(this._mementosCatWindow.currentSymbol());
        this._mementosItemWindow.show();
        this._mementosItemWindow.activate();
        this._mementosItemWindow.select(0);
    };

    Scene_Map.prototype.onMementosCancel = function() {
        this._mementosCatWindow.deactivate();
        this._mementosCatWindow._closingDelay = CURSOR_ANIMATION_DELAY;
        this._commandWindow.activate();
    };

    Scene_Map.prototype.onMementosItemOk = function() {
        const item = this._mementosItemWindow.item();
        if (item) {
            this._mementosItemWindow.deactivate();
            
            $gameTemp._menuCursorDelay = CURSOR_ANIMATION_DELAY; 
            
            this._mementosActionWindow.setItem(item);
            this._mementosActionWindow.show();
            this._mementosActionWindow.activate();
            this._mementosActionWindow.select(0);
        } else {
            this._mementosItemWindow.activate();
        }
    };

    Scene_Map.prototype.onMementosItemCancel = function() {
        this._mementosItemWindow.deactivate();
        this._mementosItemWindow._closingDelay = CURSOR_ANIMATION_DELAY;
        this._mementosCatWindow.activate();
    };

    Scene_Map.prototype.onMementosActionUse = function() {
        $gameTemp.mementosUseMode = true; 
        this._statusWindow.activate();
        this._statusWindow.select(0);
    };

    Scene_Map.prototype.onMementosActionTrash = function() {
        this._mementosActionWindow.deactivate();
        
        $gameTemp._menuCursorDelay = CURSOR_ANIMATION_DELAY; 
        
        this._mementosConfirmWindow.show();
        this._mementosConfirmWindow.activate();
        this._mementosConfirmWindow.select(0);
    };

    Scene_Map.prototype.onMementosActionCancel = function() {
        this._mementosActionWindow.deactivate();
        this._mementosActionWindow._closingDelay = CURSOR_ANIMATION_DELAY;
        this._mementosItemWindow.activate();
    };

    Scene_Map.prototype.onMementosConfirmYes = function() {
        const item = this._mementosActionWindow._item;
        if (item) {
            SoundManager.playShop(); 
            $gameParty.loseItem(item, 1);
            this._mementosItemWindow.refresh();
            this._mementosActionWindow.refresh();
        }
        this._mementosConfirmWindow.deactivate();
        this._mementosConfirmWindow._closingDelay = CURSOR_ANIMATION_DELAY;
        this._mementosActionWindow.deactivate();
        this._mementosActionWindow._closingDelay = CURSOR_ANIMATION_DELAY;
        this._mementosItemWindow.activate();
    };

    Scene_Map.prototype.onMementosConfirmCancel = function() {
        this._mementosConfirmWindow.deactivate();
        this._mementosConfirmWindow._closingDelay = CURSOR_ANIMATION_DELAY;
        this._mementosActionWindow.activate();
    };

    const _Window_MenuStatus_processOk = Window_MenuStatus.prototype.processOk;
    Window_MenuStatus.prototype.processOk = function() {
        if (this.isCurrentItemEnabled()) {
            this.playOkSound();
            this.updateInputData();
            this.deactivate();
            SceneManager._scene.onPersonalOkCustom();
        }
    };

    Scene_Map.prototype.onPersonalOkCustom = function() {
        const symbol = this._commandWindow.currentSymbol();
        const actorIndex = this._statusWindow.index();
        const actor = $gameParty.members()[actorIndex];
        
        if ($gameTemp.mementosUseMode) {
            const item = this._mementosActionWindow._item;
            const action = new Game_Action(actor);
            action.setItemObject(item);
            
            if (action.testApply(actor)) {
                action.apply(actor);
                $gameParty.loseItem(item, 1);
                SoundManager.playUseItem();
                this._mementosItemWindow.refresh();
                this._mementosActionWindow.refresh();
                this._statusWindow.refresh();
                
                if ($gameParty.numItems(item) === 0) {
                    $gameTemp.mementosUseMode = false;
                    this._statusWindow.deselect();
                    this._mementosActionWindow.deactivate();
                    this._mementosActionWindow._closingDelay = CURSOR_ANIMATION_DELAY;
                    this._mementosItemWindow.activate();
                } else {
                    this._statusWindow.activate(); 
                }
            } else {
                SoundManager.playBuzzer();
                this._statusWindow.activate();
            }
        } else {
            $gameTemp.menuSelectedActorIndex = actorIndex;
            this._statusWindow.deselect();
            this._commandWindow.activate();
        }
    };

    // =======================================================
    // 9. HUD MAKER ULTRA TRACKING BRIDGE
    // =======================================================
    Scene_Map.prototype.updateHUDMakerBridge = function() {
        if (!$gameTemp) return;

        $gameTemp.isTopMenuActive = this._commandWindow ? this._commandWindow.active : false;
        $gameTemp.menuTopIndex = this._commandWindow ? this._commandWindow.index() : -1;
        
        $gameTemp.isSelectingActor = this._statusWindow ? this._statusWindow.active : false;
        $gameTemp.menuActorIndex = this._statusWindow ? this._statusWindow.index() : -1;

        $gameTemp.hudShowMementos = !!(this._mementosCatWindow && (this._mementosCatWindow.visible || this._mementosCatWindow._closingDelay > 0 || $gameTemp._globalClosingDelay > 0));
        $gameTemp.hudShowMementosList = !!(this._mementosItemWindow && (this._mementosItemWindow.visible || this._mementosItemWindow._closingDelay > 0 || $gameTemp._globalClosingDelay > 0));
        
        const showAction = !!(this._mementosActionWindow && (this._mementosActionWindow.visible || this._mementosActionWindow._closingDelay > 0 || $gameTemp._globalClosingDelay > 0));
        $gameTemp.hudShowMementosAction = showAction && !$gameTemp.mementosUseMode;
        
        $gameTemp.hudShowMementosConfirm = !!(this._mementosConfirmWindow && (this._mementosConfirmWindow.visible || this._mementosConfirmWindow._closingDelay > 0 || $gameTemp._globalClosingDelay > 0));

        if (this._mementosItemWindow && this._mementosItemWindow.active) {
            const item = this._mementosItemWindow.item();
            $gameTemp.mementosItemName = item ? item.name : "";
            
            if (item && item.description) {
                if (item.description.includes('\n')) {
                    // Native manual enter key support
                    const descParts = item.description.split('\n');
                    $gameTemp.mementosItemDesc1 = descParts[0] || "";
                    $gameTemp.mementosItemDesc2 = descParts[1] || "";
                } else if (item.description.length > 45) {
                    // Auto-wrap safely at a space before 46 characters
                    let splitIndex = item.description.lastIndexOf(' ', 45);
                    if (splitIndex === -1) splitIndex = 45; // Failsafe if one giant word
                    
                    $gameTemp.mementosItemDesc1 = item.description.substring(0, splitIndex).trim();
                    $gameTemp.mementosItemDesc2 = item.description.substring(splitIndex).trim();
                } else {
                    $gameTemp.mementosItemDesc1 = item.description;
                    $gameTemp.mementosItemDesc2 = "";
                }
            } else {
                $gameTemp.mementosItemDesc1 = "";
                $gameTemp.mementosItemDesc2 = "";
            }
            
            $gameTemp.mementosItemAmount = item ? $gameParty.numItems(item) : 0;
        } else if (!this._mementosItemWindow || (!this._mementosItemWindow.visible && this._mementosItemWindow._closingDelay === 0)) {
            $gameTemp.mementosItemName = "";
            $gameTemp.mementosItemDesc1 = "";
            $gameTemp.mementosItemDesc2 = "";
            $gameTemp.mementosItemAmount = 0;
        }
    };

})();