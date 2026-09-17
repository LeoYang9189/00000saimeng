import { Outlet } from 'react-router-dom'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <aside className="auth-layout__aside">
        <div className="auth-layout__visual" />
      </aside>

      <section className="auth-layout__main">
        <div className="auth-layout__toolbar">
          <LanguageSwitcher />
        </div>
        <Outlet />
      </section>
    </div>
  )
}
