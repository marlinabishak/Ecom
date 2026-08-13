import os
import zipfile

source_dir = r"C:\Users\marlin\OneDrive\Desktop\workss\ecom"
output_path = r"C:\Users\marlin\.gemini\antigravity-ide\brain\f091da17-56fb-4c70-a5de-9430c6eb4522\final_ecom_project.zip"

def should_exclude(path):
    exclusions = ["node_modules", "__pycache__", ".git", ".env", "zip_project.py", "venv", ".pytest_cache", "ecom_project.zip"]
    for ex in exclusions:
        if os.sep + ex + os.sep in path or path.endswith(os.sep + ex):
            return True
    return False

print(f"Creating ZIP file at {output_path}...")

with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_dir):
        # Filter directories to prevent traversing into excluded ones
        dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d))]
        
        for file in files:
            file_path = os.path.join(root, file)
            if not should_exclude(file_path):
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)

print("ZIP creation complete!")
