$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

function Run-Git {
  param(
    [Parameter(Mandatory = $true)]
    [string[]] $Arguments
  )

  & git @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Git command failed: git $($Arguments -join ' ')"
  }
}

function Get-GitOutput {
  param(
    [Parameter(Mandatory = $true)]
    [string[]] $Arguments
  )

  $output = & git @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Git command failed: git $($Arguments -join ' ')"
  }

  return ($output | Out-String).Trim()
}

Write-Host ""
Write-Host "Mr.ATG Blog - GitHub one-click publish" -ForegroundColor Cyan
Write-Host "Repository: $repoRoot"
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is not installed or not available in PATH."
}

$insideWorkTree = Get-GitOutput @("rev-parse", "--is-inside-work-tree")
if ($insideWorkTree -ne "true") {
  throw "This folder is not a Git working tree."
}

$branch = Get-GitOutput @("branch", "--show-current")
if ([string]::IsNullOrWhiteSpace($branch)) {
  throw "Cannot publish while Git is in detached HEAD state."
}

$remoteUrl = Get-GitOutput @("remote", "get-url", "origin")
if ([string]::IsNullOrWhiteSpace($remoteUrl)) {
  throw "Git remote 'origin' is not configured."
}

$status = Get-GitOutput @("status", "--short")
if ([string]::IsNullOrWhiteSpace($status)) {
  Write-Host "No local changes to publish." -ForegroundColor Green
  exit 0
}

Write-Host "Remote: origin -> $remoteUrl"
Write-Host "Branch: $branch"
Write-Host ""
Write-Host "Changes that will be committed and pushed:" -ForegroundColor Yellow
git status --short
if ($LASTEXITCODE -ne 0) {
  throw "Could not read Git status."
}

Write-Host ""
$confirm = Read-Host "Commit ALL changes above and push to GitHub? Type Y to continue"
if ($confirm -ne "Y" -and $confirm -ne "y") {
  Write-Host "Canceled. Nothing was committed or pushed." -ForegroundColor Yellow
  exit 0
}

Write-Host ""
$message = Read-Host "Commit message (leave blank for an automatic message)"
if ([string]::IsNullOrWhiteSpace($message)) {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
  $message = "Update site content $timestamp"
}

Write-Host ""
Write-Host "Staging changes..." -ForegroundColor Cyan
Run-Git @("add", "-A")

$staged = Get-GitOutput @("diff", "--cached", "--name-only")
if ([string]::IsNullOrWhiteSpace($staged)) {
  Write-Host "No staged changes after git add. Nothing to commit." -ForegroundColor Yellow
  exit 0
}

Write-Host "Creating commit..." -ForegroundColor Cyan
Run-Git @("commit", "-m", $message)

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
$upstream = & git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>$null
if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($upstream)) {
  Run-Git @("push")
} else {
  Run-Git @("push", "-u", "origin", $branch)
}

Write-Host ""
Write-Host "Published to GitHub successfully." -ForegroundColor Green
Write-Host "Cloudflare Pages will deploy after GitHub receives the push."
