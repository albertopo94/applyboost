from playwright.sync_api import sync_playwright
import sys

def check_site(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Capture console messages
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
        
        try:
            print(f"Navigating to {url}...")
            response = page.goto(url)
            page.wait_for_load_state('networkidle')
            
            status = response.status
            print(f"Status: {status}")
            
            if status != 200:
                print(f"Error: Status is {status}")
                sys.exit(1)
            
            content = page.content()
            if "Internal Server Error" in content:
                print("Error: 'Internal Server Error' found in page content")
                sys.exit(1)
            
            print("Console messages:")
            for msg in console_messages:
                print(msg)
                if "Internal Server Error" in msg:
                    print("Error: 'Internal Server Error' found in console")
                    sys.exit(1)
            
            print("UI Check Passed: No 'Internal Server Error' detected.")
            
        except Exception as e:
            print(f"Exception during UI check: {e}")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    check_site("http://localhost:3002")
