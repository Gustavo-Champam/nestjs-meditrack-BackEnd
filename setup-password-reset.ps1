<# 
.SYNOPSIS
  Instala e configura o módulo de Recuperação de Senha (NestJS + MongoDB) no seu projeto.

.EXAMPLE
  # No diretório do projeto NestJS
  powershell -ExecutionPolicy Bypass -File .\setup-password-reset.ps1 -FrontUrl "http://localhost:5173" -MailUser "seu@gmail.com" -MailPass "senha_app"

.PARAMETER ProjectPath
  Caminho do projeto NestJS (onde está o package.json). Padrão: diretório atual.

.PARAMETER FrontUrl
  URL do front/tela de reset (Flutter Web ou deep link). Padrão: http://localhost:5173

.PARAMETER MailService
  Serviço SMTP (gmail, outlook, etc.). Padrão: gmail

.PARAMETER MailUser
  Usuário/e-mail SMTP (recomendado usar senha de app).

.PARAMETER MailPass
  Senha do app SMTP.

.PARAMETER MailFrom
  From dos e-mails. Padrão: "MediTrack <MAIL_USER>"

.PARAMETER AppModulePath
  Caminho do AppModule. Padrão: src/app.module.ts

.NOTES
  - Idempotente (pode rodar mais de uma vez).
  - Requer Node/npm instalados e acesso de escrita ao projeto.
#>

param(
  [string]$ProjectPath = ".",
  [string]$FrontUrl = "http://localhost:5173",
  [string]$MailService = "gmail",
  [string]$MailUser = "",
  [string]$MailPass = "",
  [string]$MailFrom = "",
  [string]$AppModulePath = "src/app.module.ts"
)

function Stop-OnError($msg) {
  Write-Host "❌ $msg" -ForegroundColor Red
  exit 1
}

# 1) Checagens iniciais
Write-Host "🔎 Verificando ambiente..." -ForegroundColor Cyan
$npmVersion = (& npm -v) 2>$null
if (-not $npmVersion) { Stop-OnError "npm não encontrado. Instale Node.js antes de continuar." }

$project = Resolve-Path $ProjectPath
Set-Location $project

if (-not (Test-Path "package.json")) { Stop-OnError "package.json não encontrado em $project" }

# 2) Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
$deps = "@nestjs/mongoose mongoose bcryptjs nodemailer class-validator class-transformer"
npm i $deps | Out-Null
if ($LASTEXITCODE -ne 0) { Stop-OnError "Falha ao instalar dependências npm." }

# 3) Criar estrutura de arquivos
Write-Host "🧱 Gerando arquivos do módulo..." -ForegroundColor Cyan

$files = @{
  "src/password-reset/dto/forgot-password.dto.ts" = @"
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
"@;

  "src/password-reset/dto/reset-password.dto.ts" = @"
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
"@;

  "src/password-reset/schemas/password-reset.schema.ts" = @"
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'password_resets' })
export class PasswordReset extends Document {
  @Prop({ required: true })
  email: string;

  // store only the hash of the token
  @Prop({ required: true })
  tokenHash: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
// TTL com base em expiresAt
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
"@;

  "src/password-reset/mailer/mailer.service.ts" = @"
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null;

