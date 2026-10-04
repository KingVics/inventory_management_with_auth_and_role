export const swaggerInitOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    requestInterceptor: (req) => {
      const token = localStorage.getItem('token');
      if (token && !req.loadSpec) {
        req.headers.Authorization = `Bearer ${token}`;
      }
      return req;
    },
    responseInterceptor: (res) => {
      if (res.url.includes('/api/v1/auth/login') && res.ok) {
        try {
          const token = res.body?.token || res.body?.data?.token;
          if (token) {
            localStorage.setItem('token', token);
            console.log('[Swagger] Token saved to localStorage');

            if (window.ui) {
              window.ui.preauthorizeApiKey('bearerAuth', token);
            }
          }
        } catch (err) {
          console.warn('[Swagger] Token not found in login response:', err);
        }
      }

      if (res.url.includes('/api/v1/auth/logout') && res.ok) {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('authorized');
          // window.ui?.getSystem?.()?.authActions?.logoutWithPersistOption?.('bearerAuth');
        } catch (error) {
          console.warn('[Swagger] error in removing token:', err);
        }
      }

      return res;
    },
  },
};
