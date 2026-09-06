$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$env:XDG_CONFIG_HOME = Join-Path (Get-Location) 'tmp\cloudflare'
$env:WRANGLER_LOG_PATH = Join-Path (Get-Location) 'tmp\cloudflare-login.log'
New-Item -ItemType Directory -Force -Path $env:XDG_CONFIG_HOME | Out-Null
& .\node_modules\.bin\wrangler.cmd login
if ($LASTEXITCODE -ne 0) { throw 'Cloudflare 登录未完成。请按浏览器中的官方提示完成授权后重试。' }
& .\node_modules\.bin\wrangler.cmd whoami
if ($LASTEXITCODE -ne 0) { throw '无法确认 Cloudflare 登录状态。' }
Write-Host 'Cloudflare 登录完成。请回到 Codex 告知已登录，以继续部署并核验线上对局。'
