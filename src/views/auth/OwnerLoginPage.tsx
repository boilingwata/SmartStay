import React from 'react'
import WorkspaceLogin from '@/components/auth/WorkspaceLogin'

const OwnerLoginPage: React.FC = () => {
  return (
    <WorkspaceLogin
      title="Owner Workspace"
      subtitle="Dành cho chủ vận hành tổ chức và portfolio tòa nhà. Đây là phần thay thế cho Admin hiện tại."
      accentClass="text-primary"
      panelClass="bg-gradient-to-br from-primary to-[#2E5D9F]"
      allowedRoles={['Owner']}
      redirectWhenAuthenticated={['Owner']}
      invalidRoleMessage="Tài khoản này không thuộc cổng Owner."
      quickLogin={{
        email: 'admin@smartstay.vn',
        password: 'Admin@123456',
        label: 'Owner hiện tại',
        helper: 'Admin cũ được hiểu là Owner',
      }}
    />
  )
}

export default OwnerLoginPage
