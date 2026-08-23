[CmdletBinding()]
param(
  [ValidateSet('start', 'status', 'stop', 'restart', 'monitor')]
  [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'
$GatewayPortValue = $env:RUNTIME_GATEWAY_LOCAL_PORT
if (-not $GatewayPortValue) { $GatewayPortValue = 18080 }
$SocksPortValue = $env:RUNTIME_EMBEDDING_SOCKS_PORT
if (-not $SocksPortValue) { $SocksPortValue = 18081 }
$GatewayPort = [int]$GatewayPortValue
$SocksPort = [int]$SocksPortValue
$StateDir = $env:RUNTIME_CONNECTIVITY_STATE_DIR
if (-not $StateDir) {
  $stateBase = $env:LOCALAPPDATA
  if (-not $stateBase) { $stateBase = $env:TEMP }
  $StateDir = Join-Path $stateBase 'BidPlatform\runtime-connectivity'
}
$StatePath = Join-Path $StateDir 'state.json'
$StopPath = Join-Path $StateDir 'stop.requested'
$ScriptPath = $PSCommandPath

function Write-Result([hashtable]$Value, [int]$Code = 0) {
  $Value | ConvertTo-Json -Compress
  if ($Code -ne 0) { exit $Code }
}

function Read-State {
  if (-not (Test-Path -LiteralPath $StatePath)) { return $null }
  try { return (Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json) } catch { return $null }
}

function Save-State($State) {
  New-Item -ItemType Directory -Path $StateDir -Force | Out-Null
  $State | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $StatePath -Encoding UTF8
}

function Test-LocalPort([int]$Port) {
  $result = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -WarningAction SilentlyContinue
  return [bool]$result.TcpTestSucceeded
}

function Get-SshPath {
  $candidate = Join-Path $env:SystemRoot 'System32\OpenSSH\ssh.exe'
  if (Test-Path -LiteralPath $candidate) { return $candidate }
  $command = Get-Command ssh.exe -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  throw 'SSH_NOT_FOUND'
}

function Get-Target {
  $target = [string]$env:RUNTIME_SSH_TARGET
  if (-not $target) { $target = [string]$env:RUNTIME_SSH_HOST_ALIAS }
  if (-not $target) { throw 'RUNTIME_SSH_TARGET_NOT_CONFIGURED' }
  return $target.Trim()
}

function Get-ProcessAlive([int]$Pid) {
  if (-not $Pid) { return $false }
  return [bool](Get-Process -Id $Pid -ErrorAction SilentlyContinue)
}

function Start-Ssh($Target) {
  if ((Test-LocalPort $GatewayPort) -or (Test-LocalPort $SocksPort)) {
    throw 'PORT_IN_USE_UNMANAGED'
  }
  $ssh = Get-SshPath
  $args = @('-N', '-T', '-o', 'BatchMode=yes', '-o', 'ServerAliveInterval=30', '-o', 'ServerAliveCountMax=3', '-o', 'TCPKeepAlive=yes', '-o', 'ExitOnForwardFailure=yes', '-L', "$GatewayPort`:127.0.0.1:8080", '-D', "127.0.0.1:$SocksPort")
  if ($env:RUNTIME_SSH_PORT) { $args += @('-p', [string]$env:RUNTIME_SSH_PORT) }
  $args += $Target
  return Start-Process -FilePath $ssh -ArgumentList $args -WindowStyle Hidden -PassThru
}

function Start-Supervisor($Target, $SshPid) {
  $powershell = (Get-Command powershell.exe -ErrorAction SilentlyContinue).Source
  if (-not $powershell) { throw 'POWERSHELL_NOT_FOUND' }
  $args = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $ScriptPath, '-Action', 'monitor')
  return Start-Process -FilePath $powershell -ArgumentList $args -WindowStyle Hidden -PassThru
}

function Get-SafeStatus {
  $state = Read-State
  $sshAlive = $false
  $supervisorAlive = $false
  if ($state) {
    $sshAlive = Get-ProcessAlive ([int]$state.ssh_pid)
    $supervisorAlive = Get-ProcessAlive ([int]$state.supervisor_pid)
  }
  $gatewayOpen = Test-LocalPort $GatewayPort
  $socksOpen = Test-LocalPort $SocksPort
  $healthy = $state -and $sshAlive -and $gatewayOpen -and $socksOpen
  return @{
    status = if ($healthy) { 'ready' } elseif ($state -or $gatewayOpen -or $socksOpen) { 'degraded' } else { 'stopped' }
    managed = [bool]$state
    ssh_pid = if ($state) { [int]$state.ssh_pid } else { $null }
    supervisor_pid = if ($state) { [int]$state.supervisor_pid } else { $null }
    gateway_port = $GatewayPort
    socks_port = $SocksPort
    gateway_port_open = $gatewayOpen
    socks_port_open = $socksOpen
    auto_reconnect = [bool]($state -and $supervisorAlive)
  }
}

function Stop-Managed {
  $state = Read-State
  if (-not $state) { Write-Result @{ status = 'stopped'; managed = $false }; return }
  New-Item -ItemType Directory -Path $StateDir -Force | Out-Null
  New-Item -ItemType File -Path $StopPath -Force | Out-Null
  foreach ($pid in @([int]$state.supervisor_pid, [int]$state.ssh_pid)) {
    if (Get-ProcessAlive $pid) { Stop-Process -Id $pid -ErrorAction SilentlyContinue }
  }
  Start-Sleep -Milliseconds 300
  Remove-Item -LiteralPath $StatePath, $StopPath -Force -ErrorAction SilentlyContinue
  Write-Result @{ status = 'stopped'; managed = $true }
}

function Start-Managed {
  $target = Get-Target
  $state = Read-State
  if ($state -and (Get-ProcessAlive ([int]$state.ssh_pid)) -and (Test-LocalPort $GatewayPort) -and (Test-LocalPort $SocksPort)) {
    Write-Result (Get-SafeStatus)
    return
  }
  if ($state -and ((Test-LocalPort $GatewayPort) -or (Test-LocalPort $SocksPort))) { Write-Result @{ status = 'degraded'; error_class = 'MANAGED_STATE_STALE_PORTS' } 2 }
  $ssh = Start-Ssh $target
  $newState = [ordered]@{ target = $target; ssh_pid = $ssh.Id; supervisor_pid = $null; gateway_port = $GatewayPort; socks_port = $SocksPort; started_at = (Get-Date).ToUniversalTime().ToString('o') }
  Save-State $newState
  Start-Sleep -Milliseconds 500
  $supervisor = Start-Supervisor $target $ssh.Id
  $newState.supervisor_pid = $supervisor.Id
  Save-State $newState
  Write-Result (Get-SafeStatus)
}

function Monitor-Managed {
  while (-not (Test-Path -LiteralPath $StopPath -PathType Leaf -ErrorAction SilentlyContinue)) {
    $state = Read-State
    if (-not $state) { break }
    if (-not (Get-ProcessAlive ([int]$state.ssh_pid))) {
      if ((Test-LocalPort $GatewayPort) -or (Test-LocalPort $SocksPort)) { Start-Sleep -Seconds 5; continue }
      try {
        $ssh = Start-Ssh ([string]$state.target)
        $state.ssh_pid = $ssh.Id
        Save-State $state
      } catch { Start-Sleep -Seconds 5 }
    }
    Start-Sleep -Seconds 5
  }
}

try {
  switch ($Action) {
    'status' { Write-Result (Get-SafeStatus) }
    'start' { Start-Managed }
    'restart' { Stop-Managed; Start-Managed }
    'stop' { Stop-Managed }
    'monitor' { Monitor-Managed }
  }
} catch {
  Write-Result @{ status = 'fail'; error_class = $_.Exception.Message } 2
}
