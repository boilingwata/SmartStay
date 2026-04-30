export function statusLabel(value: string) {
  switch (value) {
    case 'approved': return 'Đã duyệt';
    case 'pending_approval': return 'Chờ duyệt';
    case 'archived': return 'Lưu trữ';
    case 'rejected': return 'Từ chối';
    default: return 'Nháp';
  }
}

export function statusClass(value: string) {
  switch (value) {
    case 'approved': return 'bg-primary/10 text-primary border-primary/20';
    case 'pending_approval': return 'bg-amber-500/15 text-amber-600 border-amber-500/20';
    case 'archived': return 'bg-muted text-muted-foreground border-border';
    case 'rejected': return 'bg-destructive/15 text-destructive border-destructive/20';
    default: return 'bg-secondary text-secondary-foreground border-border';
  }
}
