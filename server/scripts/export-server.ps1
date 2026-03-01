# PowerShell Script: Export Node.js Server for Production
# Usage: Run from the server directory

# 1. Clean previous export
$exportDir = "../server-export"
if (Test-Path $exportDir) {
    Write-Host "Removing previous export directory..."
    Remove-Item -Recurse -Force $exportDir
}

# 2. Create export directory
Write-Host "Creating export directory..."
New-Item -ItemType Directory -Path $exportDir

# 3. Copy important TypeScript/server files
$filesToCopy = @(
    "src",              # All TypeScript source code
    "tsconfig.json",    # TypeScript config
    "package.json",
    "package-lock.json",
    ".env.example",
    "README.md",
    "SETUP.md",
    "SECURITY_AUDIT.md"
)
foreach ($item in $filesToCopy) {
    if (Test-Path $item) {
        Write-Host "Copying $item..."
        Copy-Item $item -Destination $exportDir -Recurse -Force
    }
}

# 4. (Optional) Zip the export
$zipPath = "../server-export-ts.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}
Write-Host "Creating zip archive..."
Compress-Archive -Path $exportDir\* -DestinationPath $zipPath

Write-Host "TypeScript export complete!"
