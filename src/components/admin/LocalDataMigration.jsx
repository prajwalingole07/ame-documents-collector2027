import React, { useEffect, useState } from 'react';
import {
  Database,
  UploadCloud,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  scanLocalData,
  migrateLocalDataToCloud,
} from '../../firebase/migrationService';
import { formatFileSize } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function LocalDataMigration() {
  const [scan, setScan] = useState({ students: [], uploadedDocs: [], marker: null });
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, message: '' });
  const [result, setResult] = useState(null);

  const refreshScan = () => {
    const data = scanLocalData();
    setScan(data);
  };

  useEffect(() => {
    refreshScan();
  }, []);

  const localFileBytes = scan.uploadedDocs.reduce((sum, item) => {
    const url = item.meta?.url || item.meta?.downloadURL || '';
    if (!url.startsWith('data:')) return sum + (item.meta?.fileSize || 0);
    const base64 = url.split(',')[1] || '';
    return sum + Math.round((base64.length * 3) / 4);
  }, 0);

  const handleMigrate = async () => {
    if (scan.uploadedDocs.length === 0 && scan.students.length === 0) {
      toast.error('No old local data was found in this browser.');
      return;
    }

    setMigrating(true);
    setResult(null);
    setProgress({ percent: 0, message: 'Starting migration...' });
    try {
      const res = await migrateLocalDataToCloud({ onProgress: setProgress });
      setResult(res);
      refreshScan();
      if (res.studentsFailed === 0 && res.docsFailed === 0) {
        toast.success('All local data was uploaded to the cloud!');
      } else {
        toast.error('Migration finished with a few skipped items. See the details below.');
      }
    } catch (err) {
      toast.error('Migration failed: ' + err.message);
    } finally {
      setMigrating(false);
    }
  };

  const hasData = scan.students.length > 0 || scan.uploadedDocs.length > 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Move Old Device Data to the Cloud</h3>
            <p className="text-xs text-gray-400">
              One-time import for students &amp; documents saved by the old app on this browser
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refreshScan}
          disabled={migrating}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-scan
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-slate-500">Old students on this device</p>
          <p className="text-lg font-black text-slate-800">{scan.students.length}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-slate-500">Old uploaded files</p>
          <p className="text-lg font-black text-slate-800">{scan.uploadedDocs.length}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 col-span-2 sm:col-span-1">
          <p className="text-slate-500">Approx. file size</p>
          <p className="text-lg font-black text-slate-800">{formatFileSize(localFileBytes)}</p>
        </div>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            No old local-only data found in this browser. If your data is on another phone or PC,
            open this page there and run the migration once on that device.
          </span>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              This uploads the old students and files stored in <strong>this browser only</strong> to
              Cloud Firestore. Files larger than 4.5 MB are skipped because of the free plan limit.
              Already-migrated records are not duplicated.
            </span>
          </div>

          <button
            type="button"
            onClick={handleMigrate}
            disabled={migrating}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {migrating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress.message || 'Uploading to cloud...'}
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Upload This Device's Data to Cloud
              </>
            )}
          </button>

          {migrating && (
            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span className="truncate pr-2">{progress.message}</span>
                <span>{progress.percent}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-200"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {result && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-1.5">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <HardDrive className="w-4 h-4" /> Migration result
          </p>
          <p>
            Students added: <strong>{result.studentsAdded}</strong> • already in cloud:{' '}
            <strong>{result.studentsSkipped}</strong> • failed:{' '}
            <strong>{result.studentsFailed}</strong>
          </p>
          <p>
            Files uploaded: <strong>{result.docsMigrated}</strong> • already migrated:{' '}
            <strong>{result.docsSkipped}</strong> • failed:{' '}
            <strong>{result.docsFailed}</strong>
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
              {result.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {scan.marker && (
        <p className="text-[11px] text-slate-400">
          Last migration on this device: {new Date(scan.marker).toLocaleString('en-IN')}
        </p>
      )}
    </div>
  );
}
