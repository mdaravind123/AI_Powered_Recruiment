import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ScheduleInterview = ({ onClose, onSchedule, jobTitle }) => {
  const [formData, setFormData] = useState({
    interviewDate: '',
    interviewTime: '',
    interviewType: 'online',
    meetingLink: '',
    location: '',
    additionalNotes: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.interviewDate || !formData.interviewTime) {
      toast.error('Please select date and time');
      return;
    }

    if (formData.interviewType === 'online' && !formData.meetingLink.trim()) {
      toast.error('Please enter meeting link for online interview');
      return;
    }

    if (formData.interviewType === 'offline' && !formData.location.trim()) {
      toast.error('Please enter location for offline interview');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.interviewDate);
    if (selectedDate < new Date()) {
      toast.error('Interview date cannot be in the past');
      return;
    }

    setSubmitting(true);
    try {
      await onSchedule(formData);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 flex justify-between items-center">
          <h2 className="text-xl font-bold">📅 Schedule Interview</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-green-800 px-3 py-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Job Title Display */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Position</label>
            <p className="text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
              {jobTitle}
            </p>
          </div>

          {/* Interview Date */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Interview Date *
            </label>
            <input
              type="date"
              name="interviewDate"
              value={formData.interviewDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Interview Time */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Interview Time *
            </label>
            <input
              type="time"
              name="interviewTime"
              value={formData.interviewTime}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Interview Type */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Interview Type *
            </label>
            <select
              name="interviewType"
              value={formData.interviewType}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="online">Online</option>
              <option value="offline">Offline / In-Person</option>
              <option value="phone">Phone Call</option>
            </select>
          </div>

          {/* Meeting Link (for online) */}
          {formData.interviewType === 'online' && (
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Meeting Link *
              </label>
              <input
                type="url"
                name="meetingLink"
                placeholder="e.g., https://zoom.us/meeting/123456"
                value={formData.meetingLink}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required={formData.interviewType === 'online'}
              />
            </div>
          )}

          {/* Location (for offline) */}
          {formData.interviewType === 'offline' && (
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                placeholder="e.g., Office Room 201, Downtown Office"
                value={formData.location}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required={formData.interviewType === 'offline'}
              />
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              name="additionalNotes"
              placeholder="Any additional information for the candidate..."
              value={formData.additionalNotes}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleInterview;
