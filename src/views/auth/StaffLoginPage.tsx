import React from 'react'
import WorkspaceLogin from '@/components/auth/WorkspaceLogin'

const StaffLoginPage: React.FC = () => {
  return (
    <WorkspaceLogin
      title="Staff Workspace"
      subtitle="Dành cho nhân viên vận hành: ticket, check-in, công việc hiện trường và thao tác hằng ngày."
      accentClass="text-secondary"
      panelClass="bg-gradient-to-br from-secondary to-[#0F766E]"
      allowedRoles={['Staff']}
      redirectWhenAuthenticated={['Staff']}
      invalidRoleMessage="Tài khoản này không thuộc cổng Staff."
      quickLogin={{
        email: 'staff@smartstay.vn',
        password: 'Staff@123456',
        label: 'Staff mẫu',
        helper: 'Seed mẫu cho đợt tách vai trò',
      }}
    />
  )
}

export default StaffLoginPage
