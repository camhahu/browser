export type BenchmarkKey =
    | "account-setup"
    | "account-setup-settings"
    | "data-table"
    | "drag-drop"
    | "checkout-flow"
    | "accessibility"
    | "error-states"
    | "infinite-scroll";

export type Benchmark = {
    key: BenchmarkKey;
    name: string;
    route: string;
    promptFile: string;
};

export const benchmarks: Benchmark[] = [
    {
        key: "account-setup",
        name: "Account Setup",
        route: "/benchmark/account-setup",
        promptFile: "packages/site/src/pages/benchmark/account-setup-page.prompt.md",
    },
    {
        key: "account-setup-settings",
        name: "Account Setup Settings",
        route: "/benchmark/account-setup/settings",
        promptFile:
            "packages/site/src/pages/benchmark/account-setup-settings-page.prompt.md",
    },
    {
        key: "data-table",
        name: "Data Table",
        route: "/benchmark/data-table",
        promptFile: "packages/site/src/pages/benchmark/data-table-page.prompt.md",
    },
    {
        key: "drag-drop",
        name: "Drag & Drop",
        route: "/benchmark/drag-drop",
        promptFile: "packages/site/src/pages/benchmark/drag-drop-page.prompt.md",
    },
    {
        key: "checkout-flow",
        name: "Checkout Flow",
        route: "/benchmark/checkout-flow",
        promptFile: "packages/site/src/pages/benchmark/checkout-flow-page.prompt.md",
    },
    {
        key: "accessibility",
        name: "Accessibility",
        route: "/benchmark/accessibility",
        promptFile: "packages/site/src/pages/benchmark/accessibility-page.prompt.md",
    },
    {
        key: "error-states",
        name: "Error States",
        route: "/benchmark/error-states",
        promptFile: "packages/site/src/pages/benchmark/error-states-page.prompt.md",
    },
    {
        key: "infinite-scroll",
        name: "Infinite Scroll",
        route: "/benchmark/infinite-scroll",
        promptFile: "packages/site/src/pages/benchmark/infinite-scroll-page.prompt.md",
    },
];

export function getBenchmark(key: string): Benchmark {
    const benchmark = benchmarks.find((item) => item.key === key);
    if (!benchmark) {
        throw new Error(`Unknown benchmark: ${key}`);
    }
    return benchmark;
}
