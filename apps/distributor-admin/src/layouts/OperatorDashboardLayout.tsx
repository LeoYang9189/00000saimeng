import {
  ApartmentOutlined,
  DashboardOutlined,
  FileTextOutlined,
  DownOutlined,
  LogoutOutlined,
  OrderedListOutlined,
  ProductOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Avatar, Breadcrumb, Dropdown, Layout, Menu, Typography } from 'antd'
import type { MenuProps } from 'antd'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { OperatorSessionData } from '../types'

const { Header, Sider, Content } = Layout

interface OperatorDashboardLayoutProps {
  session: OperatorSessionData
  onLogout: () => void
}

interface OperatorMenuNode {
  key: string
  label: string
  icon?: ReactNode
  children?: OperatorMenuNode[]
}

const menuTree: OperatorMenuNode[] = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'AI工作台' },
  { key: '/admin/products', icon: <ProductOutlined />, label: '商品中心' },
  { key: '/admin/orders', icon: <OrderedListOutlined />, label: '订单中心' },
  {
    key: '/admin/marketing',
    icon: <FileTextOutlined />,
    label: '营销中心',
    children: [
      { key: '/admin/marketing/assets', label: '素材管理' },
      { key: '/admin/marketing/quotations', label: '报价单管理' },
    ],
  },
  {
    key: '/admin/enterprise',
    icon: <ApartmentOutlined />,
    label: '企业中心',
    children: [
      { key: '/admin/enterprise/employees', label: '员工管理' },
      { key: '/admin/enterprise/roles', label: '角色管理' },
      { key: '/admin/enterprise/permissions', label: '权限管理' },
      { key: '/admin/enterprise/organization', label: '组织架构' },
      { key: '/admin/enterprise/companies', label: '企业管理' },
    ],
  },
  {
    key: '/admin/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
    children: [
      { key: '/admin/settings/profile', label: '个人中心' },
      { key: '/admin/settings/logs', label: '系统日志' },
    ],
  },
]

function createMenuItems(nodes: OperatorMenuNode[]): NonNullable<MenuProps['items']> {
  return nodes.map((node) => ({
    key: node.key,
    icon: node.icon,
    label: node.label,
    ...(node.children?.length ? { children: createMenuItems(node.children) } : {}),
  }))
}

const menuItems: MenuProps['items'] = createMenuItems(menuTree)

const titleMap = new Map<string, string>()
const breadcrumbMap = new Map<string, string[]>()
const openKeyMap = new Map<string, string[]>()

function collectMenuMeta(nodes: OperatorMenuNode[], titleTrail: string[] = [], openTrail: string[] = []) {
  nodes.forEach((node) => {
    const currentTitleTrail = [...titleTrail, node.label]

    titleMap.set(node.key, node.label)
    breadcrumbMap.set(node.key, currentTitleTrail)
    openKeyMap.set(node.key, openTrail)

    if (node.children?.length) {
      collectMenuMeta(node.children, currentTitleTrail, [...openTrail, node.key])
    }
  })
}

collectMenuMeta(menuTree)

/**
 * 经销商后台标准框架布局。
 */
export function OperatorDashboardLayout({ session, onLogout }: OperatorDashboardLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const currentPageTitle = useMemo(
    () => titleMap.get(location.pathname) ?? '经销商后台',
    [location.pathname],
  )
  const currentBreadcrumbTitles = useMemo(
    () => breadcrumbMap.get(location.pathname) ?? ['经销商后台'],
    [location.pathname],
  )
  const currentOpenKeys = useMemo(
    () => openKeyMap.get(location.pathname) ?? [],
    [location.pathname],
  )
  const [openKeys, setOpenKeys] = useState<string[]>(currentOpenKeys)

  useEffect(() => {
    setOpenKeys(currentOpenKeys)
  }, [currentOpenKeys])

  function handleMenuClick({ key }: { key: string }) {
    void navigate(key)
  }

  function handleLogout() {
    onLogout()
    void navigate('/login', { replace: true })
  }

  const avatarMenuItems: MenuProps['items'] = [
    {
      key: 'account',
      disabled: true,
      label: (
        <div className="operator-layout__dropdown-account">
          <strong>{session.profile.displayName}</strong>
          <span>{session.profile.phone}</span>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout className="operator-layout">
      <Sider breakpoint="lg" className="operator-layout__sider" collapsedWidth={80} width={248}>
        <div className="operator-layout__brand">
          <strong>赛盟商城经销商后台</strong>
        </div>

        <Menu
          className="operator-layout__menu"
          items={menuItems}
          mode="inline"
          onClick={handleMenuClick}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          openKeys={openKeys}
          selectedKeys={[location.pathname]}
        />
      </Sider>

      <Layout>
        <Header className="operator-layout__header">
          <div className="operator-layout__header-main">
            <Breadcrumb
              className="operator-layout__breadcrumb"
              items={currentBreadcrumbTitles.map((title) => ({ title }))}
            />
            <Typography.Title level={4}>{currentPageTitle}</Typography.Title>
          </div>

          <Dropdown menu={{ items: avatarMenuItems }} placement="bottomRight" trigger={['click']}>
            <button className="operator-layout__avatar-trigger" type="button">
              <Avatar className="operator-layout__avatar">
                {session.profile.displayName.slice(0, 1)}
              </Avatar>
              <DownOutlined />
            </button>
          </Dropdown>
        </Header>

        <Content className="operator-layout__content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
