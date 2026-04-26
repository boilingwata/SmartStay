import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmergencyContact, TenantProfile } from '@/models/Tenant';

interface ContactTabProps {
  profile: TenantProfile;
  contacts: EmergencyContact[] | undefined;
}

export const ContactTab: React.FC<ContactTabProps> = ({ profile, contacts }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="card-container border-primary/10 bg-primary/5 p-8">
          <h3 className="mb-6 text-label font-black text-primary">Lien he chinh</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-md">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted">Dien thoai</p>
                <a href={`tel:${profile.phone}`} className="text-h3 font-black text-primary hover:underline">
                  {profile.phone}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-md">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted">Email</p>
                <a href={`mailto:${profile.email ?? ''}`} className="text-h3 font-black text-primary hover:underline">
                  {profile.email || 'Chua cap nhat'}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="card-container border-secondary/10 bg-secondary/5 p-8">
          <h3 className="mb-6 text-label font-black text-secondary">Dia chi thuong tru</h3>
          <div className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-secondary shadow-md">
              <MapPin size={24} />
            </div>
            <p className="text-body font-bold leading-relaxed text-primary">
              {profile.permanentAddress || 'Chua cap nhat'}
            </p>
          </div>
        </div>
      </div>

      <div className="card-container overflow-hidden p-0">
        <div className="border-b bg-bg/30 p-6">
          <h3 className="text-label font-black text-muted">Lien he khan cap</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b bg-bg/50 text-[10px] font-black uppercase tracking-widest text-muted">
              <tr>
                <th className="px-8 py-4">Nguoi lien he</th>
                <th className="px-8 py-4">Moi quan he</th>
                <th className="px-8 py-4">So dien thoai</th>
                <th className="px-8 py-4">Loai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {contacts && contacts.length > 0 ? contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-bg/20">
                  <td className="px-8 py-5 font-bold text-primary">{contact.contactName}</td>
                  <td className="px-8 py-5">
                    <StatusBadge status="Inactive" label={contact.relationship} className="!bg-bg !text-muted !capitalize" />
                  </td>
                  <td className="px-8 py-5 font-mono font-bold text-muted">{contact.phone || 'Chua cap nhat'}</td>
                  <td className="px-8 py-5">
                    {contact.isPrimary ? (
                      <span className="rounded bg-success/10 px-2 py-1 text-[10px] font-black uppercase text-success">Chinh</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase text-muted">Phu</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-sm font-medium italic text-muted">
                    Chua co lien he khan cap. Cap nhat trong form chinh sua tenant de hoan tat onboarding.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
