import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, FileBadge2, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatVND } from '@/utils';
import publicListingsService, { RentalApplicationFormData, RentalApplicationSummary } from '@/services/publicListingsService';
import useAuthStore from '@/stores/authStore';

const ListingApplyPage: React.FC = () => {
  const { id } = useParams();
  const { isAuthenticated, user, setUser } = useAuthStore();
  const [submittedApplication, setSubmittedApplication] = useState<RentalApplicationSummary | null>(null);
  const [form, setForm] = useState<RentalApplicationFormData>({
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    preferredMoveIn: '',
    verificationMethod: 'id',
    verificationValue: '',
    notes: '',
  });

  const { data: listing, isLoading: loadingListing } = useQuery({
    queryKey: ['public-room-listing', id],
    queryFn: () => publicListingsService.getListingDetail(id ?? ''),
    enabled: !!id,
  });

  const { data: existingApplication } = useQuery({
    queryKey: ['rental-application', id, user?.id],
    queryFn: () => publicListingsService.getExistingApplication(id ?? ''),
    enabled: !!id && isAuthenticated && user?.role === 'Tenant',
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      fullName: user?.fullName ?? current.fullName,
      phone: user?.phone ?? current.phone,
      email: user?.email ?? current.email,
    }));
  }, [user?.email, user?.fullName, user?.phone]);

  useEffect(() => {
    if (!existingApplication) return;

    setSubmittedApplication(existingApplication);
    setForm((current) => ({
      ...current,
      preferredMoveIn: existingApplication.preferredMoveIn ?? current.preferredMoveIn,
      verificationMethod: (existingApplication.verificationMethod as RentalApplicationFormData['verificationMethod']) ?? current.verificationMethod,
      verificationValue: existingApplication.verificationValue ?? current.verificationValue,
      notes: existingApplication.notes ?? current.notes ?? '',
    }));
  }, [existingApplication]);

  const submitApplication = useMutation({
    mutationFn: (payload: RentalApplicationFormData) => publicListingsService.submitApplication(id ?? '', payload),
    onSuccess: (application) => {
      setSubmittedApplication(application);
      if (user) {
        setUser({
          ...user,
          tenantStage: 'applicant',
        });
      }
      toast.success('Application submitted. Verification now follows the listing flow.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not submit the application');
    },
  });

  if (!id) {
    return <Navigate to="/listings" replace />;
  }

  const residentStage = user?.tenantStage === 'resident_active' || user?.tenantStage === 'resident_pending_onboarding';

  return (
    <div className="min-h-screen bg-[#F5F7FB] pt-28">
      <div className="mx-auto max-w-[1040px] px-6 pb-20">
        <Link
          to={`/listings/${id}`}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm"
        >
          <ArrowLeft size={14} />
          Back to listing
        </Link>

        {loadingListing ? (
          <div className="mt-6 h-[420px] animate-pulse rounded-[40px] border border-slate-200 bg-white" />
        ) : !listing ? (
          <div className="mt-6 rounded-[40px] border border-red-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">Listing unavailable</h1>
            <p className="mt-2 text-sm text-slate-500">This room is no longer accepting new applications.</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <section className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D8A8A]">Apply for {listing.roomCode}</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Sign in only when you are ready to verify and apply.</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Browsing stays public. To continue with this application we need an account so your verification step can be tied to the room you chose.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Link
                  to={`/public/register?redirect=${encodeURIComponent(`/listings/${id}/apply`)}`}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-900 text-[12px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-[#0D8A8A]"
                >
                  Create account
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to={`/portal/login?redirect=${encodeURIComponent(`/listings/${id}/apply`)}`}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-[12px] font-black uppercase tracking-[0.18em] text-slate-700 transition-all hover:border-[#0D8A8A] hover:text-[#0D8A8A]"
                >
                  I already have an account
                </Link>
              </div>
            </section>

            <section className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Selected room</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{listing.roomCode}</h2>
              <p className="mt-2 text-sm text-slate-500">{listing.roomType} at {listing.buildingName}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Rent</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{formatVND(listing.baseRent)}</p>
                </div>
                <div className="rounded-[24px] bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Space</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{listing.areaSqm} m²</p>
                </div>
              </div>
            </section>
          </div>
        ) : user?.role !== 'Tenant' ? (
          <div className="mt-6 rounded-[40px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">This account is not a tenant profile</h1>
            <p className="mt-2 text-sm text-slate-500">Please use a tenant account to submit a rental application.</p>
          </div>
        ) : residentStage ? (
          <div className="mt-6 rounded-[40px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">Resident accounts do not use the prospect application flow</h1>
            <p className="mt-2 text-sm text-slate-500">Your account already belongs to the resident journey. Continue inside the resident portal instead.</p>
            <Link
              to={user.tenantStage === 'resident_pending_onboarding' ? '/portal/onboarding' : '/portal/dashboard'}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-[12px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-[#0D8A8A]"
            >
              Open resident portal
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : submittedApplication ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <section className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">
                <CheckCircle2 size={14} />
                Application submitted
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Verification now belongs to this room application.</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Your browsing account stays lightweight until you decide to apply. From here, staff can review the application and move you into the resident activation flow later.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] bg-slate-50 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Status</p>
                  <p className="mt-2 text-lg font-black capitalize text-slate-900">{submittedApplication.status.replaceAll('_', ' ')}</p>
                </div>
                <div className="rounded-[24px] bg-slate-50 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Verification method</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{submittedApplication.verificationMethod ?? 'Pending'}</p>
                </div>
              </div>

              {submittedApplication.submittedAt && (
                <p className="mt-6 text-sm text-slate-500">
                  Submitted on {formatDate(submittedApplication.submittedAt)}
                </p>
              )}
            </section>

            <section className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Selected room</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{listing.roomCode}</h2>
              <p className="mt-2 text-sm text-slate-500">{listing.roomType} at {listing.buildingName}</p>
              <div className="mt-6 rounded-[28px] bg-slate-50 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Monthly rent</p>
                <p className="mt-2 text-xl font-black text-slate-900">{formatVND(listing.baseRent)}</p>
              </div>
            </section>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <section className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D8A8A]">Application + verification</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Apply for {listing.roomCode} without going through resident onboarding first.</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                This step captures only the details needed to review the room application. If your application is approved and a resident record is created, the resident portal onboarding will happen later.
              </p>

              <div className="mt-8 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    value={form.fullName}
                    onChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
                    placeholder="Nguyen Van A"
                  />
                  <Field
                    label="Preferred move-in"
                    type="date"
                    value={form.preferredMoveIn}
                    onChange={(value) => setForm((current) => ({ ...current, preferredMoveIn: value }))}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Phone"
                    value={form.phone}
                    onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                    placeholder="09xxxxxxxx"
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[0.48fr_1fr]">
                  <label className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Verification method</span>
                    <select
                      value={form.verificationMethod}
                      onChange={(event) => setForm((current) => ({ ...current, verificationMethod: event.target.value as RentalApplicationFormData['verificationMethod'], verificationValue: '' }))}
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-[#0D8A8A] focus:bg-white"
                    >
                      <option value="id">Government ID</option>
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                    </select>
                  </label>

                  <Field
                    label={form.verificationMethod === 'id' ? 'ID number' : form.verificationMethod === 'phone' ? 'Confirm phone number' : 'Confirm email'}
                    value={form.verificationValue}
                    onChange={(value) => setForm((current) => ({ ...current, verificationValue: value }))}
                    placeholder={form.verificationMethod === 'id' ? 'Citizen ID / passport number' : form.verificationMethod === 'phone' ? '09xxxxxxxx' : 'you@example.com'}
                  />
                </div>

                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Notes for the leasing team</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Share move-in timing, household size, or questions about the room"
                    className="min-h-[140px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none transition-all focus:border-[#0D8A8A] focus:bg-white"
                  />
                </label>
              </div>

              <button
                onClick={() => submitApplication.mutate(form)}
                disabled={
                  submitApplication.isPending ||
                  !form.fullName ||
                  !form.phone ||
                  !form.email ||
                  !form.preferredMoveIn ||
                  !form.verificationValue
                }
                className="mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-[12px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-[#0D8A8A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitApplication.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                Submit application
              </button>
            </section>

            <section className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Selected room</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{listing.roomCode}</h2>
              <p className="mt-2 text-sm text-slate-500">{listing.roomType} at {listing.buildingName}</p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-[24px] bg-slate-50 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Rent</p>
                  <p className="mt-2 text-xl font-black text-slate-900">{formatVND(listing.baseRent)}</p>
                </div>
                <div className="rounded-[24px] bg-slate-50 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Verification happens here</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    This application holds the chosen verification method so discovery stays open while identity checks still happen before move-in.
                  </p>
                </div>
                <div className="rounded-[24px] border border-dashed border-slate-200 p-5">
                  <div className="flex items-start gap-3">
                    <FileBadge2 size={18} className="mt-0.5 text-[#0D8A8A]" />
                    <p className="text-sm leading-relaxed text-slate-600">
                      Once approved and linked to a resident record, this account can move into resident activation inside the portal.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
}) => (
  <label className="space-y-2">
    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-[#0D8A8A] focus:bg-white"
    />
  </label>
);

export default ListingApplyPage;
