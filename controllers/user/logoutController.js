
const userLogout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
        }
        delete req.session.user_id;
        delete req.user;
        res.redirect('/');
    });
};



module.exports = {
    userLogout,
   
};

