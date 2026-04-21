import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost } from '@/lib/api';
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import type { Project } from '@/lib/types';
import { motion } from 'framer-motion';

export default function ProjectsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiGet<Project[]>('/projects'),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiPost<Project>('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
      setName('');
      setDescription('');
      toast({ title: 'Project created' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create project';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
              <p className="text-sm text-muted-foreground mt-1">Your financial projects</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-project">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create new project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="proj-name">Project name</Label>
                    <Input
                      id="proj-name"
                      data-testid="input-project-name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Sector-9 Building"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="proj-desc">Description (optional)</Label>
                    <Textarea
                      id="proj-desc"
                      data-testid="input-project-description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Short description..."
                      rows={3}
                    />
                  </div>
                  <Button
                    className="w-full"
                    data-testid="button-create-project"
                    onClick={handleCreate}
                    disabled={createMutation.isPending || !name.trim()}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create project'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <motion.div
              className="grid gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/projects/${project.id}`} className="block" data-testid={`card-project-${project.id}`}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="py-4 px-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FolderOpen className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground" data-testid={`text-project-name-${project.id}`}>{project.name}</p>
                              {project.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="font-medium">No projects yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create your first project to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}
