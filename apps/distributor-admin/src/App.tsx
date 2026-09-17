import zhCN from 'antd/locale/zh_CN'
import { App as AntdApp, ConfigProvider } from 'antd'
import { useMemo, useState } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import './App.css'
import { OperatorDashboardLayout } from './layouts/OperatorDashboardLayout'
import { AiWorkbenchPage } from './pages/AiWorkbenchPage'
import { AuthTransferPage } from './pages/AuthTransferPage'
import { EnterpriseEmployeesPage } from './pages/EnterpriseEmployeesPage'
import { EnterpriseCompanyPage } from './pages/EnterpriseCompanyPage'
import { EnterpriseOrganizationPage } from './pages/EnterpriseOrganizationPage'
import { EnterprisePermissionsPage } from './pages/EnterprisePermissionsPage'
import { EnterpriseRolesPage } from './pages/EnterpriseRolesPage'
import { OperatorLoginPage } from './pages/OperatorLoginPage'
import { OperatorPlaceholderPage } from './pages/OperatorPlaceholderPage'
import { OperatorProfilePage } from './pages/OperatorProfilePage'
import { getStoredOperatorSession, setStoredOperatorSession } from './session'
import type { OperatorSessionData } from './types'

function ProtectedRoute({ session }: { session: OperatorSessionData | null }) {
  if (!session || !session.profile.roles.includes('DISTRIBUTOR')) {
    if (session && !session.profile.roles.includes('DISTRIBUTOR')) {
      setStoredOperatorSession(null)
    }
    return <Navigate replace to="/login" />
  }

  return <Outlet />
}

export default function App() {
  const [session, setSession] = useState<OperatorSessionData | null>(() => {
    const storedSession = getStoredOperatorSession()
    if (!storedSession) {
      return null
    }
    if (!storedSession.profile.roles.includes('DISTRIBUTOR')) {
      setStoredOperatorSession(null)
      return null
    }
    return storedSession
  })

  const defaultRedirectPath = useMemo(() => (session ? '/admin/dashboard' : '/login'), [session])

  function handleSessionChange(nextSession: OperatorSessionData | null) {
    if (nextSession && !nextSession.profile.roles.includes('DISTRIBUTOR')) {
      setStoredOperatorSession(null)
      setSession(null)
      return
    }
    setStoredOperatorSession(nextSession)
    setSession(nextSession)
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1f5eff',
          borderRadius: 0,
          colorBgLayout: '#f2f5fa',
          colorText: '#162033',
          fontFamily: '"Alibaba PuHuiTi", "PingFang SC", "Microsoft YaHei", sans-serif',
        },
      }}
    >
      <AntdApp>
        <Routes>
          <Route element={<OperatorLoginPage currentSession={session} onLogin={handleSessionChange} />} path="/login" />
          <Route element={<AuthTransferPage onTransfer={handleSessionChange} />} path="/auth/transfer" />

          <Route element={<ProtectedRoute session={session} />}>
            <Route
              element={session ? <OperatorDashboardLayout onLogout={() => handleSessionChange(null)} session={session} /> : null}
              path="/admin"
            >
              <Route element={<AiWorkbenchPage />} path="dashboard" />
              <Route
                element={<OperatorPlaceholderPage description="管理经销商品资料、上下架状态、渠道适配与商品维护流程。" />}
                path="products"
              />
              <Route
                element={<OperatorPlaceholderPage description="查看经销订单流转、履约进度、售后状态与异常订单处理入口。" />}
                path="orders"
              />
              <Route
                element={<OperatorPlaceholderPage description="统一管理经销场景下的营销素材、视觉资源与内容投放物料。" />}
                path="marketing/assets"
              />
              <Route
                element={<OperatorPlaceholderPage description="维护经销报价单模板、渠道报价记录、导出规则与跟进状态。" />}
                path="marketing/quotations"
              />
              <Route element={<EnterpriseEmployeesPage />} path="enterprise/employees" />
              <Route element={<EnterpriseRolesPage />} path="enterprise/roles" />
              <Route element={<EnterprisePermissionsPage />} path="enterprise/permissions" />
              <Route element={<EnterpriseOrganizationPage />} path="enterprise/organization" />
              <Route element={<EnterpriseCompanyPage />} path="enterprise/companies" />
              <Route element={<OperatorProfilePage />} path="settings/profile" />
              <Route
                element={<OperatorPlaceholderPage description="查看系统日志、操作轨迹、异常记录与审计留痕。" />}
                path="settings/logs"
              />
              <Route element={<Navigate replace to="/admin/dashboard" />} index />
            </Route>
          </Route>

          <Route element={<Navigate replace to={defaultRedirectPath} />} path="*" />
        </Routes>
      </AntdApp>
    </ConfigProvider>
  )
}
