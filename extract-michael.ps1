$content = Get-Content "C:\Users\swatw\Desktop\Blossomwood LOC\extracted\blossomwood\frontend\src\App.jsx" -Raw
$idx = $content.IndexOf('const MICHAEL_FACE = "data:image/jpeg;base64,')
$start = $idx + 'const MICHAEL_FACE = "data:image/jpeg;base64,'.Length
$end = $content.IndexOf('"', $start)
$b64 = $content.Substring($start, $end - $start)
Write-Host "Base64 length: $($b64.Length)"
$bytes = [Convert]::FromBase64String($b64)
[System.IO.File]::WriteAllBytes("C:\Users\swatw\Desktop\loc-platform\public\michael.jpg", $bytes)
Write-Host "Saved michael.jpg, $($bytes.Length) bytes"
