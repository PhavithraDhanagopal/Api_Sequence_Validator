const dns = require("node:dns/promises");
const net = require("node:net");

function isPrivateIPv4(ip) {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a,b] = p;
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function validateExternalUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("Step URL is not a valid URL"); }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS URLs are allowed");
  if (url.username || url.password) throw new Error("URLs containing embedded credentials are not allowed");
  const host = url.hostname.toLowerCase();
  if (["localhost", "localhost.localdomain"].includes(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error("Local network URLs are blocked");
  }
  const ipType = net.isIP(host);
  if (ipType === 4 && isPrivateIPv4(host)) throw new Error("Private or reserved IP addresses are blocked");
  if (ipType === 6) throw new Error("IPv6 targets are blocked by this demo's URL safety policy");
  if (!ipType) {
    let addresses;
try {
  addresses = await dns.lookup(host, {
    all: true,
    family: 4,
    verbatim: true
  });
} catch {
  throw new Error("Could not resolve the step URL hostname");
}

if (!addresses.length || addresses.some(item => isPrivateIPv4(item.address))) {
  throw new Error("The URL resolves to a private or reserved network address");
}
  }
  return url.toString();
}
module.exports = { validateExternalUrl };
