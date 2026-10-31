# ADR-0016 - Hospedagem de produção do M1 (custo zero) e operação

| Campo | Valor |
|---|---|
| Status | Proposto |
| Data | 30/10/2026 |
| Sprint | S06 |
| Autor | Agente |
| Aprovação | Pendente (supervisor) |

## Contexto

O planejamento (seção 25) e a ficha S06 pedem uma decisão de hospedagem de produção própria e independente do site institucional (Q3), com orçamento de **R$ 0** (nenhuma contratação paga autorizada). O ADR-0003 fixou o uso gratuito até o M1. O ADR-0009 deixou para a S06 a decisão sobre o plano do GitHub e a trava de produção. O ADR-0011 deixou para a S06 o limite de ~4,5 MB por requisição da Vercel Hobby. O ADR-0014 definiu o domínio `https://bioeticaps.app`.

Preços e limites revisados em 30/10/2026 nas páginas públicas dos provedores (sujeitos a mudança):

| Serviço | Plano | Limites relevantes |
|---|---|---|
| Vercel | Hobby (gratuito) | Uso pessoal/não comercial; corpo de requisição de funções ~4,5 MB; funções em `gru1` |
| Neon | Free | 0,5 GB por projeto; compute com suspensão por inatividade (partida a frio de ~1 s); até 10 branches |
| Cloudflare R2 | Free | 10 GB armazenados, 1 M operações classe A e 10 M classe B por mês; sem cobrança de saída |
| GitHub | Free, repositório **público** (desde 30/10/2026) | Actions sem limite de minutos em repositório público; ambientes com regras de branch/tag |

## Decisão

1. **Produção na mesma pilha da homologação**: Vercel Hobby (projeto `ppgps-portal`, alvo *production*, região `gru1`), Neon Free (branch `production`), Cloudflare R2 (bucket exclusivo de produção, token restrito a ele) e GitHub Actions. É uma hospedagem própria do grupo, sem vínculo técnico com o site da UniCesumar (Q3).
2. **Uso não comercial**: o portal é acadêmico, sem anúncios, venda ou patrocínio, o que é compatível com o Hobby. Se isso mudar, migrar para Vercel Pro ou para hospedagem Docker (`next start`, ADR-0001), sem mudança de código.
3. **Limite de upload (ADR-0011)**: aceito para o M1. Imagens de capa e fotos ficam abaixo de 4 MB (o guia do editor orienta a redução). PDFs maiores são publicados por link para a fonte oficial (o portal referencia documentos, não os duplica, AGENTS §9.1). Os limites de 10/25 MB continuam válidos no servidor. Upload direto ao R2 por URL assinada fica no backlog (V2).
4. **Trava e controles de produção (ADR-0009)**:
   - deploy só pelo workflow `deploy-production.yml`, a partir de tag `vX.Y.Z` contida na `main`, disparado pelo dono do repositório com `PRODUCTION_DEPLOY_ENABLED=true` (variável mantida como *kill switch*);
   - o ambiente GitHub `production` aceita **somente tags `v*.*.*`**, e os segredos de produção ficam nesse ambiente;
   - o ambiente `production-cron` (somente `main`) guarda apenas o `CRON_SECRET`;
   - revisores obrigatórios **não** foram configurados: com um único mantenedor, a aprovação seria do próprio autor do disparo, e a trava por variável + tag + dono já cumpre o papel.
