Param(
    [Parameter(Mandatory=$true)] [string]$AcrUser,
    [Parameter(Mandatory=$true)] [string]$AcrPassword,
    [Parameter(Mandatory=$false)] [string]$Registry = 'crpi-rluo2fbrl2jbhstr.cn-hangzhou.personal.cr.aliyuncs.com',
    [Parameter(Mandatory=$false)] [string]$Namespace = 'ai-travel-planner',
    [Parameter(Mandatory=$false)] [string]$Image = 'ai-travel-planner',
    [Parameter(Mandatory=$false)] [string]$Tag = 'latest',
    [Parameter(Mandatory=$false)] [string]$NpmRegistry = 'https://registry.npmmirror.com',
    [switch]$UseNpmjs,
    [switch]$NoCache
)

$ErrorActionPreference = 'Stop'

function Exec($cmd) {
    Write-Host "==> $cmd" -ForegroundColor Cyan
    iex $cmd
}

# Avoid "$Image:$Tag" interpolation issues in PowerShell
$repoPath = "$Registry/$Namespace/$Image"
$fullName = $repoPath + ":" + $Tag

# 1) Login ACR
Write-Host "==> docker login $Registry" -ForegroundColor Cyan
# Note: Passing password directly; consider using token in CI
Exec "docker login `"$Registry`" --username `"$AcrUser`" --password `"$AcrPassword`""

# 2) Build
$buildArgs = @()
if ($UseNpmjs) { $buildArgs += "--build-arg NPM_REGISTRY=https://registry.npmjs.org" } else { $buildArgs += "--build-arg NPM_REGISTRY=$NpmRegistry" }
if ($NoCache)  { $buildArgs += "--no-cache" }

$buildCmd = "docker build $($buildArgs -join ' ') -t `"$fullName`" ."
Exec $buildCmd

# 3) Push
Exec "docker push `"$fullName`""

Write-Host "✔ Done. Pushed image: $fullName" -ForegroundColor Green
