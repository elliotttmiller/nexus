import os
import sys
import subprocess
import threading
import time
import shutil

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
AI_DIR = os.path.join(PROJECT_ROOT, 'nexus-ai')
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'nexus-backend')
MOBILE_DIR = os.path.join(PROJECT_ROOT, 'nexus-mobile')

# Helper to run a command and stream output
class ServiceThread(threading.Thread):
    def __init__(self, name, command, cwd, shell=True):
        super().__init__()
        self.name = name
        self.command = command
        self.cwd = cwd
        self.shell = shell
        self.process = None

    def run(self):
        print(f"\n--- Starting {self.name} ---")
        self.process = subprocess.Popen(
            self.command,
            cwd=self.cwd,
            shell=self.shell,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            universal_newlines=True
        )
        for line in self.process.stdout:
            print(f"[{self.name}] {line}", end='')
        self.process.stdout.close()
        self.process.wait()
        print(f"--- {self.name} stopped ---\n")

    def stop(self):
        if self.process and self.process.poll() is None:
            self.process.terminate()

# Dependency checks

def ensure_python_dependencies():
    req_path = os.path.join(AI_DIR, 'requirements.txt')
    print('Checking Python dependencies for nexus-ai...')
    result = subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', req_path], cwd=AI_DIR)
    if result.returncode != 0:
        print('❌ Failed to install Python dependencies.')
        sys.exit(1)
    print('✅ Python dependencies installed.')

def ensure_node_dependencies(target_dir):
    print(f'Checking Node.js dependencies in {target_dir}...')
    if not os.path.exists(os.path.join(target_dir, 'node_modules')):
        result = subprocess.run(['npm', 'install'], cwd=target_dir)
        if result.returncode != 0:
            print(f'❌ npm install failed in {target_dir}.')
            sys.exit(1)
        print(f'✅ npm install completed in {target_dir}.')
    else:
        print(f'✅ node_modules already present in {target_dir}.')

def ensure_backend_env():
    env_path = os.path.join(BACKEND_DIR, '.env')
    example_path = os.path.join(BACKEND_DIR, 'env.example')
    if not os.path.exists(env_path):
        if os.path.exists(example_path):
            shutil.copy2(example_path, env_path)
            print(f'⚠️  .env file not found in nexus-backend. Created from env.example. Please update credentials and secrets in {env_path}!')
        else:
            print('❌ ERROR: Neither .env nor env.example found in nexus-backend. Please create a .env file with the required environment variables.')
            sys.exit(1)
    else:
        print('✅ .env file found in nexus-backend.')

def main():
    print('--- Starting Nexus Development Environment ---')
    ensure_backend_env()
    # 1. Ensure dependencies
    ensure_python_dependencies()
    ensure_node_dependencies(BACKEND_DIR)
    ensure_node_dependencies(MOBILE_DIR)

    # 2. Start services
    services = [
        ServiceThread('Nexus-AI Backend', f'{sys.executable} app.py', AI_DIR),
        ServiceThread('Nexus Node Backend', 'npm start', BACKEND_DIR),
        ServiceThread('Nexus Mobile App', 'npm start', MOBILE_DIR)
    ]
    for s in services:
        s.start()
    print('\nAll services started. Press Ctrl+C to stop.\n')
    try:
        while any(s.is_alive() for s in services):
            time.sleep(1)
    except KeyboardInterrupt:
        print('\nShutting down all services...')
        for s in services:
            s.stop()
        print('All services terminated.')

if __name__ == '__main__':
    main() 