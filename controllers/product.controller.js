const Product = require('../models/product.model');

module.exports.index = async (req, res) => {
  const { _limit, _category, _keyword } = req.query;
  let regex = new RegExp(_keyword,'i');

  if ( !_category && !_keyword) {
    const products = await Product.find().limit(parseInt(_limit));
    res.json(products);
  } else {
    const products = await Product.find(
      _category && _keyword ? { category: _category, title: regex } : 
      ( _category ? { category: _category } : { title: regex } )
      )
      .limit(parseInt(_limit));
      res.json(products);
  }
}

module.exports.productDetail = async (req, res) => {
  const product = await Product.findOne({ slug: req.query.slug });
  res.json(product);
} 

module.exports.addProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
}
