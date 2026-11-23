"""Run the real app from an isolated copy of reviewed source, with temporary SQLite."""
import contextlib
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import secrets
import shutil
import sqlite3
import subprocess
import tempfile
from types import SimpleNamespace

BASELINE = '603b9fabf3cbd78abc392c9d40ea8e3c80892e01'

INTEGRATED = '08eec9bf509403099e6851ae5d7cbf45fdbfb8d8'

@contextlib.contextmanager
def isolated(repo, overlay, *, candidates=False, file_backed=False):
    raw = (repo/'backend/main.py').read_bytes()
    blob = hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
    if blob not in (BASELINE, INTEGRATED):
        raise RuntimeError('Backend differs from the reviewed source. Review it before running the suite.')
    with tempfile.TemporaryDirectory(prefix='inzenity-validation-') as tmp:
        root = Path(tmp)
        backend = root/'backend'
        backend.mkdir()
        (root/'data').mkdir()
        static = root/'public'
        if blob == INTEGRATED:
            static.mkdir(exist_ok=True)
            # Run the branch files. Copy only the reviewed frontend allowlist.
            if overlay.resolve() == (repo/'public').resolve():
                expected_files = [overlay/name for name in ('index.html', 'app.js', 'admin-login.html', 'admin-login.js', 'admin.html', 'admin.js')]
                for area in ('admin-v2', 'member-v2'):
                    expected_files.extend((overlay/area).rglob('*'))
            else:
                expected_files = overlay.rglob('*')
            for expected in expected_files:
                if not expected.is_file(): continue
                relative = expected.relative_to(overlay)
                source = repo/'public'/relative
                if source.read_bytes() != expected.read_bytes():
                    raise RuntimeError(f'Frontend differs from the reviewed package: {relative}')
                (static/relative).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, static/relative)
        else:
            shutil.copytree(overlay, static)
        for name in ('styles.css','i18n.js'):
            shutil.copyfile(repo/'public'/name, static/name)
        module_path = backend/'main.py'
        module_path.write_bytes(raw)
        if candidates and blob == BASELINE:
            for patch in sorted((Path(__file__).resolve().parents[1]/'review').glob('*.patch')):
                subprocess.run(['patch','--silent','--batch','-p1','-i',str(patch)], cwd=root, check=True)
        # Only random, disposable principals enter this test's seed.
        creds = {r:secrets.token_urlsafe(24) for r in ('admin','member','merchant')}
        users = [dict(id=i, name='Test '+role, username='qa-'+role, role=role,
                      password=pw, phone='', city='Test', language='en')
                 for i,(role,pw) in enumerate(creds.items(),1)]
        (root/'data/seed.json').write_text(json.dumps({'users':users}))
        name = 'inzenity_qa_'+secrets.token_hex(10)
        previous = os.environ.get('INZENITY_DB_URL')
        anchor = None
        if file_backed:
            # Concurrent HTTP requests use the same pooling defaults as production SQLite.
            os.environ['INZENITY_DB_URL'] = 'sqlite:///' + str(root/'qa.sqlite')
        else:
            uri = 'file:'+name+'?mode=memory&cache=shared'
            anchor = sqlite3.connect(uri, uri=True, check_same_thread=False)
            os.environ['INZENITY_DB_URL'] = 'sqlite:///'+uri+'&uri=true'
        mod = None
        try:
            spec=importlib.util.spec_from_file_location(name,module_path)
            mod=importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            yield SimpleNamespace(app=mod.app, creds=creds, root=root, mod=mod)
        finally:
            if mod is not None and hasattr(mod,'engine'): mod.engine.dispose()
            if anchor is not None: anchor.close()
            if previous is None: os.environ.pop('INZENITY_DB_URL',None)
            else: os.environ['INZENITY_DB_URL']=previous
