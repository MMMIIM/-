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

if ([string]::IsNullOrWhiteSpace($env:SEMANTIC_GATEWAY_PROVIDER_API_KEY)) {
  throw 'SEMANTIC_GATEWAY_PROVIDER_API_KEY is required but will not be printed.'
}
if ([string]::IsNullOrWhiteSpace($env:SEMANTIC_GATEWAY_API_KEY)) {
  throw 'SEMANTIC_GATEWAY_API_KEY is required but will not be printed.'
}

npm run start -w semantic-gateway
