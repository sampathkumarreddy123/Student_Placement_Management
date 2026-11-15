import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (res, userId, role, rememberMe = false) => {
  const secret = process.env.JWT_SECRET || 'placement_portal_fallback_secret_key_2026';
  const expiresIn = rememberMe ? '30d' : '7d';
  const maxAge = (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000;

  const token = jwt.sign({ id: userId, role }, secret, {
    expiresIn,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge,
  });

  return token;
};

export const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
};

