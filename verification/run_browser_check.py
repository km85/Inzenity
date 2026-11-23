"""Serve the release browser check, with disposable accounts and SQLite, only on loopback."""
import json
import os
from pathlib import Path

import uvicorn
from local_tls import tls_options
from isolated import isolated

def main():
    verification = Path(__file__).resolve().parent
    repo = Path(os.environ['INZENITY_REVIEW_CHECKOUT']).resolve()
    with isolated(repo, verification.parent/'public', candidates=True, file_backed=True) as env:
        template = (verification/'browser-check.template.html').read_text()
        check = template.replace('FIXTURE_SECRET', json.dumps(env.creds['admin']))
        (env.root/'public/index.html').write_text(check)
        print('Open https://127.0.0.1:4173/ and select Run browser checks.', flush=True)
        uvicorn.run(env.app, host='127.0.0.1', port=4173, log_level='critical', access_log=False, **tls_options(env.root))

if __name__ == '__main__':
    main()
