const User = require('../../models/userCredentials');
const bcrypt = require('bcrypt');
require('dotenv').config();




const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email_address: email, is_block: false })


        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch && userData.is_valid == 1) {
                req.session.user_id = userData._id;


                res.status(200).json({ success: true });
            } else {
                res.json({ success: false, msg: "Email or password incorrect" });
            }
        } else {

            res.json({ success: false, msg: "Shopeazy blocked you" });

        }
    } catch (error) {
        console.log('Error verify signin', error.message);
        res.status(500).send('Internal Server Error');
    }
}










module.exports = {

    verifyLogin


};