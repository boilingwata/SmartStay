import React from 'react'
import WorkspaceLogin from '@/components/auth/WorkspaceLogin'

const SuperAdminLoginPage: React.FC = () => {
  return (
    <WorkspaceLogin
      title="Super Admin"
      subtitle="Không gian hạ tầng và giám sát nền tảng SaaS. Tài khoản này đăng nhập bằng Supabase thật nhưng tách khỏi workspace Owner và Staff."
      accentClass="text-accent"
      panelClass="bg-gradient-to-br from-[#4338CA] to-[#0F172A]"
      allowedRoles={['SuperAdmin']}
      redirectWhenAuthenticated={['SuperAdmin']}
      invalidRoleMessage="Tài khoản này không thuộc cổng Super Admin."
      isSuperAdmin
      quickLogin={{
        email: 'superadmin@smartstay.vn',
        password: 'SuperAdmin@123456',
        label: 'Super Admin preview',
        helper: 'Supabase auth + platform layout',
      }}
    />
  )
}

export default SuperAdminLoginPage
