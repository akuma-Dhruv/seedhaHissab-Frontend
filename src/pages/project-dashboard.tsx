import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost } from '@/lib/api';
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import { TransactionList } from '@/components/transaction-list';
import { VendorLedgerTable } from '@/components/vendor-ledger-table';
import { PartnerSettlementTable } from '@/components/partner-settlement-table';
import type { Project, Partner, Vendor, ProjectSummaryResponse } from '@/lib/types';
import { motion } from 'framer-motion';

function formatAmount(val: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

export default function ProjectDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerShare, setPartnerShare] = useState('');
  const [vendorName, setVendorName] = useState('');

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiGet<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['project-summary', projectId],
    queryFn: () => apiGet<ProjectSummaryResponse>(`/projects/${projectId}/summary`),
    enabled: !!projectId,
  });

  const { data: partners } = useQuery({
    queryKey: ['partners', projectId],
    queryFn: () => apiGet<Partner[]>(`/projects/${projectId}/partners`),
    enabled: !!projectId,
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors', projectId],
    queryFn: () => apiGet<Vendor[]>(`/projects/${projectId}/vendors`),
    enabled: !!projectId,
  });

  const addPartnerMutation = useMutation({
    mutationFn: (data: { name: string; sharePercentage: number }) =>
      apiPost<Partner>(`/projects/${projectId}/partners`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners', projectId] });
      setPartnerDialogOpen(false);
      setPartnerName('');
      setPartnerShare('');
      toast({ title: 'Partner added' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add partner';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  const addVendorMutation = useMutation({
    mutationFn: (data: { name: string; projectId: string }) =>
      apiPost<Vendor>('/vendors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors', projectId] });
      setVendorDialogOpen(false);
      setVendorName('');
      toast({ title: 'Vendor added' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add vendor';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/projects')} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              {projectLoading ? (
                <Skeleton className="h-7 w-48" />
              ) : (
                <h1 className="text-2xl font-semibold tracking-tight truncate" data-testid="text-project-name">{project?.name}</h1>
              )}
              {project?.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
              )}
            </div>
            <Button
              data-testid="button-add-transaction"
              onClick={() => navigate(`/projects/${projectId}/transactions/new`)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>

          {summaryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : summary && (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Income</p>
                      <p className="text-xl font-semibold mt-1 text-emerald-600 dark:text-emerald-400" data-testid="text-total-income">
                        {formatAmount(summary.totalIncome)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-500/30" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Expense</p>
                      <p className="text-xl font-semibold mt-1 text-rose-600 dark:text-rose-400" data-testid="text-total-expense">
                        {formatAmount(summary.totalExpense)}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-rose-500/30" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Net Profit</p>
                      <p className={`text-xl font-semibold mt-1 ${Number(summary.profit) >= 0 ? 'text-primary' : 'text-rose-600 dark:text-rose-400'}`} data-testid="text-profit">
                        {formatAmount(summary.profit)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Tabs defaultValue="transactions">
            <TabsList data-testid="tabs-project">
              <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
              <TabsTrigger value="vendors" data-testid="tab-vendors">Vendors</TabsTrigger>
              <TabsTrigger value="partners" data-testid="tab-partners">Partners</TabsTrigger>
              <TabsTrigger value="settlement" data-testid="tab-settlement">Settlement</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-4">
              <TransactionList projectId={projectId!} />
            </TabsContent>

            <TabsContent value="vendors" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">Vendors</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="button-add-vendor"
                    onClick={() => setVendorDialogOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Vendor
                  </Button>
                </div>
                <VendorLedgerTable projectId={projectId!} />
              </div>
            </TabsContent>

            <TabsContent value="partners" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">Partners</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="button-add-partner"
                    onClick={() => setPartnerDialogOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Partner
                  </Button>
                </div>
                {partners && partners.length > 0 ? (
                  <div className="space-y-2">
                    {partners.map(p => (
                      <Card key={p.id}>
                        <CardContent className="py-3 px-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium" data-testid={`text-partner-name-${p.id}`}>{p.name}</span>
                          </div>
                          <Badge variant="secondary" data-testid={`text-partner-share-${p.id}`}>{p.sharePercentage}% share</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No partners yet</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settlement" className="mt-4">
              <PartnerSettlementTable projectId={projectId!} />
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={partnerDialogOpen} onOpenChange={setPartnerDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Partner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Partner name</Label>
                <Input
                  data-testid="input-partner-name"
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Share percentage</Label>
                <Input
                  type="number"
                  data-testid="input-partner-share"
                  value={partnerShare}
                  onChange={e => setPartnerShare(e.target.value)}
                  placeholder="e.g. 50"
                  min={0}
                  max={100}
                />
              </div>
              <Button
                className="w-full"
                data-testid="button-save-partner"
                disabled={addPartnerMutation.isPending || !partnerName.trim() || !partnerShare}
                onClick={() => addPartnerMutation.mutate({ name: partnerName.trim(), sharePercentage: Number(partnerShare) })}
              >
                {addPartnerMutation.isPending ? 'Adding...' : 'Add Partner'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Vendor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Vendor name</Label>
                <Input
                  data-testid="input-vendor-name"
                  value={vendorName}
                  onChange={e => setVendorName(e.target.value)}
                  placeholder="e.g. Steel Supplier Co."
                />
              </div>
              <Button
                className="w-full"
                data-testid="button-save-vendor"
                disabled={addVendorMutation.isPending || !vendorName.trim()}
                onClick={() => addVendorMutation.mutate({ name: vendorName.trim(), projectId: projectId! })}
              >
                {addVendorMutation.isPending ? 'Adding...' : 'Add Vendor'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Layout>
    </AuthGuard>
  );
}
