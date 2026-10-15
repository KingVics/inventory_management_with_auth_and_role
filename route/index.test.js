import { describe, expect, test } from '@jest/globals';
import { renderHomePage } from './index.js';

describe('home page', () => {
    test('shows the GitHub sign-in button when the user is signed out', () => {
        const html = renderHomePage();

        expect(html).toContain('Sign in with GitHub');
        expect(html).toContain('href="/api/v1/auth/github"');
        expect(html).toContain('Open API documentation');
    });

    test('shows the signed-in username without the sign-in button', () => {
        const html = renderHomePage('alexm');

        expect(html).toContain('Welcome, alexm');
        expect(html).not.toContain('Sign in with GitHub');
        expect(html).toContain('Open API documentation');
    });

    test('escapes the username before rendering it as HTML', () => {
        const html = renderHomePage('<script>alert("xss")</script>');

        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });

});
