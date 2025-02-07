// CIDR Calculator Utility Functions
export function ipToBinary(ip: string): string {
  return ip
    .split('.')
    .map(octet => parseInt(octet).toString(2).padStart(8, '0'))
    .join('');
}

export function binaryToIp(binary: string): string {
  const octets: string[] = [];
  for (let i = 0; i < 32; i += 8) {
    octets.push(parseInt(binary.slice(i, i + 8), 2).toString());
  }
  return octets.join('.');
}

export function calculateNetmask(cidr: number): string {
  const binary = '1'.repeat(cidr) + '0'.repeat(32 - cidr);
  return binaryToIp(binary);
}

export function calculateNetwork(ip: string, cidr: number): string {
  const ipBinary = ipToBinary(ip);
  const networkBinary = ipBinary.slice(0, cidr) + '0'.repeat(32 - cidr);
  return binaryToIp(networkBinary);
}

export function calculateBroadcast(ip: string, cidr: number): string {
  const ipBinary = ipToBinary(ip);
  const broadcastBinary = ipBinary.slice(0, cidr) + '1'.repeat(32 - cidr);
  return binaryToIp(broadcastBinary);
}

export function calculateLastUsableIp(ip: string, cidr: number): string {
  const broadcast = calculateBroadcast(ip, cidr);
  const parts = broadcast.split('.').map(Number);
  parts[3]--; // Decrement the last octet to get the last usable IP
  return parts.join('.');
}

function decrementIp(ip: string): string {
  const parts = ip.split('.').map(Number);
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] > 0) {
      parts[i]--;
      break;
    }
    parts[i] = 255;
  }
  return parts.join('.');
}

function incrementIp(ip: string): string {
  const parts = ip.split('.').map(Number);
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] < 255) {
      parts[i]++;
      break;
    }
    parts[i] = 0;
  }
  return parts.join('.');
}

export function calculateSubnets(baseIp: string, baseCidr: number, count: number) {
  // Calculate the minimum CIDR needed for the requested number of subnets
  const minSubnetBits = Math.ceil(Math.log2(count));
  const newCidr = baseCidr + minSubnetBits;

  // Check if the new CIDR is valid
  if (newCidr > 32) {
    throw new Error(`Cannot create ${count} subnets with /${baseCidr} network. Need ${minSubnetBits} additional bits, which would exceed /32.`);
  }

  const totalIps = Math.pow(2, 32 - baseCidr);
  const ipsPerSubnet = Math.floor(totalIps / count);
  
  if (ipsPerSubnet < 2) {
    throw new Error(`Not enough IP addresses to create ${count} subnets. Each subnet needs at least 2 IPs.`);
  }

  const subnets = [];
  let currentIp = calculateNetwork(baseIp, baseCidr);
  const zones = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

  for (let i = 0; i < count; i++) {
    const networkAddress = currentIp;
    const broadcastAddress = calculateBroadcast(currentIp, newCidr);
    const firstUsableIp = incrementIp(networkAddress);
    const lastUsableIp = decrementIp(broadcastAddress);

    const subnet = {
      name: `Subnet ${i + 1}`,
      cidrBlock: `${networkAddress}/${newCidr}`,
      firstIp: firstUsableIp,
      lastIp: lastUsableIp,
      broadcastAddress: broadcastAddress,
      totalIps: Math.pow(2, 32 - newCidr),
      usableIps: Math.pow(2, 32 - newCidr) - 2,
      zone: `1${zones[i]}`
    };
    subnets.push(subnet);
    currentIp = incrementIp(broadcastAddress);
  }

  return subnets;
}

export function isValidIp(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part);
    return num >= 0 && num <= 255 && !isNaN(num);
  });
}

export function isValidCidr(cidr: number): boolean {
  return cidr >= 0 && cidr <= 32;
}