#!/usr/bin/env python3
"""
Cross-platform script to launch MathKB application and open it in a web browser.
This script works on Windows, macOS, and Linux.
"""

import os
import sys
import time
import subprocess
import webbrowser
import signal
import re
import platform

def get_virtual_env_activate_command():
    """Get the command to activate the virtual environment based on the OS"""
    if platform.system() == "Windows":
        return os.path.join("venv", "Scripts", "activate.bat")
    else:
        return f"source {os.path.join('venv', 'bin', 'activate')}"

def get_python_command():
    """Get the Python executable command based on the OS and virtual environment"""
    if platform.system() == "Windows":
        return os.path.join("venv", "Scripts", "python.exe")
    else:
        return os.path.join("venv", "bin", "python")

def main():
    # Get the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Check if virtual environment exists
    if not os.path.exists('venv'):
        print("Error: Virtual environment not found. Please create it using:")
        print("python -m venv venv")
        print("Then install requirements with: pip install -r requirements.txt")
        input("Press Enter to exit...")
        return

    # Start the Flask application
    print("Starting MathKB application...")
    
    # Prepare the command to run the Flask app
    if platform.system() == "Windows":
        # On Windows, we need to use shell=True and a combined command
        cmd = f"{get_python_command()} app.py"
        proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    else:
        # On Unix-based systems, we can use the Python executable directly
        python_exe = get_python_command()
        proc = subprocess.Popen([python_exe, "app.py"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    # URL where the app will be running
    url = None
    
    # Read the output and look for the local URL
    for line in iter(proc.stdout.readline, ''):
        print(line.strip())
        # Check for the local URL
        if "Local:" in line:
            match = re.search(r'Local:\s+(\S+)', line)
            if match:
                url = match.group(1)
                break
        # If we see any error about the port being in use, wait for the app to find an available port
    
    # If no URL was found after a few seconds, assume it's still starting up
    if url is None:
        print("Waiting for application to start...")
        time.sleep(5)
        
        # Check if the process is still running
        if proc.poll() is not None:
            print("Error: Application failed to start.")
            print(proc.stdout.read())
            input("Press Enter to exit...")
            return
        
        # Look for the URL in any new output
        remaining_output = proc.stdout.read()
        match = re.search(r'Local:\s+(\S+)', remaining_output)
        if match:
            url = match.group(1)
        
    if url:
        print(f"Opening MathKB in browser: {url}")
        # Open the URL in the default web browser
        webbrowser.open(url)
        
        print("\nMathKB is running. Press Ctrl+C to stop the application.")
        try:
            # Keep the script running until interrupted
            proc.wait()
        except KeyboardInterrupt:
            print("\nStopping MathKB application...")
            if platform.system() == "Windows":
                # On Windows, we need to use taskkill to kill the process tree
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], 
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                # On Unix-based systems, we can send a signal to the process group
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
    else:
        print("Error: Could not find the application URL in the output.")
        proc.terminate()
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()
