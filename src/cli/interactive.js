import * as readline from "node:readline/promises";
const interactive = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.setPrompt("> ");
  rl.prompt();
  rl.on("line", (input) => {
    const command = input.trim();

    switch (command) {
      case "exit":
        rl.close();
        return;
      case "uptime":
        const uptime = process.uptime().toFixed(2);
        console.log(`Uptime:${uptime}s`);
        break;
      case "cwd":
        const directory = process.cwd();
        console.log(directory);
        break;
      case "date":
        const currentDateAndTime = new Date().toISOString();
        console.log(currentDateAndTime);
        break;

      default:
        console.log("Unknown command");
        break;
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log(`Goodbye!`);
    process.exit(0);
  });
};

interactive();
