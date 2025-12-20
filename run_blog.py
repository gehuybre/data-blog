import subprocess
import webbrowser
import time
import os
import sys
import signal

def kill_process_on_port(port):
    """Kills the process running on the specified port."""
    try:
        # Find PID using lsof
        # This works on macOS/Linux. For Windows, netstat/taskkill would be needed.
        cmd = f"lsof -t -i:{port}"
        pid = subprocess.check_output(cmd, shell=True).decode().strip()
        
        if pid:
            # If multiple PIDs are returned (e.g. newline separated), split them
            pids = pid.split('\n')
            for p in pids:
                if p:
                    print(f"Killing existing process {p} on port {port}...")
                    os.kill(int(p), signal.SIGKILL)
            time.sleep(2) # Wait for it to die
    except subprocess.CalledProcessError:
        # No process found on port, which is fine
        pass
    except Exception as e:
        print(f"Warning: Could not kill process on port {port}: {e}")

def main():
    # Define the project directory relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.join(script_dir, 'embuild-analyses')
    
    # Kill any existing server on port 3000 to avoid conflicts
    kill_process_on_port(3000)
    
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
