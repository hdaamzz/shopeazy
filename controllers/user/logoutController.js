
const userLogout = (req, res) => {
    // if(req.session.user_id){
    //      delete req.session.user_id;
    //     res.redirect('/');
    // }else{
        req.logout((err) => {
            if (err) {
                console.log(err);
            }
            delete req.session.user_id;
            delete req.user;
            res.redirect('/');
        });
    // }
    
   

};



module.exports = {
    userLogout,
   
};

