import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (res, userId, role) => {
  const secret = process.env.JWT_SECRET || 'placement_portal_fallback_secret_key_2026';
  const token = jwt.sign({ id: userId, role }, secret, {
    expiresIn: '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

export const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
  });
};

