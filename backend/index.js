

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let packetCount = 0;
const protocolCounts = {};
const ipCommunications = {};
const bandwidthUsage = [];
const recentPackets = [];

function generateRandomIP() {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function simulatePacket() {
    packetCount++;
    const protocol = Math.random() < 0.7 ? 'TCP' : (Math.random() < 0.9 ? 'UDP' : 'ICMP');
    const srcIp = generateRandomIP();
    const dstIp = generateRandomIP();
    const size = Math.floor(Math.random() * 1500) + 64; // Packet size between 64 and 1564 bytes

    protocolCounts[protocol] = (protocolCounts[protocol] || 0) + 1;
    ipCommunications[dstIp] = (ipCommunications[dstIp] || 0) + 1;
    bandwidthUsage.push(size);

    if (bandwidthUsage.length > 100) {
        bandwidthUsage.shift();
    }

    recentPackets.push({
        src_ip: srcIp,
        dst_ip: dstIp,
        protocol,
        size,
        timestamp: Date.now()
    });

    if (recentPackets.length > 10) {
        recentPackets.shift();
    }
}

wss.on('connection', function connection(ws) {
    console.log('Client connected');

    const sendUpdate = () => {
        simulatePacket();
        const data = {
            packet_count: packetCount,
            protocol_counts: protocolCounts,
            sps_data: ipCommunications,
            recent_packets: recentPackets
        };
        ws.send(JSON.stringify(data));
    };

    const intervalId = setInterval(sendUpdate, 1000);

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(intervalId);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});