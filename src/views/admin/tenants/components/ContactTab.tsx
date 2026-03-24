import React from 'react';
import { Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import { TenantProfile, EmergencyContact } from '@/models/Tenant';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ContactTabProps {
  profile: TenantProfile;
  contacts: EmergencyContact[] | undefined;
}

export const ContactTab: React.FC<ContactTabProps> = ({ profile, contacts }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-container p-8 bg-primary/5 border-primary/10">
          <h3 className="text-label text-primary font-black mb-6">Liên hệ chính</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md text-primary">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-[10px] text-muted font-black uppercase">Điện thoại</p>
                <a href={`tel:${profile.phone}`} className="text-h3 font-black text-primary hover:underline">{profile.phone}</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md text-primary">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-[10px] text-muted font-black uppercase">Email</p>
                <a href={`mailto:${profile.email}`} className="text-h3 font-black text-primary hover:underline">{profile.email || 'N/A'}</a>
              </div>
            </div>
          </div>
        </div>

        <div className="card-container p-8 bg-secondary/5 border-secondary/10">
          <h3 className="text-label text-secondary font-black mb-6">Địa chỉ thường trú</h3>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md text-secondary">
              <MapPin size={24} />
            </div>
            <p className="text-body font-bold text-primary leading-relaxed">
              {profile.permanentAddress}
            </p>
          </div>
        </div>
      </div>

      <div className="card-container overflow-hidden p-0">
        <div className="p-6 border-b flex justify-between items-center bg-bg/30">
          <h3 className="text-label text-muted font-black">Danh bạ khẩn cấp (Emergency)</h3>
          <button className="text-primary text-[11px] font-black uppercase hover:underline">+ Thêm liên hệ</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg/50 text-[10px] font-black uppercase text-muted tracking-widest border-b">
              <tr>
                <th className="px-8 py-4">Người liên hệ</th>
                <th className="px-8 py-4">Mối quan hệ</th>
                <th className="px-8 py-4">Số điện thoại</th>
                <th className="px-8 py-4">Loại</th>
                <th className="px-8 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {contacts?.map(contact => (
                <tr key={contact.id} className="hover:bg-bg/20">
                  <td className="px-8 py-5 font-bold text-primary">{contact.contactName}</td>
                  <td className="px-8 py-5">
                    <StatusBadge status="Inactive" label={contact.relationship} className="!bg-bg !text-muted !capitalize" />
                  </td>
                  <td className="px-8 py-5 font-mono font-bold text-muted">{contact.phone}</td>
                  <td className="px-8 py-5">
                    {contact.isPrimary && <span className="px-2 py-1 bg-success/10 text-success text-[10px] font-black rounded uppercase">Chính</span>}
                  </td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button className="p-2 hover:bg-bg rounded-lg text-muted transition-all"><Edit size={14} /></button>
                    <button className="p-2 hover:bg-bg rounded-lg text-danger transition-all"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
