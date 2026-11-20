Add-Type -AssemblyName System.Drawing

function Generate-Variant([string]$name, [System.Drawing.Color]$primaryColor, [System.Drawing.Color]$accentColor, [System.Drawing.Color]$borderColor) {
    $size = 256
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background Squircle
    $rect = New-Object System.Drawing.Rectangle(12, 12, 232, 232)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = 48
    $diameter = $radius * 2
    $arc = New-Object System.Drawing.Rectangle($rect.X, $rect.Y, $diameter, $diameter)
    $path.AddArc($arc, 180, 90)
    $arc.X = $rect.Right - $diameter
    $path.AddArc($arc, 270, 90)
    $arc.Y = $rect.Bottom - $diameter
    $path.AddArc($arc, 0, 90)
    $arc.X = $rect.Left
    $path.AddArc($arc, 90, 90)
    $path.CloseFigure()

    # Dark background with gradient
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF(0, 0)),
        (New-Object System.Drawing.PointF(256, 256)),
        [System.Drawing.Color]::FromArgb(255, 14, 17, 23),
        [System.Drawing.Color]::FromArgb(255, 26, 32, 44)
    )
    $g.FillPath($bgBrush, $path)

    # Border
    $borderPen = New-Object System.Drawing.Pen($borderColor, 4)
    $g.DrawPath($borderPen, $path)

    # Primary Chef Cloche / Monogram
    $accentBrush = New-Object System.Drawing.SolidBrush($accentColor)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

    # Handle knob
    $g.FillEllipse($accentBrush, 120, 68, 16, 16)
    $g.FillRectangle($accentBrush, 124, 80, 8, 8)

    # Dome
    $g.FillPie($accentBrush, 68, 84, 120, 104, 180, 180)

    # Base tray
    $trayPen = New-Object System.Drawing.Pen($accentColor, 8)
    $trayPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $trayPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($trayPen, 54, 140, 202, 140)

    # Steam lines
    $steamPen = New-Object System.Drawing.Pen($primaryColor, 3)
    $steamPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $steamPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawArc($steamPen, 100, 48, 12, 16, -45, 180)
    $g.DrawArc($steamPen, 122, 42, 12, 18, -45, 180)
    $g.DrawArc($steamPen, 144, 48, 12, 16, -45, 180)

    # Typography
    $fontFamily = [System.Drawing.FontFamily]::GenericSansSerif
    $font = New-Object System.Drawing.Font($fontFamily, 14, [System.Drawing.FontStyle]::Bold)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString("RESTAURANT", $font, $whiteBrush, 128, 164, $format)

    $smallFont = New-Object System.Drawing.Font($fontFamily, 13, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("OS", $smallFont, $accentBrush, 128, 188, $format)

    $g.Flush()

    # Save PNG
    $pngPath = "public\icons\$name.png"
    $bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

    # Save ICO
    $pngBytes = [System.IO.File]::ReadAllBytes($pngPath)
    $ms = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter($ms)
    $bw.Write([UInt16]0)
    $bw.Write([UInt16]1)
    $bw.Write([UInt16]1)
    $bw.Write([Byte]0)
    $bw.Write([Byte]0)
    $bw.Write([Byte]0)
    $bw.Write([Byte]0)
    $bw.Write([UInt16]1)
    $bw.Write([UInt16]32)
    $bw.Write([UInt32]$pngBytes.Length)
    $bw.Write([UInt32]22)
    $bw.Write($pngBytes)
    $bw.Flush()

    [System.IO.File]::WriteAllBytes("public\icons\$name.ico", $ms.ToArray())
    [System.IO.File]::WriteAllBytes("$name.ico", $ms.ToArray())
    $bw.Close()
    $ms.Close()
    Write-Host "Created $name.ico and $name.png"
}

# 1. Gold Luxury
Generate-Variant "icon-gold" ([System.Drawing.Color]::FromArgb(255, 255, 215, 0)) ([System.Drawing.Color]::FromArgb(255, 245, 166, 35)) ([System.Drawing.Color]::FromArgb(200, 225, 150, 40))

# 2. Emerald Bistro
Generate-Variant "icon-emerald" ([System.Drawing.Color]::FromArgb(255, 52, 211, 153)) ([System.Drawing.Color]::FromArgb(255, 16, 185, 129)) ([System.Drawing.Color]::FromArgb(200, 16, 185, 129))

# 3. Ruby Flame
Generate-Variant "icon-flame" ([System.Drawing.Color]::FromArgb(255, 251, 146, 60)) ([System.Drawing.Color]::FromArgb(255, 239, 68, 68)) ([System.Drawing.Color]::FromArgb(200, 239, 68, 68))

# 4. Royal Sapphire
Generate-Variant "icon-sapphire" ([System.Drawing.Color]::FromArgb(255, 96, 165, 250)) ([System.Drawing.Color]::FromArgb(255, 59, 130, 246)) ([System.Drawing.Color]::FromArgb(200, 59, 130, 246))

Write-Host "All 4 Icon Themes Generated Successfully!"
