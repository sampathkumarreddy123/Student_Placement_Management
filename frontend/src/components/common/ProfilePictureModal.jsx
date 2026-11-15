import React from 'react';
import Modal from './Modal';
import { getImageUrl } from '../../utils/imageUrl';

const ProfilePictureModal = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  const photoUrl = user.profilePhoto || user.avatarUrl || '';
  const photoSrc = photoUrl ? getImageUrl(photoUrl) : null;
  const initial = (user.name || 'U').charAt(0).toUpperCase();
  const roleName = user.role === 'officer' ? 'Placement Officer' : 'Student';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profile Picture"
      subtitle={`${user.name || 'User'} • ${roleName}`}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center justify-center py-2 text-center">
        <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl bg-[#EFF6FF] border-2 border-[#DBEAFE] overflow-hidden shadow-lg flex items-center justify-center p-1">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={user.name || 'Profile Picture'}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-[#172554]">
              <div className="w-24 h-24 rounded-full bg-[#DBEAFE] flex items-center justify-center text-4xl font-extrabold text-[#172554] mb-3 shadow-inner">
                {initial}
              </div>
              <p className="text-sm font-bold text-[#172554]">No Profile Photo</p>
              <p className="text-xs text-[#64748B] mt-1 max-w-[200px]">
                You haven't uploaded a profile picture yet.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm font-bold text-[#172554]">{user.name}</p>
          <p className="text-xs text-[#64748B] mt-0.5">{user.email}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ProfilePictureModal;
