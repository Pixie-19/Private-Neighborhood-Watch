import { createFileRoute } from '@tanstack/react-router';
import { IncidentReport } from '@/pages/incident-report';

export const Route = createFileRoute('/incident-report')({
  component: IncidentReport,
});
