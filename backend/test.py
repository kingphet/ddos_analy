import websocket
import json
import time
import random
import threading

# Global counter for requests sent
requests_sent = 0

def generate_random_ip():
    return f"{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}"

def simulate_packet():
    protocol = random.choices(['TCP', 'UDP', 'ICMP'], weights=[0.7, 0.2, 0.1])[0]
    src_ip = generate_random_ip()
    dst_ip = generate_random_ip()
    size = random.randint(64, 1564)
    return {
        'src_ip': src_ip,
        'dst_ip': dst_ip,
        'protocol': protocol,
        'size': size,
        'timestamp': int(time.time() * 1000)
    }

def on_message(ws, message):
    global requests_sent
    data = json.loads(message)
    print(f"Received data for request {requests_sent}:")
    print(f"Packet count: {data['packet_count']}")
    print(f"Protocol counts: {data['protocol_counts']}")
    print(f"SPS data: {data['sps_data']}")
    print(f"Recent packets: {len(data['recent_packets'])}")
    print("-" * 50)

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Connection closed")

def on_open(ws):
    print("Connection opened")
    
    def run():
        global requests_sent
        start_time = time.time()
        
        while True:
            current_time = time.time()
            elapsed_time = current_time - start_time
            
            if elapsed_time >= 1:  # Reset every second
                print(f"Requests sent in the last second: {requests_sent}")
                requests_sent = 0
                start_time = current_time
            
            packet = simulate_packet()
            ws.send(json.dumps(packet))
            requests_sent += 1
            
            # Adjust sleep time to achieve 1000 RPS
            time.sleep(0.001)  # Sleep for 1ms (theoretically allows for 1000 RPS)
    
    threading.Thread(target=run).start()

if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp("ws://localhost:5000",
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)

    ws.run_forever()