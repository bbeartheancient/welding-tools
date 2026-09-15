import subprocess, time, sys
from playwright.sync_api import sync_playwright

def test_gui():
    try:
        p = sync_playwright().start()
    except Exception as e:
        print(f'Failed to start playwright: {e}')
        return False

    browser = None
    try:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:8081')
        page.wait_for_load_state('load')
        print('Page loaded')

        # Check tape
        page.click('[data-tab="tape"]')
        page.wait_for_timeout(500)
        tape_canvas = page.locator('#tape-canvas')
        tape_visible = tape_canvas.is_visible()
        print(f'Tape canvas visible: {tape_visible}')

        if tape_visible:
            tape_question = page.locator('#tape-question').text_content()
            print(f'Tape question: {tape_question}')

            tape_input = page.locator('#tape-answer')
            tape_input.fill('1')
            page.click('#tape-check')
            page.wait_for_timeout(500)

            feedback = page.locator('.feedback')
            if feedback.is_visible():
                print(f'Feedback: {feedback.text_content()}')

        # Check caliper
        page.click('[data-tab="caliper"]')
        page.wait_for_timeout(500)
        caliper_canvas = page.locator('#caliper-canvas')
        caliper_visible = caliper_canvas.is_visible()
        print(f'Caliper canvas visible: {caliper_visible}')

        if caliper_visible:
            caliper_question = page.locator('#caliper-question').text_content()
            print(f'Caliper question: {caliper_question}')

        # Check weld
        page.click('[data-tab="weld"]')
        page.wait_for_timeout(500)
        weld_canvas = page.locator('#weld-canvas')
        weld_visible = weld_canvas.is_visible()
        print(f'Weld canvas visible: {weld_visible}')

        if weld_visible:
            weld_question = page.locator('#weld-question').text_content()
            print(f'Weld question: {weld_question}')

        # Check console for errors
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))

        # Try interacting with each module
        page.click('[data-tab="tape"]')
        page.wait_for_timeout(500)
        tape_input = page.locator('#tape-answer')
        tape_input.fill('1')
        page.click('#tape-check')
        page.wait_for_timeout(500)

        if errors:
            print('Console errors:')
            for e in errors:
                print(f'  {e}')
        else:
            print('No console errors')

        # Screenshot for debugging
        page.screenshot(path='/tmp/opencode/gui-test.png')
        print('Screenshot saved to /tmp/opencode/gui-test.png')

        return not errors

    except Exception as e:
        print(f'Error during test: {e}')
        import traceback
        traceback.print_exc()
        return False
    finally:
        if browser:
            browser.close()
        p.stop()

# Start HTTP server
server = subprocess.Popen(['python3', '-m', 'http.server', '8081'],
                          stdout=subprocess.DEVNULL,
                          stderr=subprocess.DEVNULL)
time.sleep(1)

try:
    success = test_gui()
    sys.exit(0 if success else 1)
except Exception as e:
    print(f'Unexpected error: {e}')
    sys.exit(1)
finally:
    server.terminate()
    server.wait()
