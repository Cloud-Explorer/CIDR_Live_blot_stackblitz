import React, { useState, useEffect } from 'react';
import { Network, Globe, AlertCircle, Palette, SunMoon } from 'lucide-react';
import {
  calculateNetwork,
  calculateNetmask,
  calculateBroadcast,
  calculateSubnets,
  isValidIp,
  isValidCidr
} from './utils/cidr';

function App() {
  const [ip, setIp] = useState('192.168.1.1');
  const [cidr, setCidr] = useState('24');
  const [subnetCount, setSubnetCount] = useState(0);
  const [error, setError] = useState('');
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [subnets, setSubnets] = useState<any[]>([]);
  const [isDark, setIsDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const cidrRanges = Array.from({ length: 32 }, (_, i) => ({
    value: i + 1,
    ips: Math.pow(2, 32 - (i + 1))
  }));

  useEffect(() => {
    calculateResults();
  }, [ip, cidr, subnetCount]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const calculateResults = () => {
    try {
      if (!ip || !cidr) {
        setError('Please enter both IP and CIDR');
        return;
      }

      if (!isValidIp(ip)) {
        setError('Invalid IP address');
        return;
      }

      const cidrNum = parseInt(cidr);
      if (!isValidCidr(cidrNum)) {
        setError('Invalid CIDR (must be between 0 and 32)');
        return;
      }

      setError('');

      const networkIp = calculateNetwork(ip, cidrNum);
      const netmask = calculateNetmask(cidrNum);
      const broadcast = calculateBroadcast(ip, cidrNum);
      const totalIps = Math.pow(2, 32 - cidrNum);
      const usableIps = totalIps - 2;

      if (totalIps <= 0 || usableIps < 0) {
        setError('Invalid network configuration: Negative or zero IP addresses');
        setNetworkInfo(null);
        setSubnets([]);
        return;
      }

      setNetworkInfo({
        baseIp: networkIp,
        totalIps,
        usableIps,
        firstUsableIp: ip,
        lastUsableIp: broadcast.split('.').slice(0, 3).concat([254]).join('.'),
        broadcast,
        netmask
      });

      if (subnetCount > 0) {
        try {
          const calculatedSubnets = calculateSubnets(ip, cidrNum, subnetCount);
          setSubnets(calculatedSubnets);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to calculate subnets');
          setSubnets([]);
        }
      } else {
        setSubnets([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during calculation');
      setNetworkInfo(null);
      setSubnets([]);
    }
  };

  return (
    <div className="animated-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-end mb-6">
          <button
            role="switch"
            aria-checked={isDark}
            className="theme-switch"
            onClick={() => setIsDark(!isDark)}
          >
            <span className="sr-only">Toggle theme</span>
            {isDark ? (
              <Palette className="theme-icon theme-icon-dark" />
            ) : (
              <SunMoon className="theme-icon theme-icon-light" />
            )}
          </button>
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Network className="h-10 w-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">CIDR Calculator</h1>
          </div>
          <p className="text-gray-400 text-lg">Calculate network information and subnet ranges</p>
        </div>

        <div className="glass-panel p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                IP Address
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="glass-input w-full text-white"
                placeholder="e.g. 192.168.1.1"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                CIDR Range
              </label>
              <select
                value={cidr}
                onChange={(e) => setCidr(e.target.value)}
                className="glass-input w-full text-white"
              >
                {cidrRanges.map(({ value, ips }) => (
                  <option key={value} value={value} className="bg-gray-900">
                    /{value} - {ips.toLocaleString()} IP addresses
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Number of Subnets
              </label>
              <select
                value={subnetCount}
                onChange={(e) => setSubnetCount(parseInt(e.target.value))}
                className="glass-input w-full text-white"
              >
                <option value={0} className="bg-gray-900">No subnets</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <option key={num} value={num} className="bg-gray-900">{num}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 mb-6 p-4 glass-panel bg-red-500/10">
              <AlertCircle className="h-5 w-5" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          {networkInfo && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                <Globe className="h-6 w-6 text-blue-400" />
                Network Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="network-info-card">
                  <p className="network-info-label">Network Address</p>
                  <p className="network-info-value">{networkInfo.baseIp}</p>
                </div>
                <div className="network-info-card">
                  <p className="network-info-label">Total IPs</p>
                  <p className="network-info-value">{networkInfo.totalIps.toLocaleString()}</p>
                </div>
                <div className="network-info-card">
                  <p className="network-info-label">Usable IPs</p>
                  <p className="network-info-value">{networkInfo.usableIps.toLocaleString()}</p>
                </div>
                <div className="network-info-card">
                  <p className="network-info-label">First Usable IP</p>
                  <p className="network-info-value">{networkInfo.firstUsableIp}</p>
                </div>
                <div className="network-info-card">
                  <p className="network-info-label">Last Usable IP</p>
                  <p className="network-info-value">{networkInfo.lastUsableIp}</p>
                </div>
                <div className="network-info-card">
                  <p className="network-info-label">Broadcast IP</p>
                  <p className="network-info-value">{networkInfo.broadcast}</p>
                </div>
                <div className="network-info-card">
                  <p className="network-info-label">Netmask</p>
                  <p className="network-info-value">{networkInfo.netmask}</p>
                </div>
              </div>
            </div>
          )}

          {subnets.length > 0 && (
            <div className="subnet-table-container">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                <Network className="h-6 w-6 text-blue-400" />
                Subnet Information
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead>
                    <tr>
                      <th className="table-header">Subnet Name</th>
                      <th className="table-header">CIDR Block</th>
                      <th className="table-header">IP Range</th>
                      <th className="table-header">Total IPs</th>
                      <th className="table-header">Usable IPs</th>
                      <th className="table-header">Broadcast IP Address</th>
                      <th className="table-header">Zone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {subnets.map((subnet, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors duration-150">
                        <td className="table-cell">{subnet.name}</td>
                        <td className="table-cell-mono">{subnet.cidrBlock}</td>
                        <td className="table-cell-mono">{subnet.firstIp} - {subnet.lastIp}</td>
                        <td className="table-cell">{subnet.totalIps.toLocaleString()}</td>
                        <td className="table-cell">{subnet.usableIps.toLocaleString()}</td>
                        <td className="table-cell-mono">{subnet.broadcastAddress}</td>
                        <td className="table-cell">{subnet.zone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;