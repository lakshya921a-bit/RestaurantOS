$dishes = @(
    @{
        name = "paneer-tikka.jpg"
        url = "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "dal-makhani.jpg"
        url = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "veg-biryani.jpg"
        url = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "butter-naan.jpg"
        url = "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "masala-dosa.jpg"
        url = "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "truffle-pasta.jpg"
        url = "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "margherita-pizza.jpg"
        url = "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "burger.jpg"
        url = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "chicken-tikka.jpg"
        url = "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "samosa-chaat.jpg"
        url = "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "gulab-jamun.jpg"
        url = "https://images.unsplash.com/photo-1605197148560-63024c0840b3?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "mango-lassi.jpg"
        url = "https://images.unsplash.com/photo-1528736235302-52922df5c122?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "cold-brew.jpg"
        url = "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80"
    },
    @{
        name = "mojito.jpg"
        url = "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80"
    }
)

$targetDir = "public\images\dishes"
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

foreach ($item in $dishes) {
    $outPath = Join-Path $targetDir $item.name
    Write-Host "Downloading $($item.name)..."
    try {
        Invoke-WebRequest -Uri $item.url -OutFile $outPath -TimeoutSec 15 -Headers @{ "User-Agent" = "Mozilla/5.0" }
        Write-Host " Saved to $outPath"
    } catch {
        Write-Warning "Failed to download $($item.name): $_"
    }
}
