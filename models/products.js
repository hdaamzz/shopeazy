const mongoose =require('mongoose')
const productsSchema = new mongoose.Schema({
    product_name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    images:{
        type:[String],
        required:true
    },
    category: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Category',
         required: true
     },
    is_listed:{
        type:Boolean,
        require:true
    },
    stock:{
        type:Number,
        require:true
    },
    price:{
        type:Number,
        require:true
    },
    added_date:{
        type:Date,
        default:Date.now()
    }
})
module.exports = mongoose.model('Products', productsSchema);