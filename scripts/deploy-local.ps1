<#
.SYNOPSIS
    Peluncur deployment LSP FIT dari Windows.

.DESCRIPTION
    1. Preflight lokal: cabang sesuai, working tree bersih, sudah di-push.
    2. Menjalankan deploy.sh di server lewat SSH.
    3. Meneruskan kode keluaran script.

    Server harus sudah di-setup mengikuti DEPLOY.md bagian A.

.EXAMPLE
    .\scripts\deploy-local.ps1 -Target root@203.0.113.10
    .\scripts\deploy-local.ps1 -Target root@203.0.113.10 -RemoteDir /var/www/sertifikasifit.com -Doctor
    .\scripts\deploy-local.ps1 -Target root@203.0.113.10 -Rollback -Yes
    .\scripts\deploy-local.ps1 -Target root@203.0.113.10 -DryRun
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Target,

    [string]$RemoteDir = "/var/www/sertifikasifit.com",

    [string]$Branch = "lspfit",

    [int]$SshPort = 22,

    [switch]$Doctor,
    [switch]$Status,
    [switch]$Rollback,
    [switch]$DryRun,
    [switch]$AllowDestructive,
    [switch]$Yes,
    [switch]$NoAutoRollback,
    [string]$BackupStamp = "",
    [switch]$SkipPreflight
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) { Write-Host "[deploy] $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message)   { Write-Host "[deploy] OK   $Message" -ForegroundColor Green }
function Write-Bad([string]$Message)  { Write-Host "[deploy] GAGAL $Message" -ForegroundColor Red }

$RepoRoot = Split-Path -Parent $PSScriptRoot

if (-not $SkipPreflight) {
    Write-Step "Preflight lokal di $RepoRoot"

    if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
        Write-Bad "$RepoRoot bukan repository git."
        exit 1
    }

    $current = (git -C $RepoRoot rev-parse --abbrev-ref HEAD 2>$null)
    if ($current -ne $Branch) {
        Write-Bad "Cabang saat ini '$current', diharapkan '$Branch'. Jalankan: git checkout $Branch"
        exit 1
    }
    Write-Ok "cabang $Branch"

    $dirty = (git -C $RepoRoot status --porcelain 2>$null)
    if ($dirty) {
        Write-Bad "Masih ada perubahan yang belum di-commit:"
        $dirty -split "`n" | ForEach-Object { Write-Host "       $_" }
        Write-Host "       Jalankan: git add -A && git commit -m `"pesan`" && git push origin $Branch"
        exit 1
    }
    Write-Ok "working tree bersih"

    $counts = (git -C $RepoRoot rev-list --left-right --count "$Branch...@{u}" 2>$null)
    if ($counts) {
        $parts = $counts -split "\s+"
        $ahead = [int]$parts[0]
        $behind = [int]$parts[1]
        if ($ahead -gt 0) {
            Write-Bad "Ada $ahead commit lokal yang belum di-push ke origin/$Branch."
            exit 1
        }
        if ($behind -gt 0) {
            Write-Bad "origin/$Branch lebih maju $behind commit. Jalankan: git pull --rebase origin $Branch"
            exit 1
        }
        Write-Ok "sinkron dengan origin/$Branch"
    }
    else {
        Write-Bad "Tidak menemukan upstream untuk $Branch (belum di-push?)."
        exit 1
    }
}

# Susun perintah di server
$command = "deploy"
if ($Doctor)   { $command = "doctor" }
if ($Status)   { $command = "status" }
if ($Rollback) { $command = "rollback" }

$flags = @()
if ($DryRun)            { $flags += "--dry-run" }
if ($AllowDestructive)  { $flags += "--allow-destructive" }
if ($NoAutoRollback)    { $flags += "--no-auto-rollback" }
if ($Yes)               { $flags += "--yes" }
if ($BackupStamp)       { $flags += "--backup=$BackupStamp" }

$remoteCmd = "cd '$RemoteDir' && bash ./deploy.sh $command"
if ($flags.Count -gt 0) { $remoteCmd = "$remoteCmd " + ($flags -join " ") }

Write-Step "SSH $Target -> $remoteCmd"

$sshArgs = @("-p", "$SshPort", $Target, $remoteCmd)
& ssh @sshArgs
$exit = $LASTEXITCODE

if ($exit -ne 0) {
    Write-Bad "deploy.sh keluar dengan kode $exit"
    exit $exit
}

Write-Ok "selesai"
exit 0
