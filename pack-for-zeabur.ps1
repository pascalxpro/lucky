$zipFile = "riiqi-lucky-deploy.zip"

if (Test-Path $zipFile) { Remove-Item $zipFile -Force }

# 明確列出要打包的項目
$paths = @()
foreach ($item in @('src','prisma','public','Dockerfile','docker-compose.yml','docker-entrypoint.sh','package.json','package-lock.json','next.config.ts','tsconfig.json','prisma.config.ts','.gitignore','.dockerignore','.zeaburignore','.env','AGENTS.md','CLAUDE.md','README.md')) {
    if (Test-Path $item) {
        $paths += $item
    }
}

Compress-Archive -Path $paths -DestinationPath $zipFile -Force

if (Test-Path $zipFile) {
    $info = Get-Item $zipFile
    $sizeKB = [math]::Round($info.Length / 1KB, 1)
    Write-Host "Done: $zipFile = $sizeKB KB"
} else {
    Write-Host "FAILED"
}
