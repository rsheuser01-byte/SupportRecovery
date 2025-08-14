import type { RequestHandler } from 'express';

/**
 * Special middleware for debugging iPhone-specific authentication issues
 */
export const iPhoneDebugMiddleware: RequestHandler = (req, _res, next) => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const isIPhone = /iPhone/i.test(userAgent);
  
  if (isIPhone) {
    console.log('=== iPhone Request Debug ===');
    console.log(`URL: ${req.url}`);
    console.log(`Method: ${req.method}`);
    console.log(`User-Agent: ${userAgent}`);
    console.log(`Headers:`, {
      accept: req.headers.accept,
      'accept-language': req.headers['accept-language'],
      'accept-encoding': req.headers['accept-encoding'],
      'cache-control': req.headers['cache-control'],
      cookie: req.headers.cookie ? 'present' : 'missing',
      referer: req.headers.referer,
    });
    
    // Check session state for iPhone users
    if (req.session) {
      console.log(`iPhone Session ID: ${req.sessionID || 'no session id'}`);
      console.log(`iPhone Session Data:`, {
        hasPassport: !!(req.session as any).passport,
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'unknown'
      });
    } else {
      console.log('iPhone: No session object found');
    }
    
    console.log('=== End iPhone Debug ===');
  }
  
  next();
};