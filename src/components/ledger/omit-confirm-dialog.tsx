import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Transaction } from '@/lib/types';

interface OmitConfirmDialogProps {
  target: Transaction | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
  testIdPrefix: string;
}

export function OmitConfirmDialog({
  target,
  onCancel,
  onConfirm,
  testIdPrefix,
}: OmitConfirmDialogProps) {
  return (
    <AlertDialog open={!!target} onOpenChange={open => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Omit transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            This transaction will be marked as omitted and excluded from your
            totals. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={`button-${testIdPrefix}-omit-cancel`}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid={`button-${testIdPrefix}-omit-confirm`}
            className="bg-destructive hover:bg-destructive/90"
            onClick={() => target && onConfirm(target.id)}
          >
            Omit transaction
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
