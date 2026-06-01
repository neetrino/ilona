const { networkInterfaces } = require("node:os");

/**
 * @returns {string[]}
 */
function getLanIpv4Addresses() {
  const interfaces = networkInterfaces();
  const seen = new Set();
  const addresses = [];

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (
        entry.family !== "IPv4" ||
        entry.internal ||
        entry.address.startsWith("169.254.")
      ) {
        continue;
      }
      if (!seen.has(entry.address)) {
        seen.add(entry.address);
        addresses.push(entry.address);
      }
    }
  }

  return addresses;
}

function getPrimaryLanIpv4() {
  return getLanIpv4Addresses()[0] ?? null;
}

module.exports = { getLanIpv4Addresses, getPrimaryLanIpv4 };
