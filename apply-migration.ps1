# Load environment variables from .env (fallback: .env.local)
$envFile = Get-Content .env -ErrorAction SilentlyContinue
if (-not $envFile) {
    $envFile = Get-Content .env.local -ErrorAction SilentlyContinue
}
if ($envFile) {
    foreach ($line in $envFile) {
        if ($line -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim() -replace '^["'']|["'']$', ''
            if ($key -eq 'DATABASE_URL') {
                $env:DATABASE_URL = $value
                $env:DIRECT_URL = $value
                Write-Host "Loaded DATABASE_URL"
            }
        }
    }
}

if ($env:DATABASE_URL) {
    Write-Host "Applying migration..."
    pnpm db:push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Migration applied successfully!"
        Write-Host "📝 Next: Run 'pnpm db:generate' to regenerate Prisma Client"
    }
} else {
    Write-Host "❌ DATABASE_URL not found in .env"
    exit 1
}

