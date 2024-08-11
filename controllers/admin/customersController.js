const User = require('../../models/user/userCredentials');


const loadAllCustomers = async (req, res) => {
    try {
        const userData = await User.find({ is_valid: 1 })
        res.render('allcustomer', { users: userData })

    } catch (error) {
        console.error('Error in All customers load:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const blockUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.is_block = !user.is_block;
        await user.save();

        const message = user.is_block ? 'User blocked successfully' : 'User unblocked successfully';
        res.json({ success: true, message: message });

    } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}


module.exports = {
    loadAllCustomers,
    blockUser
}