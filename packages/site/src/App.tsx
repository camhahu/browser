import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { RootLayout, BenchmarkLayout, TestLayout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { BenchmarkLoginPage } from './pages/benchmark/BenchmarkLoginPage'
import { BenchmarkSettingsPage } from './pages/benchmark/BenchmarkSettingsPage'
import { BenchmarkDataTablePage } from './pages/benchmark/BenchmarkDataTablePage'
import { BenchmarkDragDropPage } from './pages/benchmark/BenchmarkDragDropPage'
import { BenchmarkWizardPage } from './pages/benchmark/BenchmarkWizardPage'
import { BenchmarkErrorHandlingPage } from './pages/benchmark/BenchmarkErrorHandlingPage'
import { BenchmarkInfiniteScrollPage } from './pages/benchmark/BenchmarkInfiniteScrollPage'
import { BenchmarkAccessibilityPage } from './pages/benchmark/BenchmarkAccessibilityPage'
import { TestIndexPage } from './pages/test/TestIndexPage'
import { TestPage } from './pages/test/TestPage'
import { TestBlogPage } from './pages/test/TestBlogPage'

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

const benchmarkLoginRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'account-setup',
  component: BenchmarkLoginPage,
})

const benchmarkSettingsRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'account-setup/settings',
  component: BenchmarkSettingsPage,
})

const benchmarkDataTableRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'data-table',
  component: BenchmarkDataTablePage,
})

const benchmarkDragDropRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'drag-drop',
  component: BenchmarkDragDropPage,
})

const benchmarkWizardRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'checkout-flow',
  component: BenchmarkWizardPage,
})

const benchmarkAccessibilityRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'accessibility',
  component: BenchmarkAccessibilityPage,
})

const benchmarkErrorHandlingRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'error-states',
  component: BenchmarkErrorHandlingPage,
})

const benchmarkInfiniteScrollRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: 'infinite-scroll',
  component: BenchmarkInfiniteScrollPage,
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
    benchmarkLoginRoute,
    benchmarkSettingsRoute,
    benchmarkDataTableRoute,
    benchmarkDragDropRoute,
    benchmarkWizardRoute,
    benchmarkAccessibilityRoute,
    benchmarkErrorHandlingRoute,
    benchmarkInfiniteScrollRoute,
  ]),
  testLayoutRoute.addChildren([testIndexRoute, testPageRoute, testBlogRoute]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
