import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  ExternalLink,
  Mail,
  MapPin,
  Trash2,
  Edit2,
  Search,
  Filter,
  Briefcase,
  Archive,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Globe,
  UserCheck,
  X,
} from 'lucide-react';
import { companyService } from '../../services/companyService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/Skeleton';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';

const INDUSTRIES = [
  'Information Technology',
  'Software & Cloud Services',
  'Financial Services & Fintech',
  'Consulting & Analytics',
  'E-Commerce & Retail',
  'Electronics & Semiconductors',
  'Automotive & Engineering',
  'Telecommunications',
  'Healthcare & Biotech',
  'Other',
];

const ManageCompanies = () => {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionAlert, setActionAlert] = useState(null);

  const [searchParams] = useSearchParams();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [statusFilter, setStatusFilter] = useState('active'); // active, archived, all
  const [viewMode, setViewMode] = useState('table'); // table, grid

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterOptions, setFilterOptions] = useState({ industries: [], locations: [] });

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const initialForm = {
    name: '',
    website: '',
    industry: 'Information Technology',
    description: '',
    location: '',
    contactPerson: '',
    contactEmail: '',
    logoUrl: '',
  };

  const [form, setForm] = useState(initialForm);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const logoInputRef = useRef(null);

  // Safe Deletion & Archival Modal State
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    company: null,
    hasRecords: false,
    drivesCount: 0,
    placedCount: 0,
    loading: false,
  });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        status: statusFilter,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedIndustry !== 'All') params.industry = selectedIndustry;
      if (selectedLocation !== 'All') params.location = selectedLocation;

      const res = await companyService.getCompanies(params);
      setCompanies(res.companies || []);
      setTotalPages(res.pages || 1);
      setTotalCount(res.total || 0);

      if (res.filterOptions) {
        setFilterOptions(res.filterOptions);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
      setActionAlert({
        type: 'error',
        text: err.message || 'Failed to retrieve companies.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, statusFilter, selectedIndustry, selectedLocation]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateModal();
    }
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingCompany(null);
    setForm(initialForm);
    setSelectedLogoFile(null);
    setLogoPreview('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (comp) => {
    setEditingCompany(comp);
    setForm({
      name: comp.name || '',
      website: comp.website || '',
      industry: comp.industry || 'Information Technology',
      description: comp.description || '',
      location: comp.location || '',
      contactPerson: comp.contactPerson || '',
      contactEmail: comp.contactEmail || '',
      logoUrl: comp.logoUrl || '',
    });
    setSelectedLogoFile(null);
    setLogoPreview(comp.logoUrl || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
        setActionAlert({
          type: 'error',
          text: 'Only JPG, PNG, WebP or SVG logo files are permitted.',
        });
        return;
      }
      setSelectedLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const validateCompanyForm = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = 'Company name is required';
    }

    const urlPattern = /^https?:\/\/.+/i;
    if (form.website && !urlPattern.test(form.website.trim())) {
      errs.website = 'Website must start with http:// or https://';
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (form.contactEmail && !emailRegex.test(form.contactEmail.trim())) {
      errs.contactEmail = 'Please provide a valid email format';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setActionAlert(null);

    if (!validateCompanyForm()) {
      return;
    }

    try {
      setSaving(true);
      let companyId;

      if (editingCompany) {
        const res = await companyService.updateCompany(editingCompany._id, form);
        companyId = editingCompany._id;
        toast.success(`"${form.name}" updated successfully!`);
        setActionAlert({ type: 'success', text: `"${form.name}" updated successfully!` });
      } else {
        const res = await companyService.createCompany(form);
        companyId = res.company?._id;
        toast.success(`"${form.name}" added to partner directory!`);
        setActionAlert({ type: 'success', text: `"${form.name}" added to partner directory!` });
      }

      // If a logo file was selected, upload it
      if (selectedLogoFile && companyId) {
        const logoData = new FormData();
        logoData.append('logo', selectedLogoFile);
        await companyService.uploadLogo(companyId, logoData);
      }

      setIsModalOpen(false);
      await fetchCompanies();
    } catch (err) {
      toast.error(err.message || 'Failed to save company information.');
      setActionAlert({
        type: 'error',
        text: err.message || 'Failed to save company information.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Safe Deletion & Archival Handling
  const initiateDelete = (company) => {
    setDeleteModalState({
      isOpen: true,
      company,
      hasRecords: (company.drivesCount || 0) > 0 || (company.placedCount || 0) > 0,
      drivesCount: company.drivesCount || 0,
      placedCount: company.placedCount || 0,
      loading: false,
    });
  };

  const executeDeleteOrArchive = async (archiveOnly = false) => {
    const comp = deleteModalState.company;
    if (!comp) return;

    try {
      setDeleteModalState((prev) => ({ ...prev, loading: true }));
      setActionAlert(null);

      const res = await companyService.deleteCompany(comp._id, archiveOnly);
      const msg = res.message || (archiveOnly ? 'Company safely archived.' : 'Company deleted.');
      toast.success(msg);
      setActionAlert({
        type: 'success',
        text: msg,
      });

      setDeleteModalState({
        isOpen: false,
        company: null,
        hasRecords: false,
        drivesCount: 0,
        placedCount: 0,
        loading: false,
      });

      await fetchCompanies();
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
      setActionAlert({
        type: 'error',
        text: err.message || 'Operation failed.',
      });
      setDeleteModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleToggleArchive = async (company) => {
    try {
      setActionAlert(null);
      const res = await companyService.toggleArchive(company._id);
      toast.success(res.message);
      setActionAlert({ type: 'success', text: res.message });
      await fetchCompanies();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle archive status.');
      setActionAlert({
        type: 'error',
        text: err.message || 'Failed to toggle archive status.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <PageHeader
        category="Corporate Partners"
        title="Corporate Partner Directory"
        subtitle="Maintain authorized corporate recruiters, primary POC contacts, and company hiring profiles"
        badge={`${totalCount} Companies`}
        actions={
          <Button size="sm" icon={Plus} onClick={openCreateModal}>
            Add Company
          </Button>
        }
      />

      {actionAlert && (
        <Alert
          type={actionAlert.type}
          message={actionAlert.text}
          onClose={() => setActionAlert(null)}
        />
      )}

      {/* 2. Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#DBEAFE] shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5">
            <Input
              placeholder="Search by company name, location, POC..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Industry Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedIndustry}
              onChange={(e) => {
                setSelectedIndustry(e.target.value);
                setPage(1);
              }}
              className="w-full h-[38px] rounded-lg border border-[#DBEAFE] text-xs px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white text-[#172554]"
            >
              <option value="All">All Industries</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-[38px] rounded-lg border border-[#DBEAFE] text-xs px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white text-[#172554]"
            >
              <option value="active">Active Only</option>
              <option value="archived">Archived</option>
              <option value="all">All Statuses</option>
            </select>
          </div>

          {/* Action & View Toggles */}
          <div className="sm:col-span-2 flex items-center justify-end gap-2">
            <Button type="submit" size="sm" variant="secondary" className="w-full sm:w-auto">
              Search
            </Button>

            <div className="hidden sm:flex border border-[#DBEAFE] rounded-lg p-0.5 bg-[#F0F7FF]">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-[#EFF6FF] shadow-sm text-[#163A5F]' : 'text-[#64748B]'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#EFF6FF] shadow-sm text-[#163A5F]' : 'text-[#64748B]'}`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. Companies Listing (Table View or Grid View) */}
      {loading ? (
        <Card noPadding>
          <div className="p-5">
            <TableSkeleton />
          </div>
        </Card>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search || selectedIndustry !== 'All' ? 'No matching companies found' : 'No partner companies registered'}
          description={
            search || selectedIndustry !== 'All'
              ? 'Try adjusting your search criteria or resetting filters.'
              : 'Add recruiting organizations to begin associating on-campus placement drives.'
          }
          actionLabel="Add Partner Company"
          onAction={openCreateModal}
        />
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0F7FF] border-b border-[#DBEAFE] text-[#172554] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Company Details</th>
                  <th className="py-3 px-4">Industry & Domain</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Website</th>
                  <th className="py-3 px-4">Contact POC</th>
                  <th className="py-3 px-4 text-center">Placement Drives</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBEAFE]/60">
                {companies.map((comp) => (
                  <tr key={comp._id} className="hover:bg-[#F0F7FF] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {comp.logoUrl ? (
                          <img
                            src={comp.logoUrl}
                            alt={comp.name}
                            className="w-10 h-10 rounded-xl object-contain p-1 border border-[#DBEAFE] bg-white flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                        {(!comp.logoUrl || undefined) && (
                          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F] font-bold text-sm flex-shrink-0">
                            {comp.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-[#172554] block leading-tight text-sm">
                            {comp.name}
                          </span>
                          <span className="text-[11px] text-[#64748B] line-clamp-1 max-w-xs mt-0.5">
                            {comp.description || 'Corporate recruiter'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-[#172554]">
                      <span className="px-2 py-0.5 rounded-full bg-[#F0F7FF] border border-[#DBEAFE] text-[#172554] text-[11px]">
                        {comp.industry}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#64748B]">
                      <div className="flex items-center gap-1 truncate max-w-xs">
                        <MapPin className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
                        <span>{comp.location || 'Multiple'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#64748B]">
                      {comp.website ? (
                        <a
                          href={comp.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-semibold"
                        >
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[#64748B]/60">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#172554]">
                        {comp.contactPerson || 'HR Team'}
                      </div>
                      {comp.contactEmail && (
                        <div className="text-[11px] text-[#64748B] truncate max-w-xs">
                          {comp.contactEmail}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        to={`/officer/drives`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#163A5F] font-semibold hover:bg-[#DBEAFE] transition-colors border border-[#DBEAFE]"
                        title="View Associated Drives"
                      >
                        <Briefcase className="w-3 h-3 text-[#2563EB]" />
                        {comp.drivesCount || 0}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={comp.isArchived ? 'secondary' : 'success'}
                        size="sm"
                      >
                        {comp.isArchived ? 'Archived' : 'Active'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(comp)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172554] hover:bg-[#F0F7FF] transition-colors"
                          title="Edit Company"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleArchive(comp)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#D97706] hover:bg-[#F0F7FF] transition-colors"
                          title={comp.isArchived ? 'Restore to Active' : 'Archive Company'}
                        >
                          {comp.isArchived ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : (
                            <Archive className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => initiateDelete(comp)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#F0F7FF] transition-colors"
                          title="Delete Company"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((comp) => (
            <div
              key={comp._id}
              className="bg-white rounded-xl border border-[#DBEAFE] p-5 shadow-sm hover:border-[#2563EB]/60 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {comp.logoUrl ? (
                      <img
                        src={comp.logoUrl}
                        alt={comp.name}
                        className="w-12 h-12 rounded-xl object-contain p-1 border border-[#DBEAFE] bg-white"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : null}
                    {(!comp.logoUrl || undefined) && (
                      <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F] font-bold text-lg flex-shrink-0">
                        {comp.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-[#172554] text-sm leading-tight">
                        {comp.name}
                      </h3>
                      <span className="text-[11px] text-[#64748B]">{comp.industry}</span>
                    </div>
                  </div>

                  <Badge
                    variant={comp.isArchived ? 'secondary' : 'success'}
                    size="sm"
                  >
                    {comp.isArchived ? 'Archived' : 'Active'}
                  </Badge>
                </div>

                <p className="text-xs text-[#64748B] line-clamp-2 mb-4 leading-relaxed">
                  {comp.description || 'Corporate recruitment partner.'}
                </p>

                <div className="space-y-1.5 text-xs text-[#64748B] pt-3 border-t border-[#DBEAFE]">
                  {comp.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span className="truncate">{comp.location}</span>
                    </div>
                  )}

                  {comp.contactPerson && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#64748B] font-medium">POC:</span>
                      <span className="text-[#172554] font-medium">{comp.contactPerson}</span>
                      {comp.contactEmail && (
                        <span className="text-[#64748B] text-[11px]">({comp.contactEmail})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DBEAFE] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#163A5F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                  {comp.drivesCount || 0} Drives
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(comp)}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172554] hover:bg-[#F0F7FF] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleArchive(comp)}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#D97706] hover:bg-[#F0F7FF] transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => initiateDelete(comp)}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Pagination Controls */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={10}
        onPageChange={setPage}
      />

      {/* 5. ADD / EDIT COMPANY MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCompany ? `Edit Company: ${editingCompany.name}` : 'Register New Partner Company'}
        subtitle="Manage corporate hiring credentials, contacts, and recruiter profile"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
          {/* Logo Picker & Preview */}
          <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white border border-[#DBEAFE] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-1" />
              ) : (
                <Building2 className="w-7 h-7 text-[#2563EB]/40" />
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <span className="font-semibold text-[#172554] block text-xs">Company Logo</span>
              <p className="text-[11px] text-[#64748B]">
                Upload image (JPG, PNG, SVG, WebP max 2MB)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Upload}
                  onClick={() => logoInputRef.current?.click()}
                >
                  Choose File
                </Button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLogoFile(null);
                      setLogoPreview('');
                      setForm((prev) => ({ ...prev, logoUrl: '' }));
                    }}
                    className="text-[11px] text-[#DC2626] hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoFileChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Company Name *"
              placeholder="e.g. Google India"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={formErrors.name}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-[#172554] mb-1.5">
                Industry / Business Vertical *
              </label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full h-[38px] rounded-lg border border-[#DBEAFE] px-3 bg-white text-[#172554] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Official Careers Website URL"
              type="url"
              placeholder="https://careers.company.com"
              icon={Globe}
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              error={formErrors.website}
            />

            <Input
              label="Headquarters / Office Location"
              placeholder="e.g. Bengaluru / Hyderabad / Remote"
              icon={MapPin}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Primary HR Contact Person"
              placeholder="e.g. Vikram Sharma"
              icon={UserCheck}
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            />

            <Input
              label="Recruiter Email Address"
              type="email"
              placeholder="campus-hiring@company.com"
              icon={Mail}
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              error={formErrors.contactEmail}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172554] mb-1.5">
              Company Overview & Hiring Profile
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-[#DBEAFE] p-2.5 text-xs text-[#172554] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white placeholder-[#64748B]/60"
              placeholder="Provide a brief background on product verticals, technology stack, and hiring tiers..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#DBEAFE]">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={saving}>
              {editingCompany ? 'Save Changes' : 'Register Partner'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. SAFE DELETION / ARCHIVAL CONFIRMATION DIALOG */}
      <Modal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
        title={deleteModalState.hasRecords ? 'Safe Company Archival Required' : 'Confirm Permanent Deletion'}
        subtitle={`Target: ${deleteModalState.company?.name}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          {deleteModalState.hasRecords ? (
            <div className="p-3.5 bg-[#F0F7FF] border border-[#DBEAFE] rounded-xl space-y-2 text-[#172554]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#D97706]">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                Active Placement Records Detected
              </div>
              <p className="leading-relaxed text-xs">
                <strong>"{deleteModalState.company?.name}"</strong> is linked to{' '}
                <strong>{deleteModalState.drivesCount} placement drive(s)</strong>
                {deleteModalState.placedCount > 0 && (
                  <span> and <strong>{deleteModalState.placedCount} placed student record(s)</strong></span>
                )}.
              </p>
              <p className="text-[11px] text-[#64748B]">
                To preserve academic accreditation and student placement history, permanent deletion is prevented. You can safely archive this company instead, which hides it from active recruitment while keeping student history intact.
              </p>
            </div>
          ) : (
            <p className="text-[#64748B] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#172554]">"{deleteModalState.company?.name}"</strong>? This company has no associated drives and will be completely removed from the database.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#DBEAFE]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>

            {deleteModalState.hasRecords ? (
              <Button
                variant="primary"
                size="sm"
                icon={Archive}
                isLoading={deleteModalState.loading}
                onClick={() => executeDeleteOrArchive(true)}
              >
                Safely Archive Company
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                isLoading={deleteModalState.loading}
                onClick={() => executeDeleteOrArchive(false)}
              >
                Permanently Delete
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageCompanies;
