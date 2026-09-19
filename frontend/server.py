import mimetypes
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("PORT", "8000"))
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")


class SpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def _resolver(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        if path == "/":
            return "/index.html"
        ext = os.path.splitext(path)[1]
        if ext:
            return path
        return "/index.html"

    def _serve(self, rel, head_only=False):
        target = os.path.normpath(os.path.join(DIST, rel.lstrip("/")))
        if not target.startswith(DIST):
            self.send_error(403)
            return
        if not os.path.isfile(target):
            self.send_error(404)
            return
        ctype = mimetypes.guess_type(target)[0] or "application/octet-stream"
        size = os.path.getsize(target)
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(size))
        if rel == "/index.html":
            self.send_header("Cache-Control", "no-cache")
        else:
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.end_headers()
        if not head_only:
            with open(target, "rb") as f:
                self.copyfile(f, self.wfile)

    def do_GET(self):
        self._serve(self._resolver())

    def do_HEAD(self):
        self._serve(self._resolver(), head_only=True)


if __name__ == "__main__":
    print(f"Sirviendo {DIST} en el puerto {PORT}")
    ThreadingHTTPServer(("0.0.0.0", PORT), SpaHandler).serve_forever()