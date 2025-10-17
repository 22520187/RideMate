import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Configuration
export const GOOGLE_CONFIG = {
  clientId: Platform.select({
    ios: 'YOUR_IOS_GOOGLE_CLIENT_ID',
    android: 'YOUR_ANDROID_GOOGLE_CLIENT_ID',
    web: 'YOUR_WEB_GOOGLE_CLIENT_ID',
  }),
  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'ridemate',
    useProxy: true,
  }),
  scopes: ['openid', 'profile', 'email'],
};

// Facebook OAuth Configuration
export const FACEBOOK_CONFIG = {
  appId: 'YOUR_FACEBOOK_APP_ID',
  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'ridemate',
    useProxy: true,
  }),
  scopes: ['public_profile', 'email'],
};

// Google OAuth URLs
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/oauth/authorize';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// Facebook OAuth URLs
export const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth';
export const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
export const FACEBOOK_USER_INFO_URL = 'https://graph.facebook.com/v18.0/me';

// Authentication helper functions
export const createAuthRequest = (config, authUrl) => {
  return new AuthSession.AuthRequest({
    clientId: config.clientId || config.appId,
    scopes: config.scopes,
    redirectUri: config.redirectUri,
    responseType: AuthSession.ResponseType.Code,
    extraParams: {
      access_type: 'offline',
    },
  });
};

export const performGoogleAuth = async () => {
  try {
    const request = createAuthRequest(GOOGLE_CONFIG, GOOGLE_AUTH_URL);
    const result = await request.promptAsync({
      authorizationEndpoint: GOOGLE_AUTH_URL,
    });

    if (result.type === 'success') {
      // Exchange code for token
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: GOOGLE_CONFIG.clientId,
          code: result.params.code,
          redirectUri: GOOGLE_CONFIG.redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        },
        GOOGLE_TOKEN_URL
      );

      // Get user info
      const userInfoResponse = await fetch(
        `${GOOGLE_USER_INFO_URL}?access_token=${tokenResponse.accessToken}`
      );
      const userInfo = await userInfoResponse.json();

      return {
        success: true,
        user: {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture,
          provider: 'google',
        },
        accessToken: tokenResponse.accessToken,
      };
    } else {
      return {
        success: false,
        error: 'Authentication cancelled',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const performFacebookAuth = async () => {
  try {
    const request = createAuthRequest(FACEBOOK_CONFIG, FACEBOOK_AUTH_URL);
    const result = await request.promptAsync({
      authorizationEndpoint: FACEBOOK_AUTH_URL,
    });

    if (result.type === 'success') {
      // Exchange code for token
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: FACEBOOK_CONFIG.appId,
          code: result.params.code,
          redirectUri: FACEBOOK_CONFIG.redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        },
        FACEBOOK_TOKEN_URL
      );

      // Get user info
      const userInfoResponse = await fetch(
        `${FACEBOOK_USER_INFO_URL}?fields=id,name,email,picture&access_token=${tokenResponse.accessToken}`
      );
      const userInfo = await userInfoResponse.json();

      return {
        success: true,
        user: {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture?.data?.url,
          provider: 'facebook',
        },
        accessToken: tokenResponse.accessToken,
      };
    } else {
      return {
        success: false,
        error: 'Authentication cancelled',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Phone number validation
export const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
  return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
};

// Format phone number for display
export const formatPhoneNumber = (text) => {
  const cleaned = text.replace(/\D/g, '');
  
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  } else if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  } else {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }
};

// Generate random OTP
export const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Generate random password
export const generatePassword = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