  constructor() {
    if (process.env.MAIL_USER && process.env.MAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: process.env.MAIL_SERVICE || 'gmail',
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      });
    } else {
      this.logger.warn('MAIL_USER/MAIL_PASS não setados. Usando fallback de console.');
      this.transporter = null;
    }
  }

  async sendResetEmail(email: string, token: string) {
    const link = `${process.env.FRONT_URL ?? 'http://localhost:5173'}/reset-password?token=${token}`;

    if (!this.transporter) {
      this.logger.warn(`[DEV ONLY] Link de reset para ${email}: ${link}`);
      return;
    }

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || `MediTrack <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Redefinição de Senha - MediTrack',
      html: \`
        <h2>Recuperação de senha</h2>
        <p>Use o link abaixo para redefinir sua senha (expira em 30 minutos):</p>
        <p><a href="\${link}">\${link}</a></p>
        <p>Se você não solicitou, ignore este e-mail.</p>
      \`,
    });
  }
}
"@;

  "src/password-reset/password-reset.service.ts" = @"
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailerService } from './mailer/mailer.service';
import { PasswordReset } from './schemas/password-reset.schema';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectConnection() private readonly conn: Connection,
    @InjectModel(PasswordReset.name) private resetModel: Model<PasswordReset>,
    private mailer: MailerService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const usersCol = this.conn.collection('users');
    const user = await usersCol.findOne({ email: dto.email });
    if (!user) {
      return { message: 'Se existir, enviaremos instruções para o e-mail informado.' };
    }

    await this.resetModel.deleteMany({ email: dto.email });

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.resetModel.create({ email: dto.email, tokenHash, expiresAt });
    await this.mailer.sendResetEmail(dto.email, token);

    return { message: 'Se existir, enviaremos instruções para o e-mail informado.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const reset = await this.resetModel.findOne({ tokenHash });
    if (!reset || reset.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const usersCol = this.conn.collection('users');
    const user = await usersCol.findOne({ email: reset.email });
    if (!user) {
      await this.resetModel.deleteOne({ _id: reset._id });
      throw new BadRequestException('Usuário não encontrado.');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await usersCol.updateOne({ _id: user._id }, { $set: { password: newHash } });
    await this.resetModel.deleteOne({ _id: reset._id });

    return { message: 'Senha redefinida com sucesso.' };
  }
}
"@;

  "src/password-reset/password-reset.controller.ts" = @"
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetService } from './password-reset.service';

@Controller('auth')
export class PasswordResetController {
  constructor(private readonly svc: PasswordResetService) {}

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.svc.forgotPassword(dto);
  }

  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.svc.resetPassword(dto);
  }
}
"@;

  "src/password-reset/password-reset.module.ts" = @"
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { PasswordReset, PasswordResetSchema } from './schemas/password-reset.schema';
import { MailerService } from './mailer/mailer.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PasswordReset.name, schema: PasswordResetSchema }]),
  ],
  controllers: [PasswordResetController],
  providers: [PasswordResetService, MailerService],
})
export class PasswordResetModule {}
"@;
}

foreach ($path in $files.Keys) {
  $full = Join-Path $project $path
  $dir = Split-Path $full -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  Set-Content -Path $full -Value $files[$path] -Encoding UTF8
}

# 4) Importar o módulo no AppModule
Write-Host "🧩 Atualizando $AppModulePath ..." -ForegroundColor Cyan
if (-not (Test-Path $AppModulePath)) {
  Stop-OnError "$AppModulePath não encontrado. Informe -AppModulePath corretamente."
}

$app = Get-Content $AppModulePath -Raw

# a) import do módulo
if ($app -notmatch "PasswordResetModule") {
  $importLine = "import { PasswordResetModule } from './password-reset/password-reset.module';"
  $app = ($app -split "`n")
  $lastImportIndex = ($app | Select-String -Pattern '^import ' | Select-Object -Last 1).LineNumber
  if ($lastImportIndex) {
    $idx = [int]$lastImportIndex
    $app = @($app[0..($idx-1)] + $importLine + $app[$idx..($app.Length-1)])
  } else {
    $app = @($importLine) + $app
  }
  $app = ($app -join "`n")
}

# b) garantir PasswordResetModule no array imports: [...]
if ($app -match "imports\s*:\s*\[") {
  if ($app -notmatch "imports\s*:\s*\[[^\]]*PasswordResetModule") {
    $app = [regex]::Replace($app, "imports\s*:\s*\[", "imports: [PasswordResetModule, ")
  }
} else {
  $app = [regex]::Replace($app, "@Module\(\s*{", "@Module({`n  imports: [PasswordResetModule],", 1)
}

Set-Content -Path $AppModulePath -Value $app -Encoding UTF8

# 5) Atualizar .env
Write-Host "🧾 Atualizando .env ..." -ForegroundColor Cyan
$envPath = ".env"
if (-not (Test-Path $envPath)) { New-Item -ItemType File -Path $envPath | Out-Null }

$envMap = @{
  "MAIL_SERVICE" = $MailService
  "MAIL_USER"    = $MailUser
  "MAIL_PASS"    = $MailPass
  "MAIL_FROM"    = ($MailFrom -ne "" ? $MailFrom : ("MediTrack <" + $MailUser + ">"))
  "FRONT_URL"    = $FrontUrl
}

$envText = Get-Content $envPath -Raw

foreach ($k in $envMap.Keys) {
  $v = $envMap[$k]
  if ($v -eq "") { continue }
  if ($envText -match "^\s*${k}\s*=") {
    $envText = [regex]::Replace($envText, "^\s*${k}\s*=.*$", "${k}=${v}", 'Multiline')
  } else {
    if ($envText.Trim().Length -gt 0) { $envText += "`n" }
    $envText += "${k}=${v}"
  }
}
Set-Content -Path $envPath -Value $envText -Encoding UTF8

Write-Host ""
Write-Host "✅ PRONTO!" -ForegroundColor Green
Write-Host "Rotas:"
Write-Host "  POST /auth/forgot-password   { email }"
Write-Host "  POST /auth/reset-password    { token, newPassword }"
Write-Host ""
Write-Host "Dica: rode 'npm run start:dev' e verifique logs. Se MAIL_USER/MAIL_PASS não estiverem setados," `
  "o link de reset será apenas logado no console (modo DEV)."
