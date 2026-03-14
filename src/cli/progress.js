const progress = () => {
  const args = process.argv.slice(2);
  const defaultDuration = 5000;
  const defaultInterval = 100;
  const defaultLength = 30;
  const defaultColor = "\x1b[0m";
  let duration = defaultDuration;
  let interval = defaultInterval;
  let length = defaultLength;
  let color = defaultColor;
  let currentStep = 0;

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (
      arg === "--duration" &&
      i + 1 < args.length &&
      !args[i + 1].startsWith("--")
    ) {
      duration = getValidNumber(args[++i], defaultDuration);
    } else if (
      arg === "--interval" &&
      i + 1 < args.length &&
      !args[i + 1].startsWith("--")
    ) {
      interval = getValidNumber(args[++i], defaultInterval);
    } else if (
      arg === "--length" &&
      i + 1 < args.length &&
      !args[i + 1].startsWith("--")
    ) {
      length = getValidNumber(args[++i], defaultLength);
    } else if (
      arg === "--color" &&
      i + 1 < args.length &&
      !args[i + 1].startsWith("--")
    ) {
      color = getValidColor(args[++i], defaultColor);
    }
    i++;
  }
  const currentInterval = setInterval(() => {
    currentStep++;
    const totalSteps = Math.ceil(duration / interval);
    const percent = Math.min(100, Math.floor((currentStep / totalSteps) * 100));
    const filled = Math.floor((percent / 100) * length);
    const filledBar = "█".repeat(filled);
    const emptyBar = " ".repeat(length - filled);
    process.stdout.write(
      `\r[${color}${filledBar}\x1b[0m${emptyBar}] ${percent}%`,
    );

    if (currentStep >= totalSteps) {
      clearInterval(currentInterval);
      process.stdout.write("\nDone!\n");
    }
  }, interval);
};

progress();

function getValidNumber(value, defaultValue) {
  const testNumber = Number(value);
  if (isNaN(testNumber) || testNumber <= 0) {
    console.log(
      `Sorry, \x1b[31mInvalid\x1b[0m characters \x1b[31m${value}\x1b[0m . Using \x1b[32mdefault ${defaultValue}\x1b[0m`,
    );
    return defaultValue;
  }
  return testNumber;
}

function getValidColor(value, defaultValue) {
  if (value && /^#[0-9A-Fa-f]{6}$/.test(value)) {
    const r = parseInt(value.slice(1, 3), 16);
    const g = parseInt(value.slice(3, 5), 16);
    const b = parseInt(value.slice(5, 7), 16);
    return `\x1b[38;2;${r};${g};${b}m`;
  }
  return defaultValue;
}
