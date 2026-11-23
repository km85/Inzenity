"""Browser checks against the pinned FastAPI app on an ephemeral loopback port."""
import contextlib
import os
from pathlib import Path
import shutil
import socket
import threading
import time
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright
import pytest
import uvicorn
from local_tls import tls_options

from isolated import isolated

ROOT = Path(__file__).resolve().parents[1]

@pytest.fixture(scope='module')
def server():
    repo = Path(os.environ['INZENITY_REVIEW_CHECKOUT']).resolve()
    with isolated(repo, ROOT/'public', candidates=os.environ.get('CHECK_CANDIDATES') == '1', file_backed=True) as env:
        with contextlib.closing(socket.socket()) as sock:
            sock.bind(('127.0.0.1', 0))
            sock.listen(128)
            base = f'https://127.0.0.1:{sock.getsockname()[1]}'
            app = uvicorn.Server(uvicorn.Config(env.app, **tls_options(env.root), log_level='critical', access_log=False))
            worker = threading.Thread(target=app.run, kwargs={'sockets':[sock]}, daemon=True)
            worker.start()
            try:
                for _ in range(200):
                    if app.started: break
                    time.sleep(.025)
                assert app.started
                yield base, env
            finally:
                app.should_exit = True
                worker.join(5)

@pytest.fixture(scope='module')
def browser():
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=shutil.which('google-chrome') or shutil.which('chromium'), args=['--no-sandbox'])
        yield b
        b.close()

def login(page, base, env):
    page.goto(base+'/admin-login.html')
    page.locator('#adminUsername').fill('qa-admin')
    page.locator('#adminPassword').fill(env.creds['admin'])
    page.locator('form button').click()
    expect(page.locator('.summary-tile')).to_have_count(5)

@pytest.fixture
def ui(browser, server):
    base, env = server
    context = browser.new_context(ignore_https_errors=True, viewport={'width':1440,'height':900})
    # This suite permits loopback network traffic exclusively.
    context.route('**/*', lambda route: route.continue_() if urlparse(route.request.url).hostname == '127.0.0.1' else route.abort())
    page = context.new_page()
    page.set_default_timeout(6000)
    try:
        login(page, base, env)
        yield page
    finally:
        context.close()

def tab(page, key, mobile=False):
    if mobile: page.locator('#navToggle').click()
    button = page.locator(f'#sidebarNav [data-tab="{key}"]')
    group = button.locator('xpath=parent::details')
    if group.count() and group.get_attribute('open') is None:
        group.locator('summary').click()
    button.click()
    expect(button).to_have_attribute('aria-current','page')

@pytest.mark.parametrize('width', [1440,390])
def test_all_screens_responsive(ui,width):
    page = ui
    issues = []
    page.on('pageerror', lambda err: issues.append(type(err).__name__))
    page.set_viewport_size({'width':width, 'height':850})
    keys = page.locator('#sidebarNav [data-tab]').evaluate_all("(nodes)=>nodes.map(n=>n.dataset.tab).filter(k=>k!=='dashboard')")
    assert len(keys)==len(set(keys))==21
    for key in keys:
        tab(page, key, width<850)
        expect(page.locator('#tableArea h3')).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        if key == 'leaderboard':
            expect(page.locator('#loadLeaderboardButton')).to_be_enabled()
    assert not issues

def test_modal_crud_and_reload(ui):
    page=ui
    tab(page,'news')
    expect(page.locator('#tableArea .empty-state')).to_be_visible()
    page.locator('#newRecordButton').click()
    for field, value in dict(title='QA browser article',image='/admin-v2/club-mark.webp',category='QA',date='2026-11-20').items():
        page.locator('#recordForm [name="'+field+'"]').fill(value)
    page.locator('#recordForm [type="submit"]').click()
    row=page.locator('#tableArea tbody tr')
    expect(row).to_have_count(1)
    row.locator('[data-edit]').click()
    page.locator('#recordForm [name=title]').fill('Revised QA article')
    page.locator('#recordForm [type=submit]').click()
    expect(row).to_contain_text('Revised QA article')
    page.reload()
    expect(page.locator('.summary-tile')).to_have_count(5)
    tab(page,'news')
    expect(row).to_contain_text('Revised QA article')
    page.once('dialog',lambda d:d.dismiss())
    row.locator('[data-delete]').click()
    expect(row).to_have_count(1)
    page.once('dialog',lambda d:d.accept())
    row.locator('[data-delete]').click()
    expect(page.locator('#tableArea .empty-state')).to_be_visible()
    page.reload()
    expect(page.locator('.summary-tile')).to_have_count(5)
    tab(page,'news')
    expect(row).to_have_count(0)

def test_server_error_and_recovery(ui):
    # One simulated failed read tests the banner. Recovery uses real handlers.
    page=ui
    page.route('**/api/users',lambda route: route.fulfill(status=503,body='{}'))
    page.reload()
    expect(page.locator('#apiNotice')).to_be_visible()
    page.unroute('**/api/users')
    page.locator('#reloadRecords').click()
    expect(page.locator('.summary-tile')).to_have_count(5)

def test_logout_redirect(ui):
    page=ui
    page.locator('.sidebar-actions summary').click()
    page.locator('#adminLogoutButton').click()
    expect(page.locator('#adminLoginForm')).to_be_visible()
    page.goto(page.url.replace('/admin-login.html','/admin.html'))
    expect(page.locator('#adminLoginForm')).to_be_visible()
