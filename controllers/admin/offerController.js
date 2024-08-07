const Category = require('../../models/categoryList');
const Products = require('../../models/products');
const Offer = require('../../models/offers')

const loadOffer = async(req,res)=>{
    try {
        const offer= await Offer.find({type:"PRODUCT"})
        const products = await Products.find({is_listed:true})
        res.render('offers',{products,offer})
    } catch (error) {
        
    }
}
const addOffer= async(req,res)=>{

    try {
        const { title, description, discount, products, status, type } = req.body;
        if(type =='PRODUCT'){
        const newOffer = new Offer({
            title,
            description,
            discount,
            type,
            products,
            status
        });

        await newOffer.save();

        res.status(201).json({ success: true, message: 'Offer added successfully' , redirectUrl:'/admin/offers'});
        }else{
            const newOffer = new Offer({
                title,
                description,
                discount,
                type,
                category:products,
                status
            });
    
            await newOffer.save();
    
            res.status(201).json({ success: true, message: 'Offer added successfully' , redirectUrl:'/admin/offers'});
        }
    } catch (error) {
        
    }
}

const loadCateOffer =async(req,res)=>{
    try {
        const offer= await Offer.find({type:"CATEGORY"})
        const category = await Category.find({status:true})
        res.render('cateoffers',{category,offer})
    } catch (error) {
        
    }
}

const updateOffer = async (req, res) => {
    try {
        const { title, description, discount, products, status, type, id } = req.body

        const updatedOffer = await Offer.findByIdAndUpdate(id, {
            $set: {
                title,
                description,
                discount,
                type,
                products,
                status
            }
        }, { new: true });

        if (!updatedOffer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        res.status(200).json({ success: true, message: 'Offer updated successfully', redirectUrl: '/admin/offers' });

    } catch (error) {
        console.log('Error updating offer:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


const deleteOffer = async (req, res) => {
    try {
        const offerId = req.body.id;
        await Offer.findByIdAndDelete(offerId);

        res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ success: false, message: 'Error deleting offer' });
    }
};

module.exports = {
    loadOffer,
    addOffer,
    loadCateOffer,
    updateOffer,
    deleteOffer
}