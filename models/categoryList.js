const mongoose =require('mongoose');
const categorySchema = new mongoose.Schema({
    category_name:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        require:true
    },
    description:{
        type:String,
        require:true
    }
});
module.exports = mongoose.model('Category', categorySchema);