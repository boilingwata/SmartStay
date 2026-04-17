import React from 'react'
import WorkspaceLogin from '@/components/auth/WorkspaceLogin'

const OwnerLoginPage: React.FC = () => {
  return (
    <WorkspaceLogin
      title="Không gian chủ sở hữu"
      subtitle="Dành cho chủ vận hành tổ chức và danh mục tòa nhà. Đây là phần thay thế cho khu vực Admin trước đây."
      accentClass="text-primary"
      panelClass="bg-gradient-to-br from-primary to-[#2E5D9F]"
      allowedRoles={['Owner']}
      redirectWhenAuthenticated={['Owner']}
      invalidRoleMessage="Tài khoản này không thuộc cổng chủ sở hữu."
      quickLogin={{
        email: 'admin@smartstay.vn',
        password: 'Admin@123456',
        label: 'Chủ sở hữu hiện tại',
        helper: 'Tài khoản Admin cũ được hiểu là Chủ sở hữu',
      }}
    />
  )
}

export default OwnerLoginPage
