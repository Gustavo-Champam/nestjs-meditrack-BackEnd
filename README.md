# 🩺 MediTrack – Backend API

**MediTrack** é o backend oficial da aplicação de gerenciamento e acompanhamento de medicamentos.  
Desenvolvido com **NestJS**, este serviço fornece uma **API RESTful segura e escalável**, conectada a um **banco de dados MongoDB**, servindo como **base de dados e lógica de negócio** para o aplicativo mobile desenvolvido em **Flutter**.

### 🚀 Tecnologias Principais
- **NestJS** — Framework Node.js para aplicações escaláveis  
- **MongoDB (Mongoose)** — Banco de dados não relacional  
- **JWT Authentication** — Autenticação segura via token  
- **BullMQ + Redis** — Filas e agendamento de doses  
- **Firebase Admin SDK** — Comunicação em tempo real com dispositivos (ESP32)  
- **Docker Compose** — Ambientes isolados para MongoDB e Redis

### 🧩 Funcionalidades Principais
- Cadastro e autenticação de usuários  
- Registro e controle de medicamentos  
- Agendamento automático de doses  
- Pareamento e controle de dispositivos (ESP32)  
- Confirmação de dispensação via webhook  
- Integração com Firebase Realtime Database  

### 🧠 Arquitetura
O backend foi projetado com **arquitetura modular** e segue as melhores práticas do NestJS:
```
src/
├── auth/         # Login, registro e JWT
├── users/        # CRUD de usuários
├── medications/  # Medicamentos
├── schedules/    # Agendamentos e filas BullMQ
├── devices/      # Pareamento de dispositivos
├── firebase/     # Inicialização e comunicação Firebase
├── webhook/      # Confirmações do ESP32
└── common/       # Utilitários e helpers
```

(NestJS + MongoDB + Firebase + BullMQ)

Backend de referência para o app **MediTrack**: autenticação JWT, cadastro de usuários, medicamentos, agendamentos com fila (BullMQ/Redis), integração com ESP32 via Firebase (Realtime Database) e webhooks de confirmação.

## Stack
- NestJS (TypeScript)
- MongoDB (Mongoose)
- Redis + BullMQ (filas e jobs de disparo)
- Firebase Admin SDK (notificações + canal ESP32)
- JWT (auth)
- Docker Compose (MongoDB + Redis)

## Rodando localmente
1. Copie `.env.example` para `.env` e ajuste os valores.
2. Suba as dependências:
   ```bash
   docker compose up -d
   ```
3. Instale e rode a API:
   ```bash
   npm install
   npm run start:dev
   ```

## Estrutura
- `src/auth` — login/registro (email/senha), JWT, guarda de rotas.
- `src/users` — CRUD básico de usuários.
- `src/medications` — cadastro de medicamentos.
- `src/schedules` — agendamentos de doses e fila de execução.
- `src/devices` — vínculo de dispositivos (ESP32) e token de pareamento.
- `src/firebase` — módulo de inicialização do Firebase Admin.
- `src/webhook` — endpoint para confirmação de dispensação pelo ESP32.

## Endpoints (resumo)
- `POST /auth/register`, `POST /auth/login`
- `GET /users/me`
- `POST /medications`, `GET /medications`
- `POST /schedules`, `GET /schedules`, `PATCH /schedules/:id/enable`
- `POST /devices/pair` (gera token), `POST /devices/bind` (confirma pareamento)
- `POST /webhook/dispense-confirm` (ESP32 → API)

> Timezone padrão: `America/Sao_Paulo`. Todos os horários são salvos em UTC com offset convertido na criação.

## Licença
MIT — use como base acadêmica e expanda à vontade.
---

### ✅ Correções Aplicadas (v3)
- Corrigido `self` → `this` no `SchedulesController`.
- `tsconfig.json`: `esModuleInterop`, `resolveJsonModule`, `moduleResolution` e `skipLibCheck` para compatibilidade com `ioredis` e JSON do Firebase.
- `Devices`: token de pareamento agora tem emissão controlada e verificação de expiração (10 min) e tratamento de conflito de `deviceId`.
