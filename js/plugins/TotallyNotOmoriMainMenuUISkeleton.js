/*:
@target MZ
@plugindesc Reverie - Complete Main Menu UI Override (ONLY SKELETON HERE, THE ACTUAL UI WAS MADE VIA SRD HUD MAKER ULTRA)
@author Aristel
*/

(() => {
    // =======================================================
    // 1. SETTINGS & CONSTANTS
    // =======================================================
    const DEBUG_MODE = false; 

    const MENU_MARGIN_X = 24; 
    const MENU_MARGIN_Y = 24; 

    const CURSOR_IMAGE_NAME = "FingerCursor";
    const CURSOR_NATIVE_SIZE = 14; 
    const CURSOR_DRAW_SIZE = 28;

    // =======================================================
    // 1.5. OVERLAY ENGINE (FREEZES MAP, OPENS MENU ON MAP)
    // =======================================================
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        if ($gameTemp && $gameTemp._customMenuOpen) {
            // Updates the windows and HUD Maker, but skips player/event logic
            Scene_Base.prototype.update.call(this); 
            this.updateHUDMakerBridge(); // Continuously tracks variables for HUD Maker
            return;
        }
        _Scene_Map_update.call(this);
    };

    // Override the default menu button to open our overlay instead of changing scenes
    Scene_Map.prototype.updateCallMenu = function() {
        if (this.isMenuEnabled() && this.isMenuCalled()) {
            this.menuCalling = false;
            this.openCustomOmoriMenu();
        }
    };

    // Helper for dimensions on the Map Scene
    Scene_Map.prototype.calcWindowHeight = function(numLines, selectable) {
        if (selectable) {
            return Window_Selectable.prototype.fittingHeight(numLines);
        }
        return Window_Base.prototype.fittingHeight(numLines);
    };

    // =======================================================
    // 2. ANNIHILATE UNWANTED UI ELEMENTS
    // =======================================================
    Scene_Map.prototype.createMenuButton = function() {}; 
    Scene_MenuBase.prototype.createCancelButton = function() {}; 
    Scene_MenuBase.prototype.createButtonAssistWindow = function() {};

    // =======================================================
    // 3. SKELETON INVISIBILITY & CURSOR INJECTION
    // =======================================================
    const applySkeletonStyle = function(windowClass) {
        const _initialize = windowClass.prototype.initialize;
        windowClass.prototype.initialize = function(rect) {
            _initialize.call(this, rect);
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

    applySkeletonStyle(Window_MenuCommand);
    applySkeletonStyle(Window_MenuStatus);
    applySkeletonStyle(Window_Gold);
    applySkeletonStyle(Window_EquipSlot);
    applySkeletonStyle(Window_EquipItem);

    // =======================================================
    // 4. CUSTOM DRAW ITEM (FOR ALL BUTTON LISTS)
    // =======================================================
    const customDrawItemWithCursor = function(index) {
        const rect = this.itemLineRect(index);
        
        const clearX = rect.x - CURSOR_DRAW_SIZE - 20;
        const clearW = rect.width + CURSOR_DRAW_SIZE + 40;
        this.contents.clearRect(clearX, rect.y, clearW, rect.height);
        
        const name = this.commandName ? this.commandName(index) : (this.item() ? this.item().name : "");
        this.changePaintOpacity(this.isCommandEnabled ? this.isCommandEnabled(index) : true);

        const textWidth = this.textWidth(name);
        const textX = rect.x + (rect.width / 2) - (textWidth / 2);
        
        if (DEBUG_MODE) {
            this.drawText(name, textX, rect.y, textWidth, 'left');
        }

        if (this.index() === index && this.active) {
            const cursorX = textX - CURSOR_DRAW_SIZE - 5; 
            const cursorY = rect.y + (rect.height - CURSOR_DRAW_SIZE) / 2; 
            const cursorBmp = ImageManager.loadSystem(CURSOR_IMAGE_NAME);
            
            if (cursorBmp.isReady()) {
                this.contents.blt(
                    cursorBmp, 0, 0, CURSOR_NATIVE_SIZE, CURSOR_NATIVE_SIZE, 
                    cursorX, cursorY, CURSOR_DRAW_SIZE, CURSOR_DRAW_SIZE 
                );
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

    // =======================================================
    // 5. BLUEPRINT ALIGNMENT: MAIN MENUS
    // =======================================================
    Scene_Map.prototype.commandWindowRect = function() {
        const w = Graphics.boxWidth - (MENU_MARGIN_X * 2);
        const h = this.calcWindowHeight(1, true);
        return new Rectangle(MENU_MARGIN_X, MENU_MARGIN_Y, w, h);
    };

    Window_MenuCommand.prototype.maxCols = function() { return 4; }; 
    Window_MenuCommand.prototype.numVisibleRows = function() { return 1; }; 
    Window_MenuCommand.prototype.makeCommandList = function() {
        this.addCommand("Equip", 'equip');
        this.addCommand("Mindset", 'mindset');   
        this.addCommand("Mementos", 'mementos'); 
        this.addCommand("Options", 'options');
    };
    Window_MenuCommand.prototype.drawItem = customDrawItemWithCursor;
    Window_MenuCommand.prototype.select = customSelectRefresh;

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
    Window_MenuStatus.prototype.select = customSelectRefresh;

    // =======================================================
    // 6. MEMENTOS & MINDSET CATEGORIES
    // =======================================================
    function Window_MenuMementosCat() { this.initialize(...arguments); }
    Window_MenuMementosCat.prototype = Object.create(Window_HorzCommand.prototype);
    Window_MenuMementosCat.prototype.constructor = Window_MenuMementosCat;
    applySkeletonStyle(Window_MenuMementosCat);
    Window_MenuMementosCat.prototype.maxCols = function() { return 4; }; 
    Window_MenuMementosCat.prototype.makeCommandList = function() {
        this.addCommand("Snacks", 'snacks');
        this.addCommand("Toys", 'toys');
        this.addCommand("Important", 'important');
    };
    Window_MenuMementosCat.prototype.drawItem = customDrawItemWithCursor;
    Window_MenuMementosCat.prototype.select = customSelectRefresh;

    function Window_MenuMindsetCat() { this.initialize(...arguments); }
    Window_MenuMindsetCat.prototype = Object.create(Window_HorzCommand.prototype);
    Window_MenuMindsetCat.prototype.constructor = Window_MenuMindsetCat;
    applySkeletonStyle(Window_MenuMindsetCat);
    Window_MenuMindsetCat.prototype.maxCols = function() { return 4; }; 
    Window_MenuMindsetCat.prototype.makeCommandList = function() {
        this.addCommand("Skill", 'skill');
        this.addCommand("Bond", 'bond');
    };
    Window_MenuMindsetCat.prototype.drawItem = customDrawItemWithCursor;
    Window_MenuMindsetCat.prototype.select = customSelectRefresh;

    // =======================================================
    // 7. EQUIP WINDOWS (SLOT & ITEM LIST)
    // =======================================================
    Window_EquipSlot.prototype.maxItems = function() { return 2; }; 
    Window_EquipSlot.prototype.drawItem = function(index) {
        const rect = this.itemLineRect(index);
        this.contents.clearRect(0, rect.y, this.width, rect.height);
        
        if (DEBUG_MODE) {
            const slotName = index === 0 ? "Weapon" : "Charm";
            const item = this.itemAt(index);
            const itemName = item ? item.name : "-------";
            this.drawText(slotName + ": " + itemName, rect.x + 40, rect.y, rect.width, 'left');
        }

        if (this.index() === index && this.active) {
            const cursorY = rect.y + (rect.height - CURSOR_DRAW_SIZE) / 2; 
            const cursorBmp = ImageManager.loadSystem(CURSOR_IMAGE_NAME);
            if (cursorBmp.isReady()) {
                this.contents.blt(cursorBmp, 0, 0, CURSOR_NATIVE_SIZE, CURSOR_NATIVE_SIZE, rect.x, cursorY, CURSOR_DRAW_SIZE, CURSOR_DRAW_SIZE);
            } else {
                cursorBmp.addLoadListener(() => this.redrawItem(index));
            }
        }
    };
    Window_EquipSlot.prototype.select = customSelectRefresh;

    Window_EquipItem.prototype.maxCols = function() { return 1; }; 
    Window_EquipItem.prototype.drawItem = function(index) {
        const rect = this.itemLineRect(index);
        this.contents.clearRect(0, rect.y, this.width, rect.height);
        const item = this.itemAt(index);
        if (item) {
            if (DEBUG_MODE) this.drawText(item.name, rect.x + 40, rect.y, rect.width, 'left');
            if (this.index() === index && this.active) {
                const cursorY = rect.y + (rect.height - CURSOR_DRAW_SIZE) / 2; 
                const cursorBmp = ImageManager.loadSystem(CURSOR_IMAGE_NAME);
                if (cursorBmp.isReady()) {
                    this.contents.blt(cursorBmp, 0, 0, CURSOR_NATIVE_SIZE, CURSOR_NATIVE_SIZE, rect.x, cursorY, CURSOR_DRAW_SIZE, CURSOR_DRAW_SIZE);
                }
            }
        }
    };
    Window_EquipItem.prototype.select = customSelectRefresh;

    // =======================================================
    // 8. WIRING IT ALL TOGETHER ON THE MAP
    // =======================================================
    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this.createCustomOmoriMenu();
    };

    Scene_Map.prototype.createCustomOmoriMenu = function() {
        // Build all windows securely on the Map Scene
        this.createCommandWindow();
        this.createStatusWindow();
        this.createMementosSubWindow();
        this.createMindsetSubWindow(); 
        this.createEquipWindows();

        // Ensure everything starts hidden
        this._commandWindow.hide();
        this._commandWindow.deactivate();
        this._statusWindow.hide();
        this._statusWindow.deactivate();
    };

    Scene_Map.prototype.createCommandWindow = function() {
        const rect = this.commandWindowRect();
        this._commandWindow = new Window_MenuCommand(rect);
        this._commandWindow.setHandler('equip', this.commandPersonal.bind(this));
        this._commandWindow.setHandler('mindset', this.commandPersonal.bind(this));
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
        this._mementosCatWindow.setHandler('cancel', this.onMementosCancel.bind(this));
        this.addWindow(this._mementosCatWindow);
        this._mementosCatWindow.hide(); 
        this._mementosCatWindow.deactivate();
    };

    Scene_Map.prototype.createMindsetSubWindow = function() {
        const h = this.calcWindowHeight(1, true);
        const y = MENU_MARGIN_Y + h; 
        const rect = new Rectangle(MENU_MARGIN_X, y, Graphics.boxWidth - (MENU_MARGIN_X * 2), h);
        this._mindsetCatWindow = new Window_MenuMindsetCat(rect);
        this._mindsetCatWindow.setHandler('cancel', this.onMindsetCancel.bind(this));
        this.addWindow(this._mindsetCatWindow);
        this._mindsetCatWindow.hide(); 
        this._mindsetCatWindow.deactivate();
    };

    Scene_Map.prototype.createEquipWindows = function() {
        const slotW = 340; 
        const slotH = this.calcWindowHeight(2, true);
        const slotY = Graphics.boxHeight - slotH - MENU_MARGIN_Y;
        this._equipSlotWindow = new Window_EquipSlot(new Rectangle(MENU_MARGIN_X, slotY, slotW, slotH));
        this._equipSlotWindow.setHandler('ok', this.onEquipSlotOk.bind(this));
        this._equipSlotWindow.setHandler('cancel', this.onEquipSlotCancel.bind(this));
        this.addWindow(this._equipSlotWindow);
        this._equipSlotWindow.hide();
        this._equipSlotWindow.deactivate();

        const itemW = 340; 
        const itemH = slotH * 2; 
        const itemX = MENU_MARGIN_X + slotW + 20; 
        const itemY = slotY - slotH; 
        this._equipItemWindow = new Window_EquipItem(new Rectangle(itemX, itemY, itemW, itemH));
        this._equipItemWindow.setHandler('ok', this.onEquipItemOk.bind(this));
        this._equipItemWindow.setHandler('cancel', this.onEquipItemCancel.bind(this));
        this.addWindow(this._equipItemWindow);
        this._equipItemWindow.hide();
        this._equipItemWindow.deactivate();

        this._equipSlotWindow.setItemWindow(this._equipItemWindow);
    };

    // --- OVERLAY LOGIC HANDLERS ---
    Scene_Map.prototype.openCustomOmoriMenu = function() {
        $gameTemp._customMenuOpen = true;
        this._commandWindow.show();
        this._commandWindow.activate();
        this._commandWindow.select(0);
    };

    Scene_Map.prototype.closeCustomOmoriMenu = function() {
        $gameTemp._customMenuOpen = false;
        $gameTemp.isEquipMenuOpen = false;
        $gameTemp.isMindsetMenuOpen = false;
        
        this._commandWindow.hide();
        this._commandWindow.deactivate();
        this._statusWindow.hide();
        this._statusWindow.deactivate();
        this._mementosCatWindow.hide();
        this._mementosCatWindow.deactivate();
        this._mindsetCatWindow.hide();
        this._mindsetCatWindow.deactivate();
        this._equipSlotWindow.hide();
        this._equipSlotWindow.deactivate();
        this._equipItemWindow.hide();
        this._equipItemWindow.deactivate();
    };

    Scene_Map.prototype.commandPersonal = function() {
        this._statusWindow.show();
        this._statusWindow.activate();
        this._statusWindow.select(0); 
    };

    Scene_Map.prototype.onPersonalCancel = function() {
        this._statusWindow.hide();
        this._statusWindow.deactivate();
        this._commandWindow.activate();
    };

    Scene_Map.prototype.commandMementos = function() {
        this._mementosCatWindow.show();
        this._mementosCatWindow.activate();
        this._mementosCatWindow.select(0); 
    };

    Scene_Map.prototype.onMementosCancel = function() {
        this._mementosCatWindow.hide();
        this._mementosCatWindow.deactivate();
        this._commandWindow.activate();
    };

    Scene_Map.prototype.onMindsetCancel = function() {
        this._mindsetCatWindow.hide();
        this._mindsetCatWindow.deactivate();
        this._statusWindow.activate(); 
    };

    // Override processOk natively on Status window so it triggers our custom map logic
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
        
        $gameTemp.menuSelectedActorIndex = actorIndex;

        if (symbol === 'equip') {
            $gameTemp.isEquipMenuOpen = true; 
            
            this._equipSlotWindow.setActor(actor);
            this._equipItemWindow.setActor(actor);
            
            this._statusWindow.deselect();
            this._equipSlotWindow.show();
            this._equipSlotWindow.activate();
            this._equipSlotWindow.select(0);

        } else if (symbol === 'mindset') {
            $gameTemp.isMindsetMenuOpen = true; 
            this._mindsetCatWindow.show();
            this._mindsetCatWindow.activate();
            this._mindsetCatWindow.select(0);
        }
    };

    Scene_Map.prototype.onEquipSlotCancel = function() {
        $gameTemp.isEquipMenuOpen = false; 
        this._equipSlotWindow.hide();
        this._equipSlotWindow.deactivate();
        this._statusWindow.activate();
    };

    Scene_Map.prototype.onEquipSlotOk = function() {
        this._equipItemWindow.show();
        this._equipItemWindow.activate();
        this._equipItemWindow.select(0);
    };

    Scene_Map.prototype.onEquipItemCancel = function() {
        this._equipItemWindow.hide();
        this._equipItemWindow.deactivate();
        this._equipSlotWindow.activate();
    };

    Scene_Map.prototype.onEquipItemOk = function() {
        SoundManager.playEquip();
        this._equipSlotWindow.actor().changeEquip(this._equipSlotWindow.index(), this._equipItemWindow.item());
        this._equipSlotWindow.refresh();
        this._equipItemWindow.refresh();
        
        this._equipItemWindow.hide();
        this._equipItemWindow.deactivate();
        this._equipSlotWindow.activate();
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

        $gameTemp.isMementosCatActive = this._mementosCatWindow ? this._mementosCatWindow.active : false;
        $gameTemp.mementosCatIndex = this._mementosCatWindow ? this._mementosCatWindow.index() : -1;

        $gameTemp.isMindsetCatActive = this._mindsetCatWindow ? this._mindsetCatWindow.active : false;
        $gameTemp.mindsetCatIndex = this._mindsetCatWindow ? this._mindsetCatWindow.index() : -1;

        $gameTemp.isEquipSlotActive = this._equipSlotWindow ? this._equipSlotWindow.active : false;
        $gameTemp.equipSlotIndex = this._equipSlotWindow ? this._equipSlotWindow.index() : -1;
        
        $gameTemp.isEquipItemActive = this._equipItemWindow ? this._equipItemWindow.active : false;
        
        let currentActor = null;
        if (this._statusWindow && this._statusWindow.active) {
            currentActor = $gameParty.members()[this._statusWindow.index()];
        } else if ($gameTemp.menuSelectedActorIndex !== undefined && $gameTemp.menuSelectedActorIndex >= 0) {
            currentActor = $gameParty.members()[$gameTemp.menuSelectedActorIndex];
        }

        if (currentActor) {
            const wpn = currentActor.equips()[0];
            const chrm = currentActor.equips()[1];
            $gameTemp.equipWeaponName = wpn ? wpn.name : "-------";
            $gameTemp.equipCharmName = chrm ? chrm.name : "-------";
        } else {
            $gameTemp.equipWeaponName = "-------";
            $gameTemp.equipCharmName = "-------";
        }

        if (this._equipSlotWindow && this._equipSlotWindow.active) {
            const equippedItem = this._equipSlotWindow.item();
            $gameTemp.hoveredEquipDesc = equippedItem ? equippedItem.description : "";
            $gameTemp.hoveredEquipName = equippedItem ? equippedItem.name : "";
        } else if (this._equipItemWindow && this._equipItemWindow.active) {
            const listItem = this._equipItemWindow.item();
            $gameTemp.hoveredEquipDesc = listItem ? listItem.description : "";
            $gameTemp.hoveredEquipName = listItem ? listItem.name : "";
        } else {
            $gameTemp.hoveredEquipDesc = "";
            $gameTemp.hoveredEquipName = "";
        }
    };

})();