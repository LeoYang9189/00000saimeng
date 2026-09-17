import zhCN from 'antd/locale/zh_CN'
import { ConfigProvider } from 'antd'
import { useMemo, useState } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import './App.css'
import { OperatorDashboardLayout } from './layouts/OperatorDashboardLayout'
import { AiWorkbenchPage } from './pages/AiWorkbenchPage'
import { KnowledgeManagementPage } from './pages/KnowledgeManagementPage'
import { CategoryManagementPage } from './pages/CategoryManagementPage'
import { EnterpriseEmployeesPage } from './pages/EnterpriseEmployeesPage'
import { EnterpriseOrganizationPage } from './pages/EnterpriseOrganizationPage'
import { EnterprisePermissionsPage } from './pages/EnterprisePermissionsPage'
import { EnterpriseRolesPage } from './pages/EnterpriseRolesPage'
import { OperatorLoginPage } from './pages/OperatorLoginPage'
import { OperatorPlaceholderPage } from './pages/OperatorPlaceholderPage'
import { OperatorProfilePage } from './pages/OperatorProfilePage'
import { ProductCenterPage } from './pages/ProductCenterPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { QuotationDetailPage } from './pages/QuotationDetailPage'
import { QuotationManagementPage } from './pages/QuotationManagementPage'
import { UserCenterCompaniesPage } from './pages/UserCenterCompaniesPage'
import { UserCenterCompanyDetailPage } from './pages/UserCenterCompanyDetailPage'
import { UserCenterMembersPage } from './pages/UserCenterMembersPage'
import { UserCenterReviewsPage } from './pages/UserCenterReviewsPage'
import { UserCenterUsersPage } from './pages/UserCenterUsersPage'
import { getStoredOperatorSession, setStoredOperatorSession } from './session'
import type { OperatorSessionData } from './types'

function ProtectedRoute({ session }: { session: OperatorSessionData | null }) {
  if (!session) {
    return <Navigate replace to="/login" />
  }

  return <Outlet />
}

export default function App() {
  const [session, setSession] = useState<OperatorSessionData | null>(() => getStoredOperatorSession())

  const defaultRedirectPath = useMemo(() => (session ? '/admin/dashboard' : '/login'), [session])

  function handleSessionChange(nextSession: OperatorSessionData | null) {
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
      <Routes>
        <Route
          element={session ? <Navigate replace to="/admin/dashboard" /> : <OperatorLoginPage onLogin={handleSessionChange} />}
          path="/login"
        />

        <Route element={<ProtectedRoute session={session} />}>
          <Route
            element={session ? <OperatorDashboardLayout onLogout={() => handleSessionChange(null)} session={session} /> : null}
            path="/admin"
          >
              <Route
                element={<AiWorkbenchPage />}
                path="dashboard"
              />
              <Route
                element={<UserCenterUsersPage />}
                path="user-center/users"
              />
              <Route
                element={<UserCenterReviewsPage />}
                path="user-center/reviews"
              />
              <Route
                element={<UserCenterCompaniesPage />}
                path="user-center/companies"
              />
              <Route
                element={<UserCenterCompanyDetailPage isCreateMode />}
                path="user-center/companies/new"
              />
              <Route
                element={<UserCenterCompanyDetailPage />}
                path="user-center/companies/:enterpriseId"
              />
              <Route
                element={<UserCenterMembersPage />}
                path="user-center/members"
              />
              <Route
                element={<ProductCenterPage />}
                path="products"
              />
              <Route element={<ProductDetailPage isCreateMode />} path="products/new" />
              <Route element={<ProductDetailPage />} path="products/:productId" />
              <Route
                element={
                  <OperatorPlaceholderPage
                    description="查看订单流转、履约进度、售后状态与异常订单处理入口。"
                  />
                }
                path="orders"
              />
              <Route
                element={
                  <OperatorPlaceholderPage
                    description="维护首页 Banner、投放素材、营销内容与视觉资源配置。"
                  />
                }
                path="marketing/banners"
              />
              <Route
                element={
                  <OperatorPlaceholderPage
                    description="统一管理营销图片、文案素材、活动资源与素材归档。"
                  />
                }
                path="marketing/assets"
              />
              <Route
                element={<QuotationManagementPage />}
                path="marketing/quotations"
              />
              <Route element={<QuotationDetailPage isCreateMode />} path="marketing/quotations/new" />
              <Route element={<QuotationDetailPage />} path="marketing/quotations/:quotationId" />
              <Route
                element={
                  <OperatorPlaceholderPage
                    description="配置营销活动规则、活动时间、参与范围与投放节奏。"
                  />
                }
                path="marketing/activities"
              />
              <Route element={<EnterpriseEmployeesPage />} path="enterprise/employees" />
              <Route element={<EnterpriseRolesPage />} path="enterprise/roles" />
              <Route element={<EnterprisePermissionsPage />} path="enterprise/permissions" />
              <Route element={<EnterpriseOrganizationPage />} path="enterprise/organization" />
              <Route element={<OperatorProfilePage />} path="settings/profile" />
              <Route element={<Navigate replace to="/admin/dashboard" />} path="settings/ai" />
              <Route element={<CategoryManagementPage />} path="settings/categories" />
              <Route element={<KnowledgeManagementPage />} path="settings/knowledge" />
              <Route
                element={
                  <OperatorPlaceholderPage
                    description="维护网站基础配置、全局参数、域名信息与站点设定。"
                  />
                }
                path="settings/site"
              />
              <Route
                element={
                  <OperatorPlaceholderPage
                    description="维护网站栏目内容、页面说明、富文本内容与发布状态。"
                  />
                }
                path="settings/content"
              />
              <Route
                element={
                  <OperatorPlaceholderPage
                    description="查看系统日志、操作轨迹、异常记录与审计留痕。"
                  />
                }
                path="settings/logs"
              />
              <Route element={<Navigate replace to="/admin/dashboard" />} index />
          </Route>
        </Route>

        <Route element={<Navigate replace to={defaultRedirectPath} />} path="*" />
      </Routes>
    </ConfigProvider>
  )
}
