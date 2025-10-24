# e2e.ps1 — MediTrack smoke/E2E
$ErrorActionPreference = "Stop"
$ProgressPreference    = "SilentlyContinue"

# ====== CONFIG ======
$BASE = $env:BASE_URL
if (-not $BASE -or -not $BASE.StartsWith("http")) { $BASE = "http://localhost:3001" }

# ====== HELPERS ======
function Call-Api {
  param([string]$path,[string]$method='GET',$body=$null,[hashtable]$headers=@{})
  $u = if ($path -match '^https?://') { $path } else { "$BASE$path" }

  if ($body -is [hashtable] -or $body -is [pscustomobject]) {
    $body = ($body | ConvertTo-Json -Depth 8 -Compress)
  }

  try {
    $resp = Invoke-WebRequest -Uri $u -Method $method -Headers $headers `
              -ContentType 'application/json' -Body $body -TimeoutSec 20 -ErrorAction Stop
    $json = $null
    if ($resp.Content) { try { $json = $resp.Content | ConvertFrom-Json } catch {} }
    return [pscustomobject]@{ ok=$true; code=[int]$resp.StatusCode; json=$json; text=$resp.Content }
  } catch {
    $code = 0; $txt = $null; $json = $null
    if ($_.Exception.Response) {
      $code = [int]$_.Exception.Response.StatusCode
      try {
        $sr = New-Object IO.StreamReader ($_.Exception.Response.GetResponseStream())
        $txt = $sr.ReadToEnd(); $sr.Close()
        if ($txt) { try { $json = $txt | ConvertFrom-Json } catch {} }
      } catch {}
    }
    return [pscustomobject]@{ ok=$false; code=$code; json=$json; text=$txt; err=$_.Exception.Message }
  }
}

$script:hasFail = $false
$results = @()
function Add-Res($type,$msg){ $script:results += [pscustomobject]@{ Type=$type; Msg=$msg } }
function OK  ($msg,$cond){ if($cond){ Write-Host "[OK]  $msg"  -ForegroundColor Green;  Add-Res 'OK'  $msg } else { Write-Host "[X]   $msg" -ForegroundColor Red; Add-Res 'X' $msg; $script:hasFail=$true } }
function SKIP($msg){       Write-Host "[--]  $msg" -ForegroundColor Yellow; Add-Res 'SKIP' $msg }
function NowStr(){ (Get-Date -Format 'yyyyMMdd-HHmmss') }

# aceita {token}, {access_token}, {jwt}, { data:{token} } ou string pura
function Get-Token($j){
  if($null -eq $j){ return $null }
  if($j.token){ return $j.token }
  if($j.access_token){ return $j.access_token }
  if($j.jwt){ return $j.jwt }
  if($j.data -and $j.data.token){ return $j.data.token }
  if($j -is [string]){ return $j }
  return $null
}

# normaliza listagem (array puro OU { value:[], Count })
function To-Array($json){
  if($null -eq $json){ return @() }
  if($json.PSObject.Properties['value']){ return $json.value }
  if($json -is [System.Collections.IEnumerable]){ return ,$json }
  return @()
}

Write-Host "=== Smoke Test MediTrack @ $BASE ===" -ForegroundColor Cyan

# ====== 1) Registrar + Login ======
$email = "e2e+$(Get-Date -Format 'HHmmss')@exemplo.com"
$pass  = "segredo123"

$reg = Call-Api '/auth/register' 'POST' @{ name='E2E'; email=$email; password=$pass }
OK "POST /auth/register ($email) -> $($reg.code)" ($reg.ok -and $reg.code -ge 200 -and $reg.code -lt 300)

$login = Call-Api '/auth/login' 'POST' @{ email=$email; password=$pass }
$token = Get-Token $login.json
if(-not $token -and $login.text){ Write-Host "login body: $($login.text)" -ForegroundColor DarkGray }
OK "POST /auth/login retornou token" ($login.ok -and $token)

$H = @{ Authorization = "Bearer $token" }

# ====== 2) JWT guard (/schedules/_whoami) ======
$me = Call-Api '/schedules/_whoami' 'GET' $null $H
OK "GET /schedules/_whoami 200" ($me.ok)
if($me.ok -and $me.json.email){ OK "whoami.email == $email" ($me.json.email -eq $email) }

# também testa 401 sem token
$me401 = Call-Api '/schedules/_whoami' 'GET'
OK "GET /schedules/_whoami sem token -> 401" (-not $me401.ok -and ($me401.code -in 401,403))

# ====== 3) Medications (criar, listar) ======
$medName = "Dipirona $(Get-Date -Format HHmmss)"
$med = Call-Api '/medications' 'POST' @{ name=$medName; unit='mg'; stock=10 } $H
OK "POST /medications ($medName)" ($med.ok -and $med.json._id)
$medId = $med.json._id

$meds = Call-Api '/medications' 'GET' $null $H
if($meds.ok){
  $list = To-Array $meds.json
  $has = $false; if($list){ $has = ($list | Where-Object { $_._id -eq $medId }) -ne $null }
  OK "GET /medications contém criada" $has
}else{
  SKIP "GET /medications falhou ($($meds.code))"
}

# ====== 4) Schedules (criar, listar, filtros) ======
$nextAt = ([datetimeoffset]::Now.AddMinutes(3)).ToString("yyyy-MM-ddTHH:mm:00zzz")
$sched = Call-Api '/schedules' 'POST' @{ medicationId=$medId; dose=500; nextAt=$nextAt } $H
OK "POST /schedules (+3min)" ($sched.ok -and $sched.json._id)

$scheds = Call-Api '/schedules' 'GET' $null $H
OK "GET /schedules 200" ($scheds.ok)

# filtro por dia (se implementado)
$day = (Get-Date).ToString('yyyy-MM-dd')
$byDay = Call-Api "/schedules?day=$day" 'GET' $null $H
if($byDay.code -eq 404){
  SKIP "GET /schedules?day=YYYY-MM-DD ausente"
}else{
  OK "GET /schedules?day=$day" ($byDay.ok)
}

# upcoming opcional
$upc = Call-Api "/schedules/upcoming?limit=1" 'GET' $null $H
if($upc.code -eq 404){
  SKIP "GET /schedules/upcoming ausente"
}else{
  OK "GET /schedules/upcoming?limit=1" ($upc.ok)
}

# ====== 5) Rotas extras ======
# 5.1 PATCH /users/me
$newName = "E2E " + (NowStr)
$patchBody = @{ name = $newName; tz = 'America/Sao_Paulo' }
$tchMe = Call-Api '/users/me' 'PATCH' $patchBody $H
if($tchMe.code -in 404,405){
  SKIP "PATCH /users/me ausente"
}else{
  OK "PATCH /users/me -> $($tchMe.code)" ($tchMe.ok)
}

# 5.2 PATCH /medications/:id
$patchMed = Call-Api "/medications/$medId" 'PATCH' @{ name = "$medName (edit)" } $H
if($patchMed.code -in 404,405){
  SKIP "PATCH /medications/:id ausente"
}else{
  OK "PATCH /medications/:id -> $($patchMed.code)" ($patchMed.ok)
}

# 5.3 POST /medications/:id/refill
$refill = Call-Api "/medications/$medId/refill" 'POST' @{ add = 5 } $H
if($refill.code -in 404,405){
  SKIP "POST /medications/:id/refill ausente"
}elseif(-not $refill.ok -and $refill.code -eq 400){
  $refill2 = Call-Api "/medications/$medId/refill" 'POST' @{ amount = 5 } $H
  OK "POST /medications/:id/refill (amount=5)" ($refill2.ok)
}else{
  OK "POST /medications/:id/refill (add=5)" ($refill.ok)
}

# ====== 6) Reset de senha (fluxo completo) ======
$req = Call-Api '/auth/forgot' 'POST' @{ email = $email }
if($req.code -eq 404){ $req = Call-Api '/auth/request-reset' 'POST' @{ email = $email } }
OK "solicitou reset" ($req.ok)

$peek = Call-Api "/auth/password/dev/peek?email=$([uri]::EscapeDataString($email))" 'GET'
OK "peek DEV token" ($peek.ok -and $peek.json.token)

$rtok = $peek.json.token
$newPass = "nova@" + (Get-Random -Max 99999)

$confirm = Call-Api '/auth/reset' 'POST' @{ token=$rtok; newPassword=$newPass }
if($confirm.code -eq 404){ $confirm = Call-Api '/auth/reset-password' 'POST' @{ token=$rtok; newPassword=$newPass } }
OK "confirmou reset" ($confirm.ok)

$oldLogin = Call-Api '/auth/login' 'POST' @{ email=$email; password=$pass }
OK "login ANTIGO falha (401/403)" (-not $oldLogin.ok -and ($oldLogin.code -in 400,401,403))

$newLogin = Call-Api '/auth/login' 'POST' @{ email=$email; password=$newPass }
$newToken = Get-Token $newLogin.json
if(-not $newToken -and $newLogin.text){ Write-Host "login(novo) body: $($newLogin.text)" -ForegroundColor DarkGray }
OK "login NOVO ok (token)" ($newLogin.ok -and $newToken)

# ====== 7) 401 sem token em recursos protegidos ======
$unaM = Call-Api '/medications' 'GET'
OK "GET /medications sem token -> 401/403" (-not $unaM.ok -and ($unaM.code -in 401,403))

$unaS = Call-Api '/schedules' 'GET'
OK "GET /schedules sem token -> 401/403"   (-not $unaS.ok -and ($unaS.code -in 401,403))

# ====== RESUMO ======
$okCount = ($results | Where-Object { $_.Type -eq 'OK'  }).Count
$errCount= ($results | Where-Object { $_.Type -eq 'X'   }).Count
$skCount = ($results | Where-Object { $_.Type -eq 'SKIP'}).Count
Write-Host ("`nResumo: {0} OK, {1} FALHAS, {2} SKIPs" -f $okCount,$errCount,$skCount) -ForegroundColor Cyan

if($script:hasFail){
  Write-Host "`nAlguns testes FALHARAM." -ForegroundColor Red
  $global:LASTEXITCODE = 1   # NÃO fecha o terminal
}else{
  Write-Host "`nTudo OK! ✅" -ForegroundColor Green
  $global:LASTEXITCODE = 0   # NÃO fecha o terminal
}
