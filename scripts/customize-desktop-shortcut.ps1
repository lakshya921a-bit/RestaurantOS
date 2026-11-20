param (
    [string]$AppName = "RestaurantOS",
    [string]$IconChoice = "gold" # gold, emerald, flame, sapphire, or custom path
)

$ErrorActionPreference = "Stop"

$workspaceDir = (Get-Item -Path ".").FullName
$targetBat = Join-Path $workspaceDir "Launch-RestaurantOS.bat"

# Determine icon path
$iconFile = "restaurant-os.ico"
if ($IconChoice -eq "emerald" -or $IconChoice -eq "2") {
    $iconFile = "icon-emerald.ico"
} elseif ($IconChoice -eq "flame" -or $IconChoice -eq "3") {
    $iconFile = "icon-flame.ico"
} elseif ($IconChoice -eq "sapphire" -or $IconChoice -eq "4") {
    $iconFile = "icon-sapphire.ico"
} elseif ($IconChoice -eq "gold" -or $IconChoice -eq "1") {
    $iconFile = "icon-gold.ico"
} elseif (Test-Path $IconChoice) {
    $iconFile = $IconChoice
}

$iconFullPath = Join-Path $workspaceDir $iconFile
if (-not (Test-Path $iconFullPath)) {
    if (Test-Path $IconChoice) {
        $iconFullPath = $IconChoice
    } else {
        $iconFullPath = Join-Path $workspaceDir "restaurant-os.ico"
    }
}

# Update default icon file so launcher references it
if (Test-Path $iconFullPath) {
    Copy-Item -Path $iconFullPath -Destination (Join-Path $workspaceDir "restaurant-os.ico") -Force
}

# Clean App Name for filename (remove invalid chars)
$cleanName = $AppName -replace '[\\/:*?"<>|]', ''
if ([string]::IsNullOrWhiteSpace($cleanName)) {
    $cleanName = "RestaurantOS"
}

# Detect desktop paths
$desktopPaths = @(
    [Environment]::GetFolderPath('Desktop'),
    (Join-Path $env:USERPROFILE "Desktop"),
    (Join-Path $env:USERPROFILE "OneDrive\Desktop"),
    "C:\Users\VICTUS\Desktop",
    "C:\Users\VICTUS\OneDrive\Desktop"
) | Select-Object -Unique

$WshShell = New-Object -ComObject WScript.Shell
$createdCount = 0

foreach ($d in $desktopPaths) {
    if (Test-Path $d) {
        try {
            # Remove previous shortcuts if renamed
            Get-ChildItem -Path $d -Filter "*RestaurantOS*.lnk" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

            $shortcutPath = Join-Path $d "$cleanName.lnk"
            $shortcut = $WshShell.CreateShortcut($shortcutPath)
            $shortcut.TargetPath = $targetBat
            $shortcut.WorkingDirectory = $workspaceDir
            $shortcut.IconLocation = "$iconFullPath,0"
            $shortcut.Description = "$cleanName - Restaurant Operations & POS"
            $shortcut.WindowStyle = 1
            $shortcut.Save()
            Write-Host "Created shortcut: $shortcutPath"
            $createdCount++
        } catch {
            Write-Warning "Could not update in $($d): $_"
        }
    }
}

if ($createdCount -gt 0) {
    Write-Host "SUCCESS: Desktop shortcut updated to '$cleanName' with chosen icon!"
} else {
    Write-Warning "No accessible desktop folder found."
}
