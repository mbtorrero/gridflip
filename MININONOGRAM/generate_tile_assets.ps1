Add-Type -AssemblyName System.Drawing

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$imgDir = Join-Path $dir 'assets\img'

function New-Tile {
    param($Path, [ScriptBlock]$Draw)
    $bmp = New-Object System.Drawing.Bitmap 32, 32
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)
    & $Draw $g
    $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$baseFill   = [System.Drawing.Color]::FromArgb(255, 18, 34, 74)
$baseBorder = [System.Drawing.Color]::FromArgb(255, 70, 95, 150)
$goldFill   = [System.Drawing.Color]::FromArgb(255, 255, 200, 61)
$goldBorder = [System.Drawing.Color]::FromArgb(255, 196, 140, 24)
$markColor  = [System.Drawing.Color]::FromArgb(255, 92, 231, 255)

New-Tile (Join-Path $imgDir 'tile_unpressed.png') {
    param($g)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush($baseFill)), 0, 0, 32, 32)
    $g.DrawRectangle((New-Object System.Drawing.Pen($baseBorder, 2)), 1, 1, 29, 29)
}

New-Tile (Join-Path $imgDir 'tile_pressed.png') {
    param($g)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush($goldFill)), 0, 0, 32, 32)
    $g.DrawRectangle((New-Object System.Drawing.Pen($goldBorder, 2)), 1, 1, 29, 29)
}

New-Tile (Join-Path $imgDir 'tile_marked.png') {
    param($g)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush($baseFill)), 0, 0, 32, 32)
    $g.DrawRectangle((New-Object System.Drawing.Pen($baseBorder, 2)), 1, 1, 29, 29)
    $g.FillEllipse((New-Object System.Drawing.SolidBrush($markColor)), 11, 11, 10, 10)
}

Write-Host "Wrote tile_unpressed.png, tile_pressed.png, tile_marked.png to $imgDir"
