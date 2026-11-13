import React, { useState, useEffect } from 'react';
import { Search, Filter, Briefcase, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { driveService } from '../../services/driveService';
import { applicationService } from '../../services/applicationService';
import DriveCard from '../../components/drives/DriveCard';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';

const DrivesList = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [minPackage, setMinPackage] = useState('');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);
  const [applyingDriveId, setApplyingDriveId] = useState(null);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedStatus) params.status = selectedStatus;
      if (minPackage) params.minPackage = minPackage;

      const res = await driveService.getAllDrives(params);
      setDrives(res.drives || []);
    } catch (err) {
      console.error('Failed to load drives', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, [selectedStatus, minPackage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDrives();
  };

  const handleApply = async (driveId) => {
    try {
      setApplyingDriveId(driveId);
      setActionAlert(null);
      const res = await applicationService.applyForDrive(driveId);
      setActionAlert({ type: 'success', text: res.message });
      await fetchDrives();
    } catch (err) {
      setActionAlert({
        type: 'error',
        text: err.message || 'Failed to submit application.',
      });
    } finally {
      setApplyingDriveId(null);
    }
  };

  const filteredDrives = onlyEligible
    ? drives.filter((d) => d.isEligible)
    : drives;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Campus Placement Drives</h1>
          <p className="text-xs text-slate-500 mt-1">
            Explore ongoing corporate recruitment opportunities and submit your applications
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyEligible(!onlyEligible)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              onlyEligible
                ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Eligible Only ({drives.filter((d) => d.isEligible).length})
          </button>
        </div>
      </div>

      {actionAlert && (
        <Alert
          type={actionAlert.type}
          message={actionAlert.text}
          onClose={() => setActionAlert(null)}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search by company, title, or job role..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-[38px] rounded-lg border border-slate-200 text-xs px-3 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Published">Published (Active)</option>
              <option value="Closed">Closed</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={minPackage}
              onChange={(e) => setMinPackage(e.target.value)}
              className="flex-1 h-[38px] rounded-lg border border-slate-200 text-xs px-3 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">Any Package</option>
              <option value="6">Min 6 LPA</option>
              <option value="10">Min 10 LPA</option>
              <option value="15">Min 15 LPA</option>
              <option value="20">Min 20+ LPA</option>
            </select>
            <Button type="submit" size="sm">
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Drives Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching campus placement drives..." />
      ) : filteredDrives.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No matching drives found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or clear filters to view all available drives.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDrives.map((drive) => (
            <DriveCard
              key={drive._id}
              drive={drive}
              onApply={handleApply}
              applying={applyingDriveId === drive._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DrivesList;

