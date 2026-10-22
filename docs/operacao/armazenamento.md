# Armazenamento de arquivos (S02)

Decisão: ADR-0011. Código: `src/lib/storage/config.ts`, `src/hooks/upload-security.ts`, `src/collections/Media`, `src/collections/Documents`.

## Ambientes

| Ambiente | Serviço | Bucket | Prefixo | Credenciais |
|---|---|---|---|---|
| Local | MinIO (docker-compose) | `ppgps-local` | — | `.env` gerado por `pnpm env:local` |
| Testes (local/CI) | MinIO | `ppgps-test` | — | fixas de teste (nunca R2) |
| Preview (por PR) | Cloudflare R2 | `ppgps-preview` | `pr-N/` | ambiente GitHub `preview` |
| Homologação | Cloudflare R2 | `ppgps-staging` | — | ambiente GitHub `staging` |
| Backups | Cloudflare R2 | `ppgps-backups` | `staging/` | ambiente GitHub `backups` (exclusivas) |
| Produção | — | (S06) | — | — |

Variáveis da aplicação (somente servidor): `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, `S3_PREFIX`. No GitHub, os workflows mapeiam `vars.R2_ENDPOINT`/`vars.R2_REGION` (repositório) e `secrets.R2_BUCKET`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` (ambiente) para essas variáveis e as repassam à Vercel por `vercel deploy --env` (variáveis do deploy, nunca no bundle do navegador).

## Como os arquivos são servidos

- O bucket é **privado** (sem `r2.dev`, sem domínio público). Nenhuma página usa URL direta do bucket.
- Toda leitura passa por `/api/media/file/<nome>` ou `/api/documents/file/<nome>`. O Payload executa o `read` da coleção **antes** de acessar o objeto:
  - mídia: visitante só recebe imagens com `containsIdentifiablePeople = false`; o app transmite o arquivo;
  - documentos: visitante só recebe `visibility = public`; admin/editor recebem todos. O app responde com redirecionamento para **URL assinada do R2 válida por 5 min**.
- Upload: tipo real por magic bytes (JPEG, PNG, WebP, AVIF; PDF só em documentos), 10 MB imagem / 25 MB PDF, SVG e executáveis bloqueados, nome trocado por UUID.
- Mídia exige `alt`, crédito, licença, origem e a marcação de pessoas identificáveis.

## Verificações reais do R2 (custo controlado)

- `scripts/storage/r2-smoke.mjs`: escrita, leitura, URL assinada, acesso sem assinatura negado e exclusão de um objeto de 64 bytes (≈ 7 operações). Roda a cada deploy de preview e de homologação.
- `scripts/ci/smoke-storage-app.mjs`: no preview, pelo app implantado, com a conta fictícia do seed — upload, download público, `.exe` renomeado rejeitado, documento privado negado ao visitante e servido ao admin por URL assinada, auditoria e limpeza.
- `scripts/storage/purge-prefix.mjs`: ao fechar o PR, apaga `ppgps-preview/pr-N/` (travado para esse bucket e esse formato de prefixo).
- `r2-maintenance.yml` (mensal e sob demanda): aplica a expiração de 7 dias **somente** no `ppgps-preview` (exige token com permissão de administração do bucket) e verifica que os 3 buckets negam acesso anônimo e que a credencial de cada ambiente não alcança os outros buckets. O `r2-smoke` também alerta, a cada deploy, se a credencial da aplicação alcançar `ppgps-backups`.

Testes automatizados repetitivos usam **apenas MinIO**.

## Custos e monitoramento

Faixa gratuita do R2 (mensal): 10 GB armazenados, 1 milhão de operações classe A, 10 milhões classe B, saída gratuita. **Não é garantia de custo zero**: ultrapassar gera cobrança na conta Cloudflare. Consumo previsto na S02: poucos KB e dezenas de operações por dia. Conferir mensalmente em Cloudflare → R2 → Metrics; não executar testes de carga.

## Situação da auditoria (22/10/2026, run `39849533647`)

- Cada token (preview, staging, backups) acessa somente o próprio bucket; os demais respondem AccessDenied (403).
- Acesso anônimo negado nos 3 buckets.
- Expiração de 7 dias no `ppgps-preview` confirmada por sonda (`x-amz-expiration` = 7,0 dias); configurada no painel pelo supervisor. Os tokens são restritos a objetos (privilégio mínimo) e não leem a configuração de ciclo de vida — esperado.
- `r2.dev`/domínios públicos: conferidos no painel pelo supervisor (não visíveis pela API S3).

## Manutenção (supervisor)

1. Ao criar ou rotacionar tokens R2, usar sempre *Object Read & Write* com *Apply to specific buckets only* e rodar "Manutenção e auditoria do R2" em seguida.
2. Conferir mensalmente as métricas do R2 (faixa gratuita).
3. CORS só se for adotado upload direto do navegador (S06).
4. Na Vercel Hobby, uploads acima de ~4,5 MB falham na plataforma (ver ADR-0011; decisão na S06).
