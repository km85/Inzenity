"""Serve only synthetic data. Apply the member overlay and Phase 1 patches first."""
import argparse, json, os, shutil, tempfile
from contextlib import contextmanager
from pathlib import Path
from isolated import isolated, INTEGRATED
from fixture import populate
import hashlib
import uvicorn

@contextmanager
def laboratory(repo):
    raw=(repo/'backend/main.py').read_bytes()
    if hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()!=INTEGRATED:
        raise SystemExit('The two approved Phase 1 backend fixes are required')
    with tempfile.TemporaryDirectory() as empty, isolated(repo,Path(empty),file_backed=True) as env:
        for name in ('index.html','app.js','styles.css','i18n.js'):
            shutil.copyfile(repo/'public'/name,env.root/'public'/name)
        shutil.copytree(repo/'public/member-v2',env.root/'public/member-v2')
        data=populate(env)
        yield env,data

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--repo',type=Path,required=True)
    parser.add_argument('--port',type=int,default=4173)
    args=parser.parse_args()
    with laboratory(args.repo.resolve()) as (env,data):
        p=env.root/'public'
        page=(Path(__file__).with_name('browser.html')).read_text()
        page=page.replace('FIXTURE_MEMBER',json.dumps(env.creds['member'])).replace('FIXTURE_EVENT',json.dumps({k:data['event'][k] for k in ('id','qrToken')}))
        (p/'checks.html').write_text(page)
        print('Open http://127.0.0.1:'+str(args.port)+'/checks.html for the synthetic preview and browser checks.',flush=True)
        uvicorn.run(env.app,host=os.environ.get('INZENITY_REVIEW_BIND','127.0.0.1'),port=args.port,log_level='error',access_log=False)
