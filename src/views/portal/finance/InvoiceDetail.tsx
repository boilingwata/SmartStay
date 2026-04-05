import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui';

const InvoiceDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      navigate('/portal/invoices', { replace: true });
      return;
    }

    navigate(`/portal/invoices?invoice=${id}`, { replace: true });
  }, [id, navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
};

export default InvoiceDetail;
