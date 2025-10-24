$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ====== CONFIG ======
$BASE = $env:BASE_URL
if (-not $BASE -or -not $BASE.StartsWith("http")) { $BASE = "http://localhost:3001" }

function Call-Api {
  param([string]$path,[string]$method='GET',$body=$null,[hashtable]$headers=@{})
  $u = if ($path -match '^https?://') { $path } else { "$BASE$path" }
  try {
    if ($body -is [hashtable] -or $body -is [pscustomobject]) { $body = ($body | ConvertTo-Json -Compress) }
    $resp = Invoke-WebRequest -Uri $u -Method $method -Headers $headers -ContentType 'application/json' -Body $body -TimeoutSec 20 -ErrorAction Stop
    $json = $null; if ($resp.Content) { try{ $json = $resp.Content | ConvertFrom-Json } catch{} }
    [pscustomobject]@{ Success=$true; StatusCode=[int]$resp.StatusCode; Json=$json; Raw=$resp.Content }
  } catch {
    $sc = 0; $raw = $null; $json = $null
    if ($_.Exception.Response) {
      $sc = [int]$_.Exception.Response.StatusCode
      try { $raw = (New-Object IO.StreamReader $_.Exception.Response.GetResponseStream()).ReadToEnd() } catch {}
    }
    if ($raw) { try { $json = $raw | ConvertFrom-Json } catch {} }
    [pscustomobject]@{ Success=$false; StatusCode=$sc; Json=$json; Raw=$raw; Error=$_.Exception.Message }
  }
}

$script:fail = $false
function OK($msg,$cond){ if($cond){ Write-Host ("[OK]  " + $msg) -ForegroundColor Green } else { Write-Host ("[X]   " + $msg) -ForegroundColor Red; $script:fail=$true } }
function SKIP($msg){ Write-Host ("[--]  " + $msg) -ForegroundColor Yellow }

Write-Host "=== Smoke Test MediTrack @ $BASE ===" -ForegroundColor Cyan

# ====== 1) Registrar + Login ======
$email = "lucas+$(Get-Date -Format 'HHmmss')@exemplo.com"
$pass  = "segredo123"

$reg = Call-Api '/auth/register' 'POST' @{ name='Lucas'; email=$email; password=$pass }
OK "register 2xx" ($reg.Success)

$login = Call-Api '/auth/login' 'POST' @{ email=$email; password=$pass }
OK "login retornou token" ($login.Success -and $login.Json.token)

$HDRS = @{ Authorization = "Bearer $($login.Json.token)" }

# ====== 2) JWT guard (/schedules/_whoami) ======
$me = Call-Api '/schedules/_whoami' 'GET' $null $HDRS
OK "_whoami 2xx" ($me.Success)
if($me.Success -and $me.Json.email){ OK "whoami.email == $email" ($me.Json.email -eq $email) }

# ====== 3) Medicação + Schedule ======
$med = Call-Api '/medications' 'POST' @{ name = "Dipirona $(Get-Date -Format HHmmss)"; unit='mg'; stock=10 } $HDRS
OK "criou medicação" ($med.Success -and $med.Json._id)
$medId = $med.Json._id

$when = ([datetimeoffset]::Now.AddMinutes(3)).ToString("yyyy-MM-ddTHH:mm:00zzz")
$sched = Call-Api '/schedules' 'POST' @{ medicationId = $medId; dose = 500; nextAt = $when } $HDRS
OK "criou schedule" ($sched.Success -and $sched.Json._id)

# Listagens
$meds = Call-Api '/medications' 'GET' $null $HDRS
if($meds.Success -and $meds.Json){
  $foundMed = ($meds.Json | ConvertTo-Json -Compress) -match $medId
  OK "listou medicações (contém criada?)" $foundMed
} else { SKIP "GET /medications (retornou vazio/forma diferente)" }

$scheds = Call-Api '/schedules' 'GET' $null $HDRS
OK "listou schedules" ($scheds.Success)

