import { useEffect, type ComponentType } from 'react';
import { Contact } from './components/Contact';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { About, Gaming, Media, Racing, Sports } from './components/Sections';
import { navAlias, type SectionId } from './content';
import { useActiveSection } from './hooks';

const SECTIONS: Array<[SectionId, ComponentType]> = [
  ['inicio', Hero],
  ['sobre', About],
  ['midia', Media],
  ['racing', Racing],
  ['sports', Sports],
  ['gaming', Gaming],
  ['contato', Contact],
];

// Só em desenvolvimento: /?only=racing mostra uma única seção (usado para comparar com o PDF).
const only = import.meta.env.DEV ? (new URLSearchParams(location.search).get('only') as SectionId | null) : null;

export default function App() {
  const observed = useActiveSection();
  const active = only ? navAlias[only] ?? only : observed;

  // Links com âncora (ex.: /#contato) abrem já na seção certa.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
  }, []);

  return (
    <>
      <a className="skip-link" href="#contato">Ir para o contato</a>
      <Header active={active} />
      <main>
        {SECTIONS.filter(([id]) => !only || id === only).map(([id, Section]) => <Section key={id} />)}
      </main>
    </>
  );
}
