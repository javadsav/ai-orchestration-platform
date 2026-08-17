import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { Workflow, Execution, Page } from "@/lib/api/types";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

const workflow: Workflow = {
  id: "wf-1",
  name: "Sample Workflow",
  description: "A sample workflow",
  stage_definitions: [
    { key: "preprocess", label: "Preprocess", failure_rate: 0.1, min_duration_ms: 100, max_duration_ms: 500 },
  ],
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const execution: Execution = {
  id: "exec-1",
  workflow_id: "wf-1",
  status: "running",
  celery_task_id: "task-1",
  input_payload: null,
  result_payload: null,
  error_message: null,
  queued_at: new Date().toISOString(),
  started_at: new Date().toISOString(),
  finished_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const workflowsPage: Page<Workflow> = { items: [workflow], total: 1, limit: 100, offset: 0 };
const executionsPage: Page<Execution> = { items: [execution], total: 1, limit: 10, offset: 0 };

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  close() {
    this.readyState = 3;
  }
}

describe("smoke tests", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "WebSocket",
      MockWebSocket as unknown as typeof WebSocket,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    MockWebSocket.instances = [];
  });

  it("renders the Dashboard page without crashing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/executions")) {
          return Promise.resolve(new Response(JSON.stringify(executionsPage), { status: 200 }));
        }
        return Promise.resolve(new Response(JSON.stringify(workflowsPage), { status: 200 }));
      }),
    );

    const { default: DashboardPage } = await import("@/app/page");
    const ui = await DashboardPage();
    render(ui);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  it("renders the Workflows list page without crashing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(workflowsPage), { status: 200 }))),
    );

    const { default: WorkflowsPage } = await import("@/app/workflows/page");
    const ui = await WorkflowsPage();
    render(ui);

    await waitFor(() => {
      expect(screen.getByText("Sample Workflow")).toBeInTheDocument();
    });
  });

  it("renders the Execution Detail view without crashing", async () => {
    const { ExecutionDetailView } = await import("@/components/execution/ExecutionDetailView");
    render(<ExecutionDetailView executionId="exec-1" />);

    expect(screen.getByText(/Execution exec-1/i)).toBeInTheDocument();
    expect(screen.getByText("Stage Timeline")).toBeInTheDocument();
    expect(screen.getByText("Logs")).toBeInTheDocument();
  });
});