5. **Ordem do deploy (ADR-0005)**: branch Neon `predeploy-<tag>-<run>` (ponto de restauração; mantidos os 2 mais recentes) → `migrate` com trava de concorrência → `seed:content` (idempotente; nunca sobrescreve edições; sem pessoas/ensaios) → conta `admin` inicial (somente com banco sem contas; senha aleatória descartada, definida pelo titular via recuperação de senha) → verificação real do R2 → `vercel deploy --prebuilt --prod` → fumaça no domínio oficial.
6. **Segurança da primeira conta**: em produção, `POST /api/users/first-register` é recusado pelo proxy (403). Isso impede que um visitante se torne `admin` num banco sem contas.
7. **CSP em *enforce*** em todos os ambientes, com `'unsafe-inline'` em `script-src`: nonces exigiriam renderização com cabeçalho por requisição e impediriam cache de CDN. O risco é mitigado por: nenhum HTML bruto (serializer próprio), nenhum script de terceiros, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` e `frame-ancestors 'self'`. Limitação aceita: o editor JSON (Monaco) da fila de jobs do admin, que carrega de CDN, fica indisponível.
8. **Operação sem custo**:
   - monitor de disponibilidade e certificado TLS a cada 30 min e agendador da publicação agendada (ADR-0015), ambos em `production-cron.yml` (GitHub Actions);
   - backup diário criptografado de produção (`backup.yml`; retenção de 30 dias no `ppgps-backups`);
   - restauração verificável em branch temporário (`restore-check.yml`, entrada `label=production`);
   - Sentry no plano gratuito, sem dados pessoais (ADR-0011);
   - SMTP gratuito para recuperação de senha.
9. **Modo de manutenção** por variável de ambiente (`MAINTENANCE_MODE=true`) no deploy: aviso no site e no painel, e o proxy recusa com 503 toda escrita na API, exceto login/logout.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Vercel Pro (US$ 20/mês) | Uso comercial, limites maiores, proteção de deploy | Custo | Orçamento R$ 0 |
| VPS/Docker próprio | Sem limite de upload; controle total | Custo e operação (patches, TLS, backups do SO) | Orçamento e esforço de operação |
| Hospedar no servidor da UniCesumar | Sem custo para o grupo | Q3: hospedagem independente; exigiria autorização formal | Contraria a Q3 |
| Revisores obrigatórios no ambiente `production` | Aprovação manual no GitHub | Mantenedor único se autoaprovaria | Sem ganho real; trava por variável + tag mantida |
| Nonces na CSP | Remove `'unsafe-inline'` | Todo HTML dinâmico por requisição; mais complexidade | Risco residual baixo sem HTML bruto e sem terceiros |

## Consequências

- **Positivas:** custo zero; produção idêntica à homologação (mesmo pipeline e testes); rollback por *promote* do deploy anterior na Vercel e por branch Neon de restauração; nenhum segredo fora dos ambientes do GitHub.
- **Negativas / custos:** limite de 4,5 MB por upload; partida a frio do Neon após inatividade; dependência de faixas gratuitas que podem mudar; GitHub Actions agendado pode atrasar alguns minutos.
- **Riscos e mitigação:**

  | Risco | Mitigação |
  |---|---|
  | Mudança de política dos planos gratuitos | Portabilidade (ADR-0001): Docker + Postgres padrão + S3 compatível |
  | Faixa do R2 excedida | Métricas mensais no painel (`r2-maintenance.yml`) |
  | Neon de 0,5 GB | Conteúdo textual; mídia fica no R2 |

- **A fazer:**
  - Search Console (verificação de domínio pelo supervisor);
  - revisar este ADR antes do M2 (S11) e se o uso deixar de ser não comercial.

## Registro da implantação (31/10/2026)

- Release `v1.0.1` publicada (run `41157393442`).
- Duas correções durante o lançamento:
  - a verificação do R2 de produção passou a exigir opt-in explícito (`R2_SMOKE_ALLOW_PRODUCTION`, PR #40);
  - a fumaça passou a aguardar a atribuição do domínio (PR #41).
- Backup e restauração de produção comprovados: 240 s.

## Referências

- Planejamento v1.4: seções 24.4–24.6 e 25; ficha `docs/sprints/S06.md`.
- ADR-0001, ADR-0003, ADR-0005, ADR-0009, ADR-0011, ADR-0012, ADR-0014, ADR-0015.
- Runbooks em `docs/runbooks/`.
