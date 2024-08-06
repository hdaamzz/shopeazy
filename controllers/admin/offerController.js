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


module.exports = {
    loadOffer,
    addOffer,
    loadCateOffer
}