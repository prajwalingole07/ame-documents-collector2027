// StatusBadge component – renders a styled pill for each document/application status.
// Usage: <StatusBadge status="APPROVED" />

const configs = {
  NOT_UPLOADED: {
    label: 'Not Uploaded',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  UPLOADED: {
    label: 'Uploaded',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  UNDER_VERIFICATION: {
    label: 'Under Verification',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  APPROVED: {
    label: '✓ Approved',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  REJECTED: {
    label: '✗ Rejected',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  RE_UPLOAD_REQUIRED: {
    label: '⚠ Re-upload Required',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  NOT_STARTED: {
    label: 'Not Started',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  SUBMITTED: {
    label: 'Submitted',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  CORRECTION_REQUIRED: {
    label: 'Correction Required',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  COMPLETED: {
    label: '✓ Completed',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
};

export default function StatusBadge({ status }) {
  const cfg = configs[status] || configs.NOT_UPLOADED;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
