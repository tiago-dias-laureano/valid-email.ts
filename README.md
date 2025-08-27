# 📧 valid-email.ts

[![npm version](https://img.shields.io/npm/v/valid-email.ts)](https://www.npmjs.com/package/valid-email.ts)

[![Build](https://img.shields.io/github/actions/workflow/status/seu-usuario/valid-email.ts/ci.yml?branch=main)](https://github.com/seu-usuario/valid-email.ts/actions)

[![Coverage](https://img.shields.io/codecov/c/github/seu-usuario/valid-email.ts)](https://codecov.io/gh/seu-usuario/valid-email.ts)

Uma biblioteca **TypeScript-first** para validação de emails, incluindo:

- Validação de formato (RFC)
- Normalização automática (`trim` + lowercase)
- Regras de tamanho (RFC: 64/255/254)
- Verificação de TLDs (lista oficial IANA, com cache em memória)
- Bloqueio de domínios descartáveis
- Checagem de DNS (MX records)
- Deep Check SMTP (opcional, _best effort_)

---

## 🚀 Instalação

```bash
npm  install  valid-email.ts
```

ou com yarn:

```bash
yarn  add  valid-email.ts
```

---

## 🛠️ Uso básico

```ts
import { validate } from "valid-email.ts";

const email = "test@gmail.com";
const result = await validate(email);

console.log(result);
```

Saída:

```json
{
  "email": "test@gmail.com",
  "user": "test",
  "domain": "gmail.com",
  "status": "valid",
  "reasonCode": "VALID",
  "reason": "Email is valid",
  "disposable": false
}
```

---

## ⚙️ Opções de validação

```ts
export interface ValidationOptions {
  checkDNS?: boolean; // padrão: true - valida MX records
  deepCheckSMTP?: boolean; // padrão: false - conecta via SMTP (lento e opcional)
  allowDisposable?: boolean; // padrão: false - bloqueia descartáveis
  checkTLD?: boolean; // padrão: true - valida TLDs oficiais IANA
}
```

Exemplo:

```ts
await validate("user@mailinator.com", { allowDisposable: true });
// retorna como válido, mesmo sendo descartável
```

---

## 📦 Validação em lote

```ts
import { validateMany } from "valid-email.ts";

const emails = ["a@gmail.com", "b@mailinator.com", "c@invalid"];
const results = await validateMany(emails);

console.log(results);
```

---

## 📑 Códigos de retorno (`reasonCode`)

| Code | Descrição |

|-----------------|----------------------------------------|

| `MISSING_AT` | Email não contém `@` ou contém mais de um |

| `MISSING_USER` | Não há usuário antes do `@` |

| `MISSING_DOMAIN`| Domínio inválido ou sem `.` |

| `TOO_LONG` | Ultrapassa limite de tamanho RFC |

| `INVALID_FORMAT`| Regex básica falhou |

| `INVALID_TLD` | TLD não está na lista oficial da IANA |

| `DISPOSABLE` | Domínio descartável detectado |

| `NO_MX` | Domínio sem MX records válidos |

| `SMTP_FAIL` | SMTP check falhou (_best effort_) |

| `VALID` | Email válido |

---

## 🌍 Configurações globais

Você pode definir defaults para todas as chamadas:

```ts
import { setDefaultOptions } from "valid-email.ts";

setDefaultOptions({
  allowDisposable: true,
  checkDNS: false,
});
```

---

## 🧪 Testes

Rodar com [Vitest](https://vitest.dev):

```bash
npm  run  test
npm  run  test:coverage
```

---

## 📄 Licença

[MIT](LICENSE) © 2025 Tiago Dias Laureano

---

## 🤝 Contribuindo

Pull Requests são bem-vindos!

- Fork o repositório

- Crie uma branch: `git checkout -b feature/nova-feature`

- Faça commit: `git commit -m 'feat: nova feature'`

- Envie PR 🚀
