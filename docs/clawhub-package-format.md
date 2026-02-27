# ClawFlow Package Format

Packages สำหรับ ClawFlow สามารถ publish ขึ้น npm registry ได้โดยมีรูปแบบดังนี้:

## 1. การระบุว่าเป็น ClawFlow Package

มี 3 วิธี:

### วิธีที่ 1: ใช้ Scope `@clawflow/`
```json
{
  "name": "@clawflow/trading-kit"
}
```

### วิธีที่ 2: ใช้ Keyword
```json
{
  "name": "my-awesome-kit",
  "keywords": ["clawflow", "trading", "crypto"]
}
```

### วิธีที่ 3: ใช้ Field `clawflow` ใน package.json
```json
{
  "name": "my-awesome-kit",
  "clawflow": {
    "skills": [...],
    "crons": [...]
  }
}
```

## 2. Package Structure

```
my-package/
├── package.json          # ต้องมี keyword "clawflow" หรือ field clawflow
├── clawflow.json         # (optional) แยก config ออกมา
├── README.md
└── (other files)
```

## 3. clawflow.json Format

```json
{
  "$schema": "https://clawflowhub.dev/schema/v1.json",
  "skills": [
    {
      "name": "binance-pro",
      "version": "^1.0.0",
      "source": "openclaw",
      "repository": "https://github.com/owner/binance-pro-skill.git",
      "description": "Binance trading skill"
    }
  ],
  "crons": [
    {
      "skill": "crypto-price",
      "schedule": "*/5 * * * *",
      "params": {
        "symbols": ["BTC", "ETH", "SOL"]
      },
      "description": "เช็คราคาคริปโตทุก 5 นาที",
      "enabled": true
    }
  ],
  "config": {
    "binance-pro": {
      "apiKey": {
        "env": "BINANCE_API_KEY",
        "required": true,
        "description": "Binance API Key"
      },
      "secretKey": {
        "env": "BINANCE_SECRET_KEY",
        "required": true,
        "description": "Binance Secret Key"
      }
    }
  },
  "postInstall": "กรุณาตั้งค่า BINANCE_API_KEY และ BINANCE_SECRET_KEY ใน environment variables"
}
```

## 4. Field Descriptions

### skills
รายการ skills ที่จะติดตั้ง

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | ชื่อ skill |
| `version` | string | No | เวอร์ชัน (semver) |
| `source` | string | No | แหล่งที่มา (openclaw, npm, github) |
| `repository`/`repo`/`git` | string | No | Git URL สำหรับ fallback เมื่อหา skill ใน clawhub ไม่เจอ |
| `branch`/`tag`/`ref` | string | No | branch/tag/ref สำหรับ git clone |
| `description` | string | No | คำอธิบาย |

### crons
รายการ cronjobs ที่จะสร้าง

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `skill` | string | Yes | ชื่อ skill ที่จะรัน |
| `schedule` | string | Yes | Cron expression |
| `params` | object | No | Parameters ที่ส่งให้ skill |
| `description` | string | No | คำอธิบาย |
| `enabled` | boolean | No | เปิดใช้งานหรือไม่ (default: true) |

### config
Schema สำหรับการตั้งค่า package

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `env` | string | No | ชื่อ environment variable |
| `required` | boolean | No | บังคับต้องมีหรือไม่ |
| `default` | any | No | ค่า default |
| `description` | string | No | คำอธิบาย |
| `type` | string | No | ประเภท (string, number, array, object) |

## 5. ตัวอย่าง package.json สมบูรณ์

```json
{
  "name": "@clawflowhub/trading-kit",
  "version": "1.0.0",
  "description": "ชุดเครื่องมือสำหรับเทรดคริปโต",
  "keywords": ["clawflowhub", "trading", "crypto", "binance"],
  "author": "Your Name",
  "license": "MIT",
  "clawflowhub": {
    "skills": [
      { "name": "binance-pro", "version": "^1.0.0", "source": "openclaw" },
      { "name": "crypto-price", "version": "^1.0.0", "source": "openclaw" }
    ],
    "crons": [
      {
        "skill": "crypto-price",
        "schedule": "*/5 * * * *",
        "params": { "symbols": ["BTC", "ETH"] },
        "description": "เช็คราคาทุก 5 นาที"
      }
    ],
    "config": {
      "binance-pro": {
        "apiKey": { "env": "BINANCE_API_KEY", "required": true }
      }
    }
  }
}
```

## 6. Publishing

```bash
# Publish ขึ้น npm
npm publish --access public

# ถ้าเป็น scoped package (@clawflowhub/xxx)
npm publish --access public
```

## 7. การติดตั้ง

หลังจาก publish แล้ว ผู้ใช้สามารถติดตั้งได้โดย:

```bash
# ติดตั้งจาก npm
clawflowhub install @clawflowhub/trading-kit

# หรือ
clawflowhub install my-awesome-kit

# ติดตั้งเวอร์ชันเฉพาะ
clawflowhub install @clawflowhub/trading-kit@1.0.0
```
