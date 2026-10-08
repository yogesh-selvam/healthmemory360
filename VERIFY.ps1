$ErrorActionPreference='Stop'
Write-Host "Checking HealthMemory 360 project..." -ForegroundColor Cyan
$required=@('package.json','frontend/package.json','frontend/src/App.tsx','frontend/public/stitch-runtime.js','backend/src/server.ts','backend/src/models/index.ts','README.md')
foreach($p in $required){ if(-not(Test-Path $p)){ throw "Missing: $p" }; Write-Host "OK $p" -ForegroundColor Green }
Write-Host "Exact Stitch HTML screens:" (Get-ChildItem frontend/public/stitch -Recurse -Filter index.html).Count
Write-Host "Source Stitch HTML screens:" (Get-ChildItem stitch-source -Recurse -Filter code.html).Count
Write-Host "Verification complete." -ForegroundColor Green
