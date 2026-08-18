#!/usr/bin/env python3
"""Deterministic OpenAI-compatible mock used only to verify the benchmark harness."""
import argparse, json, sys, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class Server(ThreadingHTTPServer):
    allow_reuse_address=True
    def __init__(self,address,orphan_cancel_seconds=0):super().__init__(address,H);self.active=0;self.lock=threading.Lock();self.orphan_cancel_seconds=orphan_cancel_seconds
    def change_active(self,delta):
        with self.lock:self.active+=delta
class H(BaseHTTPRequestHandler):
    def log_message(self,*_):pass
    def do_GET(self):
        if self.path=="/health":self.send_response(200);self.send_header("content-type","application/json");self.end_headers();self.wfile.write(b'{"status":"ok"}')
        elif self.path=="/metrics":
            raw=f"# TYPE kaizen_mock_requests_processing gauge\nkaizen_mock_requests_processing {self.server.active}\n".encode();self.send_response(200);self.send_header("content-type","text/plain");self.send_header("content-length",str(len(raw)));self.end_headers();self.wfile.write(raw)
        else:self.send_error(404)
    def do_POST(self):
        n=int(self.headers.get("content-length","0"));body=json.loads(self.rfile.read(n))
        if self.path=="/v1/embeddings":
            texts=body.get("input",[]);texts=[texts] if isinstance(texts,str) else texts;groups=[("kubernetes","authentication","cluster","login","security"),("terraform","portfolio","infrastructure","work sample"),("sleep","recovery","rest","quality","readiness"),("interview","roadmap","hiring","conversation","learning plan")];data=[]
            for i,text in enumerate(texts):
                low=text.lower();data.append({"object":"embedding","index":i,"embedding":[float(sum(term in low for term in group)) for group in groups]+[.01]})
            raw=json.dumps({"object":"list","data":data,"model":"mock"}).encode();self.send_response(200);self.send_header("content-type","application/json");self.send_header("content-length",str(len(raw)));self.end_headers();self.wfile.write(raw);return
        if self.path!="/v1/chat/completions":self.send_error(404);return
        user=body.get("messages",[])[-1].get("content","");long="request-level cancellation testing" in user.lower();self.server.change_active(1)
        try:
            self.send_response(200);self.send_header("content-type","text/event-stream");self.send_header("cache-control","no-store");self.end_headers()
            if long:
                for i in range(500):self.wfile.write(("data: "+json.dumps({"choices":[{"delta":{"content":str(i%10)}}]})+"\n\n").encode());self.wfile.flush();time.sleep(.02)
                self.wfile.write(b"data: [DONE]\n\n");self.wfile.flush();return
            if body.get("tools"):name="get_today" if "focus on today" in user.lower() else "get_tasks";chunks=[{"choices":[{"delta":{"tool_calls":[{"index":0,"id":"mock","type":"function","function":{"name":name,"arguments":"{}"}}]}}]}]
            else:
                response_format=body.get("response_format",{});canonical=response_format.get("type")=="json_schema" and isinstance(response_format.get("json_schema",{}).get("schema"),dict) and response_format.get("json_schema",{}).get("strict") is True
                if not canonical:text="INVALID_RESPONSE_FORMAT"
                elif "Project X" in user:text=json.dumps({"answer":"Insufficient velocity data.","confidence":.2,"uncertainty":["Velocity is unavailable"]})
                elif "job description" in user:text=json.dumps({"skills":["Kubernetes","Terraform"]})
                else:text=json.dumps({"type":"recommendation","title":"Kubernetes auth","sourceIds":["t1"],"confidence":.9})
                chunks=[{"choices":[{"delta":{"content":text}}]}]
            chunks.append({"choices":[],"usage":{"prompt_tokens":64,"completion_tokens":24,"total_tokens":88}})
            for x in chunks:self.wfile.write(("data: "+json.dumps(x)+"\n\n").encode());self.wfile.flush()
            self.wfile.write(b"data: [DONE]\n\n");self.wfile.flush()
        except (BrokenPipeError,ConnectionResetError):pass
        finally:
            if long and self.server.orphan_cancel_seconds:time.sleep(self.server.orphan_cancel_seconds)
            self.server.change_active(-1)
def main():
    if "--version" in sys.argv:print("kaizen-wave0-mock 2");return
    ap=argparse.ArgumentParser(add_help=False);ap.add_argument("--host",default="127.0.0.1");ap.add_argument("--port",type=int,default=18080);ap.add_argument("--orphan-cancel-seconds",type=float,default=0);args,_=ap.parse_known_args();Server((args.host,args.port),args.orphan_cancel_seconds).serve_forever()
if __name__=="__main__":main()
