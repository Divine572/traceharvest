'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { X, Fish, Package, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useCreateBatch, useHasHarvesterRole } from '@/hooks/useTraceability';

interface CreateBatchFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateBatchForm({ onClose, onSuccess }: CreateBatchFormProps) {
  const [formData, setFormData] = useState({
    batchNumber: '',
    species: '',
    quantity: '',
    harvestLocation: '',
    waterTemperature: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const { createBatch, isPending } = useCreateBatch();
  const { hasRole, isPending: roleLoading } = useHasHarvesterRole(address);

  const generateBatchNumber = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-8);
    setFormData(prev => ({ ...prev, batchNumber: `TH${timestamp}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !hasRole) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.batchNumber || !formData.species || !formData.quantity || !formData.harvestLocation) {
        throw new Error('Please fill in all required fields');
      }

      const quantity = parseFloat(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Please enter a valid quantity');
      }

      const details = `Water Temperature: ${formData.waterTemperature}°C. Notes: ${formData.notes}`;

      await createBatch(
        formData.batchNumber,
        formData.species,
        quantity,
        formData.harvestLocation,
        details
      );

      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);

    } catch (err: any) {
      console.error('Batch creation error:', err);
      setError(err.message || 'Failed to create batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Checking Permissions...</h3>
        </div>
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Harvester Role</h3>
          <p className="text-gray-600 mb-4">You need harvester permissions to create batches.</p>
          <button onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Batch Created!</h3>
          <p className="text-gray-600">Batch #{formData.batchNumber} recorded on blockchain.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Fish className="h-6 w-6 text-blue-600" />
            <span>Create New Batch</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Batch Number *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                required
              />
              <button
                type="button"
                onClick={generateBatchNumber}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Species *</label>
            <select
              value={formData.species}
              onChange={(e) => setFormData(prev => ({ ...prev, species: e.target.value }))}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              required
            >
              <option value="">Select species</option>
              <option value="Oysters">Oysters</option>
              <option value="Mussels">Mussels</option>
              <option value="Clams">Clams</option>
              <option value="Shrimp">Shrimp</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Quantity (kg) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Harvest Location *</label>
            <input
              type="text"
              value={formData.harvestLocation}
              onChange={(e) => setFormData(prev => ({ ...prev, harvestLocation: e.target.value }))}
              placeholder="e.g., Lagos Bay, Nigeria"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Water Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              value={formData.waterTemperature}
              onChange={(e) => setFormData(prev => ({ ...prev, waterTemperature: e.target.value }))}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isPending}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSubmitting || isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Package className="h-5 w-5" />
                  <span>Create Batch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}