param([string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")))

$ErrorActionPreference = "Stop"
$generator = Join-Path $Root "REMAKE\scripts\generate-parity-graph.mjs"

Push-Location (Join-Path $Root "REMAKE")
try {
  & node $generator
  if ($LASTEXITCODE -ne 0) {
    throw "Canonical manifest and parity graph generation failed."
  }
}
finally {
  Pop-Location
}
