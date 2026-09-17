import 'antd/dist/reset.css'
import { ConfigProvider } from 'antd'
import { useEffect } from 'react'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { antdLocaleMap, useI18nSettings, I18nProvider } from './storefront/i18n'
import { AuthLayout } from './storefront/layout/AuthLayout'
import { StoreLayout } from './storefront/layout/StoreLayout'
import { AboutPage } from './storefront/pages/AboutPage'
import { AuthCallbackPage } from './storefront/pages/AuthCallbackPage'
import { BrandStoryDetailPage } from './storefront/pages/BrandStoryDetailPage'
import { BrandStoriesPage } from './storefront/pages/BrandStoriesPage'
import { FeedbackPage } from './storefront/pages/FeedbackPage'
import { HomePage } from './storefront/pages/HomePage'
import { MemberCenterPage } from './storefront/pages/MemberCenterPage'
import { ProductDetailPage } from './storefront/pages/ProductDetailPage'
import { RegisterPage } from './storefront/pages/RegisterPage'
import { DISTRIBUTOR_LOGIN_URL } from './storefront/navigation'
import { StorefrontSessionProvider } from './storefront/session'
import './App.css'

function ExternalRedirectPage({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url)
  }, [url])

  return null
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <StoreLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'about-us',
        element: <AboutPage />,
      },
      {
        path: 'brand-stories',
        element: <BrandStoriesPage />,
      },
      {
        path: 'brand-stories/:slug',
        element: <BrandStoryDetailPage />,
      },
      {
        path: 'member-center',
        element: <MemberCenterPage />,
      },
      {
        path: 'feedback',
        element: <FeedbackPage />,
      },
      {
        path: 'products/:productId',
        element: <ProductDetailPage />,
      },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <ExternalRedirectPage url={DISTRIBUTOR_LOGIN_URL} /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    path: '*',
    element: <Navigate replace to="/" />,
  },
])

function ThemedApp() {
  const { language } = useI18nSettings()
  const fontFamily =
    language === 'zh-CN'
      ? '"Alibaba PuHuiTi 2.0", "Alibaba PuHuiTi 3.0", "Alibaba PuHuiTi", "阿里巴巴普惠体 2.0", "阿里巴巴普惠体 3.0", "阿里巴巴普惠体", "PingFang SC", "Microsoft YaHei", sans-serif'
      : '"Montserrat", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

  return (
    <ConfigProvider
      locale={antdLocaleMap[language]}
      theme={{
        token: {
          colorPrimary: '#1f5eff',
          colorInfo: '#1f5eff',
          borderRadius: 2,
          fontSize: 13,
          fontFamily,
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

function App() {
  return (
    <I18nProvider>
      <StorefrontSessionProvider>
        <ThemedApp />
      </StorefrontSessionProvider>
    </I18nProvider>
  )
}

export default App