# ====== 4) Rotas opcionais ======
# 4.1 PATCH /users/me
$patchMe = Call-Api '/users/me' 'PATCH' @{ name = "Lucas QA"; tz = "America/Sao_Paulo" } $HDRS
if($patchMe.StatusCode -eq 404 -or $patchMe.StatusCode -eq 405){ SKIP "PATCH /users/me ausente"; } else { OK "PATCH /users/me" ($patchMe.Success) }

# 4.2 PATCH /medications/:id
$patchMed = Call-Api "/medications/$medId" 'PATCH' @{ name = "Dipirona Editada" } $HDRS
if($patchMed.StatusCode -eq 404 -or $patchMed.StatusCode -eq 405){ SKIP "PATCH /medications/:id ausente"; } else { OK "PATCH /medications/:id" ($patchMed.Success) }

# 4.3 POST /medications/:id/refill (tenta 'add' e, se 400, tenta 'amount')
$refill = Call-Api "/medications/$medId/refill" 'POST' @{ add = 5 } $HDRS
if($refill.StatusCode -eq 404 -or $refill.StatusCode -eq 405){
  SKIP "POST /medications/:id/refill ausente"
} elseif(-not $refill.Success -and $refill.StatusCode -eq 400) {
  $refill2 = Call-Api "/medications/$medId/refill" 'POST' @{ amount = 5 } $HDRS
  OK "refill (fallback 'amount')" ($refill2.Success)
} else {
  OK "refill (add=5)" ($refill.Success)
}

# 4.4 GET /schedules?day=YYYY-MM-DD
$day = ([DateTimeOffset]::Now).ToString("yyyy-MM-dd")
$byDay = Call-Api "/schedules?day=$day" 'GET' $null $HDRS
if($byDay.StatusCode -eq 404){ SKIP "GET /schedules?day ausente" } else { OK "GET /schedules?day" ($byDay.Success) }

# 4.5 GET /schedules/upcoming?limit=1
$upc = Call-Api "/schedules/upcoming?limit=1" 'GET' $null $HDRS
if($upc.StatusCode -eq 404){ SKIP "GET /schedules/upcoming ausente" } else { OK "GET /schedules/upcoming" ($upc.Success) }

# ====== 5) Reset de senha (suporta /auth/forgot|/auth/request-reset e /auth/reset|/auth/reset-password) ======
$req = Call-Api '/auth/forgot' 'POST' @{ email = $email }
if($req.StatusCode -eq 404){ $req = Call-Api '/auth/request-reset' 'POST' @{ email = $email } }
OK "solicitou reset" ($req.Success)

$peek = Call-Api "/auth/password/dev/peek?email=$([uri]::EscapeDataString($email))" 'GET'
OK "peek do token (DEV)" ($peek.Success -and $peek.Json.token)

$rtok = $peek.Json.token
$newPass = "nova@" + (Get-Random -Max 99999)

$confirm = Call-Api '/auth/reset' 'POST' @{ token=$rtok; newPassword=$newPass }
if($confirm.StatusCode -eq 404){ $confirm = Call-Api '/auth/reset-password' 'POST' @{ token=$rtok; newPassword=$newPass } }
OK "confirmou reset" ($confirm.Success)

# antiga deve falhar
$old = Call-Api '/auth/login' 'POST' @{ email=$email; password=$pass }
OK "login com senha antiga falha (401)" (-not $old.Success -and ($old.StatusCode -in  @(400,401,403)))

# nova deve logar
$newLogin = Call-Api '/auth/login' 'POST' @{ email=$email; password=$newPass }
OK "login com senha nova OK" ($newLogin.Success -and $newLogin.Json.token)

# ====== FIM ======
if($script:fail){ Write-Host "`nAlguns testes FALHARAM." -ForegroundColor Red; exit 1 } else { Write-Host "`nTudo OK! ✅" -ForegroundColor Green; exit 0 }
