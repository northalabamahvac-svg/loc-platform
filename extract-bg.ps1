$content = Get-Content "C:\Users\swatw\Desktop\Blossomwood LOC\extracted\blossomwood\frontend\src\App.jsx" -Raw
$pattern = 'data:image/jpeg;base64,([A-Za-z0-9+/=]+)'
if ($content -match $pattern) {
    $b64 = $Matches[1]
    Write-Host "Found base64, length: $($b64.Length)"
    $bytes = [Convert]::FromBase64String($b64)
    $outPath = "C:\Users\swatw\Desktop\loc-platform\public\bg.jpg"
    [System.IO.File]::WriteAllBytes($outPath, $bytes)
    Write-Host "Saved to $outPath, size: $($bytes.Length) bytes"
} else {
    Write-Host "Not found"
}
