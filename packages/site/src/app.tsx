import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { RootLayout, BenchmarkLayout, TestLayout } from './components/layout'
import { HomePage } from './pages/home-page'
import { AccountSetupPage } from './pages/benchmark/account-setup-page'
import { AccountSetupSettingsPage } from './pages/benchmark/account-setup-settings-page'
import { DataTablePage } from './pages/benchmark/data-table-page'
import { DragDropPage } from './pages/benchmark/drag-drop-page'
import { CheckoutFlowPage } from './pages/benchmark/checkout-flow-page'
import { ErrorStatesPage } from './pages/benchmark/error-states-page'
import { InfiniteScrollPage } from './pages/benchmark/infinite-scroll-page'
import { AccessibilityPage } from './pages/benchmark/accessibility-page'
import { TestIndexPage } from './pages/test/test-index-page'
import { TestPage } from './pages/test/test-page'
import { TestBlogPage } from './pages/test/test-blog-page'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const benchmarkLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/benchmark',
  component: BenchmarkLayout,
})

const accountSetupRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'account-setup',
  component: AccountSetupPage,
})

const accountSetupSettingsRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'account-setup/settings',
  component: AccountSetupSettingsPage,
})

const dataTableRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'data-table',
  component: DataTablePage,
})

const dragDropRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'drag-drop',
  component: DragDropPage,
})

const checkoutFlowRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'checkout-flow',
  component: CheckoutFlowPage,
})

const accessibilityRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'accessibility',
  component: AccessibilityPage,
})

const errorStatesRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'error-states',
  component: ErrorStatesPage,
})

const infiniteScrollRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'infinite-scroll',
  component: InfiniteScrollPage,
})

const testLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/test',
  component: TestLayout,
})

const testIndexRoute = createRoute({
  getParentRoute: () => testLayoutRoute,
  path: '/',
  component: TestIndexPage,
})

const testPageRoute = createRoute({
  getParentRoute: () => testLayoutRoute,
  path: '$slug',
  component: TestPage,
})

const testBlogRoute = createRoute({
  getParentRoute: () => testLayoutRoute,
  path: '$slug/blog',
  component: TestBlogPage,
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  benchmarkLayoutRoute.addChildren([
    accountSetupRoute,
    accountSetupSettingsRoute,
    dataTableRoute,
    dragDropRoute,
    checkoutFlowRoute,
    accessibilityRoute,
    errorStatesRoute,
    infiniteScrollRoute,
  ]),
  testLayoutRoute.addChildren([testIndexRoute, testPageRoute, testBlogRoute]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
