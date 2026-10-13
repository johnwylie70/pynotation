import os
import socket
import subprocess
import sys
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
EXAMPLES = ROOT / "examples"
SHOTS = Path(os.environ["SHOTS"]) if os.environ.get("SHOTS") else ROOT / "tests" / "screenshots"
# The JavaScript library, where the page's half is written, when it is beside this repository.
JS_REPO = ROOT.parent / "notation.js"

# Pyctures, the sound library and the dials as installed, or else their repositories beside this one.
PATHS = [str(ROOT / "src")]
for name, folder in (("pyctures", "pyctures"), ("synths", "synths-py"), ("pydials", "pydials")):
    try:
        __import__(name)
    except ImportError:
        PATHS.append(str(ROOT.parent / folder / "src"))
sys.path[:0] = PATHS[1:]


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def wait_for_port(port, timeout=10):
    end = time.time() + timeout
    while time.time() < end:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                return
        except OSError:
            time.sleep(0.05)
    raise TimeoutError("nothing listening on %d" % port)


class RunProcess:
    """`pyctures run <target> --no-browser` as a real subprocess, which can import this library."""

    def __init__(self, target):
        self.port = free_port()
        env = dict(os.environ)
        env["PYTHONPATH"] = os.pathsep.join(PATHS + [env.get("PYTHONPATH", "")]).rstrip(os.pathsep)
        self.proc = subprocess.Popen(
            [sys.executable, "-m", "pyctures", "run", str(target), "--no-browser", "--port", str(self.port)],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
        wait_for_port(self.port)
        self.url = "http://localhost:%d/" % self.port

    def stop(self):
        self.proc.terminate()
        try:
            out, _ = self.proc.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            self.proc.kill()
            out, _ = self.proc.communicate()
        return out


@pytest.fixture
def pyctures_run():
    started = []

    def start(target):
        p = RunProcess(target)
        started.append(p)
        return p
    yield start
    for p in started:
        if p.proc.poll() is None:
            p.stop()
