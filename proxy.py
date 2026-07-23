# /// script
# requires-python = ">=3.10"
# dependencies = ["curl_cffi", "python-dotenv"]
# ///
import os, socket, time, threading, re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, urlencode
from curl_cffi import requests as cffi_requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

ENV_API_KEY = os.environ.get("R34_API_KEY", "").strip()
ENV_USER_ID = os.environ.get("R34_USER_ID", "").strip()

PORT_FILE = os.path.join(os.path.dirname(__file__), ".proxy-port")
_last_request = 0
_lock = threading.Lock()

DATE_TAG_RE = re.compile(r'\bdate:(\d+)?(day|week|month|year)\b')


class DateResolver:
    """Resolves date:XX tags into id:>THRESHOLD via ID-rate estimation."""

    PRESET_DAYS = {'day': 1, 'week': 7, 'month': 30, 'year': 365}
    RATE_SAMPLE_PAGE = 10000

    def __init__(self):
        self._cache = {}
        self._cache_ttl = 3600
        self._api_key = None
        self._user_id = None
        self._posts_per_day = None
        self._rate_sample_time = None

    def set_auth(self, api_key, user_id):
        if api_key:
            self._api_key = api_key
        if user_id:
            self._user_id = user_id

    def extract_date_tags(self, tags_str):
        matches = DATE_TAG_RE.findall(tags_str)
        if not matches:
            return tags_str, None

        num_str, unit = matches[-1]
        num = int(num_str) if num_str else 1
        days = num * self.PRESET_DAYS[unit]

        cleaned = DATE_TAG_RE.sub('', tags_str).strip()
        cleaned = re.sub(r'\s{2,}', ' ', cleaned).strip()
        return cleaned, days

    def resolve(self, days):
        entry = self._cache.get(days)
        if entry and time.time() - entry[1] < self._cache_ttl:
            return entry[0]
        return None

    def calibrate(self, days_list):
        rate = self._ensure_rate()
        if not rate:
            return

        p0 = self._fetch_page('id:desc', 1, 0)
        if not p0:
            return
        latest_id = p0[0]['id']

        for days in days_list:
            if days in self._cache and time.time() - self._cache[days][1] < self._cache_ttl:
                continue
            threshold_id = latest_id - int(days * rate)
            self._cache[days] = (threshold_id, time.time())

    def _ensure_rate(self):
        now = time.time()
        if self._posts_per_day and self._rate_sample_time and now - self._rate_sample_time < self._cache_ttl:
            return self._posts_per_day

        p0 = self._fetch_page('id:desc', 1, 0)
        if not p0:
            return None

        id0 = p0[0]['id']
        ts0 = int(p0[0].get('change', 0))
        if not ts0:
            return None

        p_sample = self._fetch_page('id:desc', 1, self.RATE_SAMPLE_PAGE)
        if not p_sample:
            return None

        id_sample = p_sample[0]['id']
        ts_sample = int(p_sample[0].get('change', 0))
        if not ts_sample or ts0 == ts_sample:
            return None

        id_gap = id0 - id_sample
        time_gap = ts0 - ts_sample
        if time_gap <= 0:
            return None

        self._posts_per_day = id_gap * 86400 / time_gap
        self._rate_sample_time = now
        return self._posts_per_day

    def _fetch_page(self, sort, limit, page):
        url = (
            f"https://api.rule34.xxx/index.php"
            f"?page=dapi&s=post&q=index&json=1"
            f"&sort={sort}&limit={limit}&pid={page}"
        )
        if self._api_key:
            url += f"&api_key={self._api_key}"
        if self._user_id:
            url += f"&user_id={self._user_id}"
        try:
            _rate_wait()
            r = cffi_requests.get(url, impersonate="chrome", timeout=15)
            if r.status_code == 200:
                data = r.json()
                return data if isinstance(data, list) else []
        except Exception as e:
            print(f"date resolver fetch failed: {e}", flush=True)
        return []


_date_resolver = DateResolver()


def _rate_wait():
    global _last_request
    with _lock:
        now = time.monotonic()
        wait = 0.5 - (now - _last_request)
        if wait > 0:
            time.sleep(wait)
        _last_request = time.monotonic()


class ProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        _rate_wait()
        parsed = urlparse(self.path)

        if parsed.path == '/video':
            self._handle_video_proxy(parsed)
        else:
            self._handle_api_proxy(parsed)

    def _send_error(self, status, message):
        self.send_response(status)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(message.encode())

    def _handle_video_proxy(self, parsed):
        params = parse_qs(parsed.query)
        target_url = params.get('url', [''])[0]
        if not target_url:
            self._send_error(400, "missing url param")
            return

        # SSRF protection: only allow rule34.xxx domains
        try:
            parsed_url = urlparse(target_url)
            hostname = parsed_url.hostname or ''
            if not hostname.endswith('rule34.xxx'):
                self._send_error(403, "forbidden: only rule34.xxx domains allowed")
                return
        except Exception:
            self._send_error(400, "invalid url")
            return

        try:
            r = cffi_requests.get(target_url, impersonate="chrome", timeout=30)
            self.send_response(r.status_code)
            self.send_header("Content-Type", r.headers.get("content-type", "video/mp4"))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(r.content)))
            self.end_headers()
            self.wfile.write(r.content)
        except Exception as e:
            self._send_error(502, "failed to fetch video")

    def _handle_api_proxy(self, parsed):
        params = parse_qs(parsed.query)

        raw_tags = params.get('tags', [''])[0]
        cleaned_tags, days = _date_resolver.extract_date_tags(raw_tags)

        api_key = params.get('api_key', [''])[0] or ENV_API_KEY
        user_id = params.get('user_id', [''])[0] or ENV_USER_ID
        _date_resolver.set_auth(api_key, user_id)

        if days is not None:
            threshold = _date_resolver.resolve(days)
            if threshold is None:
                try:
                    _date_resolver.calibrate([days])
                    threshold = _date_resolver.resolve(days)
                except Exception as e:
                    print(f"date resolution failed for {days}d: {e}", flush=True)

            if threshold is not None:
                cleaned_tags = f"id:>{threshold} {cleaned_tags}".strip()

            params['tags'] = [cleaned_tags]

        target = f"https://api.rule34.xxx{parsed.path}?{urlencode(params, doseq=True)}"
        if ENV_API_KEY and 'api_key' not in parsed.query:
            sep = '&' if '?' in target else '?'
            target += f"{sep}api_key={ENV_API_KEY}"
        if ENV_USER_ID and 'user_id' not in parsed.query:
            target += f"&user_id={ENV_USER_ID}"

        try:
            r = cffi_requests.get(target, impersonate="chrome", timeout=15)
            self.send_response(r.status_code)
            self.send_header("Content-Type", r.headers.get("content-type", "text/html"))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(r.content)
        except Exception as e:
            self._send_error(502, "failed to reach upstream API")

    def log_message(self, fmt, *args):
        pass


def find_free_port(preferred=0):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("127.0.0.1", preferred))
        except OSError:
            s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main():
    preferred = int(os.environ.get("R34_PROXY_PORT", "0"))
    port = find_free_port(preferred)
    server = HTTPServer(("127.0.0.1", port), ProxyHandler)
    with open(PORT_FILE, "w") as f:
        f.write(str(port))
    print(f"proxy:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        try:
            os.remove(PORT_FILE)
        except OSError:
            pass


if __name__ == "__main__":
    main()
