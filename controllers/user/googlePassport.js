require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../../models/user/userCredentials');

// Constants
const PASSWORD_LENGTH = 8;
const USER_STATUS = {
    VALID: true,
    NOT_BLOCKED: false
};


function generateRandomPassword() {
    return Math.random().toString(36).slice(-PASSWORD_LENGTH);
}

passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;

            let user = await User.findOne({ email_address: email });

            if (!user) {
                user = new User({
                    user_name: profile.displayName,
                    email_address: email,
                    is_valid: USER_STATUS.VALID,
                    is_block: USER_STATUS.NOT_BLOCKED,
                    password: generateRandomPassword()
                });

                await user.save();
            }

            return done(null, user);
        } catch (error) {
            console.error('Error in Google authentication:', error);
            return done(error, null);
        }
    }
));


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        console.error('Error deserializing user:', error);
        done(error, null);
    }
});

module.exports = passport;
