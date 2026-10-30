/**
 * Alerta editorial no topo do editor de ensaios (ficha S05; planejamento 15.2 e 17.7):
 * privacidade de pacientes e terceiros, imagens com autorização e natureza ensaística.
 * Componente sem estado (renderizado no painel).
 */
export function EditorialNotice() {
  return (
    <aside
      role="note"
      aria-label="Cuidados editoriais"
      style={{
        border: '1px solid var(--theme-warning-400, #d9a400)',
        background: 'var(--theme-warning-100, #fff8e1)',
        color: 'var(--theme-elevation-900, #1a1a1a)',
        borderRadius: 6,
        padding: '12px 16px',
        marginBottom: 24,
        lineHeight: 1.5,
      }}
    >
      <strong>Antes de escrever ou colar o texto</strong>
      <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
        <li>
          <strong>
            Não inclua dados pessoais de pacientes, participantes de pesquisa ou terceiros
          </strong>{' '}
          (nomes, iniciais, idade, local, datas, imagens ou qualquer detalhe que permita
          identificá-los), nem relatos clínicos identificáveis.
        </li>
        <li>
          Imagens: use apenas mídias com crédito e licença; pessoas identificáveis exigem
          autorização de imagem vinculada.
        </li>
        <li>
          Texto colado do Word ou de sites é higienizado: estilos, scripts e formatações não
          permitidas são removidos ao salvar.
        </li>
        <li>
          O ensaio é publicado como texto de natureza ensaística, sem revisão por pares, e não
          representa posição institucional. Sem aconselhamento clínico individual.
        </li>
      </ul>
    </aside>
  )
}
