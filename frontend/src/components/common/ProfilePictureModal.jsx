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
      <div className="flex flex-col items-center justify-center py-3 text-center">
        <div className="w-60 h-60 sm:w-68 sm:h-68 rounded-full bg-[#EFF6FF] border-4 border-[#DBEAFE] overflow-hidden shadow-xl flex items-center justify-center p-0.5">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={user.name || 'Profile Picture'}
              className="w-full h-full object-cover rounded-full"
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
