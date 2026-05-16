const fs = require("fs");
const path = require("path");

const DEFAULT_TARGETS = ["data/System.json"];

function printHelp() {
    console.log(`Usage:
  npm run format:data
  npm run format:data -- data/System.json
  npm run format:data -- System.json Actors.json
  npm run format:data -- --all
  npm run check:data

Options:
  --check       Check formatting without writing files.
  --all         Format every JSON file in data/.
  --indent <n>  Number of spaces to use. Default: 2.
  --help        Show this help.`);
}

function parseArgs(argv) {
    const options = {
        check: false,
        all: false,
        indent: 2,
        targets: []
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--check") {
            options.check = true;
        } else if (arg === "--all") {
            options.all = true;
        } else if (arg === "--help" || arg === "-h") {
            options.help = true;
        } else if (arg === "--indent") {
            const value = argv[++i];
            const indent = Number(value);
            if (!Number.isInteger(indent) || indent < 0 || indent > 8) {
                throw new Error("--indent must be an integer from 0 to 8.");
            }
            options.indent = indent;
        } else if (arg.startsWith("--indent=")) {
            const indent = Number(arg.slice("--indent=".length));
            if (!Number.isInteger(indent) || indent < 0 || indent > 8) {
                throw new Error("--indent must be an integer from 0 to 8.");
            }
            options.indent = indent;
        } else if (arg.startsWith("--")) {
            throw new Error(`Unknown option: ${arg}`);
        } else {
            options.targets.push(...arg.split(",").filter(Boolean));
        }
    }

    return options;
}

function unique(values) {
    return [...new Set(values)];
}

function toRelative(root, filePath) {
    return path.relative(root, filePath).replace(/\\/g, "/");
}

function resolveTarget(root, target) {
    const normalizedTarget = target.replace(/\\/g, "/");
    const directPath = path.resolve(root, normalizedTarget);

    if (fs.existsSync(directPath)) {
        return directPath;
    }

    if (!normalizedTarget.includes("/") && normalizedTarget.toLowerCase().endsWith(".json")) {
        const dataPath = path.resolve(root, "data", normalizedTarget);
        if (fs.existsSync(dataPath)) {
            return dataPath;
        }
    }

    return directPath;
}

function listAllDataJson(root) {
    const dataDir = path.resolve(root, "data");
    return fs.readdirSync(dataDir)
        .filter(file => file.toLowerCase().endsWith(".json"))
        .sort((a, b) => a.localeCompare(b))
        .map(file => path.join(dataDir, file));
}

function formatJsonFile(filePath, indent, check) {
    const original = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(original);
    const formatted = `${JSON.stringify(parsed, null, indent)}\n`;

    if (original === formatted) {
        return "unchanged";
    }

    if (!check) {
        fs.writeFileSync(filePath, formatted, "utf8");
    }

    return "changed";
}

function main() {
    const root = process.cwd();
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printHelp();
        return;
    }

    const explicitTargets = options.targets.length > 0 ? options.targets : DEFAULT_TARGETS;
    const targets = options.all
        ? unique([...listAllDataJson(root), ...explicitTargets.map(target => resolveTarget(root, target))])
        : unique(explicitTargets.map(target => resolveTarget(root, target)));

    let changedCount = 0;

    for (const target of targets) {
        if (!target.toLowerCase().endsWith(".json")) {
            throw new Error(`Not a JSON file: ${toRelative(root, target)}`);
        }

        if (!fs.existsSync(target)) {
            throw new Error(`File not found: ${toRelative(root, target)}`);
        }

        const status = formatJsonFile(target, options.indent, options.check);
        const label = toRelative(root, target);

        if (status === "changed") {
            changedCount++;
            console.log(`${options.check ? "Needs format" : "Formatted"}: ${label}`);
        } else {
            console.log(`Already formatted: ${label}`);
        }
    }

    if (options.check && changedCount > 0) {
        process.exitCode = 1;
    }
}

try {
    main();
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
