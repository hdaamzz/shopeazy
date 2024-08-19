const Admin = require('../../models/admin/adminCredentials');
const Orders= require('../../models/user/userOrders')
const bcrypt = require('bcrypt');


const loadLogin = async (req, res) => {
    try {
        let message = '';
        message = req.query.logout

        res.render("loginform", { message })
    } catch (error) {
        console.error('Error while load ,admin login page', error.message);

        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const verifyAdmin = async (req, res) => {
    try {
        const email = req.body['email-username'];
        const password = req.body['password'];

        const adminData = await Admin.findOne({ email_address: email });
        if (!adminData) {
            return res.render('loginform', { message: "Email not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, adminData.password);

        if (isPasswordValid) {
            req.session.admin_id = adminData._id;
            console.log(`${adminData.admin_name} logged in successfully`);
            return res.redirect('admin/adminHome');
        } else {
            return res.render('loginform', { message: "Incorrect password" });
        }
    } catch (error) {
        console.error('Error in admin verification:', error.message);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};

const loadDashboard = async (req, res) => {
    try {
       
        const { timeFrame } = req.query; 
        
        
        const orderStatusCounts = await getOrderStatusCounts(timeFrame);
        
        
        const salesData = await getSalesData(timeFrame);
        
        
        const bestSellingProducts = await getBestSellingProducts(timeFrame);
        
        
        const bestSellingCategories = await getBestSellingCategories(timeFrame);

        res.render('dashboard', {
            orderStatusData: orderStatusCounts,
            salesData,
            bestSellingProducts,
            bestSellingCategories,
            timeFrame
        });
    } catch (error) {
        console.error('Error in admin load dashboard:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};
async function getOrderStatusCounts(timeFrame) {
    const matchStage = getTimeFrameMatchStage(timeFrame);
    return await Orders.aggregate([
        matchStage,
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.status",
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: null,
                delivered: {
                    $sum: {
                        $cond: [{ $eq: ["$_id", "Delivered"] }, "$count", 0]
                    }
                },
                canceled: {
                    $sum: {
                        $cond: [{ $eq: ["$_id", "Cancelled"] }, "$count", 0]
                    }
                },
                returned: {
                    $sum: {
                        $cond: [{ $eq: ["$_id", "Returned"] }, "$count", 0]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                delivered: 1,
                canceled: 1,
                returned: 1
            }
        }
    ]).then(result => result[0] || { delivered: 0, canceled: 0, returned: 0 });
}

async function getSalesData(timeFrame) {
    let query = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (timeFrame) {
        case 'daily':
            query.created_at = { $gte: today };
            break;
        case 'weekly':
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            query.created_at = { $gte: oneWeekAgo };
            break;
        case 'monthly':
            const oneMonthAgo = new Date(today);
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            query.created_at = { $gte: oneMonthAgo };
            break;
        case 'yearly':
            const oneYearAgo = new Date(today);
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            query.created_at = { $gte: oneYearAgo };
            break;
        default:
            // No filter
            break;
    }

    const groupingFormat = getGroupingFormat(timeFrame);

    return await Orders.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    $dateToString: { format: groupingFormat, date: "$created_at" }
                },
                totalSales: { $sum: "$total_amount" }
            }
        },
        { $sort: { "_id": 1 } },
        {
            $group: {
                _id: null,
                labels: { $push: "$_id" },
                values: { $push: "$totalSales" }
            }
        },
        {
            $project: {
                _id: 0,
                labels: 1,
                values: 1
            }
        }
    ]).then(result => result[0] || { labels: [], values: [] });
}

function getGroupingFormat(timeFrame) {
    switch(timeFrame) {
        case 'yearly':
            return "%Y";
        case 'monthly':
            return "%Y-%m-%d";
        case 'weekly':
        case 'daily':
            return "%Y-%m-%d";
        default:
            return "%Y-%m-%d";
    }
}


async function getBestSellingProducts(timeFrame) {
    const matchStage = getTimeFrameMatchStage(timeFrame);
    return await Orders.aggregate([
        matchStage,
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.product_id",
                name: { $first: "$items.name" },
                sales: { $sum: "$items.quantity" }
            }
        },
        { $sort: { sales: -1 } },
        { $limit: 10 },
        {
            $project: {
                _id: 0,
                name: 1,
                sales: 1
            }
        }
    ]);
}

async function getBestSellingCategories(timeFrame) {
    const matchStage = getTimeFrameMatchStage(timeFrame);
    return await Orders.aggregate([
        matchStage,
        { $unwind: "$items" },
        {
            $lookup: {
                from: "products",
                localField: "items.product_id",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $lookup: {
                from: "categories",
                localField: "product.category",
                foreignField: "_id",
                as: "category"
            }
        },
        { $unwind: "$category" },
        {
            $group: {
                _id: "$category._id",
                name: { $first: "$category.category_name" },
                sales: { $sum: "$items.quantity" }
            }
        },
        { $sort: { sales: -1 } },
        { $limit: 10 },
        {
            $project: {
                _id: 0,
                name: 1,
                sales: 1
            }
        }
    ]);
}

function getTimeFrameMatchStage(timeFrame) {
    const now = new Date();
    let startDate;

    switch(timeFrame) {
        case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'weekly':
            startDate = new Date(now.setDate(now.getDate() - now.getDay()));
            break;
        case 'daily':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        default:
            startDate = new Date(0); 
    }

    return { $match: { created_at: { $gte: startDate } } };
}


module.exports = {
    loadLogin,
    verifyAdmin,
    loadDashboard

}