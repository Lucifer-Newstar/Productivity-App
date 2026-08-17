#!/usr/bin/env python3
"""Local mock transport comparison. Measures protocol overhead only, not model latency."""
import argparse, base64, hashlib, json, os, socket, socketserver, statistics, struct, threading, time, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class SSEHandler(BaseHTTPRequestHandler):
    count=100
    def log_message(self,*_):pass
    def do_GET(self):
        if self.path!="/events":self.send_error(404);return
        self.send_response(200);self.send_header("content-type","text/event-stream");self.send_header("cache-control","no-store");self.end_headers()
        for i in range(self.count):self.wfile.write(f"data: {{\"i\":{i}}}\n\n".encode());self.wfile.flush()

def ws_frame(payload):
    b=payload.encode();n=len(b)
    return bytes([0x81,n]) + b if n<126 else bytes([0x81,126])+struct.pack("!H",n)+b
def recv_exact(s,n):
    out=b""
    while len(out)<n:out+=s.recv(n-len(out))
    return out
def recv_frame(s):
    h=recv_exact(s,2);n=h[1]&127;masked=bool(h[1]&128)
    if n==126:n=struct.unpack("!H",recv_exact(s,2))[0]
    elif n==127:n=struct.unpack("!Q",recv_exact(s,8))[0]
    mask=recv_exact(s,4) if masked else b"";data=bytearray(recv_exact(s,n))
    if masked:
        for i in range(n):data[i]^=mask[i%4]
    return bytes(data)
def client_frame(payload):
    data=payload.encode();mask=os.urandom(4);n=len(data);head=bytes([0x81,0x80|n]);masked=bytes(b^mask[i%4] for i,b in enumerate(data));return head+mask+masked
class WSHandler(socketserver.BaseRequestHandler):
    count=100
    def handle(self):
        data=b""
        while b"\r\n\r\n" not in data:data+=self.request.recv(4096)
        headers={}
        for line in data.decode().split("\r\n")[1:]:
            if ":" in line:k,v=line.split(":",1);headers[k.lower()]=v.strip()
        accept=base64.b64encode(hashlib.sha1((headers["sec-websocket-key"]+"258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest()).decode()
        self.request.sendall(("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: "+accept+"\r\n\r\n").encode())
        for i in range(self.count):self.request.sendall(ws_frame(json.dumps({"i":i},separators=(",",":"))))
        recv_frame(self.request);self.request.sendall(ws_frame('{"ack":true}'))

def pctl(xs,p):return sorted(xs)[round((len(xs)-1)*p)]
def main():
    ap=argparse.ArgumentParser();ap.add_argument("--output",required=True);ap.add_argument("--messages",type=int,default=200);ap.add_argument("--runs",type=int,default=20);args=ap.parse_args();SSEHandler.count=WSHandler.count=args.messages
    sse=ThreadingHTTPServer(("127.0.0.1",0),SSEHandler);threading.Thread(target=sse.serve_forever,daemon=True).start()
    ws=socketserver.ThreadingTCPServer(("127.0.0.1",0),WSHandler);threading.Thread(target=ws.serve_forever,daemon=True).start()
    sse_ms=[];ws_ms=[];ws_round=[]
    try:
        for _ in range(args.runs):
            t=time.perf_counter();seen=0
            with urllib.request.urlopen(f"http://127.0.0.1:{sse.server_port}/events") as r:
                for line in r:
                    if line.startswith(b"data:"):seen+=1
            assert seen==args.messages;sse_ms.append((time.perf_counter()-t)*1000)
            sock=socket.create_connection(("127.0.0.1",ws.server_address[1]));key=base64.b64encode(os.urandom(16)).decode();request=(f"GET / HTTP/1.1\r\nHost: 127.0.0.1\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n").encode();t=time.perf_counter();sock.sendall(request);resp=b""
            while b"\r\n\r\n" not in resp:resp+=sock.recv(4096)
            for _ in range(args.messages):recv_frame(sock)
            ws_ms.append((time.perf_counter()-t)*1000);rt=time.perf_counter();sock.sendall(client_frame('{"toolResult":true}'));recv_frame(sock);ws_round.append((time.perf_counter()-rt)*1000);sock.close()
    finally:sse.shutdown();sse.server_close();ws.shutdown();ws.server_close()
    def stats(x):return {"mean":round(statistics.mean(x),3),"p50":round(pctl(x,.5),3),"p95":round(pctl(x,.95),3)}
    out={"schemaVersion":1,"messagesPerRun":args.messages,"runs":args.runs,"sseDeliveryMs":stats(sse_ms),"webSocketDeliveryMs":stats(ws_ms),"webSocketBidirectionalRoundTripMs":stats(ws_round),"limitations":["Loopback mock payloads only","No TLS/proxy/browser/CSP behavior","SSE tool callback uses separate HTTP and is not measured","Protocol microbenchmark cannot decide maintainability/reconnect semantics"]}
    path=Path(args.output);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(out,indent=2),encoding="utf-8");print(json.dumps(out,indent=2))
if __name__=="__main__":main()
