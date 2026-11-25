import { useEffect, useState } from 'react';
import { navigation, type SectionId } from '../content';
import { scrollToSection, useScrolled } from '../hooks';

export function Header({ active }: { active: SectionId }) {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (id: SectionId) => {
    setOpen(false);
    scrollToSection(id);
  };

  return (
    <header className={`header${scrolled ? ' header--scrolled' : ''}${open ? ' header--open' : ''}`}>
      <a href="#inicio" className="header__logo" onClick={(e) => { e.preventDefault(); go('inicio'); }} aria-label="ZisTeam — voltar ao início">
        <img src="/assets/logo-zisteam.webp" alt="ZisTeam" width={234} height={95} />
      </a>

      <button
        type="button"
        className="header__toggle"
        aria-expanded={open}
        aria-controls="menu-principal"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>

      <nav id="menu-principal" className="nav" aria-label="Menu principal">
        <ul>
          {navigation.map((item) => {
            const isActive = item.target === active;
            return (
              <li key={item.target}>
                <a
                  href={`#${item.target}`}
                  className={`nav__link${isActive ? ' nav__link--active' : ''}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={(e) => { e.preventDefault(); go(item.target); }}
                >
                  {isActive && <span className="nav__slashes" aria-hidden="true">//</span>}
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
