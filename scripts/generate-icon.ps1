Add-Type -AssemblyName System.Drawing

$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Background squircle
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

# Dark luxury gradient fill
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.PointF(0, 0)),
    (New-Object System.Drawing.PointF(256, 256)),
    [System.Drawing.Color]::FromArgb(255, 18, 20, 24),
    [System.Drawing.Color]::FromArgb(255, 30, 34, 42)
)
$g.FillPath($bgBrush, $path)

# Subtle golden border
$goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 225, 150, 40), 4)
$g.DrawPath($goldPen, $path)

# Inner accent glow
$innerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 255, 255, 255), 1.5)
$innerRect = New-Object System.Drawing.Rectangle(18, 18, 220, 220)
$g.DrawEllipse($innerPen, 40, 40, 176, 176)

# Cloche Dome (Gold/Amber)
$accentColor = [System.Drawing.Color]::FromArgb(255, 245, 166, 35)
$accentBrush = New-Object System.Drawing.SolidBrush($accentColor)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

# Handle knob on top
$g.FillEllipse($accentBrush, 120, 72, 16, 16)
$g.FillRectangle($accentBrush, 124, 84, 8, 8)

# Dome
$g.FillPie($accentBrush, 68, 88, 120, 100, 180, 180)

# Tray base
$trayPen = New-Object System.Drawing.Pen($accentColor, 8)
$trayPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$trayPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($trayPen, 54, 142, 202, 142)

# Steam waves
$steamPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 220, 120), 3)
$steamPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$steamPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawArc($steamPen, 100, 52, 12, 16, -45, 180)
$g.DrawArc($steamPen, 122, 46, 12, 18, -45, 180)
$g.DrawArc($steamPen, 144, 52, 12, 16, -45, 180)

# "RestaurantOS" Text
$fontFamily = [System.Drawing.FontFamily]::GenericSansSerif
$font = New-Object System.Drawing.Font($fontFamily, 14, [System.Drawing.FontStyle]::Bold)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center

$g.DrawString("RESTAURANT", $font, $whiteBrush, 128, 164, $format)
$smallFont = New-Object System.Drawing.Font($fontFamily, 13, [System.Drawing.FontStyle]::Bold)
$amberBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 166, 35))
$g.DrawString("OS", $smallFont, $amberBrush, 128, 188, $format)

$g.Flush()

# Save PNG
$pngPath = "public\icons\restaurant-os.png"
$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Convert to Windows .ICO
function Save-AsIco([string]$sourcePng, [string]$targetIco) {
    $pngBytes = [System.IO.File]::ReadAllBytes($sourcePng)
    $ms = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter($ms)
    
    # ICONDIR
    $bw.Write([UInt16]0) # Reserved
    $bw.Write([UInt16]1) # Resource Type: 1 = Icon
    $bw.Write([UInt16]1) # Image Count: 1
    
    # ICONDIRENTRY
    $bw.Write([Byte]0)   # Width: 0 means 256
    $bw.Write([Byte]0)   # Height: 0 means 256
    $bw.Write([Byte]0)   # Color count: 0
    $bw.Write([Byte]0)   # Reserved: 0
    $bw.Write([UInt16]1) # Planes: 1
    $bw.Write([UInt16]32)# Bit count: 32
    $bw.Write([UInt32]$pngBytes.Length) # Image size
    $bw.Write([UInt32]22) # Image offset (6 + 16 = 22)
    
    # Image data (PNG bytes)
    $bw.Write($pngBytes)
    $bw.Flush()
    
    [System.IO.File]::WriteAllBytes($targetIco, $ms.ToArray())
    $bw.Close()
    $ms.Close()
}

Save-AsIco $pngPath "public\icons\restaurant-os.ico"
Save-AsIco $pngPath "public\favicon.ico"
Save-AsIco $pngPath "restaurant-os.ico"

Write-Host "Icons generated successfully!"
