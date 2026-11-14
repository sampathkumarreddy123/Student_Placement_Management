/**
 * Format currency in Indian Rupees or Lakhs
 */
export const formatLPA = (amount) => {
  if (amount === undefined || amount === null) return 'N/A';
  return `₹${amount.toFixed(1)} LPA`;
};

/**
 * Format standard date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format relative deadline (e.g. "in 3 days" or "Closed")
 */
export const getDeadlineStatus = (deadlineString) => {
  if (!deadlineString) return { text: 'No deadline', isUrgent: false, isClosed: false };
  const deadline = new Date(deadlineString);
  const now = new Date();
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: 'Deadline passed', isUrgent: false, isClosed: true };
  } else if (diffDays === 0) {
    return { text: 'Ends today', isUrgent: true, isClosed: false };
  } else if (diffDays <= 3) {
    return { text: `${diffDays} days left`, isUrgent: true, isClosed: false };
  }
  return { text: `${diffDays} days remaining`, isUrgent: false, isClosed: false };
};

/**
 * Status color mappings for badges
 */
export const getStatusColor = (status) => {
  const map = {
    // Placement Drive statuses
    Draft: 'bg-[#F0F7FF] text-[#64748B] border-[#DBEAFE]',
    Published: 'bg-[#DBEAFE] text-[#163A5F] border-[#DBEAFE] font-medium',
    Closed: 'bg-[#F0F7FF] text-[#64748B] border-[#DBEAFE]',
    Completed: 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/30 font-semibold',
    Upcoming: 'bg-[#DBEAFE] text-[#2563EB] border-[#DBEAFE]',
    Ongoing: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30',
    Cancelled: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30',
    Active: 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/30 font-medium',

    // Application statuses
    Applied: 'bg-[#EFF6FF] text-[#163A5F] border-[#DBEAFE]',
    'Under Review': 'bg-[#DBEAFE] text-[#163A5F] border-[#DBEAFE]',
    Shortlisted: 'bg-[#DBEAFE] text-[#2563EB] border-[#DBEAFE] font-medium',
    Interviewing: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30 font-medium',
    Selected: 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/30 font-semibold',
    Rejected: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30',

    // Placement status
    Placed: 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/30 font-semibold',
    'Not Placed': 'bg-[#F0F7FF] text-[#64748B] border-[#DBEAFE]',
  };

  return map[status] || 'bg-[#EFF6FF] text-[#163A5F] border-[#DBEAFE]';
};
