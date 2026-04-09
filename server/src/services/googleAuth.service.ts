import { OAuth2Client } from 'google-auth-library';
import { UserModel } from '../models/user.model';
import { getUserByEmail, createUser, updateUserGoogleId } from './auth.service';
import { env } from '../config/env';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Invalid Google token');
  }
  return payload;
}

export async function findOrCreateGoogleUser(idToken: string) {
  const payload = await verifyGoogleToken(idToken);
  let user = await getUserByEmail(payload.email!);
  if (user) {
    // קישור googleId אם לא קיים
    if (!user.googleId) {
      user = await updateUserGoogleId(user._id, payload.sub!);
    }
  } else {
    user = await createUser({
      email: payload.email!,
      name: payload.name,
      googleId: payload.sub!,
      avatar: payload.picture,
    });
  }
  return user;
}
