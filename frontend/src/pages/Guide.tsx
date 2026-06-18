import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '../components';
import { PlatformGuide } from '../components/PlatformGuide';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';

export function GuidePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Platform Guide"
        description={PAGE_DESCRIPTIONS.guide}
        action={
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/25"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        }
      />
      <PlatformGuide />
    </div>
  );
}
