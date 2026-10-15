import 'dotenv/config';
import passport from 'passport';
import GitHubStrategy from 'passport-github2';

export const configurePassport = () => {
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL } = process.env;

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_CALLBACK_URL) {
        throw new Error(
            'GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_CALLBACK_URL must be configured.',
        );
    }

    passport.use(
        new GitHubStrategy(
            {
                clientID: GITHUB_CLIENT_ID,
                clientSecret: GITHUB_CLIENT_SECRET,
                callbackURL: GITHUB_CALLBACK_URL,
            },
            (_accessToken, _refreshToken, profile, done) => {
                return done(null, {
                    githubId: profile.id,
                    username: profile.username || profile.displayName || `GitHub user ${profile.id}`,
                    role: 'user',
                });
            },
        ),
    );

    passport.serializeUser((user, done) => {
        done(null, {
            githubId: user.githubId,
            username: user.username,
            role: user.role,
        });
    });
    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    return passport;
};
