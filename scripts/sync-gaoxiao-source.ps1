$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
Write-Host '将已经提交的高校风云源码推送到 mratgnothing/mratg-blog 的 main。不会使用强制推送。'
$gxfRemote = & git remote get-url origin
if ($gxfRemote -ne 'https://github.com/mratgnothing/mratg-blog.git') { throw '仓库地址与预期不符，已停止。' }
& git status --short --branch
& git -c http.sslBackend=openssl push origin HEAD:main
if ($LASTEXITCODE -ne 0) { throw '推送未完成。请完成本机 GitHub 登录或处理远端分支更新后重试。不要使用 --force。' }
Write-Host '源码同步完成。Cloudflare 的 Git 自动发布将使用新的游戏页面。'
