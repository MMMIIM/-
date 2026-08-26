$ErrorActionPreference = 'Stop'

$serviceRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $serviceRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
  throw 'services/semantic-gateway/.env is required. Copy .env.example locally and fill secrets without committing it.'
}

foreach ($line in Get-Content -LiteralPath $envFile) {
  if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$') {
    $name = $Matches[1]
    $value = $Matches[2].Trim()
    if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    Set-Item -Path "Env:$name" -Value $value
  }
}

# Inject the deployed source revision when the runtime did not provide one.
# This is diagnostic metadata only; no secret or request data is persisted.
if ([string]::IsNullOrWhiteSpace($env:SEMANTIC_GATEWAY_COMMIT)) {
  try {
    $repositoryRoot = Resolve-Path (Join-Path $serviceRoot '..\..')
    $revision = (& git -C $repositoryRoot.Path rev-parse --short HEAD 2>$null).Trim()
    if (-not [string]::IsNullOrWhiteSpace($revision)) {
      Set-Item -Path 'Env:SEMANTIC_GATEWAY_COMMIT' -Value $revision
    }
  } catch {
    # A packaged deployment may not contain a .git directory. In that case
    # the externally injected revision remains the authoritative value.
  }
}

if ([string]::IsNullOrWhiteSpace($env:SEMANTIC_GATEWAY_PROVIDER_API_KEY)) {
  throw 'SEMANTIC_GATEWAY_PROVIDER_API_KEY is required but will not be printed.'
}
if ([string]::IsNullOrWhiteSpace($env:SEMANTIC_GATEWAY_API_KEY)) {
  throw 'SEMANTIC_GATEWAY_API_KEY is required but will not be printed.'
}

npm run start -w semantic-gateway
