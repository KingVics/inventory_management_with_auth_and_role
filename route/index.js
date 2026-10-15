import express from 'express';

const router = express.Router();

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
})[character]);

export const renderHomePage = (username) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Inventory Management API</title>
</head>
<body>
  <main>
    ${username
        ? `<h1>Welcome, ${escapeHtml(username)}</h1>`
        : `<h1>Inventory Management API</h1>
    <p>Sign in with GitHub or open the API documentation.</p>
    <form action="/api/v1/auth/github">
      <button type="submit">Sign in with GitHub</button>
    </form>`}
    <form action="/api-docs">
      <button type="submit">Open API documentation</button>
    </form>
  </main>
</body>
</html>`;

router.get('/', (req, res, next) => {
    if (req.isAuthenticated?.() && typeof req.user?.username === 'string') {
        return res.type('html').send(renderHomePage(req.user.username));
    }

    if (req.isAuthenticated?.()) {
        return next(new Error('Authenticated Passport session is missing its username.'));
    }

    return res.type('html').send(renderHomePage());
});

export default router;
