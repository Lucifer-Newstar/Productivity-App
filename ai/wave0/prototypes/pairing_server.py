#!/usr/bin/env python3
"""Isolated loopback pairing/session prototype. Never serves Kaizen data."""
from __future__ import annotations
import argparse, hashlib, hmac, json, secrets, threading, time, urllib.error, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ALLOWED_ORIGINS={"http://localhost:3000","http://127.0.0.1:3000"}
class State:
    def __init__(self,ttl=60): self.code=secrets.token_urlsafe(18);self.code_used=False;self.sessions={};self.ttl=ttl;self.lock=threading.Lock()
    def pair(self,code):
        with self.lock:
            if self.code_used or not hmac.compare_digest(code,self.code):return None
            self.code_used=True;token=secrets.token_urlsafe(32);self.sessions[hashlib.sha256(token.encode()).hexdigest()]=time.time()+self.ttl;return token
    def valid(self,token):
        digest=hashlib.sha256(token.encode()).hexdigest();expires=self.sessions.get(digest,0)
        if expires<=time.time():self.sessions.pop(digest,None);return False
        return True
class Handler(BaseHTTPRequestHandler):
    server_version="KaizenPairingPrototype/0";sys_version=""
    def log_message(self,*_):pass
    def sendj(self,status,obj):
        body=json.dumps(obj).encode();self.send_response(status);self.send_header("content-type","application/json");self.send_header("cache-control","no-store");self.send_header("x-content-type-options","nosniff");self.send_header("content-length",str(len(body)));self.end_headers();self.wfile.write(body)
    def origin_ok(self):return self.headers.get("Origin") in ALLOWED_ORIGINS
    def do_POST(self):
        if self.headers.get("Host") not in {f"127.0.0.1:{self.server.server_port}",f"localhost:{self.server.server_port}"}:return self.sendj(421,{"error":"invalid host"})
        if not self.origin_ok():return self.sendj(403,{"error":"origin denied"})
        if self.path=="/pair":
            token=self.server.state.pair(self.headers.get("X-Kaizen-Pairing-Code", ""))
            return self.sendj(200,{"sessionToken":token,"expiresIn":self.server.state.ttl}) if token else self.sendj(401,{"error":"pairing denied"})
        if self.path=="/session/check":
            auth=self.headers.get("Authorization","");token=auth[7:] if auth.startswith("Bearer ") else ""
            return self.sendj(200,{"ok":True}) if token and self.server.state.valid(token) else self.sendj(401,{"error":"invalid session"})
        self.sendj(404,{"error":"not found"})
class Server(ThreadingHTTPServer):
    def __init__(self,addr,state):super().__init__(addr,Handler);self.state=state

def request(url,origin,headers=None):
    r=urllib.request.Request(url,data=b"{}",method="POST",headers={"Origin":origin,**(headers or {})})
    try:
        with urllib.request.urlopen(r,timeout=3) as x:return x.status,json.loads(x.read())
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read())
def self_test():
    state=State(ttl=2);srv=Server(("127.0.0.1",0),state);threading.Thread(target=srv.serve_forever,daemon=True).start();base=f"http://127.0.0.1:{srv.server_port}"
    try:
        assert request(base+"/pair","https://evil.example",{"X-Kaizen-Pairing-Code":state.code})[0]==403
        assert request(base+"/pair","http://localhost:3000",{"X-Kaizen-Pairing-Code":"wrong"})[0]==401
        status,data=request(base+"/pair","http://localhost:3000",{"X-Kaizen-Pairing-Code":state.code});assert status==200;token=data["sessionToken"]
        assert request(base+"/pair","http://localhost:3000",{"X-Kaizen-Pairing-Code":state.code})[0]==401
        assert request(base+"/session/check","http://localhost:3000")[0]==401
        assert request(base+"/session/check","http://localhost:3000",{"Authorization":"Bearer "+token})[0]==200
        time.sleep(2.05);assert request(base+"/session/check","http://localhost:3000",{"Authorization":"Bearer "+token})[0]==401
        print("W0-02 pairing prototype: 7 security assertions passed")
    finally:srv.shutdown();srv.server_close()
def main():
    ap=argparse.ArgumentParser();ap.add_argument("--self-test",action="store_true");ap.add_argument("--port",type=int,default=18765);args=ap.parse_args()
    if args.self_test:return self_test()
    state=State(300);srv=Server(("127.0.0.1",args.port),state);print(f"PAIRING CODE (prototype only): {state.code}\nlistening on 127.0.0.1:{args.port}")
    try:srv.serve_forever()
    except KeyboardInterrupt:pass
    finally:srv.server_close()
if __name__=="__main__":main()
