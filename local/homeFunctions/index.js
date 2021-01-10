const { lightTimeout } = require("./lightTimeout");

const homeFunctions = {
  lightTimeout,
};

const callHomeFunction = (functionName, ...args) => {
  const homeFunction = homeFunctions[functionName];
  if (!homeFunction) console.log(`Function "${functionName}" not found`);
  else homeFunction(...args);
};

exports.callHomeFunction = callHomeFunction;
