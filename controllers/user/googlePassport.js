require('dotenv').config();
const passport = require('passport');
const User = require('../../models/user/userCredentials');
const GoogleStrategy = require('passport-google-oauth20').Strategy;



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {

            let user = await User.findOne({ email_address: profile.emails[0].value });

            if (!user) {

                user = new User({
                    user_name: profile.displayName,
                    email_address: profile.emails[0].value,
                    is_valid: true,
                    is_block: false,

                    password: Math.random().toString(36).slice(-8)
                });
                await user.save();
            }

            return done(null, user);
        } catch (error) {
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
        done(error, null);
    }
});

module.exports = passport;