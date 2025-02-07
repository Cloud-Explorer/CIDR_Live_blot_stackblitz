import React, { useState, useEffect } from 'react';
import { Network, Globe, AlertCircle, Moon, Sun } from 'lucide-react';
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
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            role="switch"
            aria-checked={isDark}
            className="theme-switch"
            onClick={() => setIsDark(!isDark)}
          >
            <span className="sr-only">Toggle dark mode</span>
            <span className="theme-switch-thumb" aria-hidden="true">
              {isDark ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
            </span>
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Network className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CIDR Calculator</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Calculate network information and subnet ranges</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border-2 border-blue-200 dark:border-blue-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                IP Address
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md 
                focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="e.g. 192.168.1.1"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                CIDR Range
              </label>
              <select
                value={cidr}
                onChange={(e) => setCidr(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md 
                focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              >
                {cidrRanges.map(({ value, ips }) => (
                  <option key={value} value={value}>
                    /{value} - {ips.toLocaleString()} IP addresses
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                Number of Subnets
              </label>
              <select
                value={subnetCount}
                onChange={(e) => setSubnetCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md 
                focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              >
                <option value={0}>No subnets</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-4 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          {networkInfo && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Network Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Subnet Information
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
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
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {subnets.map((subnet, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
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