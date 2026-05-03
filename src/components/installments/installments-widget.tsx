import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InstallmentCard } from './installment-card';
import { useInstallments } from '@/hooks/use-installments';

interface InstallmentsWidgetProps {
  projectId: string;
  /**
   * Opens the create-installment dialog. The dashboard owns the dialog so
   * the widget stays read-only and reusable.
   */
  onCreateClick: () => void;
}

/**
 * Compact installment summary surfaced on the project dashboard. Shows up
 * to five most-relevant installments (default order is the backend's
 * dueDate ASC). Click anywhere to drill into the full list page.
 */
export function InstallmentsWidget({ projectId, onCreateClick }: InstallmentsWidgetProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useInstallments(projectId, { limit: 5 });
  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <Card data-testid="widget-installments">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">Receivables</h3>
            <p className="text-xs text-muted-foreground">
              {total === 0
                ? 'No installments yet'
                : total === 1
                  ? '1 installment'
                  : `${total} installments`}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              data-testid="button-widget-add-installment"
              onClick={onCreateClick}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              data-testid="button-widget-view-all-installments"
              onClick={() => navigate(`/projects/${projectId}/installments`)}
            >
              View all
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add an installment to start tracking what you&rsquo;re owed.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((i) => (
              <InstallmentCard key={i.id} installment={i} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
