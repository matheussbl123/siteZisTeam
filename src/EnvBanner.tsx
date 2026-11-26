/** Faixa fixa no topo fora da produção, para ninguém confundir o site de teste com o real. */
export function EnvBanner() {
  if (__AMBIENTE__ === 'production') return null;
  const label = __AMBIENTE__ === 'preview' ? 'HOMOLOGAÇÃO' : 'DESENVOLVIMENTO';
  return (
    <div className="env-banner" role="note">
      {label} · ambiente de teste — contatos e configurações daqui não vão para o site oficial
    </div>
  );
}
