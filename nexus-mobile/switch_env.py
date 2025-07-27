import os
import shutil

ENV_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_ENV = os.path.join(ENV_DIR, '.env.local')
PROD_ENV = os.path.join(ENV_DIR, '.env.production')
TARGET_ENV = os.path.join(ENV_DIR, '.env')

print("Which environment do you want to use?")
print("1) Local (development)")
print("2) Production")
choice = input("Enter 1 or 2: ").strip()

if choice == "1":
    if os.path.isfile(LOCAL_ENV):
        shutil.copyfile(LOCAL_ENV, TARGET_ENV)
        print(".env set to local development.")
    else:
        print(".env.local not found!")
elif choice == "2":
    if os.path.isfile(PROD_ENV):
        shutil.copyfile(PROD_ENV, TARGET_ENV)
        print(".env set to production.")
    else:
        print(".env.production not found!")
else:
    print("Invalid choice.") 