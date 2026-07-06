param(
  [string]$Root = "F:\ADR20",
  [string]$OutFile = "F:\ADR20\DATA\canonical-manifest.json"
)

$ErrorActionPreference = "Stop"

function Read-Text([string]$Path) {
  return Get-Content -Raw -Encoding UTF8 $Path
}

function RelPath([string]$Path) {
  $fullRoot = [System.IO.Path]::GetFullPath($Root).TrimEnd('\')
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  return ($fullPath.Substring($fullRoot.Length + 1) -replace '\\', '/')
}

function Get-LineCount([string]$Path) {
  return (Get-Content -Encoding UTF8 $Path | Measure-Object -Line).Lines
}

function Get-RegexMatches([string]$Path, [string]$Pattern, [int]$Group = 1) {
  $text = Read-Text $Path
  $matches = [regex]::Matches($text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
  $values = New-Object System.Collections.Generic.List[string]
  foreach ($m in $matches) {
    $values.Add($m.Groups[$Group].Value)
  }
  return @($values | Select-Object -Unique)
}

function Get-SourceFiles {
  $dirs = @(
    "ORIGINAL\script",
    "ORIGINAL\script\events",
    "ORIGINAL\css",
    "ORIGINAL\lang",
    "ORIGINAL\doc"
  )

  $files = New-Object System.Collections.Generic.List[object]
  foreach ($dir in $dirs) {
    $absDir = Join-Path $Root $dir
    if (Test-Path $absDir) {
      Get-ChildItem -Path $absDir -File -Recurse | Sort-Object FullName | ForEach-Object {
        $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName
        $files.Add([ordered]@{
          path = RelPath $_.FullName
          bytes = $_.Length
          lines = Get-LineCount $_.FullName
          sha256 = $hash.Hash.ToLowerInvariant()
        })
      }
    }
  }

  foreach ($file in @("ORIGINAL\index.html", "ORIGINAL\browserWarning.html", "ORIGINAL\mobileWarning.html", "ORIGINAL\package.json", "ORIGINAL\README.md", "ORIGINAL\LICENSE.md")) {
    $abs = Join-Path $Root $file
    if (Test-Path $abs) {
      $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $abs
      $files.Add([ordered]@{
        path = RelPath $abs
        bytes = (Get-Item $abs).Length
        lines = Get-LineCount $abs
        sha256 = $hash.Hash.ToLowerInvariant()
      })
    }
  }

  return $files.ToArray()
}

$room = Join-Path $Root "ORIGINAL\script\room.js"
$outside = Join-Path $Root "ORIGINAL\script\outside.js"
$world = Join-Path $Root "ORIGINAL\script\world.js"
$path = Join-Path $Root "ORIGINAL\script\path.js"
$fabricator = Join-Path $Root "ORIGINAL\script\fabricator.js"
$engine = Join-Path $Root "ORIGINAL\script\engine.js"
$prestige = Join-Path $Root "ORIGINAL\script\prestige.js"
$audio = Join-Path $Root "ORIGINAL\script\audioLibrary.js"
$eventsDir = Join-Path $Root "ORIGINAL\script\events"

$eventFiles = Get-ChildItem -Path $eventsDir -File -Filter "*.js" | Sort-Object Name
$eventTitles = New-Object System.Collections.Generic.List[object]
$eventFilePaths = New-Object System.Collections.Generic.List[string]
foreach ($file in $eventFiles) {
  $eventFilePaths.Add((RelPath $file.FullName))
  $titles = Get-RegexMatches $file.FullName "title:\s*_\('([^']+)'\)" 1
  foreach ($title in $titles) {
    $eventTitles.Add([ordered]@{
      file = RelPath $file.FullName
      title = $title
    })
  }
}

$manifest = [ordered]@{
  generatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
  source = [ordered]@{
    repository = "https://github.com/doublespeakgames/adarkroom"
    commit = "1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7"
    localRoot = (Join-Path $Root "ORIGINAL")
  }
  files = Get-SourceFiles
  keys = [ordered]@{
    roomDefinitions = Get-RegexMatches $room "^\s{2,}'([^']+)':\s*\{" 1
    workers = Get-RegexMatches $outside "^\s{2,}'([^']+)':\s*\{" 1
    weapons = Get-RegexMatches $world "^\s{4}'([^']+)':\s*\{" 1
    fabricatorCraftables = Get-RegexMatches $fabricator "^\s{4}'([^']+)':\s*\{" 1
    perks = Get-RegexMatches $engine "^\s{6}'([^']+)':\s*\{" 1
    prestigeStores = Get-RegexMatches $prestige "store:\s*'([^']+)'" 1
    pathWeightOverrides = Get-RegexMatches $path "^[\t ]+'([^']+)':\s*[0-9]" 1
    audioConstants = Get-RegexMatches $audio "^\s{4}([A-Z0-9_]+):" 1
    worldTileConstants = Get-RegexMatches $world "^\s{4}([A-Z_]+):\s*'[^']+'" 1
    worldLandmarkAssignments = Get-RegexMatches $world "World\.LANDMARKS\[World\.TILE\.([A-Z_]+)\]" 1
  }
  events = [ordered]@{
    files = $eventFilePaths.ToArray()
    titles = $eventTitles.ToArray()
  }
}

$json = $manifest | ConvertTo-Json -Depth 8
$outDir = Split-Path -Parent $OutFile
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Set-Content -Encoding UTF8 -Path $OutFile -Value $json
Write-Host "Wrote $OutFile"
