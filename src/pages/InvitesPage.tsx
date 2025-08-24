import React, { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useInvites } from '@/hooks/useInvites';
import { InviteDialog } from '@/components/invites/InviteDialog';
import { Mail, Clock, CheckCircle, XCircle, Plus, RefreshCw, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export const InvitesPage: React.FC = () => {
  const { user } = useAuthStore();
  const { invites, loading: invitesLoading, refetch, resendInvite, cancelInvite } = useInvites();
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const handleInviteCreated = () => {
    setShowInviteDialog(false);
    refetch();
  };

  const handleResendInvite = async (inviteId: string) => {
    const success = await resendInvite(inviteId);
    if (success) {
      toast.success('Invitation resent successfully');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    const success = await cancelInvite(inviteId);
    if (success) {
      toast.success('Invitation cancelled');
    }
  };

  const copyInviteUrl = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite URL copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <StatusBadge variant="pending">
            <Clock className="h-3 w-3 mr-1" />
            PENDING
          </StatusBadge>
        );
      case 'ACCEPTED':
        return (
          <StatusBadge variant="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            ACCEPTED
          </StatusBadge>
        );
      case 'EXPIRED':
        return (
          <StatusBadge variant="error">
            <XCircle className="h-3 w-3 mr-1" />
            EXPIRED
          </StatusBadge>
        );
      default:
        return (
          <StatusBadge variant="neutral">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </StatusBadge>
        );
    }
  };

  type InviteType = {
    id: string;
    email: string;
    role: string;
    status: string;
    expires_at: string;
    created_at: string;
    token: string;
  };

  const inviteColumns = [
    {
      key: 'email',
      label: 'Email',
      render: (invite: InviteType) => (
        <div className="font-medium">{invite.email}</div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (invite: InviteType) => (
        <StatusBadge variant="info">{invite.role}</StatusBadge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (invite: InviteType) => getStatusBadge(invite.status)
    },
    {
      key: 'expires_at',
      label: 'Expires',
      render: (invite: InviteType) => new Date(invite.expires_at).toLocaleDateString()
    },
    {
      key: 'created_at',
      label: 'Sent',
      render: (invite: InviteType) => new Date(invite.created_at).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (invite: InviteType) => (
        <div className="flex items-center space-x-2">
          {invite.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyInviteUrl(invite.token)}
                title="Copy invite URL"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleResendInvite(invite.id)}
                title="Resend invitation"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCancelInvite(invite.id)}
                title="Cancel invitation"
              >
                <XCircle className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  if (user?.role !== 'OWNER' && user?.role !== 'SUPERADMIN') {
    return (
      <EmptyState
        icon={<Mail className="h-12 w-12" />}
        title="Access Denied"
        description="Only owners can manage invitations."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Invitations"
        description="Invite new team members to join your company"
      >
        <Button onClick={() => setShowInviteDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Send Invitation
        </Button>
      </PageHeader>

      {/* Invites Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Invitations</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={invitesLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${invitesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invitesLoading ? (
            <LoadingSpinner size="lg" text="Loading invitations..." className="py-8" />
          ) : invites.length === 0 ? (
            <EmptyState
              icon={<Mail className="h-12 w-12" />}
              title="No invitations"
              description="Get started by sending your first invitation."
              action={{
                label: 'Send First Invitation',
                onClick: () => setShowInviteDialog(true)
              }}
            />
          ) : (
            <DataTable
              data={invites}
              columns={inviteColumns}
              emptyMessage="No invitations found"
            />
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <InviteDialog onClose={handleInviteCreated} />
      )}
    </div>
  );
};