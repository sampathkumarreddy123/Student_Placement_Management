import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  ExternalLink,
  Mail,
  MapPin,
  Trash2,
  Edit2,
  Search,
} from 'lucide-react';
import { companyService } from '../../services/companyService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionAlert, setActionAlert] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    name: '',
    website: '',
    industry: 'Information Technology',
    description: '',
    location: '',
    contactPerson: '',
    contactEmail: '',
  };

  const [form, setForm] = useState(initialForm);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await companyService.getCompanies();
      setCompanies(res.companies || []);
    } catch (err) {
      console.error('Failed to load companies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (comp) => {
    setEditingId(comp._id);
    setForm({
      name: comp.name,
      website: comp.website || '',
      industry: comp.industry || 'Information Technology',
      description: comp.description || '',
      location: comp.location || '',
      contactPerson: comp.contactPerson || '',
      contactEmail: comp.contactEmail || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setActionAlert(null);

      if (editingId) {
        await companyService.updateCompany(editingId, form);
        setActionAlert({ type: 'success', text: 'Company updated successfully!' });
      } else {
        await companyService.createCompany(form);
        setActionAlert({ type: 'success', text: 'New partner company added!' });
      }

      setIsModalOpen(false);
      await fetchCompanies();
    } catch (err) {
      setActionAlert({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    try {
      setActionAlert(null);
      await companyService.deleteCompany(id);
      setActionAlert({ type: 'success', text: 'Company deleted.' });
      await fetchCompanies();
    } catch (err) {
      setActionAlert({ type: 'error', text: err.message || 'Failed to delete company.' });
    }
  };

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Corporate Partners & Recruiters</h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain relationship records, primary POCs, and company hiring profiles
          </p>
        </div>

        <Button size="sm" icon={Plus} onClick={openCreateModal}>
          Add Partner Company
        </Button>
      </div>

      {actionAlert && (
        <Alert
          type={actionAlert.type}
          message={actionAlert.text}
          onClose={() => setActionAlert(null)}
        />
      )}

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search by company name or domain..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching partner directory..." />
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No partner companies recorded</h3>
          <p className="text-xs text-slate-500 mt-1">
            Add recruiting organizations to begin associating placement drives.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((company) => (
            <div
              key={company._id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-base flex-shrink-0">
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{company.name}</h3>
                      <span className="text-[11px] text-slate-500">{company.industry}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(company)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(company._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {company.description || 'No description available for this corporate partner.'}
                </p>

                <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
                  {company.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{company.location}</span>
                    </div>
                  )}

                  {company.contactPerson && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">POC:</span>
                      <span className="text-slate-700 font-medium">{company.contactPerson}</span>
                      {company.contactEmail && (
                        <span className="text-slate-400 text-[11px]">({company.contactEmail})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {company.website && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                  >
                    Visit Website <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Partner Company' : 'Add Corporate Partner'}
        subtitle="Recruiter contact details and industry categorization"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <Input
            label="Company Name *"
            placeholder="e.g. Amazon Web Services"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Industry / Domain"
              placeholder="e.g. Cloud Computing / AI"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />

            <Input
              label="Official Website URL"
              type="url"
              placeholder="https://company.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          <Input
            label="Corporate Office Location"
            placeholder="e.g. Bengaluru / Hyderabad"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="HR / Recruiter Contact Name"
              placeholder="e.g. Vikram Sharma"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            />

            <Input
              label="Recruiter Email"
              type="email"
              placeholder="hr@company.com"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Brief Overview / Company Profile
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-500 bg-white"
              placeholder="Summary of product verticals, hiring tiers, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={saving}>
              {editingId ? 'Save Changes' : 'Add Recruiter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageCompanies;

