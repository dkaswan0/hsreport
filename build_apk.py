import os
import sys
import subprocess
import zipfile
import shutil
import tempfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

SDK = r'C:\Users\1medo\AppData\Local\Android\Sdk'
BUILD_TOOLS = os.path.join(SDK, 'build-tools', '34.0.0')
PLATFORM = os.path.join(SDK, 'platforms', 'android-34')

AAPT2 = os.path.join(BUILD_TOOLS, 'aapt2.exe')
D8 = os.path.join(BUILD_TOOLS, 'd8.bat')
ZIPALIGN = os.path.join(BUILD_TOOLS, 'zipalign.exe')
APKSIGNER = os.path.join(BUILD_TOOLS, 'apksigner.bat')
ANDROID_JAR = os.path.join(PLATFORM, 'android.jar')

PROJECT_ROOT = os.path.abspath('.')
SRC_DIR = os.path.join(PROJECT_ROOT, 'android', 'app', 'src', 'main')
FINAL_OUTPUT_APK = os.path.join(PROJECT_ROOT, 'HighSafetyReport.apk')

# Use ASCII temp build directory for Windows tool compatibility
TEMP_DIR = os.path.join(tempfile.gettempdir(), 'hs_apk_build')

def run_cmd(cmd, cwd=None):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd, encoding='utf-8', errors='replace')
    if res.stdout:
        print(res.stdout)
    if res.returncode != 0:
        print(f"Error output:\n{res.stderr}")
        raise RuntimeError(f"Command failed with code {res.returncode}")
    return res.stdout

def build():
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)

    os.makedirs(TEMP_DIR, exist_ok=True)
    os.makedirs(os.path.join(TEMP_DIR, 'compiled_res'), exist_ok=True)
    os.makedirs(os.path.join(TEMP_DIR, 'gen'), exist_ok=True)
    os.makedirs(os.path.join(TEMP_DIR, 'obj'), exist_ok=True)
    os.makedirs(os.path.join(TEMP_DIR, 'dex'), exist_ok=True)

    # Copy src files to temp directory
    shutil.copytree(os.path.join(SRC_DIR, 'res'), os.path.join(TEMP_DIR, 'res'))
    shutil.copytree(os.path.join(SRC_DIR, 'java'), os.path.join(TEMP_DIR, 'java'))
    shutil.copy(os.path.join(SRC_DIR, 'AndroidManifest.xml'), os.path.join(TEMP_DIR, 'AndroidManifest.xml'))

    res_dir = os.path.join(TEMP_DIR, 'res')
    manifest_xml = os.path.join(TEMP_DIR, 'AndroidManifest.xml')

    # Step 1: AAPT2 Compile Resources
    print("--- 1. Compiling Android Resources with AAPT2 ---")
    compiled_res_zip = os.path.join(TEMP_DIR, 'compiled_res', 'resources.zip')
    run_cmd(f'"{AAPT2}" compile --dir "{res_dir}" -o "{compiled_res_zip}"', cwd=TEMP_DIR)

    # Step 2: AAPT2 Link Resources & Generate R.java + base APK
    print("--- 2. Linking Resources and generating R.java ---")
    base_apk = os.path.join(TEMP_DIR, 'base.apk')
    run_cmd(f'"{AAPT2}" link -I "{ANDROID_JAR}" --manifest "{manifest_xml}" --java "{os.path.join(TEMP_DIR, "gen")}" -o "{base_apk}" --auto-add-overlay "{compiled_res_zip}"', cwd=TEMP_DIR)

    # Step 3: Compile Java source code
    print("--- 3. Compiling Java Source Files with javac ---")
    java_files = []
    for root, _, files in os.walk(os.path.join(TEMP_DIR, 'java')):
        for f in files:
            if f.endswith('.java'):
                java_files.append(os.path.join(root, f))
    for root, _, files in os.walk(os.path.join(TEMP_DIR, 'gen')):
        for f in files:
            if f.endswith('.java'):
                java_files.append(os.path.join(root, f))

    java_files_str = " ".join([f'"{f}"' for f in java_files])
    obj_dir = os.path.join(TEMP_DIR, 'obj')
    run_cmd(f'javac -encoding UTF-8 -cp "{ANDROID_JAR}" -d "{obj_dir}" {java_files_str}', cwd=TEMP_DIR)

    # Step 4: Convert Java bytecode to Dalvik Executable (classes.dex) with D8
    print("--- 4. Generating classes.dex with D8 ---")
    class_files = []
    for root, _, files in os.walk(obj_dir):
        for f in files:
            if f.endswith('.class'):
                class_files.append(os.path.join(root, f))
    class_files_str = " ".join([f'"{f}"' for f in class_files])
    dex_dir = os.path.join(TEMP_DIR, 'dex')
    run_cmd(f'"{D8}" --min-api 24 --lib "{ANDROID_JAR}" --output "{dex_dir}" {class_files_str}', cwd=TEMP_DIR)

    # Step 5: Merge classes.dex into base APK
    print("--- 5. Packaging classes.dex into APK ---")
    unaligned_apk = os.path.join(TEMP_DIR, 'unaligned.apk')
    shutil.copy(base_apk, unaligned_apk)

    with zipfile.ZipFile(unaligned_apk, 'a') as zf:
        dex_path = os.path.join(dex_dir, 'classes.dex')
        zf.write(dex_path, 'classes.dex')

    # Step 6: Zipalign APK (4-byte boundary)
    print("--- 6. Aligning APK with zipalign ---")
    aligned_apk = os.path.join(TEMP_DIR, 'aligned.apk')
    run_cmd(f'"{ZIPALIGN}" -f -p 4 "{unaligned_apk}" "{aligned_apk}"', cwd=TEMP_DIR)

    # Step 7: Create Debug Keystore if needed
    keystore_path = os.path.join(TEMP_DIR, 'debug.keystore')
    print("--- 7. Generating Debug Keystore ---")
    run_cmd(f'keytool -genkey -v -keystore "{keystore_path}" -alias androiddebugkey -storepass android -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=HighSafety, OU=Mobile, O=HighSafety, L=Riyadh, ST=Riyadh, C=SA"')

    # Step 8: Sign APK with apksigner inside TEMP_DIR
    print("--- 8. Signing APK with apksigner ---")
    temp_signed_apk = os.path.join(TEMP_DIR, 'HighSafetyReport.apk')
    run_cmd(f'"{APKSIGNER}" sign --ks "{keystore_path}" --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android --out "{temp_signed_apk}" "{aligned_apk}"', cwd=TEMP_DIR)

    # Copy signed APK to project root
    shutil.copy(temp_signed_apk, FINAL_OUTPUT_APK)

    print("\n=======================================================")
    print("🎉 SUCCESS! APK BUILT & SIGNED SUCCESSFULLY:")
    print(f"📦 File: {FINAL_OUTPUT_APK}")
    print(f"📊 Size: {os.path.getsize(FINAL_OUTPUT_APK):,} bytes")
    print("=======================================================\n")

if __name__ == '__main__':
    build()
