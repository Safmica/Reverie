/*:
 * @target MZ
 * @plugindesc Keeps package.json window.show set to false after RPG Maker rewrites it.
 * @author Aristel
 *
 * @help PackageShowFalseKeeper.js
 *
 * RPG Maker MZ can rewrite package.json during playtest saves and remove the
 * NW.js window.show value. This plugin restores:
 *
 *   "window": {
 *       "show": false
 *   }
 *
 * During playtest, it also starts a hidden helper watcher for the current dev
 * session so package.json is repaired again if the editor rewrites it later.
 */

(() => {
    "use strict";

    const PACKAGE_FILE_NAME = "package.json";
    const WATCHER_SCRIPT = "tools/KeepPackageShowFalse.ps1";

    const nodeModulesAvailable = () => {
        return Utils.isNwjs() && typeof require === "function";
    };

    const pathFromLocation = (path) => {
        let normalized = decodeURIComponent(path || "");
        if (normalized.startsWith("/") && /^[A-Za-z]:/.test(normalized.slice(1))) {
            normalized = normalized.slice(1);
        }
        return normalized.replace(/\//g, "\\");
    };

    const projectRoot = (pathModule) => {
        const indexPath = pathFromLocation(window.location && window.location.pathname);
        return indexPath ? pathModule.dirname(indexPath) : process.cwd();
    };

    const packagePath = (fs, pathModule) => {
        const candidates = [
            pathModule.join(projectRoot(pathModule), PACKAGE_FILE_NAME),
            pathModule.join(process.cwd(), PACKAGE_FILE_NAME)
        ];
        return candidates.find(candidate => fs.existsSync(candidate)) || candidates[0];
    };

    const withShowFalseAfterHeight = (windowConfig) => {
        const ordered = {};
        let inserted = false;

        for (const key of Object.keys(windowConfig || {})) {
            if (key === "show") continue;
            ordered[key] = windowConfig[key];
            if (key === "height") {
                ordered.show = false;
                inserted = true;
            }
        }

        if (!inserted) ordered.show = false;
        return ordered;
    };

    const restorePackageShowFalse = (fs, packageFile) => {
        try {
            const text = fs.readFileSync(packageFile, "utf8");
            const data = JSON.parse(text);
            const windowConfig = data.window && typeof data.window === "object" ? data.window : {};

            if (windowConfig.show === false) return;

            data.window = withShowFalseAfterHeight(windowConfig);
            const newline = text.includes("\r\n") ? "\r\n" : "\n";
            fs.writeFileSync(packageFile, JSON.stringify(data, null, 4) + newline, "utf8");
        } catch (error) {
            console.warn("PackageShowFalseKeeper could not update package.json:", error);
        }
    };

    const startPlaytestWatcher = (fs, pathModule, packageFile) => {
        if (!Utils.isOptionValid || !Utils.isOptionValid("test")) return;
        if (window.__reveriePackageShowFalseWatcherStarted) return;

        const scriptPath = pathModule.join(projectRoot(pathModule), WATCHER_SCRIPT);
        if (!fs.existsSync(scriptPath)) return;

        try {
            const childProcess = require("child_process");
            const child = childProcess.spawn("powershell.exe", [
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-WindowStyle",
                "Hidden",
                "-File",
                scriptPath,
                "-PackagePath",
                packageFile
            ], {
                detached: true,
                stdio: "ignore",
                windowsHide: true
            });
            child.unref();
            window.__reveriePackageShowFalseWatcherStarted = true;
        } catch (error) {
            console.warn("PackageShowFalseKeeper could not start watcher:", error);
        }
    };

    if (!nodeModulesAvailable()) return;

    const fs = require("fs");
    const pathModule = require("path");
    const packageFile = packagePath(fs, pathModule);

    restorePackageShowFalse(fs, packageFile);
    startPlaytestWatcher(fs, pathModule, packageFile);
})();
