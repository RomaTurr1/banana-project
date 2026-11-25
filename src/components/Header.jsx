import React from 'react';
import { NavLink } from 'react-router-dom';
import { useExpo } from '../context/ExpoContext';

export default function Header() {
  const { state } = useExpo();
  const count = state.items.length;

  return (
    <header className="site-header">
      <div className="header-container">
        <NavLink to="/" className="site-brand">
          <span className="brand-icon">🏛️</span>
          <div className="brand-text">
            <span className="brand-title">Своя выставка</span>
            <span className="brand-sub">Чикагский институт искусств</span>
          </div>
        </NavLink>

        <nav className="site-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Поиск
          </NavLink>
          <NavLink
            to="/expo"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Выставка
            <span className={`badge ${count > 0 ? 'badge-highlight' : ''}`}>
              {count}/12
            </span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
