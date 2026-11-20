$ErrorActionPreference = "Stop"

$workspaceDir = (Get-Item -Path ".").FullName
$iconPath = Join-Path $workspaceDir "restaurant-os.ico"
$targetBat = Join-Path $workspaceDir "Launch-RestaurantOS.bat"

# Detect actual desktop path (including OneDrive redirected Desktop)
$desktopPaths = @(
    [Environment]::GetFolderPath('Desktop'),
    (Join-Path $env:USERPROFILE "Desktop"),
    (Join-Path $env:USERPROFILE "OneDrive\Desktop"),
    "C:\Users\VICTUS\Desktop",
    "C:\Users\VICTUS\OneDrive\Desktop"
) | Select-Object -Unique

$createdCount = 0
$WshShell = New-Object -ComObject WScript.Shell

foreach ($d in $desktopPaths) {
    if (Test-Path $d) {
        try {
            $shortcutPath = Join-Path $d "RestaurantOS.lnk"
            $shortcut = $WshShell.CreateShortcut($shortcutPath)
            $shortcut.TargetPath = $targetBat
            $shortcut.WorkingDirectory = $workspaceDir
            $shortcut.IconLocation = "$iconPath,0"
            $shortcut.Description = "RestaurantOS - Premium Restaurant POS, Tables & KDS"
            $shortcut.WindowStyle = 1
            $shortcut.Save()
            Write-Host "Created desktop shortcut at: $shortcutPath"
            $createdCount++
        } catch {
            Write-Warning "Could not write to $($d): $_"
        }
    }
}

if ($createdCount -gt 0) {
    Write-Host "SUCCESS: RestaurantOS Desktop Shortcut created with icon!"
} else {
    Write-Warning "No accessible desktop folder found automatically."
}
