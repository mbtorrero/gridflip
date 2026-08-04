Add-Type -AssemblyName System.Drawing

$gameDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$assetsPath = Join-Path $gameDir 'assets.js'

$raw = Get-Content -Path $assetsPath -Raw -Encoding UTF8
$raw = $raw.TrimStart([char]0xFEFF)
$raw = $raw -replace '^\s*window\.assets\s*=\s*', ''
$raw = $raw.Trim().TrimEnd(';')
$assets = $raw | ConvertFrom-Json

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("// Precomputed per-sprite pixel data, generated from assets/img/sprites/**")
[void]$sb.AppendLine("// via scripts_gen_nonogram_data.ps1 (System.Drawing, no runtime canvas decode --")
[void]$sb.AppendLine("// Chrome taints a canvas fed by a separate file:// image, so getImageData()")
[void]$sb.AppendLine("// throws under file://; this file precomputes what that call would have read).")
[void]$sb.AppendLine("// data is a row-major string, one char per pixel: '1' opaque white, '0' opaque")
[void]$sb.AppendLine("// black, '-' transparent/anything else (ignored). index.js indexes it as")
[void]$sb.AppendLine("// data[row * w + col].")
[void]$sb.AppendLine("window.nonogram_data = [")

$count = 0
foreach ($a in $assets) {
    if ($a.id -eq 'bg' -or $a.type -ne 'image') { continue }
    $imgPath = Join-Path $gameDir ($a.src -replace '/', [System.IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path $imgPath)) { Write-Warning "Missing file: $imgPath"; continue }

    $bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
    $w = $bmp.Width
    $h = $bmp.Height
    $chars = New-Object System.Text.StringBuilder ($w * $h)

    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $px = $bmp.GetPixel($x, $y)
            if ($px.A -lt 200) {
                [void]$chars.Append('-')
            } elseif ($px.R -ge 200 -and $px.G -ge 200 -and $px.B -ge 200) {
                [void]$chars.Append('1')
            } elseif ($px.R -le 50 -and $px.G -le 50 -and $px.B -le 50) {
                [void]$chars.Append('0')
            } else {
                [void]$chars.Append('-')
            }
        }
    }
    $bmp.Dispose()

    [void]$sb.AppendLine("  {`"id`":`"$($a.id)`",`"w`":$w,`"h`":$h,`"data`":`"$($chars.ToString())`"},")
    $count++
}

[void]$sb.AppendLine("];")

$outPath = Join-Path $gameDir 'nonogram_data.js'
[System.IO.File]::WriteAllText($outPath, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Wrote $count entries to $outPath"
