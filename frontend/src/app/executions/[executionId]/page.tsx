import { ExecutionDetailView } from "@/components/execution/ExecutionDetailView";

interface PageProps {
  params: Promise<{ executionId: string }>;
}

export default async function ExecutionDetailPage({ params }: PageProps) {
  const { executionId } = await params;
  return <ExecutionDetailView executionId={executionId} />;
}
