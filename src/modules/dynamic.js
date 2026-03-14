import path from "node:path";
import url from "node:url";

const dynamic = async () => {
  const pluginName = process.argv[2];
  if (!pluginName) {
    console.error("\x1b[31mPlugin not found\x1b[0m");
    process.exit(1);
  }
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  let pluginPath;
  if (pluginName.endsWith(".js")) {
    pluginPath = path.join(__dirname, "plugins", `${pluginName}`);
  } else {
    pluginPath = path.join(__dirname, "plugins", `${pluginName}.js`);
  }

  const pluginUrl = url.pathToFileURL(pluginPath).href;

  try {
    const plugin = await import(pluginUrl);
    console.log(plugin.run());
  } catch {
    console.error("\x1b[31mPlugin not found\x1b[0m");
    process.exit(1);
  }
};

await dynamic();
