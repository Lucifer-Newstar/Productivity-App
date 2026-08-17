#!/usr/bin/env python3
"""Deterministic OpenAI-compatible mock used only to verify the benchmark harness."""
import argparse, json, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class H(BaseHTTPRequestHandler):
    def log_message(self,*_):pass
    def do_GET(self):
        if self.path=="/health":self.send_response(200);self.send_header("content-type","application/json");self.end_headers();self.wfile.write(b'{"status":"ok"}')
        else:self.send_error(404)
    def do_POST(self):
        if self.path!="/v1/chat/completions":self.send_error(404);return
        n=int(self.headers.get("content-length","0"));body=json.loads(self.rfile.read(n));user=body.get("messages",[])[-1].get("content","")
        self.send_response(200);self.send_header("content-type","text/event-stream");self.send_header("cache-control","no-store");self.end_headers()
        if body.get("tools"):
            name="get_today" if "focus on today" in user.lower() else "get_tasks"
            chunks=[{"choices":[{"delta":{"tool_calls":[{"index":0,"id":"mock","type":"function","function":{"name":name,"arguments":"{}"}}]}}]}]
        else:
            if "Project X" in user:text=json.dumps({"answer":"Insufficient velocity data.","confidence":.2,"uncertainty":["Velocity is unavailable"]})
            elif "job description" in user:text=json.dumps({"skills":["Kubernetes","Terraform"]})
            else:text=json.dumps({"type":"recommendation","title":"Kubernetes auth","sourceIds":["t1"],"confidence":.9})
            chunks=[{"choices":[{"delta":{"content":text}}]}]
        chunks.append({"choices":[],"usage":{"prompt_tokens":64,"completion_tokens":24,"total_tokens":88}})
        for x in chunks:self.wfile.write(("data: "+json.dumps(x)+"\n\n").encode());self.wfile.flush()
        self.wfile.write(b"data: [DONE]\n\n");self.wfile.flush()

def main():
    ap=argparse.ArgumentParser(add_help=False);ap.add_argument("--host",default="127.0.0.1");ap.add_argument("--port",type=int,default=18080);args,_=ap.parse_known_args();ThreadingHTTPServer((args.host,args.port),H).serve_forever()
if __name__=="__main__":main()
