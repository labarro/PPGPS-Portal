# Guia do editor (coordenador do grupo)

> Painel: `https://bioeticaps.app/admin`. Sua conta é `editor`: você edita todo o conteúdo acadêmico e editorial, registra consentimentos e lê a auditoria. Contas e configurações técnicas ficam com o desenvolvedor (`admin`).

## Primeiro acesso

1. Abra o e-mail “Defina sua senha” e use o link em até 1 hora. Se ele expirar, use **Esqueceu a senha?** na tela de login.
2. A senha precisa ter pelo menos 12 caracteres e não pode ser comum. Depois de 5 tentativas erradas, o acesso fica bloqueado por 15 minutos.

## Alterar textos do grupo e das linhas

- **Perfil do grupo:** apresentação, objetivos, histórico, liderança, e-mail de contato do grupo e nota de responsabilidade.
- **Linhas temáticas:** uma por eixo (Bioética e Promoção da Saúde).
- Ao substituir um texto provisório pelo definitivo, desmarque **Contém textos provisórios** (perfil) ou **Texto provisório** (linha) e clique em **Publicar**. O site atualiza sem deploy.
- **Rascunho** não aparece no site. Para conferir antes, use **Pré-visualizar**.

## Publicar um ensaio

1. Em **Ensaios → Criar novo**, preencha:
   - título, resumo, texto, autoria e natureza;
   - categoria e tags;
   - referências (DOI quando houver).
2. **Imagens:**
   - envie em **Mídias** com texto alternativo, crédito, licença e origem;
   - imagens com pessoas identificáveis precisam de autorização de imagem vinculada;
   - use arquivos de até **4 MB** (reduza a imagem antes de enviar).
3. Clique em **Ações editoriais → Enviar para revisão**. O ensaio pode então ser aprovado (com o checklist completo) ou devolvido (com comentário).
4. Depois de aprovado, escolha **Publicar agora** ou **Agendar** (data futura; a publicação acontece no horário marcado).
5. Para corrigir um ensaio publicado, crie uma correção. O texto original continua no ar até a nova versão ser publicada, com a nota de correção.
6. **Arquivar** tira o ensaio das listagens, do RSS e do sitemap, mas o endereço continua acessível com um aviso.

**Nunca** inclua dados de pacientes, participantes de pesquisa ou terceiros identificáveis.

## Publicar ou atualizar o perfil de um integrante

1. Em **Pessoas**, cadastre ou edite a pessoa (nome, minibiografia, formação, Lattes, ORCID). Em **Vínculos**, registre o papel no grupo, o período e as linhas.
2. O perfil **só aparece no site** depois de registrado em **Consentimentos**:
   - escopos: perfil público, foto e/ou e-mail;
   - data;
   - meio de coleta;
   - comprovante (documento privado).
   
   A autorização geral do grupo não basta.
3. Para retirar um perfil, preencha a **data de revogação** no consentimento. O efeito é imediato e definitivo; uma nova autorização exige um novo registro.

## Páginas legais e de apoio

Em **Páginas**, edite `privacidade`, `acessibilidade` e `sobre-o-portal`. Não altere esses slugs.

## Em caso de dúvida

Fale com o desenvolvedor responsável. Pedidos de titulares e de instituições seguem os runbooks `docs/runbooks/solicitacao-titular.md` e `solicitacao-instituicao.md`.
