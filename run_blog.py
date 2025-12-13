import subprocess
import webbrowser
import time
import os
import sys

def main():
    # Define the project directory relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.join(script_dir, 'embuild-analyses')
    
    print(f"Starting Next.js server in {project_dir}...")
    
    # Start the server process
    # using shell=True on Windows might be needed, but on macOS (user's OS) it's not strictly necessary 
    # unless npm is not in PATH, but usually it is. 
    # We use shell=False and pass the command as a list.
    try:
        process = subprocess.Popen(
            ['npm', 'run', 'dev'], 
            cwd=project_dir,
            stdout=sys.stdout,
            stderr=sys.stderr
        )
    except FileNotFoundError:
        print("Error: 'npm' command not found. Make sure Node.js and npm are installed.")
        return

    try:
        # Wait a bit for the server to initialize
        print("Waiting for server to start...")
        time.sleep(5)
        
        url = "http://localhost:3000"
        print(f"Opening {url} in browser...")
        webbrowser.open(url)
        
        print("Server is running. Press Ctrl+C to stop.")
        # Keep the script running while the server is running
        process.wait()
    except KeyboardInterrupt:
        print("\nStopping server...")
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
        print("Server stopped.")

if __name__ == "__main__":
    main()
