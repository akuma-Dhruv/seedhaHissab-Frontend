import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import { PrivateScopeBanner } from '@/components/hidden-partners/private-scope-banner';
import { HiddenAgreementForm } from '@/components/hidden-partners/hidden-agreement-form';
import { HiddenAgreementList } from '@/components/hidden-partners/hidden-agreement-list';
import { HiddenSettlementView } from '@/components/hidden-partners/hidden-settlement-view';
import { apiGet } from '@/lib/api';
import type { Partner, Project } from '@/lib/types';

/**
 * Private redistribution surface for a project.
 *
 * Mounted at {@code /projects/:projectId/private-ownership}. Two tabs:
 * "Agreements" (CRUD over the private overlay) and "Internal Settlement"
 * (derived per-partner breakdown). The page is wrapped in a banner that
 * makes it impossible to mistake for the official project view.
 */
export default function PrivateOwnershipPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiGet<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  });
  const { data: partners } = useQuery({
    queryKey: ['partners', projectId],
    queryFn: () => apiGet<Partner[]>(`/projects/${projectId}/partners`),
    enabled: !!projectId,
  });

  const noPartners = partners && partners.length === 0;

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-back-private"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              {projectLoading ? (
                <Skeleton className="h-7 w-56" />
              ) : (
                <>
                  <h1 className="text-2xl font-semibold tracking-tight truncate">
                    Your Share Distribution
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {project?.name}
                  </p>
                </>
              )}
            </div>
            <Button
              data-testid="button-add-private-partner"
              disabled={!partners || noPartners}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Private Partner
            </Button>
          </div>

          <PrivateScopeBanner />

          {noPartners && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Add at least one official partner to this project before recording
                private partners. Private partners always sit underneath an
                official partner's slice.
              </CardContent>
            </Card>
          )}

          {!noPartners && (
            <Tabs defaultValue="agreements">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <TabsList data-testid="tabs-private">
                  <TabsTrigger value="agreements" data-testid="tab-agreements">
                    Agreements
                  </TabsTrigger>
                  <TabsTrigger value="settlement" data-testid="tab-internal-settlement">
                    Internal Settlement
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <Switch
                    id="include-archived"
                    data-testid="switch-include-archived"
                    checked={includeArchived}
                    onCheckedChange={setIncludeArchived}
                  />
                  <Label htmlFor="include-archived" className="text-xs cursor-pointer">
                    Show archived
                  </Label>
                </div>
              </div>

              <TabsContent value="agreements" className="mt-4">
                {projectId && (
                  <HiddenAgreementList
                    projectId={projectId}
                    includeArchived={includeArchived}
                  />
                )}
              </TabsContent>

              <TabsContent value="settlement" className="mt-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Derived from your project's profit and the active agreements above.
                  Project totals on the main dashboard remain unchanged.
                </p>
                {projectId && <HiddenSettlementView projectId={projectId} />}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add private partner</DialogTitle>
            </DialogHeader>
            {projectId && (
              <HiddenAgreementForm
                projectId={projectId}
                onSuccess={() => setCreateOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </Layout>
    </AuthGuard>
  );
}
