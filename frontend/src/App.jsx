
import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const App = () => {
  const [data, setData] = useState({
    packet_count: 0,
    protocol_counts: {},
    sps_data: {},
    recent_packets: [],
    minute_traffic: []
  });

  const [socket, setSocket] = useState(null);

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket('ws://localhost:5000');

    ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(prevData => {
        // Update minute-by-minute traffic data
        const currentTime = new Date();
        const currentMinute = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        
        const updatedMinuteTraffic = [...prevData.minute_traffic];
        const minuteIndex = updatedMinuteTraffic.findIndex(item => item.minute === currentMinute);
        
        if (minuteIndex !== -1) {
          updatedMinuteTraffic[minuteIndex].count += newData.recent_packets.length;
        } else {
          updatedMinuteTraffic.push({ minute: currentMinute, count: newData.recent_packets.length });
        }

        // Keep only the last 60 minutes of data
        const sortedTraffic = updatedMinuteTraffic
          .sort((a, b) => a.minute.localeCompare(b.minute))
          .slice(-60);

        return {
          ...newData,
          minute_traffic: sortedTraffic
        };
      });
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setTimeout(connectWebSocket, 5000);
    };

    setSocket(ws);
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connectWebSocket]);

  const protocolData = Object.entries(data.protocol_counts).map(([name, value]) => ({ name, value }));
  const spsData = Object.entries(data.sps_data).map(([ip, count]) => ({ ip, count })).sort((a, b) => b.count - a.count).slice(0, 10);

  // Find max and min traffic minutes
  const maxTraffic = Math.max(...data.minute_traffic.map(item => item.count));
  const minTraffic = Math.min(...data.minute_traffic.map(item => item.count));
  const maxTrafficMinute = data.minute_traffic.find(item => item.count === maxTraffic)?.minute;
  const minTrafficMinute = data.minute_traffic.find(item => item.count === minTraffic)?.minute;

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl md:max-w-4xl lg:max-w-6xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Real-Time DDoS Analysis Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-blue-100 p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">Total Packets</h2>
              <p className="text-5xl font-bold text-blue-600">{data.packet_count.toLocaleString()}</p>
            </div>
            
            <div className="bg-green-100 p-6 rounded-xl shadow-md col-span-1 md:col-span-2 lg:col-span-1">
              <h2 className="text-2xl font-semibold text-green-800 mb-4">Protocol Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={protocolData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {protocolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-yellow-100 p-6 rounded-xl shadow-md col-span-1 md:col-span-2 lg:col-span-1">
              <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Top 10 Target IPs (Packets per Second)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ip" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-indigo-100 p-6 rounded-xl shadow-md col-span-1 md:col-span-2 lg:col-span-3">
              <h2 className="text-2xl font-semibold text-indigo-800 mb-4">Minute-by-Minute Traffic</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.minute_traffic}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="minute" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="count" stroke="#4F46E5" fill="#818CF8" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 text-indigo-800">
                <p>Peak Traffic: {maxTraffic} packets at {maxTrafficMinute}</p>
                <p>Lowest Traffic: {minTraffic} packets at {minTrafficMinute}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-pink-100 p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold text-pink-800 mb-4">Recent Packets</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-pink-200">
                  <tr>
                    <th className="px-4 py-2 text-pink-700">Source IP</th>
                    <th className="px-4 py-2 text-pink-700">Destination IP</th>
                    <th className="px-4 py-2 text-pink-700">Protocol</th>
                    <th className="px-4 py-2 text-pink-700">Size (bytes)</th>
                    <th className="px-4 py-2 text-pink-700">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_packets.map((packet, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-pink-50' : 'bg-white'}>
                      <td className="border px-4 py-2">{packet.src_ip}</td>
                      <td className="border px-4 py-2">{packet.dst_ip}</td>
                      <td className="border px-4 py-2">{packet.protocol}</td>
                      <td className="border px-4 py-2">{packet.size}</td>
                      <td className="border px-4 py-2">{new Date(packet.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;