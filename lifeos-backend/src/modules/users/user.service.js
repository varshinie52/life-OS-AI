const User = require('./user.model');
const ApiError = require('../../utils/ApiError');
const cloudinary = require('../../config/cloudinary');
const { env } = require('../../config/env');

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

const updateProfile = async (userId, updateData) => {
  // Prevent updating password or email through this route
  if (updateData.password || updateData.email) {
    throw new ApiError(400, 'This route is not for password or email updates');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      name: updateData.name,
      username: updateData.username,
      bio: updateData.bio,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return user;
};

const updatePreferences = async (userId, preferencesData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Merge preferences deeply or just override provided keys
  user.preferences = {
    ...user.preferences,
    ...preferencesData,
  };

  await user.save({ validateBeforeSave: false });
  return user;
};

const uploadAvatar = async (userId, fileBuffer) => {
  const user = await User.findById(userId);
  
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY) {
    // If Cloudinary isn't configured, use data URI fallback
    const base64Image = fileBuffer.toString('base64');
    user.avatar = {
      url: `data:image/jpeg;base64,${base64Image}`,
      publicId: `local_${userId}_${Date.now()}`
    };
    await user.save({ validateBeforeSave: false });
    return user;
  }

  if (user.avatar?.publicId && !user.avatar.publicId.startsWith('local_')) {
    // Delete old avatar from Cloudinary first
    try {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    } catch (e) {
      // Ignore cleanup error
    }
  }

  // Upload to Cloudinary using streams (since we have a buffer in memory)
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'lifeos/avatars',
        transformation: [{ width: 250, height: 250, crop: 'fill' }],
      },
      async (error, result) => {
        if (error) {
          return reject(new ApiError(500, 'Error uploading image to Cloudinary'));
        }

        user.avatar = {
          url: result.secure_url,
          publicId: result.public_id,
        };

        await user.save({ validateBeforeSave: false });
        resolve(user);
      }
    );

    // Stream the buffer to Cloudinary
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);
    bufferStream.pipe(uploadStream);
  });
};

const deleteAvatar = async (userId) => {
  const user = await User.findById(userId);
  
  if (user.avatar?.publicId) {
    await cloudinary.uploader.destroy(user.avatar.publicId);
    user.avatar = undefined;
    await user.save({ validateBeforeSave: false });
  }

  return user;
};

const deleteAccount = async (userId) => {
  // In a complete implementation, this should also cascade delete
  // tasks, habits, notes, etc. using pre('remove') hooks on the User model
  // or via an event-driven architecture.
  
  const user = await User.findById(userId);
  
  // Delete avatar from cloudinary if exists
  if (user && user.avatar?.publicId) {
    await cloudinary.uploader.destroy(user.avatar.publicId);
  }

  await User.findByIdAndDelete(userId);
};

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,
};
