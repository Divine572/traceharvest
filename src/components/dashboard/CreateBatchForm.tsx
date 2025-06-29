'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { X, Fish, Package, Loader2, CheckCircle, AlertCircle, User, Shuffle } from 'lucide-react';
import { useCreateBatch, useHarvesterRole, useUserRole } from '@/hooks/useTraceability';

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
  const { createBatch, isCreating } = useCreateBatch();
  const { hasHarvesterRole, isLoading: roleLoading } = useHarvesterRole(address);
  const { role } = useUserRole(address);

  const generateBatchNumber = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-8);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    setFormData(prev => ({ ...prev, batchNumber: `TH${timestamp}${random}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !hasHarvesterRole) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.batchNumber || !formData.species || !formData.quantity || !formData.harvestLocation) {
        throw new Error('Please fill in all required fields');
      }

      const quantity = parseFloat(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Please enter a valid quantity');
      }

      // Create details string
      const details = `Water Temperature: ${formData.waterTemperature || 'Not recorded'}°C. Notes: ${formData.notes || 'None'}`;

      // Create the batch
      await createBatch(
        formData.batchNumber,
        formData.species,
        quantity,
        formData.harvestLocation,
        details
      );

      console.log('✅ Batch created successfully!');
      setSuccess(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      console.error('❌ Batch creation error:', err);
      setError(err.message || 'Failed to create batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state - checking permissions
  if (roleLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-sky-100/80 to-blue-100/80 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl border border-gray-200">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Checking Permissions...</h3>
          <p className="text-gray-600">Verifying your harvester role</p>
        </div>
      </div>
    );
  }

  // No harvester role
  if (!hasHarvesterRole) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-sky-100/80 to-blue-100/80 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl border border-gray-200">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Harvester Role</h3>
          <p className="text-gray-600 mb-4">You need harvester permissions to create batches.</p>
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Current Role: <strong>{role || 'none'}</strong></span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-sky-100/80 to-blue-100/80 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl border border-gray-200">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Batch Created Successfully!</h3>
          <p className="text-gray-600 mb-4">Your shellfish batch has been recorded on the blockchain</p>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Batch #{formData.batchNumber}</strong> is now traceable!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sky-100/80 to-blue-100/80 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Fish className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Batch</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <User className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">
                    Role: {role?.toUpperCase() || 'HARVESTER'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Batch Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Batch Number <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={formData.batchNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                placeholder="e.g., TH2025010123"
                className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={generateBatchNumber}
                className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                title="Generate batch number"
              >
                <Shuffle className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">TraceHarvest format: TH + timestamp + random</p>
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Species <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.species}
              onChange={(e) => setFormData(prev => ({ ...prev, species: e.target.value }))}
              placeholder="e.g., Oysters, Crab, Shrimp, Periwinkle"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Quantity (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="e.g., 25.5"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-500 mt-1">Weight in kilograms (kg)</p>
          </div>

          {/* Harvest Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Harvest Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.harvestLocation}
              onChange={(e) => setFormData(prev => ({ ...prev, harvestLocation: e.target.value }))}
              placeholder="e.g., Lagos Lagoon, 6.4474°N 3.3903°E, Epe Fish Farm"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-500 mt-1">Location name or GPS coordinates (latitude, longitude)</p>
          </div>

          {/* Water Temperature (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Water Temperature (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.waterTemperature}
              onChange={(e) => setFormData(prev => ({ ...prev, waterTemperature: e.target.value }))}
              placeholder="e.g., 28.5"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-500 mt-1">Optional: Water temperature at harvest</p>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Additional Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g., Weather conditions, harvest method, quality observations..."
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-500 mt-1">Optional: Any additional harvest details</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCreating}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
            >
              {isSubmitting || isCreating ? (
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